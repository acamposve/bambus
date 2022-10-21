(function() {
  'use strict';

  angular.module('app').component('home', {
    controller: HomeController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/home/home.view.html',
  });

  /** @ngInject */
  function HomeController($log, $scope, $state, $translate, $timeout, CoreService, $window, ApiService) {
    $scope.maintenanceTimer    = null;
    $scope.appVersion          = CoreService.appVersion;
    $scope.outOfService        = false;
    $scope.totemInfoGetTimeout = 10000;

    $scope.switchLanguage = function(language){
      $translate.use(language);
    };

    $log.debug('home activated');

    $scope.goToStart = function(){
      if (!$scope.outOfService){
        $state.go('start');
      }
    }

    $scope.openInfo = function(){
      $state.go('info');
    };

    //
    // Totem info check
    //
    $scope.checkTotemInfo = function(){
      $log.debug('checkTotemInfo|Checking...');
      ApiService.getTotemInfo(true).then(
        function(response){
          if (response.outcode == 200 || response.outcode == 201){
            if (response.data){
              CoreService.cache.totemInfo = response.data;
              if (response.data.outOfService == 1 && !$scope.outOfService){
                $log.info('checkTotemInfo| Totem is not out of service and must be accoring to server, going out of business...');
                $scope.outOfService = true;
              }else if (response.data.outOfService == 0 && $scope.outOfService){
                $log.info('checkTotemInfo| Totem is out of service and must be online accoring to server, going back online...');
                $scope.outOfService = false;
              }
            }else{
              $log.error('checkTotemInfo| Server returned empty data on getTotemInfo');
              $log.error(response);
            }
          }else{
            $log.error('checkTotemInfo| Server returned outcode ' + response.outcode + ' on getTotemInfo');
            $log.error(response);
          }
          $scope.totemInfoGetTimer = $timeout(function(){
            $scope.checkTotemInfo();
          }, $scope.totemInfoGetTimeout);
        }, function(err){
          $log.error("checkTotemInfo| Error getting totem info!");
          $log.error(err);
          $scope.totemInfoGetTimer = $timeout(function(){
            $scope.checkTotemInfo();
          }, $scope.totemInfoGetTimeout);
        });
    }
    $scope.checkTotemInfo();

    //
    // Maintanance ghost button
    //
    $scope.maintenancePressed = function(e){
      $log.info('Maintenance pressed');
      e.stopPropagation();
      e.preventDefault();
      $scope.maintenanceTimer = $timeout(function() { 
        $state.go('maintenance');
      },1000);
      return false;
    }
    $scope.maintenanceReleased = function(e){
      $log.info('Maintenance released');
      e.stopPropagation();
      e.preventDefault();
      $timeout.cancel($scope.maintenanceTimer);
      return false;
    }

    //
    // Version checker
    //
    $scope.versionChecker = function(){
      CoreService.checkVersion(function(checkResponse){
        if (checkResponse.mustUpdate){
          $log.info('Found new version, will restart app in 10 seconds...');
          $timeout.cancel($scope.versionCheckerTimer);
          if ($window.Sentry){
            $window.Sentry.captureMessage('Upgrading Totem @ ' + CoreService.config.hostname + ' to version ' + checkResponse.newVersion);
          }
          $timeout(function(){
            $log.info(' Reloading Hostname: ' + CoreService.config.hostname + ' to upgrade to version: ' + checkResponse.newVersion);
            location.reload(true);
          }, 10000);
        }else{
          $log.debug('No new version found');
          $scope.versionCheckerTimer = $timeout(function(){$scope.versionChecker()}, 30000);
        }
      });
    }
    $scope.versionChecker();
    $scope.versionCheckerTimer = $timeout(function(){$scope.versionChecker()}, 30000);

    $scope.$on('$destroy', function () {
      $log.debug('Cancelling versionCheckerTimer and totemInfoGetTimer...');
      $timeout.cancel($scope.versionCheckerTimer);
      $timeout.cancel($scope.totemInfoGetTimer);
    });
  }

})();
