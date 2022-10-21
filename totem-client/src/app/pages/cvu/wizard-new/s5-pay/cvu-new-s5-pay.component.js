(function () {
  'use strict';

  angular.module('app').component('cvuNewStep5Pay', {
    controller: CVUNewStep5PayController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s5-pay/cvu-new-s5-pay.view.html'
  });

  /** @ngInject */
  function CVUNewStep5PayController($log, $scope, $state, $timeout, CoreService, ApiService) {
    $scope.payStep     = 0;
    $scope.paymentData = {
      transactionId: null,
      customerId   : null,
      status       : null
    };
    $scope.payCompleted     = false;
    $scope.checkedTimes     = 0;
    $scope.commRetries      = 2;
    $scope.statusCheckWait  = 2000;
    $scope.processCompleted = false;
    $scope.processChecks    = 0;
    $scope.maxStatusChecks  = 40;
    $scope.amountToPay      = parseInt(CoreService.session.wizardNew.amount.amount).toString();

    $log.debug('CVU New Step 5 Pay activated');

    $scope.processStatus = 'Preparando la transacción...';
    $scope.status        = 'Enviando transacción a POS...';
    
    $scope.continue = function () {
      $state.go('cvu-new-s6-tag');
    }

    //
    // CVU Process
    //
    $scope.CVUProcess = function(){
      $log.debug("Process | CVUExecuteStart for trxId " + CoreService.session.wizardNew.transactionId + '...');
      var vehicle = {
        brand: CoreService.session.wizardNew.vehicle.brand,
        model: CoreService.session.wizardNew.vehicle.model,
        color: CoreService.session.wizardNew.vehicle.color,
        plateNumber: CoreService.session.wizardNew.vehicle.plateNumber
      };

      $scope.commRetries = 2;

      ApiService.CVUExecuteStart(
        CoreService.session.wizardNew.transactionId, 
        vehicle,
        CoreService.session.wizardNew.user.externalId,
        CoreService.session.wizardNew.amount,
        CoreService.session.wizardNew.user).then((response) => {
        $log.debug(response);
        if (response.outcode == 200 || response.outcode == 201){
          $scope.CVUCheckStatus();
        }else{
          //
          // Server returned error
          //
          // CoreService.showError("Ocurrió un error", response.message, response.outcode);
          CoreService.showRetryDialog("No se pudo iniciar el procesamiento", response.outcode, response.message).then(function(retry){
            if (retry){
              $scope.CVUProcess();
            }else{
              $state.go('start');
            }
          }, function(){});
          $log.error('Error on CVUProcess');
          $log.error(response);
        }
      }, function(err){
        //
        // Server comm error
        //
        if (err.outcode == -2){
          $log.error('CVUProcess|Process with timeout!');
          if ($scope.commRetries > 0){
            $scope.commRetries--;
            $log.debug('Retrying...');
            $scope.status = 'Reintenando enviar solicitud #'+$scope.commRetries+'...';
            $scope.CVUProcess();
          }else{
            $log.error('CVUProcess|Process with timeout and no more retries!');
            CoreService.showError("Ocurrió un error", "No fue posible procesar la transacción.");
            $log.error('Error on CVUProcess 3');
            $log.error(err);
          }
        }else{
          // CoreService.showError("Ocurrió un error", "No fue posible procesar la transacción.");
          CoreService.showRetryDialog("Ocurrió un error de comunicación").then(function(retry){
            if (retry){
              $scope.CVUProcess();
            }else{
              $state.go('start');
            }
          }, function(){});
          $log.error('Error on CVUProcess 2');
          $log.error(err);
        }
      });
    }

    $scope.CVUCheckStatus = function(){
      $scope.processStatus = 'Esperando respuesta...';
      $scope.processChecks++;
      $log.log('checkStatus|Checking ('+$scope.processChecks+') process for trx ' + CoreService.session.wizardNew.transactionId);
      ApiService.CVUExecuteStatus(CoreService.session.wizardNew.transactionId).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('checkStatus|Server response is OK with data:');
          $log.log(response);
          if (response.data.status == "EXECUTED"){
            //
            // Update screen and continue to process
            //
            $log.log('checkStatus|Process completed successfully, finishing...');
            // $scope.processStatus = 'Proceso completado con éxito';
            $scope.processCompleted = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $scope.showPreparePay();
            }, 3000);
          }else if (response.data.status == "PROCESSING"){
            //
            // Process still in course, wait 2 seconds
            //
            if ($scope.processChecks == $scope.maxStatusChecks){
              $log.log('checkStatus|Max checks reached! Ask to manual retry');
              CoreService.showRetryDialog("No se pudo verificar la transacción").then(function(retry){
                if (retry){
                  $scope.CVUProcess();
                }else{
                  $state.go('start');
                }
              }, function(){});
            }else{
              $log.log('checkStatus|Process not completed yet, re-checking in 2 seconds...');
              $scope.checkStatusTimeout = $timeout(function(){
                $scope.CVUCheckStatus();
              }, $scope.statusCheckWait);
            }
          }else{
            //
            // Server status is not correct
            //
            $log.error('checkStatus|Process with error!');
            $log.error('Error on continue 1');
            $log.error(response);
            CoreService.showError("Ocurrió un error", response.data.errorDesc, response.data.errorCode, true).then(function(){
              //
              // Execute rollback to undo transaction
              //
              $scope.cancelTransaction();
            }, function(){});
          }
        }else{
          //
          // Server returned error
          //
          CoreService.showRetryDialog("Ocurrió un error verificando la transacción").then(function(retry){
            if (retry){
              $scope.CVUCheckStatus();
            }else{
              $state.go('start');
            }
          }, function(){});
          $log.error('Error on continue 2');
          $log.error(response);
          // $scope.showError("Ocurrió un error", response.message, response.outcode);
        }
      }, (error) => {
        $log.error('Error on continue 3');
        $log.error(error);
        // $scope.showError("Ocurrió un error", error.message, error.outcode);
        CoreService.showRetryDialog("Ocurrió un error verificando la transacción").then(function(retry){
          if (retry){
            $scope.CVUCheckStatus();
          }else{
            $state.go('start');
          }
        }, function(){});
      });
    }

    $scope.showError = function(localMsg, serverMsg, serverOutcode){
      var msg = (serverMsg && serverMsg.length > 0) ? serverMsg : localMsg;
      CoreService.showError("No se pudo procesar la transacción", msg, serverOutcode, true).then(function(){
        $state.go('start');
      }, function(){});
    };

    $scope.showPreparePay = function(){
      $scope.payStep = 1;
    }
    
    $scope.continueToPay = function(){
      $scope.payStep = 2;
      $scope.initPayment();
    }

    //
    // Payment Process
    //
    $scope.initPayment = function(){
      ApiService.SareaPay(CoreService.session.wizardNew).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $scope.paymentData = response.data;
          $timeout(function(){
            $scope.checkStatus();
          }, (response.data.timeout && response.data.timeout > 0 && response.data.timeout < 60000) ? response.data.timeout * 1000 : 5000 )
        }else{
          $log.error('Error on initPayment');
          $log.error(response);
          CoreService.showRetryDialog("No se pudo iniciar el pago").then(function(retry){
            if (retry){
              $scope.initPayment();
            }else{
              $log.warn('User cancelled, starting rollback at CVU...');
              $scope.cancelTransaction();
            }
          }, function(){});
        }
      }, (error) => {
        // CoreService.showError("Ocurrió un error", error.message, error.outcode);
        $log.error('Error on initPayment (2)');
        $log.error(error);
        CoreService.showRetryDialog("Ocurrió un error al iniciar el pago").then(function(retry){
          if (retry){
            $scope.initPayment();
          }else{
            $log.warn('User cancelled (2), starting rollback at CVU...');
            $scope.cancelTransaction();
          }
        }, function(){});
      });
    }

    $scope.checkStatus = function(){
      $scope.status = 'Esperando pago...';
      $log.log('checkPayStatus|Checking payment for trx ' + $scope.paymentData.transactionId + ' and customer ' + $scope.paymentData.customerId);
      ApiService.SareaCheckPayment(
        $scope.paymentData.id, 
        $scope.paymentData.transaction.id).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('checkPayStatus|Server response is OK with data:');
          $log.log(response);
          if (response.data.status == "PAID"){
            $log.log('checkPayStatus|Payment completed successfully, moving to next step...');
            CoreService.session.wizardNew.payment = $scope.paymentData;
            $scope.status = 'Pago completado con éxito';
            $scope.payCompleted = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $scope.continue();
            }, 3000);
          }else if (response.data.status == "PAYING"){
            $log.log('checkPayStatus|Payment not completed yet (paying), re-checking in '+$scope.statusCheckWait+' second...');
            $timeout(function(){
              $scope.checkStatus();
            }, $scope.statusCheckWait);
          }else if (response.data.status == "PENDING"){
            $log.log('checkPayStatus|Payment not completed yet (pending), re-checking in '+$scope.statusCheckWait+' second...');
            $timeout(function(){
              $scope.checkStatus();
            }, $scope.statusCheckWait);
          }else{
            $log.log('checkPayStatus|Payment returned errored status!');
            $log.error(response);
            // CoreService.showError("Ocurrió un error", response.data.message);
            CoreService.showRetryDialog("El pago no se pudo completar").then(function(retry){
              if (retry){
                $scope.initPayment();
              }else{
                $log.warn('User cancelled at errored status payment, starting rollback at CVU...');
                $scope.cancelTransaction();
              }
            }, function(){});
          }
        }else{
          // CoreService.showError("Ocurrió un error", response.message, response.outcode);
          $log.error('checkPayStatus|Error on server response ');
          $log.error(response);
          CoreService.showRetryDialog("El pago no se pudo completar").then(function(retry){
            if (retry){
              $scope.initPayment();
            }else{
              $log.warn('User cancelled at payment server response error, starting rollback at CVU...');
              $scope.cancelTransaction();
            }
          }, function(){});
        }
      }, (error) => {
        // CoreService.showError("Ocurrió un error", error.message, error.outcode);
        $log.error('checkPayStatus|Error on server comm');
        $log.error(error);
        CoreService.showRetryDialog("El pago no se pudo completar").then(function(retry){
          if (retry){
            $scope.initPayment();
          }else{
            $log.warn('checkPayStatus|User cancelled at payment server comm error, starting rollback at CVU...');
            $scope.cancelTransaction();
          }
        }, function(){});
      });
    }

    $scope.simInitPayment = function(){
      $timeout(function(){
        $scope.simCheckStatus();
      }, 5000 );
    }

    $scope.simCheckStatus = function(){
      $scope.status = 'Esperando pago...';
      $timeout(function(){
        CoreService.session.wizardNew.payment = {
          amount: "25000.00",
          amountDiscount: "0.00",
          id: 76,
          status: "PAID",
          statusDesc: "TRANSACCION EJECUTADA CON SUCESO",
          transaction: {id: 141, type: "", status: "PAID", userId: 141, errorCode: null, errorDesc: null},
          errorCode: null,
          errorDesc: null,
          type: "",
          userId: 141,
        };
        $scope.status = 'Pago completado con éxito';
        $scope.payCompleted = true;
        $timeout(function(){
          $timeout(function(){
            $scope.status = 'Le llegará una notificación de la transacción vía correo electrónico'
          },3000)
          $scope.continue();
        }, 3000);
      }, 3000);
    }

    $scope.cancelTransaction = function(){
      $scope.payStep = 4;
      $scope.status = 'Cancelando transacción...';
      $scope.processCompleted = false;
      $log.log('cancelTransaction|Cancelling trx ' + CoreService.session.wizardNew.transactionId);


      ApiService.CVUReverseRecharge(CoreService.session.wizardNew.transactionId).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('CVUReverseRecharge|Server response is OK with data:');
          $log.log(response);

          ApiService.CVUExecuteRollback(CoreService.session.wizardNew.transactionId).then((response) => {
            if (response.outcode == 200 || response.outcode == 201){
              $log.log('cancelTransaction|Server response is OK with data:');
              $log.log(response);
              if (response.data.status == "CANCELED"){
                $log.log('cancelTransaction| Transaction ' + CoreService.session.wizardNew.transactionId + ' cancelled sucessfully.');
              }else{
                $log.error('cancelTransaction| Transaction ' + CoreService.session.wizardNew.transactionId + ' could not be cancelled correctly.');
              }
            }else{
              $log.error('cancelTransaction| Transaction ' + CoreService.session.wizardNew.transactionId + ' could not be cancelled correctly. Server returned ' + response.outcode);
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
        } else {
          $log.error('CVUReverseRecharge| Transaction ' + CoreService.session.wizardRecharge.transactionId + ' could not be reverted correctly. Server returned ' + response.outcode);
        }
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


    // Init payment
    $timeout(function(){
      // $scope.simInitPayment();
      // $scope.initPayment();
      $scope.CVUProcess();
    }, 2000);

    CoreService.sessionTimerStop();
  }

})();
