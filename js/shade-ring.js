(function($angular, Hammer, _) {
  'use strict';

  $angular.module('app')
  .directive('shadeRing', ['UtilityService', function(utils) {

    var _shade = function(d) {
      var v = Math.floor(255 * (1 - Math.abs((d / 180))));
      return 'rgb('+v+', '+v+', '+v+')';
    };

    return {
      restrict: 'E',
      replace: true,

      scope: {
        steps: '=?'
      },

      template: '' +
        '<div class="shade-ring">' +
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" version="1.1">' +
            '<defs>' +
              '<clipPath id="clipA"><rect x="0" y="0" width="100" height="50" /></clipPath>' +
              '<clipPath id="clipB"><rect x="0" y="50" width="100" height="50" /></clipPath>' +
              '<mask id="hole"><rect width="100%" height="100%" fill="#fff" /><circle r="35" cx="50" cy="50" /></mask>' +
              '<mask id="light"><g id="a" clip-path="url(#clipA)" mask="url(#hole)"></g></mask>' +
              '<mask id="dark"><g id="b" clip-path="url(#clipB)" mask="url(#hole)"></g></mask>' +
            '</defs>' +
            '<circle cx="50" cy="50" fill="#fff" r="50" mask="url(#light)" />' +
            '<circle cx="50" cy="50" fill="#000" r="50" mask="url(#dark)" />' +
          '</svg>' +
        '</div>' +
      '',

      link: function(scope, element) {
        var a = element[0].querySelector('#a');
        var b = element[0].querySelector('#b');
        var $a = $angular.element(a);
        var $b = $angular.element(b);
        var ring = $angular.element(element[0].querySelector('svg'));

        a.setAttribute('transform', 'rotate(90 50 50)');
        b.setAttribute('transform', 'rotate(90 50 50)');

        console.log(scope.steps);

        var gradiate = function(steps){
          for(var i=0; i<360; i+=steps) {
            var rect = window.document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', 50);
            rect.setAttribute('height', 50);
            rect.setAttribute('transform', 'rotate(' + i + ' 50 50)');

            if(i < 180) {
              rect.setAttribute('fill', _shade(i));
              $a.append(rect);
            } else {
              rect.setAttribute('fill', _shade((360 - i)));
              $b.append(rect);
            }
          }
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

        var _getDeg = function(input, b){
          var barrel = _getNumbers(b);
          var radians = Math.atan2((input.clientY - barrel.cy), (input.clientX - barrel.cx));
          var degrees = Math.round(radians * 180 / Math.PI);
          return degrees;
        };

        var _rotate = function(el, degrees){
          $angular.element(el).css({
            transform: 'rotate(' + degrees + 'deg)'
          });
        };

        var uiSetRing = function(e){
          var input = e.srcEvent && e.srcEvent.changedTouches ? e.srcEvent.changedTouches : e.pointers;
          var degrees = _getDeg(input[0], ring[0]);
          window.console.log(degrees);
          _rotate(ring[0], degrees);
          scope.$apply();
        };

        // hammer time
        scope.touching = false;
        var hammerRing = new Hammer(ring[0]);
        var hammerOptions = {
          direction: Hammer.DIRECTION_ALL,
          threshold: 0
        };

        hammerRing.get('pan').set(hammerOptions);
        hammerRing.on('pan panend pancancel', function(e) {
          var touching = e.type === 'panend' || e.type === 'pancancel' ? false : true;
          scope.touching = e.srcEvent && e.srcEvent.changedTouches ? touching : false;
          uiSetRing(e, 'm');
        });

        gradiate(scope.steps);

      }

    };
  }]);

})(window.angular, window.Hammer, window._);
