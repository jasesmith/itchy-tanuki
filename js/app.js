(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu','ui.sortable']).controller('AppController', ['$scope', '$location', 'StorageService', 'UtilityService', function($scope, $location, storage, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

        $scope.colorHistory = storage.get('tanuki-history') || [];
        $scope.myColors = storage.get('tanuki-colors') || [];
        $scope.preferences = storage.get('tanuki-preferences') || {useHash: false, showHistory: false, alwaysShowHex: false};

        $scope.useHash = $scope.preferences.useHash;
        $scope.showHistory = $scope.preferences.showHistory;
        $scope.showMenu = false;

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

        // var _rotate = function(el, degrees){
        //   $angular.element(el).css({
        //     transform: 'rotate(' + degrees + 'deg)'
        //   });
        // };
        //
        // var ring = $angular.element(window.document.querySelector('.color-ring'));
        //
        // window.console.log(ring);
        //
        // var uiSetRing = function(e){
        //   var input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers[0].target;
        //   var degrees = utils.getMetrics(input, ring[0]).angleDegrees;
        //   window.console.log(e, degrees);
        //   _rotate(ring[0], degrees);
        //   $scope.$apply();
        // };
        //
        // // hammer time
        // $scope.touching = false;
        // var hammerRing = new Hammer(ring[0]);
        // var hammerOptions = {
        //   direction: Hammer.DIRECTION_ALL,
        //   threshold: 0
        // };
        //
        // hammerRing.get('pan').set(hammerOptions);
        // hammerRing.on('pan panend pancancel', function(e) {
        //   var touching = e.type === 'panend' || e.type === 'pancancel' ? false : true;
        //   $scope.touching = e.srcEvent && e.srcEvent.changedTouches ? touching : false;
        //   uiSetRing(e, 'm');
        // });

        var doIt = function(color){
            color = color ? color.toLowerCase() : utils.randomHexColor().toLowerCase();

            addToColorHistory($scope.colorHistory, color);

            $scope.darker = _.unique([
                color.darken(5),
                color.darken(10),
                color.darken(15),
                color.darken(20),
                color.darken(25),
                color.darken(30),
                color.darken(35),
                color.darken(40),
                color.darken(45),
                color.darken(50)
            ]);
            $scope.lighter = _.unique([
                color.lighten(50),
                color.lighten(45),
                color.lighten(40),
                color.lighten(35),
                color.lighten(30),
                color.lighten(25),
                color.lighten(20),
                color.lighten(15),
                color.lighten(10),
                color.lighten(5)
            ]);

            $scope.lightest = _.first($scope.lighter);
            $scope.darkest = _.last($scope.darker);

            $scope.lighter.push(color);

            $scope.alternates = _.unique($scope.lighter.concat($scope.darker));
            // inject a duplicate last item for hackery
            $scope.alternates.push($scope.darkest);

            $scope.deg = (360/($scope.alternates.length-1));
            $scope.size = Math.floor((100/($scope.alternates.length-1) + Math.PI)/2);

            $scope.color = color;
            $scope.brightness = utils.colorBrightness(color);
            $scope.controlBg = _.first($scope.darker);
            $scope.controlFg = _.last($scope.lighter);

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

        $scope.setRingRotation = function(){
          var index = _.findIndex($scope.alternates, function(item){
              return item === $scope.color;
          });
          var deg = $scope.deg*(index+1);
          var d = ($scope.alternates.length*0.08) + 's';
          return {
            transform: 'rotate(-'+deg+'deg)',
            transitionDuration: d,
          };
        };

        $scope.setRotation = function(index){
          var deg = $scope.deg*(index+1);
          var mar = '0 -'+$scope.size+'em';
          var z = $scope.alternates.length - index;
          var d = (index*0.08) + 's';

          // hackery
          if(index + 1 === $scope.alternates.length) {
            deg = 360; //$scope.deg;
            mar = '0 -'+$scope.size+'em 0 0';
            z = $scope.alternates.length;
          }

          return {
            transform: 'rotate('+deg+'deg)',
            margin: mar,
            transitionDelay: d,
            zIndex: z
          };
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

        $scope.$watch('useHash', function (value) {
            $scope.preferences.useHash = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('showHistory', function (value) {
            $scope.preferences.showHistory = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $(window.document).on('keyup', function(e){
            if(e.keyCode === 32){ // spacebar
                doIt();
            }
        });
    }]);

})(window.angular, window._);
