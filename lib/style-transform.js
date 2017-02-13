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
    var regComments = /\/\*[^]*?\*\//g;

    /**
     * css compiler
     *
     * @example compiler('.class1', 'css...', false);
     *
     * @param  {string}  id to use for data attributes
     * @param  {string}  styles
     * @return {string}
     */
    function stylis (id, styles, generator, start, fileName) {
        var suffix = '[data-jsx="' + id +'"]';
        var animationSuffix = Number(id[0]) == id[0]
          ? `a${id}` /* starting with a digit requires a prefix to generate valid animation names */
          : id

        var output = '';
        var line = '';

        // strip out comments
        styles = styles.replace(regComments, '')

        var len = styles.length;
        var i = 0;
        var lineNumber = start ? start.line : 0;
        var columnNumber = start ? start.column : 0;

        generator && generator.addMapping({
          generated: {
            line: 1,
            column: 0
          },
          source: fileName,
          original: start
        })

        // parse + compile
        while (i < len) {
            var code = styles.charCodeAt(i);

            if (code === 10) {
              lineNumber++;
              columnNumber = 0;
            }

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
                        columnNumber++;

                        if (second == 107) {
                            // @keyframes
                            line = line.substring(1, 11) + animationSuffix + line.substring(11);
                        } else {
                            // @root
                            line = '';
                        }

                        var close = 0;

                        while (i < len) {
                            var char = styles[i++];
                            columnNumber++;
                            var _code = char.charCodeAt(0);
                            if (_code === 10) {
                              lineNumber++;
                              columnNumber = 0;
                            }

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
                      line = line.substring(0, line.length-1);

                      var ninth = line.charCodeAt(9) || 0;
                      var tenth = line.charCodeAt(10) || 0;

                      var colon = line.indexOf(':')+1;
                      var build = line.substring(0, colon);

                      // short hand animation syntax
                      if (ninth !== 45) {
                        var anims = line.substring(colon).trim().split(',');
                          
                        // because we can have multiple animations `animation: slide 4s, slideOut 2s`
                        for (var j = 0, length = anims.length; j < length; j++) {
                          var anim = anims[j];
                          var props = anim.split(' ');

                          // since we can't be sure of the position of the name of the animation name
                          // we have to find it
                          for (var k = 0, l = props.length; k < l; k++) {
                            var prop = props[k].trim();

                            // animation name is anything not in this list
                            if (
                              prop &&
                              prop !== 'infinite' &&
                              prop !== 'linear' &&
                              prop !== 'alternate' &&
                              prop !== 'normal' &&
                              prop !== 'forwards' &&
                              prop !== 'backwards' &&
                              prop !== 'both' &&
                              prop !== 'none' &&
                              prop !== 'ease' &&
                              prop.indexOf('cubic-bezier(') === -1 &&
                              prop.indexOf('ease-') === -1 &&
                              isNaN(parseInt(prop))
                            ) {
                              props[k] = animationSuffix+prop;
                              anim = props.join(' ');
                            }
                          }

                          build += (j === 0 ? '' : ',') + anim.trim();
                        }
                      }
                      // explicit syntax 
                      else {
                        // n
                        build += (tenth !== 110 ? '' : animationSuffix) + line.substring(colon).trim()
                      }

                      build += ';';

                      // vendor prefix
                      line = '-webkit-' + build + '-moz-' + build + build;
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
                      const flexIndex = line.indexOf('flex')
                      if (flexIndex > -1) {
                        const flexValue = line.charAt(flexIndex-1) === '-' ? 'inline-flex' : 'flex'
                        line = 'display:-webkit-'+flexValue+'; display:'+flexValue+';'
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
                                var selector = split[j].trim();
                                var isLast = selector[selector.length - 1] === '{';
                                if (isLast) {
                                  // trim {
                                  selector = selector.substr(0, selector.length - 1);
                                }

                                var piece = ''
                                var inGlobal = false
                                var inSubSelector = false
                                var inQuotes = false
                                var inCombinatorOrPseudo = false
                                var quoteChar = null

                                for (var k = 0; k < selector.length; k++) {
                                  var chr = selector[k]

                                  if (inQuotes) {
                                    if (chr === quoteChar) {
                                      inQuotes = false
                                      quoteChar = null
                                    }
                                    piece += chr
                                    continue
                                  } else {
                                    var prev = selector[k-1]
                                    if ((chr === '"' || chr === "'") && prev !== '\\') {
                                      inQuotes = true
                                      quoteChar = chr
                                      piece += chr
                                      continue
                                    } else {
                                      if (inGlobal) {
                                        if (inSubSelector) {
                                          if (')' === chr) {
                                            inSubSelector = false
                                          }
                                          piece += chr
                                          continue
                                        } else {
                                          if (' ' === chr) {
                                            inGlobal = false
                                            // we omit the suffix
                                            _line += piece + ' '
                                            piece = ''
                                            continue
                                          } else if (')' === chr) {
                                            // ignore this char
                                            continue
                                          } else if ('(' === chr) {
                                            inSubSelector = true
                                          }
                                          piece += chr
                                          continue
                                        }
                                      } else if (inCombinatorOrPseudo) {
                                        if (' ' === chr) {
                                          inCombinatorOrPseudo = false
                                          _line += piece + ' '
                                          piece = ''
                                        } else {
                                          piece += chr
                                        }
                                      } else {
                                        // potential beginning of :global()
                                        if (chr === ':'
                                          && piece === ''
                                          && selector.substr(k, 8) === ':global(' ) {
                                          inGlobal = true
                                          k += 7
                                          continue
                                        }

                                        if (chr === ' ') {
                                          if (piece === '') {
                                            // ignore
                                            continue
                                          } else {
                                            _line += piece + suffix + ' '
                                            piece = ''
                                          }
                                        } else if (chr === ':') {
                                          // pseudo-class or preudo-element
                                          _line += piece + suffix
                                          piece = chr
                                          inCombinatorOrPseudo = true
                                        } else if (chr === '+' || chr === '~' || chr === '>') {
                                          // combinators
                                          piece += chr
                                          inCombinatorOrPseudo = true
                                        } else {
                                          piece += chr
                                        }
                                      }
                                    }
                                  }
                                }

                                // flush remainder
                                if (piece.length) {
                                  _line += piece
                                  if (!inGlobal && !inCombinatorOrPseudo) {
                                    _line += suffix
                                  }
                                }

                                if (isLast) {
                                  _line += '{'
                                } else {
                                  _line += ','
                                }
                            }

                            line = _line;
                        }
                    }
                }

                generator && generator.addMapping({
                    generated: {
                      line: 1,
                      column: output.length
                    },
                    source: fileName,
                    original: {
                        line: lineNumber,
                        column: columnNumber
                    }
                })

                output += line;
                line = '';
            }
            // not `\t`, `\r`, `\n` characters
            else if (code !== 9 && code !== 13 && code !== 10) {
                line += styles[i];
            }

            // next character
            i++;
            columnNumber++;
        }

        return output;
    }

    return stylis;
}));
