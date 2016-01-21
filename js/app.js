(function($angular, _, Hammer) {
    'use strict';

    $angular
    .module('app', ['picardy.fontawesome', 'as.sortable'])

    .directive('tap', [function() {
      return function(scope, element, attr) {
        var hammerTap = new Hammer(element[0], {});
        hammerTap.on('tap', function() {
          scope.$apply(function() {
            scope.$eval(attr.tap);
          });
        });
      };
    }])

    .factory('LocalStorage', [function () {
        // get item out of local storage and if it's a string, turn it into a json object
        var get = function(key) {
          var data, item = window.localStorage.getItem(key);
          if (item && _.isString(item) && _.isEmpty(item) === false) {
              data = $angular.fromJson(item);
          } else {
              data = item;
          }
          return data;
        };
        // save object as a json string
        var save = function(key, data) {
            window.localStorage.setItem(key, $angular.toJson(data));
        };
        // remove a specific store
        var remove = function(key) {
            window.localStorage.removeItem(key);
        };
        // blow them all away
        var clearAll = function() {
            window.localStorage.clear();
        };

        return {
            get: get,
            save: save,
            remove: remove,
            clearAll: clearAll
        };
    }])

    .factory('UiHelpers', [function(){
      var maxDegrees = 360;
      var maxRadians = 6.283185307179586;
      // helpers
      var _getNumbers = function(target){
        var numbers = {};
        if(target) {
          numbers = {
            t: target.offsetTop,
            r: target.offsetLeft + target.offsetWidth,
            b: target.offsetTop + target.offsetHeight,
            l: target.offsetLeft,
            w: target.offsetWidth,
            h: target.offsetHeight,
          };
          // find x|y center
          numbers.cx = (numbers.l + (numbers.w/2));
          numbers.cy = (numbers.t + (numbers.h/2));
        }
        return numbers;
      };

      var _getRadians = function(input, el){
        var metrics = _getNumbers(el);
        var radians = Math.atan2((input.clientY - metrics.cy), (input.clientX - metrics.cx));
        radians += maxRadians/4;
        if(radians < 0) {
          radians += maxRadians;
        }
        return radians;
      };

      var _getDegrees = function(input, el){
        var radians = _getRadians(input, el);
        var degree = radians * 180/Math.PI;
        return degree;
      };

      return {
        maxRadians: maxRadians,
        maxDegrees: maxDegrees,
        getNumbers: _getNumbers,
        getRadians: _getRadians,
        getDegrees: _getDegrees
      };
    }])

    .controller('AppController', ['$scope', '$location', '$document', 'LocalStorage', 'ColorService', 'UiHelpers', function($scope, $location, $document, storage, colors, ui) {

        _.mixin({clamp2: function(n, min, max) {
          return Math.min(Math.max(n, min), max);
        }});

        var _modes = [
          {name: 'tanuki', icon:'spinner'},
          {name: 'florix', icon:'sun-o'},
          {name: 'blook', icon:'square'}
        ];

        var _defaultPrefs = {
          useHash: false,
          allowBW: false,
          showHistory: false,
          showFavs: false,
          alwaysShowHex: false,
          mode: _modes[1].name, //tanuki,florix, blook
          toolbox: 'color', // color | display
          // hexMode: 3, // 3|6
          fancy: true,
          tweeks: {
            tanuki: {
              klumpf: 2,
              ichtzy: 5,
              flarp: 100,
              plark: 1,
              marklar: 0.01,
              quarble: 0.08,
              cappa: true
            },
            florix: {
              quarble: 0,
              borgee: 50,
              gloosh: 100,
              zarrt: 12,
              syrris: 100,
              shaado: 5,
              shaada: -1,
              shaadik: 0
            },
            blook: {
              quarble: 0.04
            }
          }
        };

        var _lum = function(l, mod){
          mod = mod || 255;
          return colors.rgbObjToHex({
            r: Math.round(l*mod),
            g: Math.round(l*mod),
            b: Math.round(l*mod)
          }, true);
        };

        $scope.colorHistory = storage.get('tanuki-history') || [];
        $scope.myColors = storage.get('tanuki-colors') || [];
        $scope.modes = _modes;

        $scope.preferences = storage.get('tanuki-preferences') || _defaultPrefs;

        $scope.showMenu = false;
        $scope.showSliders = false;
        $scope.tab = 'color';

        $scope.touching = false;
        $scope.colorSteps = 6;

        $scope.mode = _.findWhere(_modes, {name: $scope.preferences.mode});
        $scope.kulra = _lum($scope.preferences.tweeks.florix.shaadik, 255);

        $scope.sortableOptions = {
            containerPositioning: 'relative',
            // containment: '.palette',
            additionalPlaceholderClass: 'color-brick parking-spot',
            dragEnd: function() {
              var list = _.clone($scope.myColors);
               var newList = _.map(list, function(i){
                  return i;
              });
              $scope.myColors =  _.compact(newList);
              // $scope.$apply();
              storage.save('tanuki-colors', $scope.myColors);
            }
        };

        var _notInRunLoop = function _notInRunLoop() {
          return !$scope.$root.$$phase;
        };

        var addToColorHistory = function(history, color){
            var c = _.find(history, function(item){
                return item === color;
            });

            if(c !== color) {
                history.push(color);
            }

            $scope.colorHistory = _.last(history, 20);
            storage.save('tanuki-history', $scope.colorHistory);
        };

        $scope.cycleModes = function(mode) {
          if(!$scope.preferences.showFavs) {
            if(mode === 'blook') {
              $scope.preferences.mode = 'tanuki';
            } else if(mode === 'florix') {
              $scope.preferences.mode = 'blook';
            } else {
              $scope.preferences.mode = 'florix';
            }
            $scope.mode = _.findWhere(_modes, {name: $scope.preferences.mode});
          }
        };

        $scope.clearColorHistory = function(){
            $scope.colorHistory = [];
            storage.save('tanuki-history', $scope.colorHistory);
        };

        $scope.clearSavedColors = function(){
            $scope.myColors = [];
            storage.save('tanuki-colors', $scope.myColors);
        };

        $scope.clearPrefs = function() {
          storage.remove('tanuki-preferences');
          storage.save('tanuki-preferences', $angular.copy(_defaultPrefs));
          window.location.reload();
        };

        $scope.resetTweeks = function(mode){
          $scope.preferences.tweeks[mode] = $angular.copy(_defaultPrefs.tweeks[mode]);
        };

        var doIt = function(color){
          if(!color || color === '#') {
            color = colors.randomHex();
          }
          color = colors.toHex(color).toLowerCase();

          addToColorHistory($scope.colorHistory, color);

          var cb = colors.brightness(color);
          var darker = [];
          _.times(50, function(n){
            if(n % $scope.colorSteps === 0) {
              var dn = colors.darken(color, n);
              if(dn !== '#000000' || $scope.preferences.allowBW) {
                if(cb < $scope.colorSteps) {
                  darker.push(dn);
                } else {
                  if(cb - colors.brightness(dn) > $scope.colorSteps) {
                    darker.push(dn);
                  }
                }
              }
            }
          });

          var lighter = [];
          _.times(50, function(n){
            if(n % $scope.colorSteps === 0) {
              var c = 50 - n;
              var ln = colors.lighten(color, c);
              if(ln !== '#ffffff' || $scope.preferences.allowBW) {
                lighter.push(ln);
              }
            }
          });

          $scope.darker = _.unique(darker);
          $scope.lighter = _.unique(lighter);

          // edges
          $scope.lightest = _.first($scope.lighter);
          $scope.darkest = _.last($scope.darker);
          // middles
          $scope.lightish = $scope.lighter.length > 2 ? $scope.lighter[$scope.lighter.length-3] : color;
          $scope.darkish = $scope.darker.length > 2 ? $scope.darker[2] : color;

          $scope.alternates = _.unique($scope.lighter.concat([color]).concat($scope.darker));

          // inject a duplicate last item for overlap hackery in tanuki mode: flower
          if($scope.preferences.mode === 'florix') {
            if(!$scope.darkest) {
              $scope.darkest = color;
            }
            $scope.alternates.push($scope.darkest);
          }

          $scope.controlBg = _.first($scope.darker);
          $scope.controlFg = _.last($scope.lighter);

          $scope.deg = (360/($scope.alternates.length-1));
          $scope.size = Math.floor((100/($scope.alternates.length-2) + Math.PI)/2);

          $scope.color = color;
          $scope.tuner = {
            r: colors.red(color),
            g: colors.green(color),
            b: colors.blue(color),
            hex: color,
            brightness: cb
          };

          $scope.rotateFactor = _.findIndex($scope.alternates, function(item){
            return item === $scope.color;
          });

          $scope.ringDeg = $scope.deg*($scope.rotateFactor+1);

          if($scope.preferences.useHash) {
            window.location.hash = color.replace('#', '#/');
          }

          if (_notInRunLoop()) {
            try {
              // Sometimes we're outside of the Angular run-loop,
              // and therefore need to manually invoke the `apply` method
              $scope.$apply();
            } catch(e) {}
          }
        };

        $scope.doIt = function(color){
          doIt(color);
        };

        $scope.setNewColor = function(color){
          $scope.tuner.hex = colors.rgbObjToHex(color, true);
          $scope.tuner.brightness = colors.brightness($scope.tuner.hex);
          doIt($scope.tuner.hex);
        };

        $scope.setRingRotation = function(){
          return {
            transform: 'rotate(-'+$scope.ringDeg+'deg) translateZ(0)'
          };
        };

        $scope.setRotation = function(index){
          var i = index+1;
          var d = $scope.deg*(i);
          var m = '0 -'+$scope.size+'em';
          var z = $scope.preferences.mode === 'tanuki' ? i : $scope.alternates.length - i;
          var t = (i * parseFloat($scope.preferences.tweeks[$scope.preferences.mode].quarble));
          var r = '';
          var s = '';
          var f = '';
          var n;

          if($scope.preferences.mode === 'tanuki') {
            if($scope.preferences.tweeks.tanuki.cappa) {
              n = -(Math.E * (Math.ceil(i/$scope.preferences.tweeks.tanuki.klumpf) * $scope.preferences.tweeks.tanuki.marklar) - Math.ceil(i/$scope.preferences.tweeks.tanuki.klumpf));
            } else {
              n = -(Math.E * ((i/$scope.preferences.tweeks.tanuki.klumpf * $scope.preferences.tweeks.tanuki.marklar) - i/$scope.preferences.tweeks.tanuki.klumpf));
            }
            // s = ' scale3d('+ n +', '+ n +', 1)';
            s = ' scale('+ n*$scope.preferences.tweeks.tanuki.plark +')';
            f = '-' + n + 'vmax';
            m = '';
          }

          // hackery
          if($scope.preferences.mode === 'florix' && i === $scope.alternates.length) {
            d = 360; //$scope.deg;
            m = '0 -'+$scope.size+'em 0 0';
            z = $scope.alternates.length;
          }

          // r = 'rotate3d(0,0,1,'+d+'deg)';
          r = 'rotate('+d+'deg)';

          return {
            transform: r + s,
            fontSize: f,
            margin: m,
            transitionDelay: t+'s',
            zIndex: z
          };
        };

        $scope.setRotationClasses = function(index){
          var test = Math.abs($scope.ringDeg - $scope.deg*(index+1));
          return test > 90 && test < 270 ? 'flip-my-hex' : '';
        };

        var _updateColorByDeg = function(l, d, n){
          var m = n/2;
          var i = l - Math.floor(Math.abs(d - m)/n);
          window.console.log(d, i);
          var k = l - i;
          k = (k < 0 ? 0 : (k > l ? l : k));
          c = $scope.alternates[k];
          $scope.tuner = {
            r: colors.red(c),
            g: colors.green(c),
            b: colors.blue(c),
            hex: c,
            brightness: colors.brightness(c)
          };
          $scope.color = c;
          return k;
        };

        var dial = $angular.element(window.document.querySelector('.canvas'));
        var ring = $angular.element(window.document.querySelector('.color-ring'));

        var input, l, n, k, c;
        var d, deg = 0, lastDeg = 0, pointerDeg, relativeDeg, rotationDeg;
        var hammerDial = new Hammer(dial[0], {});
        hammerDial.get('pan').set({
          direction: Hammer.DIRECTION_ALL,
          threshold: 0
        });
        hammerDial
        .on('panstart', function(e) {
          l = $scope.alternates.length-1;
          n = 360/l;
          input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers;
          deg = -ui.getDegrees(input[0], dial[0]);
          lastDeg = $scope.ringDeg;
        })
        .on('pan panmove', function(e) { // _.throttle(, 30)
          input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers;
          pointerDeg = -ui.getDegrees(input[0], dial[0]);
          relativeDeg = pointerDeg - deg;
          rotationDeg = lastDeg + relativeDeg;
          if(isNaN(rotationDeg)) {rotationDeg = lastDeg;}
          if(rotationDeg < 0) {rotationDeg = ui.maxDegrees;}
          if(rotationDeg > ui.maxDegrees) {rotationDeg = 0;}
          deg = pointerDeg;
          ring.css({
            transform: 'rotate(-'+ rotationDeg +'deg) translateZ(0)',
            transitionDuration: '0s'
          });
          k = _updateColorByDeg(l, rotationDeg, n);
          lastDeg = rotationDeg;
          $scope.$apply();
        })
        .on('panend pancancel', function() {
          d = n*(k+1);
          window.console.log('>> d', n, k, d);
          $scope.ringDeg = d; //lastDeg;
          ring.css({
            transitionDuration: ''
          });
          $scope.$apply();
        });

        $scope.saveColor = function(color){
          var index = _.findIndex($scope.myColors, function(item){
            return item === color;
          });
          if(index > -1) {
            $scope.myColors.splice(index, 1);
          } else {
            $scope.myColors.push(color);
          }
          storage.save('tanuki-colors', $scope.myColors);
        };

        $scope.shareColors = function(){
          var colors = '';
          _.each($scope.myColors, function(color){
            colors += '\n' + color + '\n';
          });
          window.location.href = 'mailto:?subject=Colors&body='+encodeURIComponent(colors);
        };

        $scope.isSaved = function(color){
          return _.find($scope.myColors, function(item){
            return item === color;
          });
        };

        $scope.loadColor = function(color){
          if($scope.preferences.useHash) {
            window.location.hash = color.toLowerCase().replace('#', '#/');
          } else {
            doIt(color);
          }
        };

        $scope.setClasses = function(color, test, affectText){
          if(color) {
            var classes = [];
            if(affectText) {
              var text = colors.brightness(color) < 155 ? 'fg-light' : 'fg-dark';
              classes.push(text);
            }

            if(color === test) {
                classes.push('current');
            }

            return classes.join(' ');
          }
        };

        // var getHashColor = function(color) {
        //     if(color && (color.match('^[0-9A-Fa-f]{3}$') || color.match('^[0-9A-Fa-f]{6}$'))) {
        //         color = '#' + color;
        //     } else {
        //         color = false;
        //     }
        //     doIt(color);
        // };
        //
        // getHashColor();

        $scope.hash = window.location.hash ? window.location.hash.replace('/', '') : '';

        $scope.$watch('hash', function (color) {
          doIt(color);
        });

        $scope.$watch('tuner', function(n, o){
          if(n && n !== o) {
            n.hex = colors.rgbObjToHex(n, true);
            n.brightness = colors.brightness(n.hex);
            return n.hex;
          }
        }, true);

        $scope.$watch('colorSteps', function (n, o) {
          if(n && n !== o) {
            doIt($scope.color);
          }
        });

        $scope.$watch('preferences', function (n, o) {
          if(n && o && n !== o) {
            $scope.savePrefs = n;
            if((n.mode !== o.mode) || (n.allowBW !== o.allowBW)) {
              doIt($scope.color);
            }
            if((n.tweeks.florix.shaadik !== o.tweeks.florix.shaadik)) {
              $scope.kulra = _lum(n.tweeks.florix.shaadik, 255);
            }
          }
        }, true);

        $scope.$watch('savePrefs', _.debounce(function (n) {
          if(n) {
            storage.save('tanuki-preferences', n);
          }
        }, 500), true);

        $document.on('keyup', function(e){
          if(e.which === 32){ // spacebar
              doIt();
          }
          if(e.which === 27){ // esc
            $scope.showMenu = false;
            $scope.showSliders = false;
            $scope.preferences.showFavs = false;
            $scope.preferences.showHistory = false;
            $scope.$apply();
          }
        });
    }]);

})(window.angular, window._, window.Hammer);
