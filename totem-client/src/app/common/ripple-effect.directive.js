// angular.module('app').directive('ripple', ['$window', function ($window) {
angular.module('app').directive('ripple', function () {
  var linkFn = function (scope, element /*, attrs*/) {
    element.css('overflow', 'hidden');
    // var elementClientHeight = element[0].clientHeight,
    //     elementScrollHeight = element[0].scrollHeight;
    
    var rippling = false;
    //var rippleStream = scope.rippleStream || false;
    
    // var adjust = function () {
    //   elementClientHeight = element[0].clientHeight;
    //   elementScrollHeight = element[0].scrollHeight;
    // };
    
    var ripple = function (e) {
      rippling = true;
      
      var eRipple = angular.element('<span class="'+scope.rippleClass+'"></span>');
      
      // var rect = element[0].getBoundingClientRect(),
      //     left = e.x - rect.left - (scope.rippleRadius ? scope.rippleRadius/2 : 25)
      //             - (scope.rippleOffsetX ? scope.rippleOffsetX : 0),
      //     top = e.y - rect.top - (scope.rippleRadius ? scope.rippleRadius/2 : 25)
      //             - (scope.rippleOffsetY ? scope.rippleOffsetY : 0);

      // if(elementScrollHeight !== elementClientHeight) { 
      //   top -= elementScrollHeight;
      // } else {
      //   top -= scope.rippleRadius ? scope.rippleRadius/2 : 25;
      // }
      var left = e.layerX;
      var top = e.layerY;

      eRipple.css('display', 'block');
      eRipple.css('position', 'absolute');
      eRipple.css('width', scope.rippleRadius ? scope.rippleRadius + 'px' : '50px');
      eRipple.css('height', scope.rippleRadius ? scope.rippleRadius + 'px' : '50px');
      // eRipple.css('margin-left', left +'px');
      // eRipple.css('margin-top', top+'px');
      eRipple.css('left', left +'px');
      eRipple.css('top', top+'px');

      element.append(eRipple);

      eRipple.on('animationend msAnimationEnd webkitAnimationEnd oAnimationEnd', function() {
        eRipple.remove();
        rippling = false;
        scope.rippleCallback && scope.rippleCallback({});
      });
      
      e.stopPropagation();
      e.preventDefault();
    };
    
    // angular.element($window).bind('resize', function() {
    //   adjust();
    // });

    element.on('mousedown ontouchstart', function (e) {
      if(!rippling || scope.rippleStream) {
        ripple(e);
      }
    });

  };

  return {
    scope: {
      'rippleClass': '@',
      'rippleRadius': '@',
      'rippleOffsetX': '@',
      'rippleOffsetY': '@',
      'rippleStream': '@',
      'rippleCallback': '&'
    },
    retrict: 'A',
    link: linkFn
  };
});
// }]);