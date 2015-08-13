(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu','ui.sortable']).controller('AppController', ['$scope', '$location', 'StorageService', 'UtilityService', function($scope, $location, storage, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

        $scope.colorHistory = storage.get('tanuki-history') || [];
        $scope.myColors = storage.get('tanuki-colors') || [];
        $scope.preferences = storage.get('tanuki-preferences') || {useHash: false, showHistory: false};

        $scope.useHash = $scope.preferences.useHash;
        $scope.showHistory = $scope.preferences.showHistory;

        $scope.sortableOptions = {
            placeholder: 'color-brick parking-spot',
            tolerance: 'pointer',
            stop: function() {
                var list = _.map($scope.myColors, function(i){
                    return i;
                });
                $scope.$apply();
                storage.save('tanuki-colors', list);
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

            $scope.colorHistory = _.last(history, 90);
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

            // $scope.myColors = _.last($scope.myColors, 9);

            storage.save('tanuki-colors', $scope.myColors);

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

        $scope.setClasses = function(color, test){
            if(color) {
                var brightness = utils.colorBrightness(color);
                var classes = [];

                var text = brightness < 125 ? 'fg-light' : 'fg-dark';
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

        $scope.$watch('useHash', function (value) {
            $scope.preferences.useHash = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $scope.$watch('showHistory', function (value) {
            $scope.preferences.showHistory = value;
            storage.save('tanuki-preferences', $scope.preferences);
        });

        $(document).on('keyup', function(e){
            if(e.keyCode === 32){
                doIt();
            }
        });

        // $('.canvas .fa').click(function(e) {
        //     doIt();
        // });

    }]);

})(window.angular, window._);
