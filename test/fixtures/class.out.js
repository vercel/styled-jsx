"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _inject = require("styled-jsx/inject");

var _inject2 = _interopRequireDefault(_inject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _class = function () {
  function _class() {
    (0, _classCallCheck3.default)(this, _class);
  }

  (0, _createClass3.default)(_class, [{
    key: "render",
    value: function render() {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "p",
          {
            "data-jsx": "1544381438"
          },
          "test"
        ),
        (0, _inject2.default)("1544381438", "p[data-jsx=\"1544381438\"]{color: red;}")
      );
    }
  }]);
  return _class;
}();

exports.default = _class;
