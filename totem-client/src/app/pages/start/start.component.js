(function() {
  'use strict';

  angular.module('app').component('start', {
    controller: StartController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/start/start.view.html',
  });

  /** @ngInject */
  function StartController($log, $state, $translate, CoreService, $scope, ApiService) {
    $scope.initialized   = false;
    $scope.newTagEnabled = true;

    $log.debug('start activated');

    $state.switchLanguage = function switchLanguage(language) {
      $translate.use(language);
    };

    $scope.goCVUNew = function(){
      if ($scope.newTagEnabled) $state.go('cvu-new-s1-id');
    }

    $scope.goCVURecharge = function(){
      $state.go('cvu-rech-s1-id');
    }

    $scope.cancel = function(){
      CoreService.clearSession();
      $state.go('home');
    }

    CoreService.clearSession();
   
    //
    // Initialize buttons
    //
    $scope.initializeButtons = function(){
      ApiService.getTotemInfo(true).then(
        function(response){
          $scope.initialized = true;
          if (response.outcode == 200 || response.outcode == 201){
            if (response.data){
              if (response.data.roll && (response.data.roll.qty == response.data.roll.sequencePosition)){
                $scope.newTagEnabled = false;
              }
              if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
              }
            }else{
              $log.error('initializeButtons| Server returned empty data on getTotemInfo');
              $log.error(response);
            }
          }else{
            $log.error('initializeButtons| Server returned outcode ' + response.outcode + ' on getTotemInfo');
            $log.error(response);
          }
        }, function(err){
          $scope.initialized = true;
          $log.error("initializeButtons| Error getting totem info!");
          $log.error(err);
        });
    }
    $scope.initializeButtons();

    //
    // Session timeout handler
    CoreService.sessionTimerStart(true);
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });
  }

})();
