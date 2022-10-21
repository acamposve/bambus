(function () {
  'use strict';

  angular.module('app').component('cvuSupportScreen', {
    controller: CVUSupportScreenController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/support-screen/cvu-support-screen.view.html'
  });

  /** @ngInject */
  function CVUSupportScreenController($log, $scope, $state, CoreService) {

    $log.debug('CVU Support Screen activated');

    $scope.data = CoreService.session;
    
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
