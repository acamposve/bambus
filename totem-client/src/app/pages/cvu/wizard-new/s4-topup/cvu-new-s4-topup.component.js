(function () {
  'use strict';

  angular.module('app').component('cvuNewStep4Topup', {
    controller: CVUNewStep4TopupController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s4-topup/cvu-new-s4-topup.view.html'
  });

  /** @ngInject */
  function CVUNewStep4TopupController($log, $scope, $document, $window, CoreService, ApiService, $state) {

    $log.debug('CVU New Step 4 TopUp activated');

    $scope.keyboardLayout = 'number';
    $scope.keyboardInput  = '';
    $scope.showErrors = false;
    $scope.showKeyboard = false;
    $scope.data = {
      rechargeAmount: 0,
      amounts: null,
      includesTaxes: false
    }; 
    
    $scope.initialize = function() {
      CoreService.showProgress();
      $scope.showKeyboard = false;
      try {
        ApiService.CVUGetRechargeAmounts().then(function(response) {
          if (response.data && response.data.length){
            for(var i=0; i < response.data.length; i++){
              response.data[i].amountNice = parseInt(response.data[i].amount).toString();
            }
            $scope.data.amounts = response.data;
            if ($scope.data.amounts && $scope.data.amounts.length){
              $scope.data.includesTaxes = $scope.data.amounts[0].includesTaxes;
            }
          }
          CoreService.hideProgress();
          $scope.$apply();
        }, function(error) {
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

    $scope.select = function (amount) {
      // Store data in session
      CoreService.session.wizardNew.amount = amount;

      $state.go('cvu-new-s5-pay');
      // $state.go('cvu-new-s6-tag');
    }

    $scope.selectCustom = function (){
      $scope.showKeyboard = true;
      CoreService.showCustomAmountSelector($scope).then(function(customAmount){
        CoreService.session.wizardNew.amount = {
          amount        : customAmount,
        };

        $state.go('cvu-new-s5-pay');
      }, function(error){
        if (error){
          $log.error(error);
        }else{
          $scope.showKeyboard = false;
        }
      });
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
      if (CoreService.session.wizardNew.operation == 'NEW_CLIENT'){
        $state.go('cvu-new-s2-user-data');
      }else if (CoreService.session.wizardNew.operation == 'ADD_VEHICLE'){
        $state.go('cvu-new-s1-id');
      }else if (CoreService.session.wizardNew.operation == 'ASSIGN_TAG'){
        $state.go('cvu-new-s1-id');
      }else{
        $state.go('cvu-new-s1-id');
      }
    }

    $scope.initialize();

    //
    // Session timeout handler
    CoreService.sessionTimerStart();
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });
  }

})();
