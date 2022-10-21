(function() {

  angular.module('app').directive('keyboard', function () {
      
    var controller = ['$scope','$rootScope','$element','$attrs','$log','$window','$document', function ($scope, $rootScope, $element, $attrs, $log, $window, $document) {
      
      $scope.form = $document[0].getElementById($scope.formName);

      //
      // Attributes watch
      //
      $scope.$watch('layout', function (newValue /*, oldValue*/) {
        if (!$scope.keyboard) return;
        // $log.debug('Keyboard|Setting new layout to ' + newValue + ' from ' + oldValue);
        $scope.keyboard.setOptions({
          layoutName: newValue
        }); 
      }, true);
      // $scope.$watch('input', function (newValue , oldValue) {
      //   $log.warn('Keyboard| Input watch | Setting new input to ' + newValue + ' from ' + oldValue);
      //   if (newValue == oldValue) {
      //     $log.log('equal');
      //     return;
      //   }
      //   if (!$scope.keyboard) return;
      //   $scope.keyboard.setInput(newValue);
      // }, true);
      $scope.changeInputHanlder = $rootScope.$on('keyboard::changeInput', function(event, arg){
        // $log.warn('Keyboard| Input watch | Setting new input to ' + arg );
        $scope.keyboard.setInput(arg);
      });

      //
      // Init
      //
      $scope.handleShift = function() {
        let currentLayout = $scope.keyboard.options.layoutName;
        let shiftToggle = currentLayout === "default" ? "shift" : "default";
        // $log.log('Setting layout to ' + shiftToggle);
        $scope.keyboard.setOptions({
          layoutName: shiftToggle
        });
      }
      $scope.handleNext = function(){
        var els = $scope.form.elements;
        var activeEl = $document[0].activeElement;
        for (let i = 0; i < els.length; i++) {
          if (els[i].id == activeEl.id){
            if ( (i+1) < els.length){
              els[i+1].focus();
              $scope.keyboard.setInput(els[i+1].value);
            }else if ((i+1) == els.length){
              els[0].focus();
              $scope.keyboard.setInput(els[0].value);
              break;
            }
          }
        }
      }

      $scope.onChange = function(newValue) {
        $document[0].activeElement.value = newValue;
        $scope.input = newValue;
        angular.element($document[0].activeElement).triggerHandler('input');
        // $log.log("Input changed to " + newValue);
      }

      $scope.onKeyPress = function(button) {
        // $log.log("Button pressed", button);
        if (button === "{shift}" || button === "{lock}"){
          $scope.handleShift();
          return;
        }
        if (button === "{tab}") {
          $scope.handleNext();
          return;
        }
        if (button === "{bksp}") {
          return;
        }

        if (button === "←") {
          return;
        }
        // $scope.input += button;
        //$scope.input = $scope.keyboard.getInput();
        
      }
      $scope.keyboard = new $window.SimpleKeyboard.default({
        layout: {
        'min': [
          '1 2 3 4 5 6 7 8 9 0 {bksp}',
          ' q w e r t y u i o p ',
          ' a s d f g h j k l ñ' ,
          '  z x c v b n m  ',
          ' {space} '
        ],
        'default': [
          '1 2 3 4 5 6 7 8 9 0 {bksp}',
          ' Q W E R T Y U I O P ',
          ' A S D F G H J K L Ñ ',
          '  Z X C V B N M  ',
          ' {space} '
        ],
        'email': [
          ' @gmail.com @hotmail.com @ .com ',
          '1 2 3 4 5 6 7 8 9 0 {bksp}',
          ' q w e r t y u i o p ',
          ' a s d f g h j k l ñ ',
          ' z x c v b n m . _ - ',
          ' {tab} '
        ],
        'phoneNumber': [
          ' 1 2 3 ',
          ' 4 5 6 ',
          ' 7 8 9 ',
          ' + 0 {bksp} ',
          $scope.showNext ? ' {tab} ' : ''
        ],
        'number': [
          ' 1 2 3 ',
          ' 4 5 6 ',
          ' 7 8 9 ',
          '  0  ',
          ' {bksp} ',
          $scope.showNext ? ' {tab} ' : ''
        ]},
        display: {
          '{bksp}': '←',
          '{enter}': 'ENTER',
          '{space}': 'ESPACIO',
          '{lock}': 'MAYUS',
          '{tab}': 'SIGUIENTE'
        },
        buttonTheme: [{
          class: "bt-key-blank",
          buttons: " "
        },{
          class: "bt-key-next",
          buttons: "{tab}"
        }],
        onChange: input => $scope.onChange(input),
        onKeyPress: button => $scope.onKeyPress(button),
        preventMouseDownDefault: true,
        tabCharOnTab: false,
        physicalKeyboardHighlight: true
      });

    }],
        
    template = '<div class="keyboard-cntr bt-keyboard"><div class="simple-keyboard"></div></div>';
      
    return {
      restrict: 'E',
      scope: {
        layout: '=layout',
        // input: '=input',
        formName: '=formName',
        showNext: '=showNext'
        //add: '&',
      },
      controller: controller,
      template: template,
      replace: true,
    };
  });

}());