'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _inject = require('styled-jsx/inject');

var _inject2 = _interopRequireDefault(_inject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  return React.createElement(
    'div',
    {
      'data-jsx': '4271158759'
    },
    React.createElement(
      'p',
      {
        'data-jsx': '4271158759'
      },
      'test'
    ),
    React.createElement(
      'p',
      {
        'data-jsx': '4271158759'
      },
      'woot'
    ),
    React.createElement(
      'p',
      {
        'data-jsx': '4271158759'
      },
      'woot'
    ),
    (0, _inject2.default)('4271158759', 'p[data-jsx="4271158759"]{color: red }')
  );
};
