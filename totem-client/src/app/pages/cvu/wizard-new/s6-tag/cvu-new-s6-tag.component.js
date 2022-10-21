(function () {
  'use strict';

  angular.module('app').component('cvuNewStep6Tag', {
    controller: CVUNewStep6TagController,
    controllerAs: 'vm',
    templateUrl: 'app/pages/cvu/wizard-new/s6-tag/cvu-new-s6-tag.view.html'
  });

  /** @ngInject */
  function CVUNewStep6TagController($log, $scope, $state, $window, $document, $timeout, ApiService, CoreService) {

    $log.debug('CVU New Step 6 Tag activated');

    $scope.status = 'Esperando lectura de TAG...';
    $scope.scanCompleted = false;
    $scope.showErrors = false;
    $scope.data = {
      tagId   : 0,
      printQty: CoreService.session.wizardNew.printQty
    };
    
    $scope.expendTag = function (){
      $log.log('Expending tag...');
      $scope.status = 'Imprimiendo TAG...';
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
      //
      // Send prin request
      //
      CoreService.printTag($scope.data.printQty, [CoreService.session.wizardNew.theoricTag]).then(function(){
        $timeout(function(){
          $log.log('Notifying expended tag to server for trxid ' + CoreService.session.wizardNew.transactionId + ' with qty ' + CoreService.session.wizardNew.printQty);
          ApiService.expendedTag(CoreService.session.wizardNew.transactionId, CoreService.session.wizardNew.printQty).then(function(response) {
            if (response.outcode == 200 || response.outcode == 201){
              $log.log('Tag expended notified to server successfully');
              $scope.status = 'Esperando lectura de TAG...';
              if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
              }
              $scope.initializeOnScan();
            }else{
              //
              // Server returned error
              //
              CoreService.showRetryDialog("El TAG no se pudo imprimir correctamente").then(function(retry){
                if (retry){
                  $scope.expendTag();
                }else{
                  CoreService.showCancelDialog().then(function(cancel){
                    if (cancel){
                      //
                      // User cancelled transaction
                      //
                      $state.go('cvu-new-s7b-refund');
                    }else{
                      // Retry again
                      $scope.expendTag();
                    }
                  }, function(){});
                }
              }, function(){});
              $log.error('Error on CVUCheckTAG.printTag.expendedTag, server returned error');
              $log.error(response);
            }
          }, function(error) {
            //
            // Comm error with server
            //
            CoreService.showRetryDialog("Ocurrió un error al intentar imprimir el TAG").then(function(retry){
              if (retry){
                $scope.expendTag();
              }else{
                CoreService.showCancelDialog().then(function(cancel){
                  if (cancel){
                    //
                    // User cancelled transaction
                    //
                    $state.go('cvu-new-s7b-refund');
                  }else{
                    // Retry again
                    $scope.expendTag();
                  }
                }, function(){});
              }
            }, function(){});
            $log.error('Error on CVUCheckTAG.printTag.expendedTag, comm error');
            $log.error(error);
          });
        }, 1000);
      }, function(){
        $log.error('Error trying to print, showing retry dialog...');
        CoreService.showRetryDialog("No fue posible imprimir el tag").then(function(retry){
          if (retry){
            $scope.expendTag();
          }else{
            CoreService.showCancelDialog().then(function(cancel){
              if (cancel){
                $state.go('cvu-new-s7b-refund');
              }else{
                $scope.expendTag();
              }
            }, function(){});
          }
        }, function(){});
        return;
      })
    }

    $scope.continue = function () {
      var isValid = true;
      if (!$scope.data.tagId || $scope.data.tagId <= 0){
        isValid = false;
      }
      if (!isValid) {
        $scope.showErrors = true;
        return;
      }

      
    }

    $scope.initializeOnScan = function(){
      $log.log('Initializing onscan...');
      $window.onScan.attachTo($document[0], {
        suffixKeyCodes: [13], // enter-key expected at the end of a scan
        reactToPaste: true, // Compatibility to built-in scanners in paste-mode (as opposed to keyboard-mode)
        onScan: function(sCode, iQty) { // Alternative to document.addEventListener('scan')
          $scope.processScan(sCode, iQty);
        },
        onKeyDetect: function(iKeyCode){ // output all potentially relevant key events - great for debugging!
          $log.log('Pressed: ' + iKeyCode);
        },
        onScanError: function(objDebug){
          $log.error('Error: ');
          $log.error(objDebug);
        }
      });
    }

    $scope.detachOnScan = function(){
      $window.onScan.detachFrom($document[0]);
    }

    $scope.processScan = function(sCode, iQty) { // Alternative to document.addEventListener('scan')
      //
      // TODO: Evaluate sCode read
      //
      var tagCode = sCode;
      var tagQty  = iQty;
      $log.log('Scanned: ' + tagQty + 'x ' + tagCode); 
      CoreService.session.wizardNew.tagCode = tagCode;
      //
      // Validate TAG at server
      //
      $scope.status = 'Verificando TAG...';
      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
        $scope.$apply();
      }
      $timeout(function(){
        ApiService.CVUCheckTAG(CoreService.session.wizardNew.transactionId, tagCode).then(function(response) {
          if (response.outcode == 200 || response.outcode == 201){
            if (response.data.status == 'FREE'){
              //
              // TAG is correct, continue
              //
              $scope.status = 'TAG leído correctamente!';
              $scope.scanCompleted = true;
              if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
              }
              $timeout(function(){
                $state.go('cvu-new-s7-process');
              }, 2000);
            }else{
              //
              // TAG is INVALID, ask for a new one
              //
              CoreService.showRetryDialog("El TAG no es válido, por favor retire otro y vuelva a escanearlo").then(function(retry){
                if (retry){
                  $scope.status = 'Esperando lectura de nuevo TAG...';
                  if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                    $scope.$apply();
                  }
                }else{
                  CoreService.showCancelDialog().then(function(cancel){
                    if (cancel){
                      //
                      // User cancelled transaction
                      //
                      $state.go('cvu-new-s7b-refund');
                    }else{
                      //
                      // Retry again
                      //
                      $scope.status = 'Esperando lectura de nuevo TAG...';
                      if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                        $scope.$apply();
                      }
                    }
                  }, function(){});
                }
              }, function(){});
            }
          }else{
            //
            // Server returned error
            //
            CoreService.showRetryDialog("El TAG no se pudo verificar").then(function(retry){
              if (retry){
                //$scope.processScan(tagCode, tagQty);
                // Let user scan the tag again
              }else{
                CoreService.showCancelDialog().then(function(cancel){
                  if (cancel){
                    //
                    // User cancelled transaction
                    //
                    $state.go('cvu-new-s7b-refund');
                  }else{
                    // Retry again
                    // $scope.processScan(tagCode, tagQty);
                    // Let user scan the tag again
                  }
                }, function(){});
              }
            }, function(){});
            $log.error('Error on CVUCheckTAG, server response with error');
            $log.error(response);
          }
        }, function(error) {
          //
          // Comm error with server
          //
          CoreService.showRetryDialog("Ocurrió un error al intentar verificar el TAG").then(function(retry){
            if (retry){
              // $scope.processScan(tagCode, tagQty);
              // Let user scan the tag again
            }else{
              CoreService.showCancelDialog().then(function(cancel){
                if (cancel){
                  //
                  // User cancelled transaction
                  //
                  $state.go('cvu-new-s7b-refund');
                }else{
                  // Retry again
                  // $scope.processScan(tagCode, tagQty);
                  // Let user scan the tag again
                }
              }, function(){});
            }
          }, function(){});
          $log.error('Error on CVUCheckTAG, comm error');
          $log.error(error);
        });
      }, 1000);
    }

    $scope.simulateScan = function(){
      $window.onScan.simulate(document, CoreService.session.wizardNew.theoricTag);
    }

    $scope.simulateScanWrong = function(){
      $window.onScan.simulate(document, 'E280110C20007A8EC5A7099C');
    }

    $scope.$on("$destroy", function(){
      $log.log('Destroying onscan...');
      $scope.detachOnScan();
    });
    


    //
    // Init
    //
    CoreService.sessionTimerStop();
    $scope.expendTag();
    // $scope.initializeOnScan();
    // $timeout(() => {
    //   $scope.status = 'TAG leído correctamente!';
    //   $scope.scanCompleted = true;
    // }, 2000);
  }

})();
