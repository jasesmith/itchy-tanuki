(function($angular) {
  'use strict';

  $angular.module('app').factory('UiHelpers', ['ColorService', function(colors){
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

    var _getColorByDeg = function(shades, l, d, n){
      var m = n/2;
      var i = l - Math.floor(Math.abs(d - m)/n);
      var k = l - i;
      var c;
      k = (k < 0 ? 0 : (k > l ? l : k));
      c = shades[k];
      // $scope.color = c;
      return {
        color: c,
        key: k,
        tuner: {
          r: colors.red(c),
          g: colors.green(c),
          b: colors.blue(c),
          hex: c,
          brightness: colors.brightness(c)
        }
      };
    };

    var setColor = function(color, compareColor, useHash, forceRemoveHash){
      if(forceRemoveHash) {
        window.history.replaceState({}, '', '/'); //window.location.pathname);
      } else {
        if(useHash) {
          window.location.hash = color;
        }
      }
      if(color && color !== compareColor) {
        return color;
      }
    };

    return {
      maxRadians: maxRadians,
      maxDegrees: maxDegrees,
      getNumbers: _getNumbers,
      getRadians: _getRadians,
      getDegrees: _getDegrees,
      getColorByDegree: _getColorByDeg,
      setColor: setColor
    };
  }]);

})(window.angular);
