(function () {
  'use strict';

  angular.module('app').component('cvuRechStep1User', {
    controller: CVURechStep1UserController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s1-id/cvu-rech-s1-id.view.html'
  });

  /** @ngInject */
  function CVURechStep1UserController($log, $scope, $rootScope, $state, $timeout, $document, CoreService, ApiService, $window) {

    $log.debug('CVU Recharge Step 1 User activated');

    $scope.showKeyboard = true;
    $scope.keyboardLayout = 'number';
    $scope.keyboardInput  = '';
    $scope.showErrors = false;

    $scope.data = {
      userDocType: 2,
      userDocValue: ''
    }

    if ($window.IS_DEBUG && $window.DEBUG_DATA) {
      $scope.data = {
        userDocType: $window.DEBUG_DATA.userDocType ? $window.DEBUG_DATA.userDocType: 2,
        userDocValue: $window.DEBUG_DATA.userDocValue ? $window.DEBUG_DATA.userDocValue: '',
      };
    }

    $scope.inputFocus = function(ev){
      $scope.showKeyboard = true;
      $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
      if (ev.target.id == 'userDocValue') {
        $timeout(function () {
          switch ($scope.data.userDocType) {
            case 1:
              $scope.keyboardLayout = 'number';
              break;
            case 2:
              $scope.keyboardLayout = 'number';
              break;
            case 3:
              $scope.keyboardLayout = 'default';
              break;
          }}, 50);
      }else if (ev.target.id == 'vehiclePlateNumber'){
        $scope.keyboardLayout = 'default';
      }
    }

    $scope.continue = function (isValid) {
      if (!isValid) {
        $scope.showErrors = true;
        return;
      }

      // Store data in session
      CoreService.session.wizardRecharge.user = {
        docType : $scope.data.docType,
        docValue : $scope.data.docValue
      };

      // $state.go('cvu-rech-s2-topup');
      // return;
      CoreService.showProgress();
      $scope.showKeyboard = true;

      try {
        ApiService.CVUStartRecharge($scope.data).then((response) => {
          $log.log(response);
          CoreService.hideProgress();

          if (response.data.exists){
            // Store user data at session
            CoreService.session.wizardRecharge.user.externalId  = response.data.nroCliente;
            CoreService.session.wizardRecharge.user.observation = response.data.observacion;
            CoreService.session.wizardRecharge.transactionId    = response.data.transactionId;

            $state.go('cvu-rech-s2-topup');
          }else{
            $scope.showKeyboard = false;
            CoreService.showMessage(
              "Cuenta no encontrada", 
              "No se encontró la cuenta para esos datos, vuelva a intentarlo o use la opción para adquirir un nuevo TAG", 
              true).then(function(){
                $state.go('start');
              }, function(){
                $state.go('start');
              });
          }
        }, (error) => {
          CoreService.showError("Ocurrió un error", error.message, error.outcode);
          $log.error('Error on continue');
          $log.error(error);
          CoreService.hideProgress();
        });

      } catch (exc) {
        $log.error('Exception catched on continue');
        CoreService.hideProgress();
      }
    }

    $scope.docTypeSelect = function(){
      $document[0].getElementById('userDocValue').focus();
    }

    $scope.cancel = function(){ 
      CoreService.clearSession();
      $state.go('start');
    }

    $scope.goBack = function(){
      $state.go('start');
    }

    $timeout(function(){
      var e = $document[0].getElementById('userDocValue');
      if (e) e.focus();
    }, 500);
   
    //
    // Session timeout handler
    CoreService.sessionTimerStart();
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });

    function clean_ci(ci){
      return ci.replace(/\D/g, '');
    }

    function validation_digit(ci){
      var a = 0;
      var i = 0;
      if(ci.length <= 6){
        for(i = ci.length; i < 7; i++){
          ci = '0' + ci;
        }
      }
      for(i = 0; i < 7; i++){
        a += (parseInt("2987634"[i]) * parseInt(ci[i])) % 10;
      }
      if(a%10 === 0){
        return 0;
      }else{
        return 10 - a % 10;
      }
    }

    function validate_ci(ci){
      ci = clean_ci(ci);
      var dig = ci[ci.length - 1];
      ci = ci.replace(/[0-9]$/, '');
      return (dig == validation_digit(ci));
    }

    $scope.validateDocValue = () => {
      if ($scope.data.userDocType == 2) {
        return validate_ci($scope.data.userDocValue)
      }

      return true;
    }
  }

})();
