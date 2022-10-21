(function () {
  'use strict';

  angular.module('app').component('cvuRechStep6bRefunded', {
    controller: CVURechStep6bRefundedController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-recharge/s6b-refunded/cvu-rech-s6b-refunded.view.html'
  });

  /** @ngInject */
  function CVURechStep6bRefundedController($log, $scope, $state, CoreService) {

    $log.debug('CVU Recharge Step 6b Refunded activated');

    $scope.showErrors = false;
    $scope.data = {
      tagId: 0
    }; 
    
    $scope.finish = function () {
      CoreService.sessionTimerStop();
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
