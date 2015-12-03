// ref: https://github.com/ndp/csster
(function() {
    'use strict';

    var HTML4_COLORS = {
        'black'  : '#000000',
        'silver' : '#c0c0c0',
        'gray'   : '#808080',
        'white'  : '#ffffff',
        'maroon' : '#800000',
        'red'    : '#ff0000',
        'purple' : '#800080',
        'fuchsia': '#ff00ff',
        'green'  : '#008000',
        'lime'   : '#00ff00',
        'olive'  : '#808000',
        'yellow' : '#ffff00',
        'navy'   : '#000080',
        'blue'   : '#0000ff',
        'teal'   : '#008080',
        'aqua'   : '#00ffff'
    };

    /*
     Use a singleton cache of all color strings we see.
     Each key points to a structure, which can have hex, rgb, etc. values in it.
     */
    var immutableCache = {};

    // returns (or creates) the cached color structure
    var colorCache = function(c) {
        if (!immutableCache[c]) {
            immutableCache[c] = {};
        }
        return immutableCache[c];
    };

    String.prototype.toHexColor = function() {
        if (this.substr(0, 1) === '#' && this.length === 7) {
            colorCache(this).hex = '' + this;
        } else if (this.substr(0, 1) === '#' && this.length === 4) {
            colorCache(this).hex = '#' +
                this.substr(1, 1) + this.substr(1, 1) +
                this.substr(2, 1) + this.substr(2, 1) +
                this.substr(3, 1) + this.substr(3, 1);
        } else {
            colorCache(this).hex = HTML4_COLORS[this];
        }
        return colorCache(this).hex;
    };

    String.prototype.toRGB = function() {
        var cache = colorCache(this);
        if (cache.rgb) {
            return cache.rgb;
        }
        var h = this.toHexColor();

        cache.rgb = [
            parseInt(h.substr(1, 2), 16),
            parseInt(h.substr(3, 2), 16),
            parseInt(h.substr(5, 2), 16)
        ];

        return cache.rgb;
    };

    String.prototype.red = function() {
        return this.toRGB()[0];
    };
    String.prototype.green = function() {
        return this.toRGB()[1];
    };
    String.prototype.blue = function() {
        return this.toRGB()[2];
    };
    String.prototype.lighten = function(percent) {
        var hsl = this.toHSL();
        var h = hsl[0],
            s = hsl[1],
            l = Math.min(100, hsl[2] + percent);

        return this.hslToHexColor(h, s, l);
    };

    String.prototype.darken = function(percent) {
        var hsl = this.toHSL();
        var h = hsl[0],
            s = hsl[1],
            l = Math.max(0, hsl[2] - percent);

        return this.hslToHexColor(h, s, l);
    };


    /**
     * Increase or decrease the saturation of a color.
     * @param percent positive values increase saturation, negative values desaturate.
     */
    String.prototype.saturate = function(percent) {
        var hsl = this.toHSL();
        var h = hsl[0],
            s = Math.min(100, Math.max(0, hsl[1] + percent)),
            l = hsl[2];

        return this.hslToHexColor(h, s, l);
    };

    // [0...360, 0...100, 0...100]
    // Ref. http://www.easyrgb.com/index.php?X=MATH&H=18#text18
    String.prototype.toHSL = function() {
        // var rgb = this.toRGB();
        var r = this.red() / 255,
            g = this.green() / 255,
            b = this.blue() / 255;
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

        var cache = colorCache(this);
        cache.hsl = [h, Math.round(s * 100), Math.round(l * 100)];
        return cache.hsl;
    };

    String.prototype.hslToHexColor = function(h, s, l) {

        var h2rgb = function(v1, v2, vH) {
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

        var hsl2rgb = function(h, s, l) {
            // HSL 0 to 1; RGB results from 0 to 255
            var r,g,b;

            if (s === 0) {
                r = l * 255;
                g = l * 255;
                b = l * 255;
            } else {
                var v2 = (l < 0.5) ? l * ( 1 + s ) : (( l + s ) - ( s * l ));
                var v1 = 2 * l - v2;

                r = 255 * h2rgb(v1, v2, h + ( 1 / 3 ));
                g = 255 * h2rgb(v1, v2, h);
                b = 255 * h2rgb(v1, v2, h - ( 1 / 3 ));
            }
            return [r,g,b];
        };

        var hex2 = function(n) {
            var h = Math.round(n).toString(16);
            if (h.length === 1) {
                h = '0' + h;
            }
            return h.substr(0, 1) + h.substr(1, 1);
        };

        if (Array.isArray(h)) {
            h = h[0] || 0;
            l = h[2] || 0;
            s = h[1] || 0;
        }

        // HSL from 0 to 1
        h = ((h + 360) % 360.0) / 360;
        s = s / 100.0;
        l = l / 100.0;


        var rgb = hsl2rgb(h, s, l);
        return "#" + hex2(rgb[0]) + hex2(rgb[1]) + hex2(rgb[2]);
    };

})();
