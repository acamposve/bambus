(function () {
  'use strict';

  angular.module('app').component('cvuRechStep6Done', {
    controller: CVURechStep6DoneController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s6-done/cvu-rech-s6-done.view.html'
  });

  /** @ngInject */
  function CVURechStep6DoneController($log, $scope, $state, CoreService) {

    $log.debug('CVU Recharge Step 6 Done activated');

    $scope.completed = CoreService.session.wizardRecharge.completed;
    
    $scope.finish = function () {
      $state.go('home');
    }

    //
    // Session timeout handler
    CoreService.sessionTimerStart();
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });

  }

})();
