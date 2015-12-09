(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu','ui.sortable']).controller('AppController', ['$scope', '$location', 'StorageService', 'UtilityService', function($scope, $location, storage, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

        $scope.colorHistory = storage.get('tanuki-history') || [];
        $scope.myColors = storage.get('tanuki-colors') || [];
        $scope.preferences = storage.get('tanuki-preferences') || {useHash: false, showHistory: false, alwaysShowHex: false, tanukiMode: false};

        $scope.useHash = $scope.preferences.useHash;
        $scope.showHistory = $scope.preferences.showHistory;
        $scope.showMenu = false;
        $scope.showSliders = false;
        $scope.tanukiMode = $scope.preferences.tanukiMode;

        $scope.colorSteps = $scope.tanukiMode ? 3 : 5;

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

        var doIt = function(color){
            color = color ? color.toLowerCase() : utils.randomHexColor().toLowerCase();

            addToColorHistory($scope.colorHistory, color);

            var cb = utils.colorBrightness(color);
            var darker = [];
            _.times(50, function(n){
              if(n % $scope.colorSteps === 0) {
                var dn = color.darken(n);
                if(cb < $scope.colorSteps) {
                  darker.push(dn);
                } else {
                  if(cb - utils.colorBrightness(dn) > $scope.colorSteps) {
                    darker.push(dn);
                  }
                }
              }
            });

            var lighter = [];
            _.times(50, function(n){
              if(n % $scope.colorSteps === 0) {
                var c = 50 - n;
                lighter.push(color.lighten(c));
              }
            });

            $scope.darker = _.unique(darker);
            $scope.lighter = _.unique(lighter);

            // edges
            $scope.lightest = _.first($scope.lighter);
            $scope.darkest = _.last($scope.darker);

            $scope.alternates = _.unique($scope.lighter.concat([color]).concat($scope.darker));

            window.console.log($scope.alternates);

            // inject a duplicate last item for overlap hackery
            if(!$scope.tanukiMode) {
              $scope.alternates.push($scope.darkest);
            }

            $scope.deg = (360/($scope.alternates.length-1));
            $scope.size = Math.floor((100/($scope.alternates.length-1) + Math.PI)/2);

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

        var _rgbObjToHex = function(color, useHash){
          /*jslint bitwise: true */
          var c = color.b | (color.g << 8) | (color.r << 16) | (1 << 24);
          /*jslint bitwise: false */
          return (useHash ? '#':'') + c.toString(16).substring(1,8);
        };

        $scope.setNewColor = function(color){
          $scope.tuner.hex = _rgbObjToHex(color, true);
          $scope.tuner.brightness = utils.colorBrightness($scope.tuner.hex);
          doIt($scope.tuner.hex);
        };

        $scope.$watch('tuner', function(n, o){
          if(n && n !== o) {
            n.hex = _rgbObjToHex(n, true);
            n.brightness = utils.colorBrightness(n.hex);
            return n.hex;
          }
        }, true);

        _.mixin({clamp2: function(n, min, max) {
          return Math.min(Math.max(n, min), max);
        }});

        $scope.setRingRotation = function(){
          var d = (($scope.alternates.length-2)*0.08) + 's';
          return {
            transform: 'rotate3d(0,0,1,-'+$scope.ringDeg+'deg)',
            transitionDuration: d,
          };
        };

        $scope.setRotation = function(index){
          var i = index+1;
          var deg = $scope.deg*(i);
          var mar = '0 -'+$scope.size+'em';
          var z = $scope.tanukiMode?i:$scope.alternates.length - i;
          var d = (i*0.08) + 's';
          var s = '';

          if($scope.tanukiMode) {
            var n = -(Math.E * (Math.ceil(i/2) * 0.01) - Math.ceil(i/2));
            s = ' scale3d('+ n +', '+ n +', 1)';
          }

          // hackery
          if(!$scope.tanukiMode && i === $scope.alternates.length) {
            deg = 360; //$scope.deg;
            mar = '0 -'+$scope.size+'em 0 0';
            z = $scope.alternates.length;
          }

          return {
            transform: 'rotate3d(0,0,1,'+deg+'deg)' + s,
            margin: mar,
            transitionDelay: d,
            zIndex: z
          };
        };

        $scope.setRotationClasses = function(index){
          var test = Math.abs($scope.ringDeg - $scope.deg*(index+1));
          return test > 90 && test < 270 ? 'flip-my-hex':'';
        };

        $scope.doIt = function(){
            doIt();
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
          window.location.href = 'mailto:?subject=Colors&body=' + encodeURIComponent(colors);
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

        $scope.$watch('colorSteps', function (n, o) {
            if(n && n !== o) {
              doIt($scope.color);
            }
        }, true);

        $scope.$watch('useHash', function (value) {
            $scope.preferences.useHash = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('showHistory', function (value) {
            $scope.preferences.showHistory = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('alwaysShowHex', function (value) {
            $scope.preferences.alwaysShowHex = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('moreSteps', function (value) {
            $scope.preferences.moreSteps = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('tanukiMode', function (value) {
            $scope.preferences.tanukiMode = value;
            storage.save('tanuki-preferences', $scope.preferences);
            $scope.colorSteps = value ? 3 : 5;
        });

        $(window.document).on('keyup', function(e){
            if(e.keyCode === 32){ // spacebar
                doIt();
            }
        });
    }]);

})(window.angular, window._);
