(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu']).controller('AppController', ['$scope', '$location', 'UtilityService', function($scope, $location, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

        $scope.colorHistory = [];

        $scope._notInRunLoop = function _notInRunLoop() {
            return !$scope.$root.$$phase;
        };

        var doIt = function(color){
            color = color || utils.randomHexColor();

            if ($scope._notInRunLoop()) {
                try {
                    // Sometimes we're outside of the Angular run-loop,
                    // and therefore need to manually invoke the `apply` method!
                    $scope.$apply();
                } catch(e) {}
            }

            $scope.color = color;
            window.location.hash = color.replace('#', '#/');
        };

        $scope.loadColor = function(color){
            window.location.hash = color.replace('#', '#/');
        };

        $scope.setClasses = function(color, test){
            var brightness = utils.colorBrightness(color);
            var classes = [];

            var text = brightness < 145 ? 'fg-light' : 'fg-dark';
            classes.push(text);

            if(color === test) {
                classes.push('current');
            }

            return classes.join(' ');
        };

        var getHashColor = function() {
            var url, hash, color;

            color = window.location.hash.replace('/', '');

            if(color && (color.match('^[0-9A-Fa-f]{3}$') || color.match('^[0-9A-Fa-f]{6}$'))) {
                color = '#' + color;
            } else {
                color = false;
            }
            doIt(color);
        };

        var addToColorHistory = function(color){
            var c = _.find($scope.colorHistory, function(item){
                return item === color;
            });

            if(c !== color) {
                $scope.colorHistory.push(color);
            }
        };

        getHashColor();

        $scope.$watch(function () {
            return window.location.hash.replace('/', '');
        }, function (color) {
            doIt(color);
            addToColorHistory(color);
        });

        $(document).on('keyup', function(e){
            if(e.keyCode == 32){
                doIt();
            }
        });

        $('.canvas .fa').click(function(e) {
            doIt();
        });

    }]);

})(window.angular, window._);
