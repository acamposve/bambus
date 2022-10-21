(function () {
  'use strict';

  angular.module('app').component('cvuRechStep5bRefund', {
    controller: CVURechStep5bRefundController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s5b-refund/cvu-rech-s5b-refund.view.html'
  });

  /** @ngInject */
  function CVURechStep5bRefundController($log, $scope, CoreService, ApiService, $state, $timeout) {

    $log.debug('CVU Recharge Step 5b Refund activated');
    $scope.refundStep  = 0;
    $scope.paymentData = {
      transactionId: null,
      customerId   : null,
      status       : null
    };
    $scope.payCompleted   = false;
    $scope.pageCancelled  = false;
    $scope.commRetries    = 2;
    $scope.amountToRefund = parseInt(CoreService.session.wizardRecharge.amount.amount).toString();
    $scope.status         = 'Cancelando transacción...';
    
    $scope.continue = function () {
      $state.go('cvu-rech-s6b-refunded');
    }

    $scope.initRefund = function(){
      $scope.status = 'Enviando transacción a POS...';
      ApiService.SareaRefund(CoreService.session.wizardRecharge.payment.id).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $scope.refundData = response.data;

          // Otherwise, trigger check status timer
          $timeout(function(){
            $scope.checkStatus();
          }, (response.data.timeout && response.data.timeout > 0 && response.data.timeout < 60000) ? response.data.timeout * 1000 : 5000 )
        }else{
          CoreService.showError("Ocurrió un error", response.data.statusDesc);
          $log.error('Error on initRefund');
          $log.error(response);
          $state.go('contact-support');
        }
      }, (err) => {
        //
        // Server comm error
        //
        if (err.outcode == -2){
          $log.error('Process|initRefund with timeout!');
          if ($scope.commRetries > 0){
            $scope.commRetries--;
            $log.debug('Retrying...');
            $scope.status = 'Reintenando enviar solicitud...';
            $scope.initRefund();
          }else{
            $log.error('Process|Process with timeout and no more retries!');
            CoreService.showError("Ocurrió un error", "No fue posible procesar la transacción.");
            $log.error('Error on initRefund 3');
            $log.error(err);
            $state.go('contact-support');
          }
        }else{
          CoreService.showError("Ocurrió un error", err.message, err.outcode);
          $log.error('Error on initRefund');
          $log.error(err);
          $state.go('contact-support');
        }
      });
    }

    $scope.simCheckStatus = function(){
      $scope.status = 'Esperando anulación...';
      $timeout(function(){
        $scope.payCompleted = true;
        $scope.status = 'Anulación completada con éxito!';
        $timeout(function(){
          $scope.continue();
        }, 3000);
      }, 3000);
    }

    $scope.checkStatus = function(){
      $scope.status = 'Esperando anulación...';
      $log.log('checkStatus|Checking refund for payId ' + CoreService.session.wizardRecharge.payment.id);
      ApiService.SareaCheckRefund(
        CoreService.session.wizardRecharge.payment.id, 
        CoreService.session.wizardRecharge.payment.transaction.id).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('checkStatus|Server response is OK with data:');
          $log.log(response);
          if (response.data.status == "REFUNDED"){
            //
            // Update screen and continue to process
            //
            $log.log('checkStatus|Refund completed successfully, moving to next step...');
            $scope.status = 'Anulación de dinero completada con éxito';
            $scope.payCompleted = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $scope.continue();
            }, 3000);
          }else if (response.data.status == "REFUNDING"){
            //
            // Payment still in course, wait 2 seconds
            //
            $log.log('checkStatus|Refund not completed yet, re-checking in 2 seconds...');
            $scope.checkStatusTimeout = $timeout(function(){
              $scope.checkStatus();
            }, 2000);
          }else{
            //
            // Payment status is errored
            //
            $log.log('checkStatus|Refund with error!');
            $log.error('Error on continue 3');
            $log.error(response);
            CoreService.showError("La anulación no se pudo completar", response.data.statusDesc, null, true).then(function(){
              $state.go('contact-support');
            }, function(){});
          }
        }else{
          //
          // Server returned error
          //
          $log.error('Error on continue 2');
          $log.error(response);
          CoreService.showError("La anulación no se pudo completar", response.data.statusDesc, null, true).then(function(){
            $state.go('contact-support');
          }, function(){});
        }
      }, (error) => {
        CoreService.showError("La anulación no se pudo completar", error.message, error.outcode, true).then(function(){
          $state.go('contact-support');
        }, function(){});
        $log.error('Error on continue');
        $log.error(error);
      });
    }

    $scope.cancelTransaction = function(){
      $scope.processCompleted = false;
      $log.log('cancelTransaction|Cancelling trx ' + CoreService.session.wizardRecharge.transactionId);
      ApiService.CVUReverseRecharge(CoreService.session.wizardNew.transactionId).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('CVUReverseRecharge|Server response is OK with data:');
          $log.log(response);
          ApiService.CVUExecuteRollback(CoreService.session.wizardRecharge.transactionId).then((response) => {
            if (response.outcode == 200 || response.outcode == 201){
              $log.log('cancelTransaction|Server response is OK with data:');
              $log.log(response);
              if (response.data.status == "CANCELED"){
                $log.log('cancelTransaction| Transaction ' + CoreService.session.wizardRecharge.transactionId + ' cancelled sucessfully.');
              }else{
                $log.error('cancelTransaction| Transaction ' + CoreService.session.wizardRecharge.transactionId + ' could not be cancelled correctly.');
              }
            }else{
              $log.error('cancelTransaction| Transaction ' + CoreService.session.wizardRecharge.transactionId + ' could not be cancelled correctly. Server returned ' + response.outcode);
            }
    
            $scope.status = 'Transacción cancelada';
            $scope.processCompleted = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $scope.refundStep  = 1;
              if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
              }
              // $scope.initRefund();
            }, 1000);
          });
        } else {
          $log.error('CVUReverseRecharge| Transaction ' + CoreService.session.wizardRecharge.transactionId + ' could not be reverted correctly. Server returned ' + response.outcode);
        }
      });
    }

    $scope.continueToRefund = function(){
      $scope.refundStep = 2;
      $scope.initRefund();
    }

    $scope.$on("$destroy", function(){
      $log.debug('Destroy called');
      $scope.pageCancelled = true;
      if ($scope.checkStatusTimeout){
        $log.debug('Cancelling checkStatusTimeout...');
        $timeout.cancel($scope.checkStatusTimeout);
      }
    });

    // Init payment
    $timeout(function(){
      // Check if page was closed
      if ($scope.pageCancelled) {
        $log.debug('Pages was destroyed before starting to request payment. Cancelling.');
        return;
      }
      // $scope.simCheckStatus();
      // $scope.initRefund();
      $scope.cancelTransaction();
    }, 2000);

    CoreService.sessionTimerStop();
  }

})();
