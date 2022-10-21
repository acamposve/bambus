// var electron = require('electron');

(function() {
  'use strict';

  angular.module('app').run(runBlock);

  /** @ngInject */
  function runBlock($document, $log, $rootScope, tmhDynamicLocale, CoreService, ApiService, $window) {
    $log.info('App run started...');

    $window.dayjs.extend($window.dayjs_plugin_updateLocale);
    $window.dayjs.locale("es");
    $window.dayjs.extend($window.dayjs_plugin_calendar);
    $window.dayjs.updateLocale('es', {
      calendar: {
        lastDay: '[Ayer a las] h:mm A',
        sameDay: '[Hoy a las] h:mm A',
        nextDay: '[Mañama a las] h:mm A',
        lastWeek: 'dddd [pasado a las] h:mm A',
        nextWeek: 'dddd [a las] h:mm A',
        sameElse: 'dddd D [de] MMMM [de] YYYY [a las] h:mm A'
      }
    })
    $window.dayjs().format();

    //
    // Initialize locale
    //
    $rootScope.$on('$translateChangeSuccess', function(event, data) { // eslint-disable-line angular/on-watch
      tmhDynamicLocale.set(data.language);
      $document[0].documentElement.setAttribute('lang', data.language);
    });

    //
    // Check DEBUG MODE
    //
    if ($window.IS_DEBUG){
      $log.info('-----------------------------');
      $log.info('    RUNNING IN DEBUG MODE!   ');
      $log.info('-----------------------------');
    }

    //
    // Initialize Core
    //
    CoreService.initialize($window.totem);
    $log.info('---------Config--------');
    $log.info(CoreService.config);
    $log.info('-----------------------');
    ApiService.initialize(CoreService.config);

    //
    // Connection monitor
    //
    $window.addEventListener("offline", function() {
      var el = $document[0].getElementById('noconn');
      el.style.display = 'flex';
    }, false);

    $window.addEventListener("online", function() {
      var el = $document[0].getElementById('noconn');
      el.style.display = 'none';
    }, false);

    $log.info('App run ready!');
  }

})();
