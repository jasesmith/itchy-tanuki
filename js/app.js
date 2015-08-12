(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu']).controller('AppController', ['$scope', '$location', 'UtilityService', function($scope, $location, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

        $scope.colorHistory = [];
        $scope.myColors = [];

        $scope.useHash = false;
        $scope.showHistory = false;

        var _notInRunLoop = function _notInRunLoop() {
            return !$scope.$root.$$phase;
        };

        var addToColorHistory = function(color){
            var c = _.find($scope.colorHistory, function(item){
                return item === color;
            });

            if(c !== color) {
                $scope.colorHistory.push(color);
            }
        };

        var doIt = function(color){
            color = color ? color.toLowerCase() : utils.randomHexColor().toLowerCase();

            addToColorHistory(color);

            $scope.darker = _.unique([
                color.darken(10),
                color.darken(20),
                color.darken(30),
                color.darken(40),
                color.darken(50)
            ]);
            $scope.lighter = _.unique([
                color.lighten(50),
                color.lighten(40),
                color.lighten(30),
                color.lighten(20),
                color.lighten(10)
            ]);

            $scope.color = color;
            $scope.brightness = utils.colorBrightness(color);

            if($scope.useHash) {
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

        $scope.doIt = function(){
            doIt();
        };

        $scope.saveColor = function(color){
            var c = _.find($scope.myColors, function(item){
                return item === color;
            });

            if(!c) {
                $scope.myColors.push(color);
            }
        };

        $scope.loadColor = function(color){
            if($scope.useHash) {
                window.location.hash = color.toLowerCase().replace('#', '#/');
            } else {
                doIt(color);
            }
        };

        $scope.setClasses = function(color, test){
            if(color) {
                var brightness = utils.colorBrightness(color);
                var classes = [];

                var text = brightness < 128 ? 'fg-light' : 'fg-dark';
                classes.push(text);

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

        $(document).on('keyup', function(e){
            if(e.keyCode == 32){
                doIt();
            }
        });

        // $('.canvas .fa').click(function(e) {
        //     doIt();
        // });

    }]);

})(window.angular, window._);
