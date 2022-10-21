(function() {
  'use strict';

  angular.module('app').config(configBlock);

  /** @ngInject */
  function configBlock($locationProvider, $logProvider, $translateProvider,
                       tmhDynamicLocaleProvider, uiGmapGoogleMapApiProvider) {
    $locationProvider.
        html5Mode(true);

    $logProvider.
        debugEnabled(true);

    $translateProvider.
        useStaticFilesLoader({
          // Update `config.locales.directory` in `gulp/config.js` if change.
          prefix: './locales/',
          suffix: '.json',
        }).
        preferredLanguage('es').
        fallbackLanguage('es').
        useSanitizeValueStrategy('escape').
        useMissingTranslationHandlerLog();

    tmhDynamicLocaleProvider.
        // Angular locales pattern used by `buildAngularLocales()` in
        // `gulp/locales.js`.
        localeLocationPattern('./locales/angular-locale_{{locale}}.js').
        defaultLocale('es');

      uiGmapGoogleMapApiProvider.configure({
          key: 'AIzaSyC0aYDd9d-wJHe0pLunCw_POfyaAm6Rfv8',
          v: '3.20', //defaults to latest 3.X anyhow
          libraries: 'weather,geometry,visualization'
      });
  }

})();
