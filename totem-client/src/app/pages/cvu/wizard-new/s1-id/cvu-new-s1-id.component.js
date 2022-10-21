(function () {
  'use strict';

  angular.module('app').component('cvuNewStep1User', {
    controller: CVUNewStep1UserController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s1-id/cvu-new-s1-id.view.html'
  });

  /** @ngInject */
  function CVUNewStep1UserController($log, $scope, $rootScope, $state, $document, $timeout, CoreService, ApiService, $window) {

    $log.debug('CVU New Step 1 User activated');

    $scope.keyboardLayout = 'default';
    $scope.keyboardInput  = '';
    $scope.showKeyboard = true;
    $scope.showErrors = false;

    $scope.data = {
      userDocType: 2,
      userDocValue: '',
      vehiclePlateNumber: ''
    }

    if ($window.IS_DEBUG && window.DEBUG_DATA){
      if ($window.DEBUG_DATA.vehiclePlateNumber && $window.DEBUG_DATA.vehiclePlateNumber.length > 0) {
        $window.DEBUG_DATA.vehiclePlateNumber = 
          $window.DEBUG_DATA.vehiclePlateNumber.slice(0,-4) +
          CoreService.zeroPad(parseInt($window.DEBUG_DATA.vehiclePlateNumber.slice(-4))+1, 4);

        $scope.data = {
          userDocType       : $window.DEBUG_DATA.userDocType ? $window.DEBUG_DATA.userDocType              : 0,
          userDocValue      : $window.DEBUG_DATA.userDocValue ? $window.DEBUG_DATA.userDocValue            : '',
          vehiclePlateNumber: $window.DEBUG_DATA.vehiclePlateNumber ? $window.DEBUG_DATA.vehiclePlateNumber: '',
        }
      }
    }

    
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

    $scope.inputFocus = function(ev){
      $scope.showKeyboard = true;
      // $scope.keyboard.setInput(ev.target.value);
      // if ($scope.keyboardInput){
      //   $log.log('Setting input from ' + $scope.keyboardInput + ' to ' + ev.target.value + ' (' + ev.target.name + ')');
      // }else{
      //   $log.log('Setting input from undefined to ' + ev.target.name + ' (' + ev.target.value + ')');
      // }

      $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
      // $scope.keyboardInput = ev.target.value;
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
        // $scope.keyboard.setOptions({
        //   layoutName: 'default'
        // });
        $scope.keyboardLayout = 'default';
      }
    }

    $scope.docTypeSelect = function(value){
      $document[0].getElementById('userDocValue').focus();
    }

    $scope.continue = function (isValid) {
      if (!isValid) {
        $scope.showErrors = true;
        return;
      }

      // Store data in session
      CoreService.session.wizardNew.user = {
        docType : $scope.data.userDocType,
        docValue : $scope.data.userDocValue
      };
      CoreService.session.wizardNew.vehicle = {
        plateNumber : $scope.data.vehiclePlateNumber
      };

      // $state.go('cvu-new-s2-user-data');
      // return;
      CoreService.showProgress();
      $scope.showKeyboard = false;

      try {
        ApiService.CVUStartNewTag($scope.data).then((response) => {
          // $log.log(response);
          CoreService.hideProgress();
          $scope.showKeyboard = true;
          //
          // Evaluate response
          //
          if (response.data.operation){
            CoreService.session.wizardNew.operation = response.data.operation;
            if (response.data.operation == 'NEW_CLIENT'){
              CoreService.session.wizardNew.transactionId   = response.data.transactionId;
              CoreService.session.wizardNew.theoricTag      = response.data.tagCode;
              CoreService.session.wizardNew.theoricTagId    = response.data.tagId;
              CoreService.session.wizardNew.printQty        = response.data.printQty;
              $state.go('cvu-new-s2-user-data');
            }else if (response.data.operation == 'ADD_VEHICLE'){
              CoreService.session.wizardNew.transactionId   = response.data.transactionId;
              CoreService.session.wizardNew.user.name       = response.data.userName;
              CoreService.session.wizardNew.user.cel        = response.data.userCel;
              CoreService.session.wizardNew.user.email      = response.data.userEmail;
              CoreService.session.wizardNew.user.externalId = response.data.nroCliente;
              CoreService.session.wizardNew.theoricTag      = response.data.tagCode;
              CoreService.session.wizardNew.theoricTagId    = response.data.tagId;
              CoreService.session.wizardNew.printQty        = response.data.printQty;
              if ($scope.userDataComplete()){
                CoreService.session.wizardNew.vehicle.brand = {id: 1, name: "Indefinido"};
                CoreService.session.wizardNew.vehicle.model = {id: 2506, name: "Indefinido"};
                CoreService.session.wizardNew.vehicle.color = {id: 1, name: "Indefinido"};
                $log.log("Skipped vehicle selection");
                $state.go('cvu-new-s4-topup');
              }else{
                $log.warn('User data is not complete, will ask for more data');
                $state.go('cvu-new-s2-user-data');
              }
            }else if (response.data.operation == 'ASSIGN_TAG'){
              CoreService.session.wizardNew.transactionId   = response.data.transactionId;
              CoreService.session.wizardNew.user.name       = response.data.userName;
              CoreService.session.wizardNew.user.cel        = response.data.userCel;
              CoreService.session.wizardNew.user.email      = response.data.userEmail;
              CoreService.session.wizardNew.user.externalId = response.data.nroCliente;
              CoreService.session.wizardNew.theoricTag      = response.data.tagCode;
              CoreService.session.wizardNew.theoricTagId    = response.data.tagId;
              CoreService.session.wizardNew.printQty        = response.data.printQty;
              // User and vehicle are already created.
              // Check if user data is complete
              if ($scope.userDataComplete()){
                $state.go('cvu-new-s4-topup');
              }else{
                $log.warn('User data is not complete, will ask for more data');
                $state.go('cvu-new-s2-user-data');
              }
            }else{
              //
              // Unknown operation received!
              //
              $scope.showKeyboard = false;
              CoreService.showError("Ocurrió un error", (response.data.error && response.data.error.length) ? response.data.error : "Operación desconocida", "-1");
              $log.error('Unknown operation received!');
              $log.error(response);
            }
          }else{
            //
            // Empty operation received!
            //
            $scope.showKeyboard = false;
            CoreService.showError("Ocurrió un error", (response.data.error && response.data.error.length) ? response.data.error : "No se recibió operación", "-1");
            $log.error('Empty operation received');
          }
        }, (error) => {
          CoreService.showError("Ocurrió un error", error.message, error.outcode);
          $log.error('Error on continue');
          $log.error(error);
          $scope.showKeyboard = false;
          CoreService.hideProgress();
        });

      } catch (exc) {
        $log.error('Exception catched on continue');
        $log.error(exc);
        $scope.showKeyboard = false;
        CoreService.hideProgress();
      }
    }

    $scope.userDataComplete = function(){
      var isComplete = false;
      if (CoreService.session.wizardNew.user.cel && CoreService.session.wizardNew.user.cel.toString().length &&
      CoreService.session.wizardNew.user.email && CoreService.session.wizardNew.user.email.length &&
      CoreService.session.wizardNew.user.name && CoreService.session.wizardNew.user.name.length ){
        isComplete = true;
      }
      return isComplete;
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
    
  }

})();
