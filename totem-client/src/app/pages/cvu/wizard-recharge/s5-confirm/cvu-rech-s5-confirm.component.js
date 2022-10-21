(function () {
  'use strict';

  angular.module('app').component('cvuRechStep5Confirm', {
    controller: CVURechStep5ConfirmController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s5-confirm/cvu-rech-s5-confirm.view.html'
  });

  /** @ngInject */
  function CVURechStep5ConfirmController($log, $scope, $state, CoreService, $timeout, ApiService) {

    $log.debug('CVU Recharge Step 5 Confirm activated');

    $scope.processCompleted = false;
    $scope.status           = 'Confirmando transacción...';

    $scope.continue = function () {
      $state.go('cvu-rech-s6-done');
    }

    $scope.process = function(){
      $log.debug("Process | CVUConfirm for trxId " + CoreService.session.wizardRecharge.payment.transaction.id + '...');

      ApiService.CVUConfirmRecharge(CoreService.session.wizardRecharge.payment.transaction.id).then((response) => {
        $log.debug(response);
        if (response.outcode == 200 || response.outcode == 201){
          if (response.data.status == 'COMPLETED'){
            $scope.continue();
          }else{
            $state.go('cvu-rech-s5b-refund');
          }
        }else{
          //
          // Server returned error
          //
          CoreService.showRetryDialog("No fue posible confirmar la transacción").then(function(retry){
            if (retry){
              $scope.process();
            }else{
              CoreService.showCancelDialog().then(function(cancel){
                if (cancel){
                  //
                  // User cancelled transaction
                  //
                  $state.go('cvu-rech-s5b-refund');
                }else{
                  // Retry again
                  $scope.process();
                }
              }, function(){});
            }
          }, function(){});
          $log.error('Error on CVUConfirm');
          $log.error(response);
        }
      }, function(err){
        //
          // Comm error with server
          //
          CoreService.showRetryDialog("No fue posible confirmar la transacción").then(function(retry){
            if (retry){
              $scope.process();
            }else{
              CoreService.showCancelDialog().then(function(cancel){
                if (cancel){
                  //
                  // User cancelled transaction
                  //
                  $state.go('cvu-rech-s5b-refund');
                }else{
                  // Retry again
                  $scope.process();
                }
              }, function(){});
            }
          }, function(){});
          $log.error('Error on CVUConfirm');
          $log.error(err);
      });
    }

    $timeout(function(){
      $scope.process();
    }, 1000);

    CoreService.sessionTimerStop();
    
  }

})();
