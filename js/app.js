(function($angular, _) {
    'use strict';

    angular.module('app', ['jamfu']).controller('AppController', ['$scope', 'UtilityService', function($scope, utils) {

        $scope.headline = 'Itchy Tanuki';
        $scope.icon = 'circle-o';

    }]);

})(window.angular, window._);
