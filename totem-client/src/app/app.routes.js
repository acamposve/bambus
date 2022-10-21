(function() {
  'use strict';

  angular.module('app').config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
      url: '/',
      component: 'home',
    });

    // ******************************************************
    // CVU
    //
    $stateProvider.state('start', {
      url: '/start',
      component: 'start',
    });
    $stateProvider.state('contact-support', {
      url: '/contact-support',
      component: 'cvuSupportScreen',
    });
    $stateProvider.state('maintenance', {
      url: '/maintenance',
      component: 'maintenance',
    });
    $stateProvider.state('info', {
      url: '/info',
      component: 'cvuInfo',
    });
    //
    // Wizard New 
    //
    $stateProvider.state('cvu-new-s1-id', {
      url: '/cvu/new/1',
      component: 'cvuNewStep1User',
    });
    $stateProvider.state('cvu-new-s2-user-data', {
      url: '/cvu/new/2',
      component: 'cvuNewStep2UserData',
    });
    $stateProvider.state('cvu-new-s3-vehicle', {
      url: '/cvu/new/3',
      component: 'cvuNewStep3Vehicle',
    });
    $stateProvider.state('cvu-new-s4-topup', {
      url: '/cvu/new/4',
      component: 'cvuNewStep4Topup',
    });
    $stateProvider.state('cvu-new-s5-pay', {
      url: '/cvu/new/5',
      component: 'cvuNewStep5Pay',
    });
    $stateProvider.state('cvu-new-s6-tag', {
      url: '/cvu/new/6',
      component: 'cvuNewStep6Tag',
    });
    $stateProvider.state('cvu-new-s7-process', {
      url: '/cvu/new/7',
      component: 'cvuNewStep7Process',
    });
    $stateProvider.state('cvu-new-s7b-refund', {
      url: '/cvu/new/7b',
      component: 'cvuNewStep7bRefund',
    });
    $stateProvider.state('cvu-new-s8-done', {
      url: '/cvu/new/8',
      component: 'cvuNewStep8Done',
    });
    $stateProvider.state('cvu-new-s8b-refunded', {
      url: '/cvu/new/8b',
      component: 'cvuNewStep8bRefunded',
    });
    //
    // Recharge account
    //
    $stateProvider.state('cvu-rech-s1-id', {
      url: '/cvu/recharge/1',
      component: 'cvuRechStep1User',
    });
    $stateProvider.state('cvu-rech-s2-topup', {
      url: '/cvu/recharge/2',
      component: 'cvuRechStep2Topup',
    });
    $stateProvider.state('cvu-rech-s3-process', {
      url: '/cvu/recharge/3',
      component: 'cvuRechStep3Process',
    });
    $stateProvider.state('cvu-rech-s4-pay', {
      url: '/cvu/recharge/4',
      component: 'cvuRechStep4Pay',
    });
    $stateProvider.state('cvu-rech-s4b-revert', {
      url: '/cvu/recharge/4b',
      component: 'cvuRechStep4bRevert',
    });
    $stateProvider.state('cvu-rech-s5-confirm', {
      url: '/cvu/recharge/5',
      component: 'cvuRechStep5Confirm',
    });
    $stateProvider.state('cvu-rech-s5b-refund', {
      url: '/cvu/recharge/5b',
      component: 'cvuRechStep5bRefund',
    });
    $stateProvider.state('cvu-rech-s6-done', {
      url: '/cvu/recharge/6',
      component: 'cvuRechStep6Done',
    });
    $stateProvider.state('cvu-rech-s6b-refunded', {
      url: '/cvu/recharge/6b',
      component: 'cvuRechStep6bRefunded',
    });
    
    
     

    $urlRouterProvider.otherwise('/');
  }

})();
