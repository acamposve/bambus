import { ipcRenderer as ipcMain } from "electron";

(function () {
  'use strict';
  angular
    .module('app')
    .factory('CoreService', CoreService);

  CoreService.$inject = ['$document','$uibModal', '$uibModalStack', 'ApiService','$log', '$timeout', '$rootScope', '$state', '$http'];

  /* @ngInject */
  function CoreService($document, $uibModal, $uibModalStack, ApiService, $log, $timeout, $rootScope, $state, $http) {
    return {
      appVersion:'1.0.16',
      config:{
        hostname: null
      },
      session: {
        wizardNew: {},
        wizardRecharge: {}
      },
      sessionTimeout: 60*2, // Must be equal to sessionTimer.secsTimer (seconds)
      sessionTimer: {
        secsTimer: 60*2, // Must be equal to sessionTimeout (seconds)
        sessionTimer: null
      },
      cache: {

      },

      initialize(hostname){
        var self = this;
        //
        // Initialize config
        //
        $log.log('Initializing core for '+ hostname +'...');
        this.config.hostname = hostname;
        // this.config.hostname = 'rondeu5-pc';
        //
        // Initialize comm with Electron
        //
        $log.log('Initializing IPC handlers...');
        ipcMain.on('PRINT_END', function(event, arg){
          $log.log('Print successfully');
          $rootScope.$broadcast('PRINT_END', {event:event, arg:arg});
        });
        ipcMain.on('PRINT_ERROR', function(event, arg){
          $log.error('Error on printing');
          $log.error(event);
          $log.error(arg);
          $rootScope.$broadcast('PRINT_ERROR', {event:event, arg:arg});
        });
        //
        // Initialize click capture
        //
        $document.on("click", function(){
          self.sessionTimerRestart();
        });
        //
        // Initialize timer ended event
        //
        self.sessionTimedoutHandler = $rootScope.$on('sessionTimedout', function(){
          $uibModalStack.dismissAll();
        });
      },
      checkVersion(cb){
        // Return true if need to be updated
        var self = this;
        $log.debug('Checking remote version...');
        $http.get('/version',{headers:{'Cache-Control': 'no-cache'}}).then(function (response) {
          var remoteVersion = response.data.trim();
          $log.debug('Remote version: ' + remoteVersion + ' | Local version: ' + self.appVersion);
          if (remoteVersion != self.appVersion){
            // $log.warn('Found new version!');
            cb({mustUpdate:true, newVersion: remoteVersion});
          }else{
            cb({mustUpdate:false});
          }
        }, function(err){
          $log.error('Could not check remote version!');
          $log.error(err);
          cb(false);
        });
      },
      //
      // Utils
      zeroPad : function(num, places){return String(num).padStart(places, '0')},
      //
      //
      // Session
      //
      clearSession : function(){
        if (this.sessionTimer.sessionTimerEval) $timeout.cancel(this.sessionTimer.sessionTimerEval);
        this.session = {
          wizardNew: {},
          wizardRecharge: {}
        };
      },
      sessionTimerRestart: function(){
        // var self = this;
        if (this.sessionTimer.sessionTimerEval){
          // $log.debug('SessionTimer| Restarting timer...');
          this.sessionTimer.secsTimer = this.sessionTimeout;
        }
      },
      sessionTimerStart : function (hideSessionTimeoutWarning){
        $log.debug('SessionTimer| Starting session timer with '+ this.sessionTimeout +' seconds...');
        var self = this;
        if (this.sessionTimer.sessionTimerEval) $timeout.cancel(this.sessionTimer.sessionTimerEval);
        this.sessionTimer.hideSessionTimeoutWarning = hideSessionTimeoutWarning;
        this.sessionTimer.secsTimer = this.sessionTimeout;
        this.sessionTimer.sessionTimerEval = $timeout(function(){
          self.sessionTimerEval();
        }, 1000);
      },
      sessionTimerEval : function(){
        var self = this;
        if (this.sessionTimer.secsTimer == 0){
          $log.debug('SessionTimer| Session about to expire, show warning for extra 10 secs!');
          if (this.sessionTimer.hideSessionTimeoutWarning) {
            $rootScope.$broadcast('sessionTimedout');
            $state.go('home');
            return;
          }
          self.showSessionTimeoutWarning().then(function(keepSession){
            if (keepSession){
              $log.debug('SessionTimer| Session restarted');
              self.sessionTimer.secsTimer = self.sessionTimeout;
              self.sessionTimer.sessionTimerEval = $timeout(function(){
                self.sessionTimerEval();
              }, 1000);
            }else{
              $rootScope.$broadcast('sessionTimedout');
              $state.go('home');
            }
          }, function(){});
        }else{
          // $log.debug('SessionTimer| Session timeout at ' + this.sessionTimer.secsTimer);
          this.sessionTimer.secsTimer--;
          this.sessionTimer.sessionTimerEval = $timeout(function(){
            self.sessionTimerEval();
          }, 1000);
        }
      },
      sessionTimerStop : function(){
        $log.debug('SessionTimer| Session timer stopped');
        if (this.sessionTimer.sessionTimerEval) $timeout.cancel(this.sessionTimer.sessionTimerEval);
      },
      //
      // Dialogs
      //
      showError: function(title, message, outcode, returnPromise){
        var modal = $uibModal.open({
          // animation: $scope.animationsEnabled,
          templateUrl: 'app/common/modalMessage.html',
          controller: function ($uibModalInstance, $scope, data) {
            $scope.data = data;
            $scope.close = function () {
              $uibModalInstance.close();
            };
          },
          backdrop  : 'static',
          keyboard  : false,
          // size: size,
          resolve: {
            data: {
              title: title,
              message: message,
              outcode: outcode
            }
          }
        }).result;
        
        if (returnPromise) return modal;
        modal.then(function () {
        }, function () {
        });
      },
      showMessage : function(title=null, message=null, returnPromise){
        var modal = $uibModal.open({
          templateUrl: 'app/common/modalMessage.html',
          controller: function ($uibModalInstance, $scope, data) {
            $scope.data = data;
            $scope.close = function () {
              $uibModalInstance.dismiss('close');
            };
          },
          backdrop  : 'static',
          keyboard  : false,
          // size: size,
          resolve: {
            data: {
              title: title,
              message: message
            }
          }
        }).result;
        if (returnPromise) return modal;
        modal.then(function () {
        }, function () {
        });
      },
      showRetryDialog : function(title, errorCode, errorDesc){
        return new Promise( (resolve, reject)=> {
          var modalInstance = $uibModal.open({
            templateUrl: 'app/common/retry-cancel-dialog.html',
            controller: function ($uibModalInstance, $scope, data) {
              $scope.data =data;
              $scope.retry = function (retry) {
                $uibModalInstance.close(retry);
              };
            },
            size: 'md',
            backdrop  : 'static',
            keyboard  : false,
            resolve: {
              data: {
                title    : title,
                errorCode: errorCode,
                errorDesc: errorDesc
              }
            }
          });
          modalInstance.result.then(function (retry) {
            resolve(retry);
          }, function () {
            reject();
          })
        });
      },
      showCancelDialog : function(txt){
        return new Promise( (resolve, reject)=> {
          var modalInstance = $uibModal.open({
            templateUrl: 'app/common/cancel-dialog.html',
            controller: function ($uibModalInstance, $scope) {

              $scope.cancel = function (doCancel) {
                $uibModalInstance.close(doCancel);
              };

            },
            size: 'md',
            backdrop  : 'static',
            keyboard  : false,
            resolve: {
              data: {
                text: txt
              }
            }
          });
          modalInstance.result.then(function (amount) {
            resolve(amount);
          }, function () {
            reject();
          })
        });
      },
      showSessionTimeoutWarning : function(){
        return new Promise( (resolve, reject)=> {
          var modalInstance = $uibModal.open({
            templateUrl: 'app/common/session-timeout.html',
            controller: function ($uibModalInstance, $scope, $timeout, $log) {
              $scope.remSecs = 30;
              $scope.timer = null;

              $scope.evaluateTimeout = function(){
                if ($scope.remSecs == 0){
                  // Close session
                  $log.debug('sessionTimerDialog | Timed out!');
                  $uibModalInstance.close(false);
                }else{
                  $scope.remSecs--;
                  // $log.debug('sessionTimerDialog | Session will expire in ' + $scope.remSecs);
                  $scope.timer = $timeout(function(){
                    $scope.evaluateTimeout();
                  }, 1000);
                }
              }

              $scope.keepSession = function () {
                if ($scope.timer) $timeout.cancel($scope.timer);
                $uibModalInstance.close(true);
              };
              $scope.closeSession = function () {
                if ($scope.timer) $timeout.cancel($scope.timer);
                $uibModalInstance.close(false);
              };

              $scope.evaluateTimeout();
            },
            size: 'md',
            backdrop  : 'static',
            keyboard  : false,
          });
          modalInstance.result.then(function (keep) {
            resolve(keep);
          }, function () {
            reject();
          })
        });
      },
      //
      // Progress indicators
      //
      showProgress : function(){
        var progressIndicator = angular.element(`<div id="progInd" class="bt-progind"><div><span class="bt-loading">ESPERE...</span></div></div>`);
        angular.element($document[0].body).append(progressIndicator);
      },
      hideProgress : function(){
        angular.element($document[0].querySelector("#progInd")).remove();
      },
      //
      // Select Dialogs
      //
      showVehicleBrandSelector : function(parentScope){
        return new Promise( (resolve, reject)=> {
          this.showProgress();
          ApiService.CVUGetVehicleBrands().then((response) => {
            $log.log(response);
            this.hideProgress();

            var modalInstance = $uibModal.open({
              templateUrl: 'app/common/cvu/vehicle-brand-selector.html',
              controller: function ($uibModalInstance, $scope, data, $rootScope) {
                $scope.data = data;

                parentScope.showKeyboard = true;

                $scope.inputFocus = function(ev){
                  parentScope.showKeyboard = true;
                  $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
                }

                $timeout(() => {
                 $document[0].getElementById('bt-search').focus();
                }, 300)

                $scope.defaultBrands = [{name: "FIAT", id: 14},
                                        {name: "VOLKSWAGEN", id: 46},
                                        {name: "CHEVROLET", id: 5},
                                        {name: "RENAULT", id: 37},
                                        {name: "PEUGEOT", id: 34},
                                        {name: "CITROEN", id: 8},
                                        {name: "SUZUKI", id: 43},
                                        {name: "HYUNDAI", id: 18},
                                        {name: "NISSAN", id: 33},
                                        {name: "TOYOTA", id: 45},
                                        {name: "FORD", id: 15},
                                        {name: "MERCEDES BENZ", id: 29}];

                $scope.filteredBrands = data.brands;
                $scope.filterText = "";

                $scope.filterBrands = () => {
                  if (!$scope.filterText || !$scope.filterText.length) {
                    $scope.filteredBrands = [...$scope.defaultBrands];
                    return;
                  }

                  $scope.filteredBrands = $scope.data.brands.filter((item) => item.name.toUpperCase().indexOf($scope.filterText.toUpperCase()) != -1)
                }
                
                $scope.filterBrands();

                $scope.close = function () {
                  $uibModalInstance.dismiss('close');
                };

                $scope.select = function (brand) {
                  $uibModalInstance.close(brand);
                };
              },
              size: 'lg',
              backdrop  : 'static',
              keyboard  : false,
              resolve: {
                data: {
                  brands: response.data
                }
              }
            });
            modalInstance.result.then(function (selectedBrand) {
              resolve(selectedBrand);
            }, function (err) {
              reject(err);
            });
          }, (error) => {
            this.showError("Ocurrió un error", error.message, error.outcode);
            $log.error('Error on continue');
            $log.error(error);
            this.hideProgress();
            reject();
          });
        });
      },
      showVehicleModelSelector : function(brand, parentScope){
        return new Promise( (resolve, reject)=> {
          parentScope.showKeyboard = false;
          this.showProgress();
          ApiService.CVUGetVehicleModels(brand).then((response) => {
            $log.log(response);
            this.hideProgress();

            var modalInstance = $uibModal.open({
              templateUrl: 'app/common/cvu/vehicle-model-selector.html',
              controller: function ($uibModalInstance, $scope, data, $rootScope) {
                $scope.data = data;

                $scope.inputFocus = function(ev){
                  parentScope.showKeyboard = true;
                  $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
                }

                $timeout(() => {
                  $document[0].getElementById('bt-search').focus();
                }, 300)

                $scope.filteredModels = data.models;
                $scope.filterText = "";

                $scope.filterModels = () => {
                  $scope.filteredModels = $scope.data.models.filter((item) => item.name.toUpperCase().indexOf($scope.filterText.toUpperCase()) != -1)
                }
                $scope.filterModels();

                $scope.close = function () {
                  $uibModalInstance.dismiss('close');
                };

                $scope.select = function (model) {
                  $uibModalInstance.close(model);
                };
              },
              size: 'lg',
              backdrop  : 'static',
              keyboard  : false,
              resolve: {
                data: {
                  models: response.data
                }
              }
            });
            modalInstance.result.then(function (selectedModel) {
              resolve(selectedModel);
            }, function () {
              reject();
            })
          }, (error) => {
            this.showError("Ocurrió un error", error.message, error.outcode);
            $log.error('Error on continue');
            $log.error(error);
            this.hideProgress();
            reject();
          });
        });
      },
      showVehicleColorSelector : function(brand, parentScope){
        return new Promise( (resolve, reject)=> {
          ApiService.CVUGetVehicleColors().then((response) => {
            $log.log(response);
            this.hideProgress();
            var modalInstance = $uibModal.open({
              templateUrl: 'app/common/cvu/vehicle-color-selector.html',
              controller: function ($uibModalInstance, $scope, data, $rootScope) {
                $scope.data = data;

                $scope.inputFocus = function(ev){
                  parentScope.showKeyboard = true;
                  $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
                }

                $timeout(() => {
                  $document[0].getElementById('bt-search').focus();
                }, 300)

                $scope.defaultColors = [{name: "Amarillo", id: 14},
                        {name: "Azul", id: 10},
                        {name: "Blanco", id: 16},
                        {name: "Celeste", id: 11},
                        {name: "Gris", id: 65},
                        {name: "Marron", id: 20},
                        {name: "Naranja", id: 3},
                        {name: "Negro", id: 17},
                        {name: "Plata", id: 23},
                        {name: "Rojo", id: 2},
                        {name: "Rosa", id: 4},
                        {name: "Verde", id: 7}]

                $scope.filteredColors = data.colors;
                $scope.filterText = "";

                $scope.filterColors = () => {
                  if (!$scope.filterText || !$scope.filterText.length) {
                    $scope.filteredColors = [...$scope.defaultColors];
                    return;
                  }

                  $scope.filteredColors = $scope.data.colors.filter((item) => item.name.toUpperCase().indexOf($scope.filterText.toUpperCase()) != -1)
                }
                $scope.filterColors();

                $scope.close = function () {
                  $uibModalInstance.dismiss('close');
                };

                $scope.select = function (color) {
                  $uibModalInstance.close(color);
                };
              },
              size: 'lg',
              backdrop  : 'static',
              keyboard  : false,
              resolve: {
                data: {
                  brand : brand,
                  colors: response.data
                }
              }
            });
            modalInstance.result.then(function (selectedColor) {
              resolve(selectedColor);
            }, function () {
              reject();
            })
          }, (error) => {
            this.showError("Ocurrió un error", error.message, error.outcode);
            $log.error('Error on continue');
            $log.error(error);
            this.hideProgress();
            reject();
          });
        });
      },
      showCustomAmountSelector : function(parentScope){
        return new Promise( (resolve, reject)=> {
          var modalInstance = $uibModal.open({
            templateUrl: 'app/common/cvu/custom-amount-input.html',
            controller: function ($uibModalInstance, $scope, $document, $timeout, $rootScope) {
              $scope.customAmount = null;
              $scope.maxError = false;

              $scope.close = function () {
                $uibModalInstance.dismiss();
              };

              $scope.validateAmount = () => {
                var isValid = true;
                $scope.maxError = false;
                if (isNaN($scope.customAmount)){
                  isValid = false;
                }else if ($scope.customAmount <= 0){
                  isValid = false;
                }else if ($scope.customAmount > 10000){
                  isValid = false;
                  $scope.maxError = true;
                }

                $scope.showErrors = !isValid;
                return isValid;
              }

              $scope.confirm = function () {
                if ($scope.validateAmount()) {
                  $uibModalInstance.close($scope.customAmount);
                }
              };

              $scope.inputFocus = function(ev){
                parentScope.showKeyboard = true;
                $rootScope.$broadcast('keyboard::changeInput', ev.target.value);
              }

              $timeout(function(){
                $document[0].getElementById('customAmount').focus();
              }, 500);
            },
            size: 'lg',
            backdrop  : 'static',
            keyboard  : false,
          });
          modalInstance.result.then(function (amount) {
            resolve(amount);
          }, function () {
            reject();
          })
        });
      },
      //
      // Printing methods
      //
      printTag: function(qty, tags){
        var self = this;
        return new Promise(function(resolve, reject){
          $log.log('Sending print request with '+qty+' copies...')
          self.printTagEndEvent = $rootScope.$on('PRINT_END', function(/*evt, data*/){
            resolve();
          });
          self.printTagErrorEvent = $rootScope.$on('PRINT_ERROR', function(/*evt, data*/){
            reject();
          });
          ipcMain.send('PRINT', qty, tags);
        });
      }
    };
  }
}());