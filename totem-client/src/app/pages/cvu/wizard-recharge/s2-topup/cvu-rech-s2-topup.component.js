(function () {
  'use strict';

  angular.module('app').component('cvuRechStep2Topup', {
    controller: CVURechStep2TopupController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s2-topup/cvu-rech-s2-topup.view.html'
  });

  /** @ngInject */
  function CVURechStep2TopupController($log, $scope, CoreService, ApiService, $state) {

    $log.debug('CVU Recharge Step 2 TopUp activated');

    $scope.keyboardLayout = 'number';
    $scope.keyboardInput  = '';
    $scope.showKeyboard   = false;
    $scope.showErrors     = false;
    $scope.data = {
      rechargeAmount: 0,
      amounts       : null,
      includesTaxes : false
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
      CoreService.session.wizardRecharge.amount = amount;

      $state.go('cvu-rech-s3-process');
    }

    $scope.selectCustom = function (){
      $scope.showKeyboard = true;
      CoreService.showCustomAmountSelector($scope).then(function(customAmount){
        CoreService.session.wizardRecharge.amount = {
          amount        : customAmount,
        };

        $state.go('cvu-rech-s3-process');
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
      $state.go('cvu-rech-s1-id');
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
