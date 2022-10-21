(function () {
  'use strict';

  angular.module('app').component('cvuNewStep8bRefunded', {
    controller: CVUNewStep8bRefundedController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s8b-refunded/cvu-new-s8b-refunded.view.html'
  });

  /** @ngInject */
  function CVUNewStep8bRefundedController($log, $scope, $state, CoreService) {

    $log.debug('CVU New Step 8b Refunded activated');

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
