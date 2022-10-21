(function () {
  'use strict';

  angular.module('app').component('cvuRechStep4bRevert', {
    controller: CVURechStep4bRevertController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s4b-revert/cvu-rech-s4b-revert.view.html'
  });

  /** @ngInject */
  function CVURechStep4bRevertController($log, $scope, CoreService, ApiService, $state, $timeout) {

    $log.debug('CVU Recharge Step 4b Revert Recharge activated');

    $scope.revertCompleted  = false;
    $scope.commRetries   = 2;

    $scope.status = 'Procesando la cancelación...';
    
    $scope.continue = function () {
      $state.go('home');
    }

    $scope.doRevert = function(){
      ApiService.CVUReverseRecharge(CoreService.session.wizardRecharge.transactionId).then((response) => {
        if (response.outcode == 200 || response.outcode == 201){
          $scope.refundData = response.data;
          CoreService.session.wizardRecharge.completed = false;
          $scope.revertCompleted = true;
          $scope.status = 'Recarga cancelada con éxito';
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
          }
          $timeout(function(){
            $scope.continue();
          }, 3000);
        }else{
          CoreService.showError("Ocurrió un error", response.data.statusDesc);
          $log.error('Error on doRevert');
          $log.error(response);
        }
      }, (err) => {
        //
        // Server comm error
        //
        if (err.outcode == -2){
          $log.error('Process|doRefund with timeout!');
          if ($scope.commRetries > 0){
            $scope.commRetries--;
            $log.debug('Retrying...');
            $scope.status = 'Reintenando enviar solicitud...';
            $scope.doRefund();
          }else{
            $log.error('Process|Process with timeout and no more retries!');
            CoreService.showError("Ocurrió un error", "No fue posible procesar la cancelación.");
            $log.error('Error on initRefund 3');
            $log.error(err);
            $state.go('home');
          }
        }else{
          CoreService.showError("Ocurrió un error", err.message, err.outcode);
          $log.error('Error on doRefund');
          $log.error(err);
          $state.go('home');
        }
      });
    }

    // Init payment
    $timeout(function(){
      
      $scope.doRevert();
    }, 2000);

    CoreService.sessionTimerStop();
  }

})();
