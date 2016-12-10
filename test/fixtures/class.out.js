"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _inject = require("styled-jsx/inject");

var _inject2 = _interopRequireDefault(_inject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  _createClass(_class, [{
    key: "render",
    value: function render() {
      return React.createElement(
        "div",
        null,
        (0, _inject2.default)("1544381438", "p[data-jsx=\"1544381438\"]{color: red;}"),
        React.createElement(
          "p",
          {
            "data-jsx": "1544381438"
          },
          "test"
        )
      );
    }
  }]);

  return _class;
}();

exports.default = _class;
