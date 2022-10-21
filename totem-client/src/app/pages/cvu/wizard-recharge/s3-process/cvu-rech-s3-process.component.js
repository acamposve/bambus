(function () {
  'use strict';

  angular.module('app').component('cvuRechStep3Process', {
    controller: CVURechStep3ProcessController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s3-process/cvu-rech-s3-process.view.html'
  });

  /** @ngInject */
  function CVURechStep3ProcessController($log, $scope, $state, $timeout, CoreService, ApiService) {

    $log.debug('CVU Recharge Step 3 Process activated');

    $scope.commRetries      = 2; 
    $scope.status           = 'Enviando solicitud...';
    $scope.showErrors       = false;
    $scope.data = {
      tagId: 0
    }; 
    
    $scope.process = function(){
      $log.debug("Process | CVUExecuteStart for trxId " + CoreService.session.wizardRecharge.transactionId + '...');
      ApiService.CVUExecuteStart(
        CoreService.session.wizardRecharge.transactionId,
        null,
        CoreService.session.wizardRecharge.user.externalId,
        CoreService.session.wizardRecharge.amount).then((response) => {
        $log.debug(response);
        if (response.outcode == 200 || response.outcode == 201){
          $timeout(function(){
            $scope.checkStatus();
            // $scope.simCheckStatus();
          },  2000 );
        }else{
          //
          // Server returned error
          //
          // CoreService.showError("Ocurrió un error", response.message, response.outcode);
          $log.error('Error on process');
          $log.error(response);
          $scope.showRetry("Ocurrió un error al recargar", response.message, response.outcode);
        }
      }, function(err){
        //
        // Server comm error
        //
        if (err.outcode == -2){
          $log.error('Process|Process with timeout!');
          if ($scope.commRetries > 0){
            $scope.commRetries--;
            $log.debug('Retrying...');
            $scope.status = 'Reintenando enviar solicitud #'+$scope.commRetries+'...';
            $scope.process();
          }else{
            $log.error('Process|Process with timeout and no more retries!');
            CoreService.showError("Ocurrió un error", "No fue posible procesar la transacción.");
            $log.error('Error on process 3');
            $log.error(err);
          }
        }else{
          $log.error('Process|Process with error!');
          $log.error('Error on process 2');
          $log.error(err);
          // CoreService.showError("Ocurrió un error", "No fue posible procesar la transacción.");
          $scope.showRetry("Ocurrió un error al enviar la solicitud", err.message, err.outcode);
        }
      });
    }

    $scope.simCheckStatus = function(){
      $scope.status = 'Esperando respuesta...';
      $timeout(function(){
        $scope.payCompleted = true;
        $scope.status = 'Proceso completado con éxito!';
        $timeout(function(){
          $scope.processStep = 1;
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
          }
        }, 3000);
      }, 3000);
    }

    $scope.checkStatus = function(){
      $scope.status = 'Esperando respuesta...';
      $log.log('checkStatus|Checking process for trx ' + CoreService.session.wizardRecharge.transactionId);
      ApiService.CVUExecuteStatus(
        CoreService.session.wizardRecharge.transactionId,
        CoreService.session.wizardRecharge.user.externalId).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $log.log('checkStatus|Server response is OK with data:');
          $log.log(response);
          if (response.data.status == "EXECUTED"){
            //
            // Update screen and continue to process
            //
            $log.log('checkStatus|Process completed successfully, finishing...');
            $scope.status = 'Recarga preparada con éxito';
            $scope.processCompleted = true;
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
              $scope.$apply();
            }
            $timeout(function(){
              $state.go('cvu-rech-s4-pay');
            }, 1000);
          }else if (response.data.status == "PROCESSING"){
            //
            // Payment still in course, wait 2 seconds
            //
            $log.log('checkStatus|Process not completed yet, re-checking in 2 seconds...');
            $scope.checkStatusTimeout = $timeout(function(){
              $scope.checkStatus();
            }, 2000);
          }else{
            //
            // Payment status is errored
            //
            $log.log('checkStatus|Process with error!');
            $log.error('Error on continue 2');
            $log.error(response);
            $scope.showError("Ocurrió un error 1", response.data.errorDesc, response.data.errorCode);
          }
        }else{
          //
          // Server returned error
          //
          $log.error('Error on continue');
          $log.error(response);
          $scope.showError("Ocurrió un error 2", response.message, response.outcode);
        }
      }, (error) => {
        $log.error('Error on continue');
        $log.error(error);
        $scope.showError("Ocurrió un error 3", error.message, error.outcode);
      });
    }

    // $scope.continueToPay = function () {
    //   $state.go('cvu-rech-s4-pay');
    // }

    $scope.showError = function(title, message, outcode){
      CoreService.showError(title, message, outcode, true).then(function(){
        $state.go('home');
      }, function(){});
    }

    $scope.showRetry = function(title, errorCode, errorDesc){
      CoreService.showRetryDialog(title, errorCode, errorDesc).then( function(retry){
        if (retry){
          $scope.process();
        }else{
          $state.go('cvu-rech-s4b-refund');
        }
      }, function(){});
    }

    // $scope.cancel = function(){
    //   CoreService.showCancelDialog().then(function(cancel){
    //     if (cancel){
    //       $scope.status = 'Cancelando la recarga...';
    //       $scope.processStep = 2;
    //       if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
    //         $scope.$apply();
    //       }
    //       ApiService.CVUReverseRecharge(CoreService.session.wizardRecharge.transactionId).then((response) => {
    //         if (response.outcode == 200 || response.outcode == 201){
    //           $log.log('Transaction ' + CoreService.session.wizardRecharge.transactionId + ' reverted successfully!');
    //           $scope.cancelCompleted = true;
    //           $timeout(function(){
    //             CoreService.clearSession();
    //             $state.go('start');
    //           }, 2000);
    //         }else{
    //           //
    //           // Server returned error
    //           //
    //           $log.error('Server returned error reversing recharge transaction '+ CoreService.session.wizardRecharge.transactionId);
    //           $log.error(response);
    //           CoreService.clearSession();
    //           $state.go('start');
    //         }
    //       }, (error) => {
    //         $log.error('Comm error reversing recharge transaction '+ CoreService.session.wizardRecharge.transactionId);
    //         $log.error(error);
    //         CoreService.clearSession();
    //         $state.go('start');
    //       });
    //     }
    //   }, function(err){
    //     $log.error(err);
    //   })
    // }

    $timeout(function(){
      $scope.process();
    }, 500);

    CoreService.sessionTimerStop();

  }

})();
