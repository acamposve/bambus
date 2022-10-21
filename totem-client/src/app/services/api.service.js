angular
  .module('app')
  .factory('ApiService', ApiService);

ApiService.inject = ['$http', '$log'];

/* @ngInject */
function ApiService($http, $log, $window) {

  var api = {
    coreConfig: null,
    // serverUrl: $window.API_URL ? $window.API_URL : 'http://localhost:12345',     // LOCAL
    // serverUrl: $window.API_URL ? $window.API_URL : 'http://192.168.1.207:12345', // RONDY
    serverUrl: $window.API_URL ? $window.API_URL : 'http://192.168.1.235:12345', // NACHO
    timeout: 40000,
    // timeout: 100,
    authorization: $window.credentials
    // authorization: '6b8ZyP0XnlS67J3v6'
  };

  // -------------------------------------------------------------------------
  //
  // Core methods
  //
  api.initialize = function(coreConfig){
    api.coreConfig = coreConfig;
  },
  api.httpGet = function (url, custom_headers) {
    var headers = {
      ...custom_headers,
      'authorization': api.authorization,
      'X-Totem': api.coreConfig.hostname
    };

    return new Promise((resolve, reject) => {
      try {
        $http.get(url, {
          headers: headers,
          timeout: this.timeout
        }).then((response) => {
          if (!response) {
            $log.error('ApiService|httpGet|Empty response for url: ' + url);
            $log.error(response);
            reject({ outcode: -1, message: 'Respuesta vacía del servidor' })
          } else {
            if (response.status != 200 && response.status != 201 && response.status != 401) {
              $log.error('ApiService|httpGet|Error with status code ' + response.status);
              $log.error(response);
              reject({ outcode: response.status, message: response.meta.desc })
            } else {
              resolve(response.data);
            }
          }
        }, (error) => {
          $log.error('ApiService|httpGet|Comm error for url: ' + url);
          $log.error(error);
          reject({ 
            outcode: (error.data && error.data.outcode) ? error.data.outcode : -1, 
            message: (error.data && error.data.message) ? error.data.message : 'Error en la comunicación con el servidor (' + error.status + ')' 
          });
        });
      } catch (exc) {
        $log.error('ApiService|httpGet|Exception catched for url: ' + url);
        $log.error(exc);
        reject({ outcode: -1, message: 'Error interno' })
      }
    });
  };
  api.httpPost = function (url, data, custom_headers) {
    var headers = {
      ...custom_headers,
      'authorization': api.authorization,
      'X-Totem': api.coreConfig.hostname
    };
    return new Promise((resolve, reject) => {
      try {
        $http.post(url, data, {
          headers: headers,
          timeout: this.timeout
        }).then((response) => {
          if (!response) {
            $log.error('ApiService|httpPost|Empty response for url: ' + url);
            $log.error(response);
            reject({ outcode: -1, message: 'Respuesta vacía del servidor' })
          } else {
            if (response.status != 200 && response.status != 201 && response.status != 401) {
              $log.error('ApiService|httpPost|Error with status code ' + response.status);
              $log.error(response.data);
              reject({ outcode: response.status, message: response.meta.desc })
            } else {
              resolve(response.data);
            }
          }
        }, (error) => {
          $log.error('ApiService|httpPost|Comm error ('+error.xhrStatus+') for url: ' + url);
          $log.error(error);
          if (error.xhrStatus == 'timeout'){
            reject({ outcode: -2, message: 'Timeout en la comunicación con el servidor (' + error.status + ')' });
          }else{
            reject({ 
              outcode: (error.data && error.data.outcode) ? error.data.outcode : -1, 
              message: (error.data && error.data.message) ? error.data.message : 'Error en la comunicación con el servidor (' + error.status + ')' 
            });
          }
        });
      } catch (exc) {
        $log.error('ApiService|httpPost|Exception catched for url: ' + url);
        $log.error(exc);
        reject({ outcode: -1, message: 'Error interno' })
      }
    });
  };

  // -------------------------------------------------------------------------
  //
  // Server Core Methods
  //
  api.maintenanceLogin = function(password){
    var data = {
      password: password
    };
    $log.debug('ApiService | maintenanceLogin | Requesting...');
    return this.httpPost(this.serverUrl + '/totem/access', data);
  }
  api.getTotemInfo = function(summarized){
    $log.debug('ApiService | getTotemInfo | Requesting...');
    var params = '';
    if (summarized){
      params = '?summarized=1';
    }
    return this.httpGet(this.serverUrl + '/totem'+params);
  }
  api.searchRoll = function(filter, encPass){
    $log.debug('ApiService | searchRoll | Requesting with '+filter+'...');
    return this.httpGet(this.serverUrl + '/rolls/filter?name='+filter, {'x-totem-credentials':encPass});
  }
  api.installRoll = function(rollId, encPass){
    var data = {
      rollId: rollId
    };
    $log.debug('ApiService | installRoll | Requesting with [' + angular.toJson(data) + ']...');
    return this.httpPost(this.serverUrl + '/rolls/assign', data, {'x-totem-credentials':encPass});
  }
  api.setTotemStatus = function(status, cause, encPass){
    var data = {
      status: status,
      cause: cause
    };
    $log.debug('ApiService | setTotemStatus | Requesting...');
    return this.httpPost(this.serverUrl + '/totem/status', data, {'x-totem-credentials':encPass});
  }
  api.setTotemSettings = function(data, encPass){
    $log.debug('ApiService | setTotemSettings | Requesting...');
    return this.httpPost(this.serverUrl + '/totem/settings', data, {'x-totem-credentials':encPass});
  }

  // -------------------------------------------------------------------------
  //
  // CVU Methods
  //
  api.CVUStartNewTag = function (data) {
    $log.debug('ApiService | CVUStartNewTag | Requesting with [' + angular.toJson(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/start/new', data);
  }

  api.CVUStartRecharge = function (data) {
    $log.debug('ApiService | CVUStartRecharge | Requesting with [' + angular.toJson(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/start/recharge', data);
  }

  api.CVUGetVehicleBrands = function () {
    $log.debug('ApiService | CVUGetVehicleBrands | Requesting...');
    return this.httpGet(this.serverUrl + '/cvu/vehicle/brands');
  }

  api.CVUGetVehicleModels = function (brand) {
    $log.debug('ApiService | CVUGetVehicleBrands | Requesting models for brand ['+brand+']...');
    return this.httpGet(this.serverUrl + '/cvu/vehicle/models?brand='+brand);
  }

  api.CVUGetVehicleColors = function () {
    $log.debug('ApiService | CVUGetVehicleColors | Requesting colors...');
    return this.httpGet(this.serverUrl + '/cvu/vehicle/colors');
  }

  api.CVUGetRechargeAmounts = function () {
    $log.debug('ApiService | CVUGetRechargeAmounts | Requesting amounts for recharge/topup...');
    return this.httpGet(this.serverUrl + '/cvu/rechargeAmounts');
  }

  api.CVUExecuteStart = function (trxId, vehicle, clientNumber, amount, user) {
    $log.debug('ApiService | CVUExecuteStart | Requesting execute start for trxId ' + trxId + '...');
    var data = {
      transactionId: trxId
    }
    if (vehicle){
      data.vehicle = vehicle;
    }
    if (clientNumber){
      data.clientNumber = clientNumber;
    }
    if (amount){
      data.amount = amount;
    }
    if (user){
      data.user = user;
    }
    return this.httpPost(this.serverUrl + '/cvu/executeStart', data);
  }

  api.CVUExecuteStatus = function (trxId, clientNumber) {
    var data = {
      transactionId: trxId
    }
    if (clientNumber){
      data.clientNumber = clientNumber;
    }
    $log.debug('ApiService | CVUExecuteStatus | Requesting execute status with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/executeStatus', data);
  }

  api.CVUExecuteRollback = function (trxId) {
    var data = {
      transactionId: trxId
    }
    $log.debug('ApiService | CVUExecuteRollback | Requesting execute rollback with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/executeRollback', data);
  }

  api.CVUReverseRecharge = function(trxId){
    var data = {
      transactionId: trxId
    }
    $log.debug('ApiService | CVUReverseRecharge | Requesting recharge reverse with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/reverseRecharge', data);
  }

  api.CVUConfirmRecharge = function(trxId){ 
    var data = {
      transactionId: trxId
    }
    $log.debug('ApiService | CVUReverseRecharge | Requesting recharge reverse with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/confirmRecharge', data);
  }

  api.expendedTag = function(transactionId, printQty){
    var data = {
      transactionId: transactionId,
      printQty: printQty
    }
    $log.debug('ApiService | expendedTag | Requesting with [' + angular.toJson(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/expendedTag', data);
  }

  api.expendedTagManual = function(tagCode, encPass){
    $log.debug('ApiService | expendedTagManual | Requesting...');
    return this.httpPost(this.serverUrl + '/cvu/expendedTagManual', {tagCode: tagCode}, {'x-totem-credentials':encPass});
  }

  api.CVUCheckTAG = function (transactionId, tagCode) {
    var data = {
      transactionId: transactionId,
      tagCode: tagCode
    };
    $log.debug('ApiService | CVUCheckTAG | Requesting checkTag with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/checkTag/', data);
  }

  api.CVUConfirm = function (transactionId, vehicle) {
    var data = {
      transactionId: transactionId,
      vehicle: vehicle
    };
    $log.debug('ApiService | CVUConfirm | Requesting confirm with [' + JSON.stringify(data) + ']...');
    return this.httpPost(this.serverUrl + '/cvu/confirm/', data);
  }

  // -------------------------------------------------------------------------
  //
  // Sarea Methods
  //
  api.SareaPay = function (data) {
    $log.debug('ApiService | SareaPay | Requesting payment...');
    return this.httpPost(this.serverUrl + '/sarea/pay', data);
  }

  api.SareaCheckPayment = function (paymentId, transactionId, customerId) {
    $log.debug('ApiService | SareaCheckPayment | Checking payment...');
    return this.httpPost(this.serverUrl + '/sarea/checkPayment', {
      paymentId    : paymentId,
      transactionId: transactionId
    });
  }

  api.SareaRefund = function(paymentId){
    $log.debug('ApiService | SareaRefund | Requesting payment refund...');
    return this.httpPost(this.serverUrl + '/sarea/refund', {paymentId: paymentId});
  }

  api.SareaCheckRefund = function(paymentId){
    $log.debug('ApiService | SareaCheckRefund | Checking payment refund request...');
    return this.httpPost(this.serverUrl + '/sarea/checkRefund', {paymentId: paymentId});
  }



  return api;
}
