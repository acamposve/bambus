(function () {
  'use strict';

  angular.module('app').component('cvuNewStep8Done', {
    controller: CVUNewStep8DoneController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s8-done/cvu-new-s8-done.view.html'
  });

  /** @ngInject */
  function CVUNewStep8DoneController($log, $scope, $state, CoreService) {

    $log.debug('CVU New Step 8 Done activated');

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
