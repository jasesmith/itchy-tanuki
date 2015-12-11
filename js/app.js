(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu','ui.sortable']).controller('AppController', ['$scope', '$location', 'StorageService', 'UtilityService', function($scope, $location, storage, utils) {

        _.mixin({clamp2: function(n, min, max) {
          return Math.min(Math.max(n, min), max);
        }});

        var _defaultPrefs = {
          useHash: false,
          allowBW: false,
          showHistory: false,
          alwaysShowHex: false,
          tanukiMode: false,
          hexMode: 3, // 3|6
          tweeks: {
            klumpf: 2,
            ichtzy: 5,
            flarp: 100,
            plark: 1,
            marklar: 0.01,
            quarble: 0.08,
            cappa: true
          }
        };

        $scope.colorHistory = storage.get('tanuki-history') || [];
        $scope.myColors = storage.get('tanuki-colors') || [];

        $scope.preferences = storage.get('tanuki-preferences') || _defaultPrefs;

        $scope.showMenu = false;
        $scope.showSliders = false;

        $scope.colorSteps = 5;

        $scope.sortableOptions = {
            placeholder: 'color-brick parking-spot',
            tolerance: 'pointer',
            stop: function() {
                var list = _.clone($scope.myColors);
                 var newList = _.map(list, function(i){
                    return i;
                });
                $scope.$apply();
                $scope.myColors =  _.compact(newList);
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

            $scope.colorHistory = _.last(history, 25);
            storage.save('tanuki-history', $scope.colorHistory);
        };

        var _rgbObjToHex = function(color, useHash){
          /*jslint bitwise: true */
          var c = color.b | (color.g << 8) | (color.r << 16) | (1 << 24);
          /*jslint bitwise: false */
          return (useHash ? '#':'') + c.toString(16).substring(1,8);
        };

        $scope.clearColorHistory = function(){
            $scope.colorHistory = [];
            // $scope.colorHistory.push($scope.color);
            storage.save('tanuki-history', $scope.colorHistory);
        };

        $scope.clearSavedColors = function(){
            $scope.myColors = [];
            // $scope.colorHistory.push($scope.color);
            storage.save('tanuki-colors', $scope.myColors);
        };

        $scope.resetTweeks = function(){
          $scope.preferences.tweeks = $angular.copy(_defaultPrefs.tweeks);
        };

        var doIt = function(color){
            if(_.isUndefined(color) || color === '#') {
              color = utils.randomHexColor();
            }
            color = color.toHexColor().toLowerCase();

            addToColorHistory($scope.colorHistory, color);

            var cb = utils.colorBrightness(color);
            var darker = [];
            _.times(50, function(n){
              if(n % $scope.colorSteps === 0) {
                var dn = color.darken(n);
                if(dn !== '#000000' || $scope.preferences.allowBW) {
                  if(cb < $scope.colorSteps) {
                    darker.push(dn);
                  } else {
                    if(cb - utils.colorBrightness(dn) > $scope.colorSteps) {
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
                var ln = color.lighten(c);
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

            $scope.alternates = _.unique($scope.lighter.concat([color]).concat($scope.darker));

            // inject a duplicate last item for overlap hackery in tanuki mode: flower
            if(!$scope.preferences.tanukiMode) {
              $scope.alternates.push($scope.darkest);
            }

            $scope.deg = (360/($scope.alternates.length-1));
            $scope.size = Math.floor((100/($scope.alternates.length-2) + Math.PI)/2);

            $scope.color = color;
            $scope.tuner = {
              r: color.red(),
              g: color.green(),
              b: color.blue(),
              hex: color,
              brightness: cb
            };
            $scope.brightness = cb;
            $scope.controlBg = _.first($scope.darker);
            $scope.controlFg = _.last($scope.lighter);

            $scope.accent = $scope.alternates[$scope.alternates.length-4];

            var rotateFactor = _.findIndex($scope.alternates, function(item){
                return item === $scope.color;
            });

            $scope.ringDeg = $scope.deg*(rotateFactor+1);

            if($scope.preferences.useHash) {
                window.location.hash = color.replace('#', '#/');
            }

            if (_notInRunLoop()) {
                try {
                    // Sometimes we're outside of the Angular run-loop,
                    // and therefore need to manually invoke the `apply` method!
                    $scope.$apply();
                } catch(e) {}
            }
        };

        $scope.doIt = function(color){
            doIt(color);
        };

        $scope.setNewColor = function(color){
          $scope.tuner.hex = _rgbObjToHex(color, true);
          $scope.tuner.brightness = utils.colorBrightness($scope.tuner.hex);
          doIt($scope.tuner.hex);
        };

        $scope.setRingRotation = function(){
          var d = (($scope.alternates.length) * ($scope.preferences.tanukiMode ? $scope.preferences.tweeks.quarble : _defaultPrefs.tweeks.quarble));
          return {
            // transform: 'rotate3d(0,0,1,-'+$scope.ringDeg+'deg)',
            transform: 'rotate(-'+$scope.ringDeg+'deg) translateZ(0)',
            transitionDuration: d+'s',
          };
        };

        $scope.setRotation = function(index){
          var i = index+1;
          var d = $scope.deg*(i);
          var m = '0 -'+$scope.size+'em';
          var z = $scope.preferences.tanukiMode ? i : $scope.alternates.length - i;
          var t = $scope.preferences.tanukiMode ? (i * $scope.preferences.tweeks.quarble) : (i * _defaultPrefs.tweeks.quarble);
          var r = '';
          var s = '';
          var f = '';
          var n;

          if($scope.preferences.tanukiMode) {
            if($scope.preferences.tweeks.cappa) {
              n = -(Math.E * (Math.ceil(i/$scope.preferences.tweeks.klumpf) * $scope.preferences.tweeks.marklar) - Math.ceil(i/$scope.preferences.tweeks.klumpf));
            } else {
              n = -(Math.E * ((i/$scope.preferences.tweeks.klumpf * $scope.preferences.tweeks.marklar) - i/$scope.preferences.tweeks.klumpf));
            }
            // s = ' scale3d('+ n +', '+ n +', 1)';
            s = ' scale('+ n*$scope.preferences.tweeks.plark +')';
            f = '-' + n + 'vmax';
            m = '';
          }

          // hackery
          if(!$scope.preferences.tanukiMode && i === $scope.alternates.length) {
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
                  var text = utils.colorBrightness(color) < 155 ? 'fg-light' : 'fg-dark';
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

        $scope.$watch(function () {
            var hash = window.location.hash;
            return hash ? hash.replace('/', '') : '';
        }, function (color) {
            doIt(color);
        });

        $scope.$watch('tuner', function(n, o){
          if(n && n !== o) {
            n.hex = _rgbObjToHex(n, true);
            n.brightness = utils.colorBrightness(n.hex);
            return n.hex;
          }
        }, true);

        $scope.$watch('colorSteps', function (n, o) {
            if(n && n !== o) {
              doIt($scope.color);
            }
        });

        $scope.$watch('preferences', _.debounce(function (n, o) {
          $scope.$apply(function(){
            window.console.log(n);
            storage.save('tanuki-preferences', n);
            if(n && (n.tanukiMode !== o.tanukiMode) || (n.allowBW !== o.allowBW)) {
              doIt($scope.color);
            }
          });
        }, 500), true);

        $(window.document).on('keyup', function(e){
          window.console.log(e.keyCode);
            if(e.keyCode === 32){ // spacebar
                doIt();
            }
            if(e.keyCode === 27){ // spacebar
              $scope.showMenu = false;
              $scope.showSliders = false;
              $scope.favs = false;
              $scope.$apply();
            }
        });
    }]);

})(window.angular, window._);
