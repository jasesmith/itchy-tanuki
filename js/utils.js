(function($angular, _) {
    'use strict';

    angular.module('app').factory('UtilityService', ['$rootScope', function($rootScope){

        var _keyCharList = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        var randomString = function(len, chars){
            var result = '';
            for (var i = len; i > 0; --i) {
                result += chars[Math.round(Math.random() * (chars.length - 1))];
            }
            return result;
        };

        var createUuid = function(){
            return randomString(12, _keyCharList) + '-' + randomString(12, _keyCharList);
        };

        var randomColor = function(sample){
            sample = sample || $rootScope.colors;
            return _.sample(sample);
        };

        var numbersArray = function(num, math){
            if(!math) {math = 0;}
            return new Array(num + math);
        };

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

        var getMetrics = function(el, parent, rtl, factor) {
            rtl = rtl || false;
            factor = factor || false;

            var en = _getNumbers(el);
            var pn = _getNumbers(parent);

            var p1 = {
                x: en.cx,
                y: en.cy
            };
            var p2 = {
                x: pn.cx,
                y: pn.cy
            };

            // angle in radians
            var angleRadians = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            // angle in degrees
            var angleDegrees = angleRadians * 180 / Math.PI;

            if(rtl) {
                // this because if the line's transform-origin is right instead left
                angleDegrees -= 180;
            }

            // length of line between two points
            // last operation as this alters the number set
            var lineLength = Math.sqrt(((p1.x -= p2.x) * p1.x) + ((p1.y -= p2.y) * p1.y));

            if(factor) {
                lineLength = lineLength*factor;
            }

            return {
                lineLength: lineLength,
                angleRadians: angleRadians,
                angleDegrees: angleDegrees
            };
        };

        var findDeep = function(collection, id, found, action) {
            found = found || {item: undefined, parentIds: []};

            var item;
            item = _.find(collection, function(cell, index) {
                return cell.id === id;
            });
            if (item) {
                found.item = $angular.copy(item);
                found.parentIds = [];
                if(action === 'remove') {
                    var index = collection.indexOf(id);
                    if(index > -1) {
                        collection.splice(index, 1);
                    }
                }
            } else {
                // if no match is found, search one level deeper for each item
                for (var i = 0; i < collection.length; i++) {
                    item = collection[i];
                   if (!_.isEmpty(item.children)) {
                        found = findDeep(item.children, id, found, action);
                        if (found.item !== undefined) {
                            found.parentIds.unshift(item.id);
                            break;
                        }
                    }
                }
            }
            return found;
        };

        return {
            createUuid: createUuid,
            randomString: randomString,
            randomColor: randomColor,
            numbersArray: numbersArray,
            getNumbers: _getNumbers,
            getMetrics: getMetrics,
            findDeep: findDeep
        };

    }]);

})(window.angular, window._);
