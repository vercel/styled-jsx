"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _style = require("styled-jsx/style");

var _style2 = _interopRequireDefault(_style);

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
        {
          "data-jsx": "1544381438"
        },
        React.createElement(
          "p",
          {
            "data-jsx": "1544381438"
          },
          "test"
        ),
        React.createElement(_style2.default, {
          css: "p[data-jsx=\"1544381438\"]{color: red;}",
          "data-jsx": "1544381438"
        })
      );
    }
  }]);
  return _class;
}();

exports.default = _class;
