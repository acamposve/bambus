(function () {
  'use strict';

  angular.module('app').component('cvuInfo', {
    controller: CVUInfoController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/info/cvu-info.view.html'
  });

  /** @ngInject */
  function CVUInfoController($log, $scope, $state, CoreService, uiGmapGoogleMapApi, $timeout) {
    $scope.map = null;
    $scope.gAPIKey = 'AIzaSyC0aYDd9d-wJHe0pLunCw_POfyaAm6Rfv8';

    $log.debug('CVU Info Screen activated');


    $scope.tolls = [
      {
        key: "barraSantaLucia",
        name: "Barra de Santa Lucía",
        address: "Ruta 1 Km. 23.500",
        coords: {
          latitude: -34.7769348,
          longitude: -56.3659734,
        },
      },
      {
        key: "cufre",
        name: "Cufré",
        address: "Ruta 1 Km. 107.350",
        coords: {
          latitude: -34.3549509,
          longitude: -57.1138582,
        },
      },
      {
        key: "mercedes",
        name: "Mercedes",
        address: "Ruta 2 Km. 284.400",
        coords: {
          latitude: -33.2122336,
          longitude: -58.0485032,
        },
      },
      {
        key: "pasoPuerto",
        name: "Paso del Puerto",
        address: "Ruta 3 km. 245.200",
        coords: {
          latitude: -33.1285767,
          longitude: -57.1705746,
        },
      },
      {
        key: "queguay",
        name: "Queguay",
        address: "Ruta 3 Km. 392,750",
        coords: {
          latitude: -32.1455421,
          longitude: -57.9409285,
        },
      },
      {
        key: "mendoza",
        name: "Mendoza",
        address: "Ruta 5 Km. 67,700",
        coords: {
          latitude: -34.3350732,
          longitude: -57.1705746,
        },
      },
      {
        key: "centenario",
        name: "Centenario",
        address: "Ruta 5 Km. 246,350",
        coords: {
          latitude: -32.8400212,
          longitude: -57.5481033,
        },
      },
      {
        key: "manuelDiaz",
        name: "Manuel Diaz",
        address: "Ruta 5 Km. 423,200",
        coords: {
          latitude: -31.5607898,
          longitude: -55.6869343,
        },
      },
      {
        key: "soca",
        name: "Soca",
        address: "Ruta 8 Km. 50,500",
        coords: {
          latitude: -34.6723044,
          longitude: -55.7675883,
        },
      },
      {
        key: "cebollati",
        name: "Cebollati",
        address: "Ruta 8 Km. 206,250",
        coords: {
          latitude: -33.8375426,
          longitude: -54.7686374,
        },
      },
      {
        key: "capillaDeCella",
        name: "Capilla De Cella",
        address: "Ruta 9 Km. 79,500",
        coords: {
          latitude: -34.7063975,
          longitude: -55.4683399,
        },
      },
      {
        key: "garzon",
        name: "Garzon",
        address: "Ruta 9 Km. 191",
        coords: {
          latitude: -34.6028426,
          longitude: -54.4286493,
        },
      },
      {
        key: "santaLucia",
        name: "Santa Lucía",
        address: "Ruta 11 Km. 81",
        coords: {
          latitude: -34.4432683,
          longitude: -56.425525,
        },
      },
      {
        key: "pando",
        name: "Pando",
        address: "Ruta Interbalnearia Km. 32,400",
        coords: {
          latitude: -34.7849055,
          longitude: -55.8905215,
        },
      },
      {
        key: "solis",
        name: "Solís",
        address: "Ruta Interbalnearia Km. 32,400",
        coords: {
          latitude: -34.728462,
          longitude: -55.7805296,
        },
      },
    ];

    $scope.prices = [
      {
        key: "category1",
        name: "Categoría 1",
        value: "$ 122,50",
      },
      {
        key: "category2",
        name: "Categoría 2",
        value: "$ 122,50",
      },
      {
        key: "category3",
        name: "Categoría 3",
        value: "$ 183,70",
      },
      {
        key: "category4",
        name: "Categoría 4",
        value: "$ 183,70",
      },
      {
        key: "category5",
        name: "Categoría 5",
        value: "$ 183,70",
      },
      {
        key: "category6",
        name: "Categoría 6",
        value: "$ 196,70",
      },
      {
        key: "category7",
        name: "Categoría 7",
        value: "$ 371,10",
      },
    ];

    //
    // Map Setup
    //
    uiGmapGoogleMapApi.then(function(maps) {
      var totemLatLngCoords = {
        latitude: -34.890823, 
        longitude: -56.166561
      };
      if (CoreService.cache.totemInfo && CoreService.cache.totemInfo.latlng){
        var totemLatLng = CoreService.cache.totemInfo.latlng.split(',');
        totemLatLngCoords.latitude = totemLatLng[0];
        totemLatLngCoords.longitude = totemLatLng[1];
      }
      var myStyles =[
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [
                  { visibility: "off" }
            ]
        }
    ];
      $scope.markerOptions = {
        label:{
          text: 'Usted esta aqui',
          className : 'markerLabel'
        }
      };
      $scope.map = {
        center: {
          latitude: totemLatLngCoords.latitude, 
          longitude: totemLatLngCoords.longitude
        },
        zoom: 12,
        options: {
          scrollwheel: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: myStyles
        },
        marker: {
          coords:{
            latitude: totemLatLngCoords.latitude, 
            longitude: totemLatLngCoords.longitude
          }
        },
      };
    });

    $scope.tollShow = function(toll){
      $scope.map.center = toll.coords;
      // $scope.map.zoom = 7;
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    }

    $scope.showHere = function(){
      $scope.map.center = {
        latitude: -34.890823, 
        longitude: -56.166561
      };
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
    }

    
    $scope.finish = function () {
      $state.go('home');
    }

    $scope.goBack = function () {
      $state.go('home');
    }

    //
    // Session timeout handler
    // CoreService.sessionTimerStart();
    // $scope.$on('sessionTimedout', function(){
    //   // Do something special for this page
    // });
    CoreService.sessionTimerStop();
  }

})();
