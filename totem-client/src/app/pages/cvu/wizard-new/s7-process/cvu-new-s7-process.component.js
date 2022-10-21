(function () {
  'use strict';

  angular.module('app').component('cvuNewStep7Process', {
    controller: CVUNewStep7ProcessController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s7-process/cvu-new-s7-process.view.html'
  });

  /** @ngInject */
  function CVUNewStep7ProcessController($log, $scope, $state, $timeout, CoreService, ApiService) {

    $log.debug('CVU New Step 7 Process activated');

    $scope.commRetries      = 2;
    $scope.processCompleted = false;
    $scope.status           = 'Enviando solicitud...';
    $scope.showErrors       = false;
    $scope.statusCheckWait  = 2000;
    $scope.statusChecks     = 0;
    $scope.maxStatusChecks  = 30;

    $scope.data = {
      tagId: 0
    }; 
    
    $scope.continue = function () {
      $state.go('cvu-new-s8-done');
    }

    $scope.process = function(){
      $log.debug("Process | CVUConfirm for trxId " + CoreService.session.wizardNew.payment.transaction.id + '...');
      var vehicle = {
        brand: CoreService.session.wizardNew.vehicle.brand,
        model: CoreService.session.wizardNew.vehicle.model,
        color: CoreService.session.wizardNew.vehicle.color,
        plateNumber: CoreService.session.wizardNew.vehicle.plateNumber
      };

      ApiService.CVUConfirm(CoreService.session.wizardNew.payment.transaction.id, vehicle).then((response) => {
        $log.debug(response);
        if (response.outcode == 200 || response.outcode == 201){
          if (response.data.status == 'COMPLETED'){
            $scope.continue();
          }else{
            $log.error('Error on CVUConfirm, server returned status: ' + response.data.status);
            $log.error(response);
            CoreService.showError("Error al confirmar", "No fue posible confirmar la transacción, se procederá a cancelar la misma y devolver el pago", null, true)
            .then(function(){
              $state.go('cvu-new-s7b-refund');
            }, function(){});
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
                  $state.go('cvu-new-s7b-refund');
                }else{
                  // Retry again
                  $scope.process();
                }
              }, function(){});
            }
          }, function(){});
          $log.error('Error on CVUConfirm, server returned error');
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
                $state.go('cvu-new-s7b-refund');
              }else{
                // Retry again
                $scope.process();
              }
            }, function(){});
          }
        }, function(){});
        $log.error('Error on CVUCheckTAG, comm error');
        $log.error(err);
      });
    }


    $timeout(function(){
      $scope.process();
    }, 3000);


    CoreService.sessionTimerStop();
  }

})();
