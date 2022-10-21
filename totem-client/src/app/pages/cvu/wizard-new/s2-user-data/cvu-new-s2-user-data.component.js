(function () {
  'use strict';

  angular.module('app').component('cvuNewStep2UserData', {
    controller: CVUNewStep2UserDataController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s2-user-data/cvu-new-s2-user-data.view.html'
  });

  /** @ngInject */
  function CVUNewStep2UserDataController($log, $scope, $rootScope, $document, $timeout, $state, CoreService, $window) {

    $log.debug('CVU New Step 2 User Data activated');

    // $scope.form = $document[0].getElementById('s2form');
    $scope.keyboardLayout = 'default';
    $scope.keyboardInput  = '';
    $scope.showKeyboard = true;

    $scope.showErrors = false;
    $scope.data = {};
    if ($window.IS_DEBUG){
      $scope.data = {
        userName : $window.DEBUG_DATA.userName ? $window.DEBUG_DATA.userName : '',
        userCel  : $window.DEBUG_DATA.userCel ? $window.DEBUG_DATA.userCel : '',
        userEmail: $window.DEBUG_DATA.userEmail ? $window.DEBUG_DATA.userEmail : '',
      };
    }
    $scope.showFields = {
      userName: true,
      userCel: true,
      userEmail: true
    };
    $scope.operation = CoreService.session.wizardNew.operation;

    $scope.init = function(){
      if (CoreService.session.wizardNew.operation != 'NEW_CLIENT'){
        $scope.showFields.userName  = !(CoreService.session.wizardNew.user.name && CoreService.session.wizardNew.user.name.length > 0);
        $scope.showFields.userCel   = !(CoreService.session.wizardNew.user.cel && CoreService.session.wizardNew.user.cel.toString().length > 0);
        $scope.showFields.userEmail = !(CoreService.session.wizardNew.user.email && CoreService.session.wizardNew.user.email.length > 0);
      }
    }

    $scope.inputFocus = function (ev) {
      $scope.showKeyboard = true;
      $rootScope.$broadcast('keyboard::changeInput', ev.target.value ? ev.target.value : '');
      // $scope.keyboardInput = ev.target.value ? ev.target.value : '';
      if (ev.target.id == 'userEmail'){
        $scope.keyboardLayout = 'email';
      }else if (ev.target.id == 'userCel'){
        $scope.keyboardLayout = 'phoneNumber';
      }else{
        $scope.keyboardLayout = 'default';
      }
    }

    $scope.continue = function (isValid) {
      if (!isValid) {
        $scope.showErrors = true;
        return;
      }

      // Store data in session
      CoreService.session.wizardNew.user.name = $scope.data.userName;
      CoreService.session.wizardNew.user.cel = $scope.data.userCel;
      CoreService.session.wizardNew.user.email = $scope.data.userEmail;

      if (CoreService.session.wizardNew.operation == 'NEW_CLIENT' || CoreService.session.wizardNew.operation == 'ADD_VEHICLE'){
        CoreService.session.wizardNew.vehicle.brand = {id: 1, name: "Indefinido"};
        CoreService.session.wizardNew.vehicle.model = {id: 2506, name: "Indefinido"};
        CoreService.session.wizardNew.vehicle.color = {id: 1, name: "Indefinido"};
        $log.log("Skipped vehicle selection");
        $state.go('cvu-new-s4-topup');
      }else if (CoreService.session.wizardNew.operation == 'ASSIGN_TAG'){
        $state.go('cvu-new-s4-topup');
      }else{
        $state.go('cvu-new-s4-topup');
      }
    }

    $scope.cancel = function(){
      CoreService.showCancelDialog().then(function(cancel){
        if (cancel){
          CoreService.clearSession();
          $state.go('start');
        }
      }, function(err){
        $log.error(err);
      })
    }

    $scope.goBack = function(){
      $state.go('cvu-new-s1-id');
    }


    $scope.init();
    $timeout(function(){
      var e = $document[0].getElementById('userName');
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
