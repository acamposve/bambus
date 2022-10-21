(function () {
  'use strict';

  angular.module('app').component('cvuNewStep3Vehicle', {
    controller: CVUNewStep3VehicleController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s3-vehicle/cvu-new-s3-vehicle.view.html'
  });

  /** @ngInject */
  function CVUNewStep3VehicleController($log, $scope, $document, $window, CoreService, ApiService, $state /*, $rootScope */) {

    $log.debug('CVU New Step 3 Vehicle activated');

    // $scope.form = $document[0].getElementById('s2form');
    $scope.keyboardLayout = 'default';
    $scope.keyboardInput  = '';
    $scope.showErrors = false;
    $scope.showKeyboard = false;

    if ($window.IS_DEBUG){
      $scope.data = {
        vehicleBrand: $window.DEBUG_DATA.vehicleBrand ? $window.DEBUG_DATA.vehicleBrand :  {
          id: null,
          name: null
        },
        vehicleModel: $window.DEBUG_DATA.vehicleModel ? $window.DEBUG_DATA.vehicleModel :  {
          id: null,
          name: null
        },
        vehicleColor: $window.DEBUG_DATA.vehicleColor ? $window.DEBUG_DATA.vehicleColor :  {
          id: null,
          name: null
        }
      };
    }else{
      $scope.data = {
        vehicleBrand: {
          id: null,
          name: null
        },
        vehicleModel: {
          id: null,
          name: null
        },
        vehicleColor: {
          id: null,
          name: null
        }
      };
    }

    $scope.pickBrand = function(){
      $scope.keyboardInput = $document[0].getElementById('bt-search');
      CoreService.showVehicleBrandSelector($scope).then( function(selectedBrand) {
        $scope.data.vehicleBrand = selectedBrand;
        $scope.data.vehicleModel = [];
        $scope.showKeyboard = false;
      }, function (){
        $scope.showKeyboard = false;
      });
    }

    $scope.pickModel = function(){
      $scope.keyboardInput = $document[0].getElementById('bt-search');
      if ($scope.data.vehicleBrand && $scope.data.vehicleBrand.id && $scope.data.vehicleBrand.id > 0){
        CoreService.showVehicleModelSelector($scope.data.vehicleBrand.id, $scope).then( selectedModel => {
          $scope.data.vehicleModel = selectedModel;
          $scope.showKeyboard = false;
        }, function (){
          $scope.showKeyboard = false;
        });
      }else{
        CoreService.showMessage(null, "Seleccione una marca primero");
      }
    }

    $scope.pickColor = function(){
      CoreService.showVehicleColorSelector(null, $scope).then( selectedColor => {
        $scope.data.vehicleColor = selectedColor;
        $scope.showKeyboard = false;
      }, function (){
        $scope.showKeyboard = false;
      });
    }

    $scope.cancel = function(){
      CoreService.showCancelDialog().then(function(cancel){
        if (cancel){
          CoreService.clearSession();
          $state.go('start');
        }
      }, function(err){
        $log.error(err);
      })
    }

    $scope.isDataValid = function() {
      var canContinue = (
        ($scope.data.vehicleBrand && $scope.data.vehicleBrand.name && $scope.data.vehicleBrand.name.length) &&
        ($scope.data.vehicleModel && $scope.data.vehicleModel.name && $scope.data.vehicleModel.name.length) &&
        ($scope.data.vehicleColor && $scope.data.vehicleColor.name && $scope.data.vehicleColor.name.length));
        return canContinue
    }

    $scope.continue = function () {
      if (!$scope.isDataValid()) {
        $scope.showErrors = true;
        return;
      }

      // Store data in session
      CoreService.session.wizardNew.vehicle.brand = $scope.data.vehicleBrand;
      CoreService.session.wizardNew.vehicle.model = $scope.data.vehicleModel;
      CoreService.session.wizardNew.vehicle.color = $scope.data.vehicleColor;

      $state.go('cvu-new-s4-topup');
    }

    $scope.goBack = function(){
      if (CoreService.session.wizardNew.operation == 'NEW_CLIENT'){
        $state.go('cvu-new-s2-user-data');
      }else if (CoreService.session.wizardNew.operation == 'ADD_VEHICLE'){
        $state.go('cvu-new-s1-id');
      }else if (CoreService.session.wizardNew.operation == 'ASSIGN_TAG'){
        $state.go('cvu-new-s1-id');
      }else{
        $state.go('cvu-new-s1-id');
      }
    }

    //
    // Session timeout handler
    CoreService.sessionTimerStart();
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });
  }

})();
