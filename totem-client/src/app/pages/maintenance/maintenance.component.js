import { ipcRenderer as ipcMain } from "electron";

(function() {
  'use strict';

  angular.module('app').component('maintenance', {
    controller: MaintenanceController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/maintenance/maintenance.view.html',
  });

  /** @ngInject */
  function MaintenanceController($log, $state, $translate, CoreService, $scope, $uibModal, ApiService, $window, $document, $uibModalStack) {
    $scope.validated      = false;
    $scope.keyboardLayout = 'default';
    $scope.keyboardInput  = '';
    $scope.encPass        = null;

    $log.debug('maintenance activated');

    // $scope.data = {
    //   id : 827,
    //   name: 'Peaje Pando',
    //   lastTrx: {
    //     date: 'Hace 3 horas',
    //     result : 'OK'
    //   },
    //   roll : {
    //     id: 182,
    //     name: "Rollo 182",
    //     start: 8800,
    //     end  : 10000,
    //     theoric: 9013,
    //     usage: 55,
    //     remaining : 1287
    //   }
    // };

    $scope.exit = function(){
      CoreService.clearSession();
      $state.go('home');
    }

    $scope.validateOperator = function(){
      $uibModal.open({
        template: `
          <div class="modal-content">
            <div class="modal-header">Ingrese clave de mantenimiento</div>
            <div class="modal-body">
              <form>
                <div class="form-group">
                  <input type="password" class="form-control" autocomplete="off" id="passcode"
                    style="text-align: center;" ng-model="passcode">
                </div>
              </form>
            </div>
            <div class="modal-footer" style="justify-content: space-evenly;">
              <button type="button" class="bt-button bt-primary-button " 
                ripple ripple-class="ripple" ripple-callback="loginOperator()" ripple-radius="40">OK</button>
              <button type="button" class="bt-button bt-link-button" 
                ripple ripple-class="ripple" ripple-callback="cancel()" ripple-radius="40">Cancelar</button>
            </div>
          </div>
        `,
        controller: function ($uibModalInstance, $scope, ApiService, CoreService, $log, $timeout, $document) {
          $scope.passcode = 'banana';
          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };
          $scope.loginOperator = function(){
            ApiService.maintenanceLogin($scope.passcode.toLowerCase()).then(function(response){
              if (response.outcode == 200){
                $uibModalInstance.close(response.data.credentials);
              }else if (response.outcode == 401){
                $log.error("Wrong credentials!");
                CoreService.showError("Error de inicio", "La clave no es correcta");
              }
            },function(err){
              $log.error("Error validating passcode!");
              $log.error(err);
              CoreService.showError("Ocurrió un error", "No se pudo validar la clave", err.outcode);
            });
          };
          $timeout(function(){
            var e = $document[0].getElementById('passcode');
            if (e) e.focus();
          },1000);
        },
        // size: size,
      }).result.then(function (encPass) {
        if (encPass){
          $scope.encPass = encPass;
          $scope.loadTotemInfo();
          $scope.validated = true;
          $scope.keyboardLayout = 'default';
        }else{
          $log.info('invalid');
          $state.go('home');
        }
      }, function () { 
        $state.go('home');
        $log.info('canceled?');
      });
    }

    $scope.loadTotemInfo = function(){
      ApiService.getTotemInfo().then(
        function(response){
          if (response.outcode == 200 || response.outcode == 201){
            if (response.data){
              var djs = null;
              if (response.data.outOfServiceOn && response.data.outOfServiceOn.length > 0){
                djs = $window.dayjs(response.data.outOfServiceOn);
                response.data.outOfServiceDesc = "Desde " + djs.calendar() + " (" + response.data.outOfServiceCause + ")";
              }
              if (response.data.roll){
                response.data.roll.remaining = response.data.roll.qty - response.data.roll.sequencePosition;
                response.data.roll.usage = (response.data.roll.sequencePosition / response.data.roll.qty)*100;
                response.data.roll.sequencePosition++;
              }
              if (response.data.lastTransaction){
                djs = $window.dayjs(response.data.lastTransaction.date);
                response.data.lastTransaction.dateNice = djs.format('dddd D [de] MMMM, YYYY h:mm A');
                response.data.lastTransaction.dateCalendar = djs.calendar();
              }
              // Update status card
              var statusCard = $document[0].getElementById('statusCard');
              if (response.data.outOfService == 0){
                statusCard.style.backgroundColor = '#c8e6c9';
              }else{
                statusCard.style.backgroundColor = '#ffccbc';
              }
            }
            $scope.data = response.data;
          }else{
            $log.error('Error on process');
            $log.error(response);
            $scope.showRetry("Ocurrió un error al obtener los datos del totem", response.message, response.outcode);
          }
        }, function(err){
          $log.error("Error getting totem info!");
          $log.error(err);
          CoreService.showError("Ocurrió un error", "No se pudo obtener la información del totem", err.outcode);
        }
      );
    }

    $scope.expendTag = function(){
      var tagText = $scope.data.roll.nextTag ? $scope.data.roll.nextTag : 'DESCONOCIDO';
      CoreService.printTag(1, [tagText]).then(function(){
        CoreService.showMessage("Tag impreso", "Escanee el tag para continuar", true).then(() => {
          $window.onScan.detachFrom($document[0]);
        }, () => {
          $window.onScan.detachFrom($document[0]);
        });

        $window.onScan.attachTo($document[0], {
          suffixKeyCodes: [13],
          reactToPaste: true,
          onScan: function(sCode, iQty) {
            $log.log('Tag read: ' + sCode + ' | Qty: ' + iQty);
            ApiService.expendedTagManual(sCode, $scope.encPass).then(function(response){
              if (response.outcode == 200 || response.outcode == 201){
                $uibModalStack.dismissAll();
                CoreService.showMessage("Tag impreso", `Tag ${sCode} registrado correctamente.`, true).then($scope.loadTotemInfo, $scope.loadTotemInfo);
              } else {
                $log.error('Error on process');
                $log.error(response);
                CoreService.showError("Ocurrió un error al registrar la impresión del tag en el servidor", response.message, response.outcode);
              }
            }, (response) => {
              $log.error('Error on webservice');
              $log.error(response);
              CoreService.showError("Ocurrió un error al validar el tag en el servidor", response.message, response.outcode);
            });
          }
        });
      }, function() {
        $log.error("Error trying to manually print tag!");
        CoreService.showError("Ocurrió un error", "Ocurrió un problema con la impresora al intentar imprimir");
      });
    }

    $scope.changeRoll = function(){
      $uibModal.open({
        template: `
          <div class="modal-content">
            <div class="modal-header">Buscar nuevo rollo</div>
            <div class="modal-body">
              <form>
                <div class="form-group" style="display: flex;justify-content: center;">
                  <select class="form-control" ng-model="selectedRoll">
                    <option value="">Seleccione un rollo</option>
                    <option ng-repeat="roll in rolls" ng-value="roll">{{roll.name}} ({{roll.qty}} tags)</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer" style="justify-content: space-evenly;">
              <button type="button" class="bt-button bt-primary-button " 
                ripple ripple-class="ripple" ripple-callback="assign()" ripple-radius="40">Asignar rollo</button>
              <button type="button" class="bt-button bt-link-button" 
                ripple ripple-class="ripple" ripple-callback="cancel()" ripple-radius="40">Cancelar</button>
            </div>
          </div>
        `,
        controller: function ($uibModalInstance, $scope, ApiService, CoreService, $log, $timeout, data) {
          $scope.selectedRoll = null;
          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };
          $scope.loadRolls = function(){
            ApiService.searchRoll("", data.encPass).then(function(response){
              if (response.outcode == 200 || response.outcode == 201){
                if (response.data){
                  $scope.rolls = response.data;
                }
              }else{
                $log.error('Error on process');
                $log.error(response);
                $scope.showRetry("Ocurrió un error al intentar obtener la lista de rollos desde el servidor", response.message, response.outcode);
              }
            }, function(err){
              $log.error("Error getting rolls!");
              $log.error(err);
              CoreService.showError("Ocurrió un error", "No se pudo obtener la lista de rollos desde el servidor", err.outcode);
            });
          };
          $scope.assign = function(){
            $uibModalInstance.close($scope.selectedRoll);
          }
          // Init
          $scope.loadRolls();
        },
        resolve: {
          data:{ 
            encPass: $scope.encPass
          }
        }
        // size: size,
      }).result.then(function (selectedRoll) {
        if (selectedRoll){
          //
          // Send assign roll to server
          //
          CoreService.showProgress();
          $log.log('Sending assign rol with:');
          $log.log(selectedRoll);
          ApiService.installRoll(selectedRoll.id, $scope.encPass).then(function(response){
            if (response.outcode == 200 || response.outcode == 201){
              $scope.loadTotemInfo();
              CoreService.hideProgress();
              CoreService.showMessage("Rollo asignado", "Rollo asignado con éxito");
            }else{
              $log.error('Error assigning roll 2!');
              $log.error(response);
              $scope.showRetry("Ocurrió un error al intentar asignar el rollo seleccionado", response.message, response.outcode);
            }
          }, function(err){
            $log.error("Error assigning roll!");
            $log.error(err);
            CoreService.showError("Ocurrió un error", "No se pudo asignar el rollo seleccionado", err.outcode);
          });
        }else{
          $log.info('invalid');
        }
      }, function () { 
        $log.info('canceled?');
      });
    }

    $scope.setTotemStatusOnline = function(setOnline){
      var statusCard = $document[0].getElementById('statusCard');

      if (setOnline){
        $scope.data.outOfService = 0;
        statusCard.style.backgroundColor = '#c8e6c9';
      }else{
        $scope.data.outOfService = 1;
        statusCard.style.backgroundColor = '#ffccbc';
      }

      ApiService.setTotemStatus(!$scope.data.outOfService, 'MANUAL', $scope.encPass).then(function(response){
        if (response.outcode == 200 || response.outcode == 201){
          $scope.loadTotemInfo();
        }else{
          $log.error('Error on setTotemStatus 2!');
          $log.error(response);
          $scope.showRetry("Ocurrió un error al cambiar el estado del totem", response.message, response.outcode);
        }
      }, function(err){
        $log.error("Error on setTotemStatus ");
        $log.error(err);
        CoreService.showError("Ocurrió un error al cambiar el estado del totem", err.outcode);
      });
    }

    $scope.setTotemSettings = function(){
      ApiService.setTotemSettings({posTerminalId: $scope.data.posTerminalId}, $scope.encPass).then(function(response){
        if (response.outcode == 200 || response.outcode == 201){
          $scope.loadTotemInfo();
        }else{
          $log.error('Error on setTotemSettings 2!');
          $log.error(response);
          $scope.showRetry("Ocurrió un error al cambiar la configuracion del totem", response.message, response.outcode);
        }
      }, function(err){
        $log.error("Error on setTotemSettings ");
        $log.error(err);
        CoreService.showError("Ocurrió un error al cambiar la configuracion del totem", err.outcode);
      });
    }

    $scope.exitApp = function() {
      ipcMain.send('EXIT');
    }
    //
    // Init screen
    //
    CoreService.clearSession();
    CoreService.sessionTimerStart();
    $scope.$on('sessionTimedout', function(){
      // Do something special for this page
    });
    $scope.validateOperator();

  }

})();
