(function () {
  'use strict';

  angular.module('app').component('cvuRechStep4Pay', {
    controller: CVURechStep4PayController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s4-pay/cvu-rech-s4-pay.view.html'
  });

  /** @ngInject */
  function CVURechStep4PayController($log, $scope, CoreService, ApiService, $state, $timeout) {

    $log.debug('CVU Recharge Step 4 Pay activated');
    $scope.payStep     = 0;
    $scope.paymentData = {
      transactionId: null,
      customerId: null,
      status: null
    };
    $scope.payCompleted    = false;
    $scope.pageCancelled   = false;
    $scope.statusCheckWait = 2000;
    $scope.statusChecks    = 0;
    $scope.maxStatusChecks = 40;
    $scope.amountToPay     = parseInt(CoreService.session.wizardRecharge.amount.amount).toString();

    $scope.status = 'Enviando transacción a POS...';
    
    $scope.continue = function () {
      $state.go('cvu-rech-s5-confirm');
    }

    $scope.initPayment = function(){
      var params = {
        transactionId: CoreService.session.wizardRecharge.transactionId,
        user         : CoreService.session.wizardRecharge.user,
        amount       : CoreService.session.wizardRecharge.amount,
        operation    : 'RECHARGE'
      }
      ApiService.SareaPay(params).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $scope.paymentData = response.data;
          CoreService.session.wizardRecharge.payment = response.data;

          // Check if page was closed
          if ($scope.pageCancelled) {
            $log.debug('Payment response received but page was cancelled');
            return;
          }
          // Otherwise, trigger check status timer
          $timeout(function(){
            $scope.statusChecks = 0;
            $scope.checkStatus();
          }, (response.data.timeout && response.data.timeout > 0 && response.data.timeout < 60000) ? response.data.timeout * 1000 : 5000 )
        }else{
          // CoreService.showError("Ocurrió un error", response.message, response.outcode);
          $log.error('Error on continue');
          $log.error(response);
          $scope.showRetry("No se pudo iniciar el pago", null, response.data.statusDesc );
        }
      }, (error) => {
        // CoreService.showError("Ocurrió un error", error.message, error.outcode);
        $log.error('Error on continue');
        $log.error(error);
        $scope.showRetry("No se pudo iniciar el pago", null , "No se pudo comunicar con el servidor" );
      });
    }

    $scope.simCheckStatus = function(resultOK){
      $scope.status = 'Esperando pago...';
      $timeout(function(){
        CoreService.session.wizardRecharge.payment = {
          amount: "25000.00",
          amountDiscount: "0.00",
          id: 91,
          status: resultOK ? "PAID" : "ERROR",
          statusDesc: resultOK ? "TRANSACCION EJECUTADA CON SUCESO" : "ERROR",
          transaction: {id: 141, type: "", status: "PAID", userId: 141, errorCode: null, errorDesc: null},
          errorCode: null,
          errorDesc: null,
          type: "",
          userId: 141,
        };
        $timeout(function(){
          if (resultOK){
            $scope.payCompleted = true;
            $scope.status = 'Pago completado con éxito!';
            CoreService.session.wizardRecharge.completed = true;
            $scope.continue();
          }else{
            $scope.showRetry("No se pudo procesar el pago", null, "Error simulado");
          }
        }, 3000);
      }, 3000);
    }

    $scope.checkStatus = function(){
      $scope.status = 'Esperando pago...';
      $scope.statusChecks++;
      $log.log('checkStatus|Checking ('+$scope.statusChecks+') payment for trx ' + $scope.paymentData.transactionId + ' and customer ' + $scope.paymentData.customerId);
      ApiService.SareaCheckPayment(
        $scope.paymentData.id, 
        $scope.paymentData.transaction.id
        /*, $scope.paymentData.transaction.userId*/).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('checkStatus|Server response is OK with data:');
          $log.log(response);
          if (response.data.status == "PAID"){
            //
            // Store payment data
            //
            CoreService.session.wizardRecharge.payment = response.data;
            //
            // Update screen and continue to process
            //
            $log.log('checkStatus|Payment completed successfully, moving to next step...');
            $scope.status = 'Pago completado con éxito';
            $scope.payCompleted = true;
            CoreService.session.wizardRecharge.completed = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $scope.continue();
            }, $scope.statusCheckWait);
          }else if (response.data.status == "PAYING"){
            //
            // Payment still in course, wait 2 seconds
            //
            if ($scope.statusChecks == $scope.maxStatusChecks){
              $log.log('checkStatus|Max checks reached! Ask to manual retry');
              CoreService.showRetryDialog("No se pudo verificar el pago").then(function(retry){
                if (retry){
                  $scope.initPayment();
                }else{
                  $state.go('cvu-rech-s4b-revert');
                }
              }, function(){});
            }else{
              $log.log('checkStatus|Payment not completed yet, re-checking #'+$scope.statusChecks+' in 2 seconds...');
              $scope.checkStatusTimeout = $timeout(function(){
                $scope.checkStatus();
              }, $scope.statusCheckWait);
            }
          }else{
            //
            // Payment status is errored
            //
            $log.log('checkStatus|Payment with error!');
            $log.error('Error on continue 2');
            $log.error(response);
            // CoreService.showError("Ocurrió un error", response.data.transaction.errorDesc, response.data.transaction.errorCode);
            $scope.showRetry("No se pudo procesar el pago", null, response.data.statusDesc);
          }
        }else{
          //
          // Server returned error
          //
          // CoreService.showError("Ocurrió un error", response.message, response.outcode);
          $log.error('checkStatus|Error on continue 2');
          $log.error(response);
          $scope.showRetry("No se pudo procesar el pago", response.outcode, response.message);
        }
      }, (error) => {
        if (error.outcode == -2){
          if ($scope.statusChecks == $scope.maxStatusChecks){
            $log.log('checkStatus|Max checks reached! Ask to manual retry');
            CoreService.showRetryDialog("No se pudo verificar el pago").then(function(retry){
              if (retry){
                $scope.initPayment();
              }else{
                $state.go('cvu-rech-s4b-revert');
              }
            }, function(){});
          }else{
            $log.warn('checkStatus|Timeout ocurred!, retrying #'+$scope.statusChecks+' in 2 seconds...');
            $scope.checkStatusTimeout = $timeout(function(){
              $scope.checkStatus();
            }, $scope.statusCheckWait);
          }
        }else{
          $scope.showRetry("No se pudo procesar el pago", null, "Error de comunicación con el servidor");
          $log.error('checkStatus|Error on continue');
          $log.error(error);
        }
      });
    }

    $scope.showRetry = function(title, errorCode, errorDesc){
      CoreService.showRetryDialog(title, errorCode, errorDesc).then( function(retry){
        if (retry){
          $scope.initPayment();
        }else{
          $state.go('cvu-rech-s4b-revert');
        }
      }, function(){});
    }

    $scope.$on("$destroy", function(){
      $log.debug('Destroy called');
      $scope.pageCancelled = true;
      if ($scope.checkStatusTimeout){
        $log.debug('Cancelling checkStatusTimeout...');
        $timeout.cancel($scope.checkStatusTimeout);
      }
    });

    $scope.cancelTransaction = function(){
      $scope.payStep = 2;
      $scope.status = 'Cancelando transacción...';
      $scope.processCompleted = false;
      $log.log('cancelTransaction|Cancelling trx ' + CoreService.session.wizardRecharge.transactionId);
      ApiService.CVUReverseRecharge(CoreService.session.wizardRecharge.transactionId).then((response) => {
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
          CoreService.clearSession();
          $state.go('start');
        }, 3000);

        
      });
      
    }

    $scope.cancel = function(){
      CoreService.showCancelDialog().then(function(cancel){
        if (cancel){
          $scope.cancelTransaction();
        }
      }, function(err){
        $log.error(err);
      })
    }

    $scope.continueToPay = function(){
      $scope.payStep = 1;
      $scope.initPayment();
    }

    // Init payment
    // $timeout(function(){
    //   // Check if page was closed
    //   if ($scope.pageCancelled) {
    //     $log.debug('Pages was destroyed before starting to request payment. Cancelling.');
    //     return;
    //   }
    //   // $scope.simCheckStatus(false);
    //   $scope.initPayment();
    // }, 2000);

    CoreService.sessionTimerStop();
  }

})();
