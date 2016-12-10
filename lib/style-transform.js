// based on Stylis (MIT) 
// modified by Guillermo Rauch to add support for custom
// attributes instead of custom selector prefix
/*!
 *
 *          __        ___     
 *    _____/ /___  __/ (_)____
 *   / ___/ __/ / / / / / ___/
 *  (__  ) /_/ /_/ / / (__  ) 
 * /____/\__/\__, /_/_/____/  
 *          /____/            
 * 
 * stylis is a small css compiler
 * 
 * @licence MIT
 */
(function (factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory(global);
    } else if (typeof define === 'function' && define.amd) {
        define(factory(window));
    } else {
        window.stylis = factory(window);
    }
}(function (window) {
    'use strict';


    // regular expressions
    var regPrefixKey = /@(keyframes +.*?}$)/g;
    var regPrefix    = /((?:transform|appearance):.*?;)/g;
    var regSpaces    = /  +/g;
    var regAnimation = /(,|:) +/g;

    /**
     * css compiler
     *
     * @example compiler('.class1', 'css...', false);
     * 
     * @param  {string}  id to use for data attributes
     * @param  {string}  styles
     * @return {string}
     */
    function stylis (id, styles) {
        var suffix = '[data-jsx="' + id +'"]';
        var output = '';
        var line = '';

        var len = styles.length;
        var i = 0;

        // parse + compile
        while (i < len) {
            var code = styles.charCodeAt(i);

            // {, }, ; characters
            if (code === 123 || code  === 125 || code === 59) {
                line += styles[i];

                var first = line.charCodeAt(0);

                // only trim when the first character is ` `
                if (first === 32) {
                    first = (line = line.trim()).charCodeAt(0);
                }

                // / character, line comment
                if (first === 47) {
                    line = code === 125 ? '}' : '';
                }
                // @ character, special block
                else if (first === 64) {
                    var second = line.charCodeAt(1) || 0;

                    // @keyframe/@root, `k` or @root, `r` character
                    if (second === 107 || second === 114) {
                        i++;

                        if (second == 107) {
                            // @keyframes
                            line = line.substring(1, 11) + id + line.substring(11);
                        } else {
                            // @root
                            line = '';
                        }

                        var close = 0;

                        while (i < len) {
                            var char = styles[i++];
                            var _code = char.charCodeAt(0);

                            // not `\t`, `\r`, `\n` characters
                            if (_code !== 9 && _code !== 13 && _code !== 10) {
                                // } character
                                if (_code === 125) {
                                    // previous block tag is close
                                    if (close === 1) {
                                        break;
                                    }
                                    // current block tag is close tag 
                                    else {
                                        close = 1;
                                    }
                                }
                                // { character 
                                else if (_code === 123) {
                                    // current block tag is open
                                    close = 0;
                                }

                                line += char;
                            }
                        }

                        // vendor prefix transform properties within keyframes and @root blocks
                        line = line.replace(regSpaces, '').replace(regPrefix, '-webkit-$1-moz-$1-ms-$1$1');
                        
                        if (second === 107) {
                            // vendor prefix keyframes blocks
                            line = '@-webkit-'+line+'}'+'@-moz-'+line+'}@'+line+'}';
                        } else {
                            // vendor prefix keyframes in @root block
                            line = line.replace(regPrefixKey, '@-webkit-$1}@-moz-$1}@$1}');
                        }
                    }
                } else {
                    var second = line.charCodeAt(1) || 0;
                    var third = line.charCodeAt(2) || 0;

                    // animation: a, n, i characters
                    if (first === 97 && second === 110 && third === 105) {
                        // remove space after `,` and `:` then split line
                        var split = line.replace(regAnimation, '$1').split(':');

                        // build line
                        line = split[0] + ':' + id + (split[1].split(',')).join(','+id);

                        // vendor prefix
                        line = '-webkit-' + line + '-moz-' + line + line;
                    }
                    // appearance: a, p, p
                    // flex: f, l, e
                    // order: o, r, d
                    else if (
                        (first === 97 && second === 112 && third === 112) ||
                        (first === 102 && second === 108 && third === 101) ||
                        (first === 111 && second === 114 && third === 100)
                    ) {
                        // vendor prefix
                        line = '-webkit-' + line + '-moz-' + line + line;
                    }
                    // transforms & transitions: t, r, a 
                    // hyphens: h, y, p
                    // user-select: u, s, r, s
                    else if (
                        (first === 116 && second === 114 && third === 97) ||
                        (first === 104 && second === 121 && third === 112) ||
                        (first === 117 && second === 115 && third === 101 && line.charCodeAt(5) === 115)
                    ) {
                        // vendor prefix
                        line = '-webkit-' + line + '-moz-' + line + '-ms-' + line + line;
                    }
                    // display: d, i, s
                    else if (first === 100 && second === 105 && third === 115) {
                        if (line.indexOf('flex') > -1) {
                            // vendor prefix
                            line = 'display:-webkit-flex; display:flex;'
                        }
                    }

                    else {
                        // selector declaration
                        if (code === 123) {
                            var split = line.split(',');
                            var _line = '';

                            // iterate through characters and prefix multiple selectors with namesapces
                            // i.e h1, h2, h3 --> [namespace] h1, [namespace] h1, ....
                            for (var j = 0, length = split.length; j < length; j++) {
                                var selector = split[j];
                                var _last = selector[selector.length - 1]
                                var affix = '';

                                if (_last === '{') {
                                  _line += selector
                                    .substring(0, selector.length - 1)
                                    .trim() + suffix + _last;
                                } else {
                                  _line += selector.trim() + suffix + ',';
                                }
                            }

                            line = _line;
                        }
                    }
                }

                output += line;
                line = '';
            } 
            // not `\t`, `\r`, `\n` characters
            else if (code !== 9 && code !== 13 && code !== 10) {
                line += styles[i];
            }

            // next character
            i++; 
        }

        return output;
    }

    return stylis;
}));
