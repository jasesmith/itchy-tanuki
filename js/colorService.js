(function($angular) {
  'use strict';

  $angular.module('app').factory('ColorService', [function(){

    var _hexChars = '0123456789ABCDEF';
    /*
     Use a singleton cache of all color strings we see.
     Each key points to a structure, which can have hex, rgb, etc. values in it.
     */
    var _immutableCache = {};

    // returns (or creates) the cached color structure
    var _cache = function(c) {
        if (!_immutableCache[c]) {
            _immutableCache[c] = {};
        }
        return _immutableCache[c];
    };

    var _h2rgb = function(v1, v2, vH) {
      if (vH < 0) {
        vH += 1;
      }
      if (vH > 1) {
        vH -= 1;
      }
      if (( 6 * vH ) < 1) {
        return ( v1 + ( v2 - v1 ) * 6 * vH );
      }
      if (( 2 * vH ) < 1) {
        return ( v2 );
      }
      if (( 3 * vH ) < 2) {
        return ( v1 + ( v2 - v1 ) * ( ( 2 / 3 ) - vH ) * 6 );
      }

      return ( v1 );
    };

    var rgbObjToHex = function(colorObj, useHash){
      /*jslint bitwise: true */
      var c = colorObj.b | (colorObj.g << 8) | (colorObj.r << 16) | (1 << 24);
      /*jslint bitwise: false */
      return (useHash ? '#':'') + c.toString(16).substring(1,8);
    };

    var toHex = function(color) {
      var colorObj = _cache(color);
      if (colorObj.hex) {
        return colorObj.hex;
      }

      if (color.substr(0, 1) === '#' && color.length === 7) {
        colorObj.hex = '' + color;
      } else if (color.substr(0, 1) === '#' && color.length === 4) {
        colorObj.hex = '#' +
            color.substr(1, 1) + color.substr(1, 1) +
            color.substr(2, 1) + color.substr(2, 1) +
            color.substr(3, 1) + color.substr(3, 1);
      }

      return colorObj.hex;
    };

    var isValidHex = function(color) {
        return (color && color.match(/^#(?:[0-9a-f]{3}){1,2}$/i)) ? true : false;
    };

    var toRGB = function(color) {
      var colorObj = _cache(color);
      if (colorObj.rgb) {
        return colorObj.rgb;
      }
      var h = toHex(color);

      colorObj.rgb = [
        parseInt(h.substr(1, 2), 16),
        parseInt(h.substr(3, 2), 16),
        parseInt(h.substr(5, 2), 16)
      ];

      return colorObj.rgb;
    };

    var red = function(color) {
        return toRGB(color)[0];
    };
    var green = function(color) {
        return toRGB(color)[1];
    };
    var blue = function(color) {
        return toRGB(color)[2];
    };

    var toHSL = function(color) {
      var r = red(color) / 255,
          g = green(color) / 255,
          b = blue(color) / 255;

      var max = Math.max(r, g, b),
          min = Math.min(r, g, b);

      var d = max - min; // Delta RGB value

      var h,
          s,
          l = (max + min) / 2;

      if (d === 0) {
        // gray?, no chroma...
        h = 0;
        s = 0;
      } else {
        // Chromatic data...
        s = d / ( l < 0.5 ? ( max + min ) : ( 2 - max - min ));

        var delR = ( ( ( max - r ) / 6 ) + ( d / 2 ) ) / d;
        var delG = ( ( ( max - g ) / 6 ) + ( d / 2 ) ) / d;
        var delB = ( ( ( max - b ) / 6 ) + ( d / 2 ) ) / d;

        if (r === max) {
            h = delB - delG;
        } else if (g === max) {
            h = ( 1 / 3 ) + delR - delB;
        } else if (b === max) {
            h = ( 2 / 3 ) + delG - delR;
        }

        if (h < 0) {
            h += 1;
        }
        if (h > 0) {
            h -= 1;
        }
      }

      h = Math.round(h * 360);
      if (h < 0) {
        h += 360;
      }

      var colorObj = _cache(color);

      colorObj.hsl = [h, Math.round(s * 100), Math.round(l * 100)];

      return colorObj.hsl;
    };

    var hslToRGB = function(h, s, l) {
      // HSL 0 to 1; RGB results from 0 to 255
      var r,g,b;

      if (s === 0) {
        r = l * 255;
        g = l * 255;
        b = l * 255;
      } else {
        var v2 = (l < 0.5) ? l * ( 1 + s ) : (( l + s ) - ( s * l ));
        var v1 = 2 * l - v2;

        r = 255 * _h2rgb(v1, v2, h + ( 1 / 3 ));
        g = 255 * _h2rgb(v1, v2, h);
        b = 255 * _h2rgb(v1, v2, h - ( 1 / 3 ));
      }
      return [r,g,b];
    };

    var _hex2 = function(n) {
      var h = Math.round(n).toString(16);
      if (h.length === 1) {
        h = '0' + h;
      }
      return h.substr(0, 1) + h.substr(1, 1);
    };

    var hslToHex = function(h, s, l) {
      if (Array.isArray(h)) {
        h = h[0] || 0;
        l = h[2] || 0;
        s = h[1] || 0;
      }

      // HSL from 0 to 1
      h = ((h + 360) % 360.0) / 360;
      s = s / 100.0;
      l = l / 100.0;

      var rgb = hslToRGB(h, s, l);
      return '#' + _hex2(rgb[0]) + _hex2(rgb[1]) + _hex2(rgb[2]);
    };

    var lighten = function(color, percent) {
      var hsl = toHSL(color);
      var h = hsl[0],
          s = hsl[1],
          l = Math.min(100, hsl[2] + percent);

      return hslToHex(h, s, l);
    };

    var darken = function(color, percent) {
      var hsl = toHSL(color);
      var h = hsl[0],
          s = hsl[1],
          l = Math.max(0, hsl[2] - percent);

      return hslToHex(h, s, l);
    };

    var saturate = function(color, percent) {
      var hsl = toHSL(color);
      var h = hsl[0],
          s = Math.min(100, Math.max(0, hsl[1] + percent)),
          l = hsl[2];

      return hslToHex(h, s, l);
    };

    var brightness = function(color){
      var r, g, b, brightness;

      if (color.match(/^rgb/)) {
        color = color.match(/rgb\(([^)]+)\)/)[1];
        color = color.split(/ *, */).map(Number);
        r = color[0];
        g = color[1];
        b = color[2];
      } else if ('#' === color[0] && 7 === color.length) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
      } else if ('#' === color[0] && 4 === color.length) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      }

      brightness = (r * 299 + g * 587 + b * 114) / 1000;

      return brightness;
    };

    var randomHex = function() {
      var hex = '#';
      for (var i = 0; i < 6; i++ ) {
        hex += _hexChars.charAt(Math.floor(Math.random() * _hexChars.length));
      }
      return hex;
    };

    return {
      rgbObjToHex: rgbObjToHex,
      toHex: toHex,
      isValidHex: isValidHex,
      toRGB: toRGB,
      toHSL: toHSL,
      hslToHex: hslToHex,
      hslToRGB: hslToRGB,
      red: red,
      green: green,
      blue: blue,
      lighten: lighten,
      darken: darken,
      saturate: saturate,
      brightness: brightness,
      randomHex: randomHex
    };

  }]);

})(window.angular);
