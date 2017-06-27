'use strict';

(function() {

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var _rules = function () {
    var required = function required(value) {
      if (Array.isArray(value)) {
        return value.length;
      }
      return value;
    };

    var number = function number(value) {
      return !isNaN(value);
    };

    var phone = function phone(value) {
      var regex = /^1[34578]\d{9}$/;
      return regex.test(value);
    };

    var identity = function identity(value) {
      var regex = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$)/;
      return regex.test(value);
    };

    return {
      required: required,
      number: number,
      phone: phone,
      identity: identity
    };
  }();

  var _errors = {
    required: '请填写该项.',
    number: '请填写数字.',
    phone: '请填写手机号.',
    identity: '请填写身份证号.'
  };

  var ValidateError = function () {
    function ValidateError(msg) {
      _classCallCheck(this, ValidateError);

      this.msg = '[validator-error]: ' + msg;
    }

    _createClass(ValidateError, [{
      key: 'toString',
      value: function toString() {
        return this.msg;
      }
    }]);

    return ValidateError;
  }();

  var Validator = function () {
    function Validator(config) {
      _classCallCheck(this, Validator);

      this.errors = Object.assign({}, _errors, config.errors);
      this.rules = Object.assign({}, _rules, config.rules);
      this.fields = {};
    }

    _createClass(Validator, [{
      key: 'addErrors',
      value: function addErrors(obj) {
        this.errors = Object.assign({}, this.errors, obj);
      }
    }, {
      key: 'addRules',
      value: function addRules(obj) {
        this.rules = Object.assign({}, this.rules, obj);
      }
    }, {
      key: 'validate',
      value: function validate() {
        var _this = this;

        var fields = this.fields;
        var promises = Object.keys(fields).map(function (name) {
          return _this.validateField(name, fields[name].value());
        });

        return Promise.all(promises).then(function (results) {
          var fails = results.filter(function (r) {
            return r.pass !== true;
          });

          return {
            valid: !fails.length,
            fails: fails
          };
        });
      }
    }, {
      key: 'fill',
      value: function fill(name, checks, value, msg) {
        this.fields[name] = {
          msg: msg,
          value: value,
          checks: checks,
          isReq: ~'required'.indexOf(checks)
        };
      }
    }, {
      key: 'validateField',
      value: function validateField(name, value) {
        var _this2 = this;

        var field = this.fields[name];
        var promises = field.checks.split('|').map(function (check) {
          return _this2.test(name, value, check);
        });

        return Promise.all(promises).then(function (results) {
          var fails = results.filter(function (r) {
            return r !== true;
          });

          if (field.msg) {
            if (fails.length) {
              _this2.displayError(field.msg, fails[0].rule);
            } else _this2.hideError(field.msg);
          }

          return {
            pass: !fails.length,
            name: name,
            rules: fails.map(function (f) {
              return f.rule;
            })
          };
        });
      }
    }, {
      key: 'test',
      value: function test(name, value, check) {
        var rule = this.rules[check];
        var result = rule(value);

        if (result) {
          return Promise.resolve(true);
        } else return Promise.resolve({ name: name, rule: check });
      }
    }, {
      key: 'displayError',
      value: function displayError(msg, rule) {
        var error = this.getErrorMessage(rule);
        msg.innerText = error;
        msg.style.display = 'block';
      }
    }, {
      key: 'hideError',
      value: function hideError(msg) {
        msg.style.display = 'none';
      }
    }, {
      key: 'getErrorMessage',
      value: function getErrorMessage(rule) {
        return this.errors[rule] || '请检查内容格式.';
      }
    }]);

    return Validator;
  }();

  var ValidateListener = function () {
    function ValidateListener(el, binding, vnode, config) {
      _classCallCheck(this, ValidateListener);

      this.config = config, this.el = el;
      this.vm = vnode.context;
      this.component = vnode.child;
      this.binding = binding;
      this.name = this.getFieldName();
    }

    _createClass(ValidateListener, [{
      key: 'attach',
      value: function attach() {
        var checks = this.binding.value;
        this.createErrorMsg();
        this.vm.$validator.fill(this.name, checks, this.getFieldValue(), this.msg);
        this.attachFieldListener();
      }
    }, {
      key: 'attachFieldListener',
      value: function attachFieldListener() {
        var _this3 = this;

        var componentListener = _wait(function (value) {
          return _this3.vm.$validator.validateField(_this3.name, value);
        }, this.getFieldDelay());

        var nativeListener = _wait(function () {
          return _this3.vm.$validator.validateField(_this3.name, _this3.el.value);
        }, this.getFieldDelay());

        if (this.component) {
          this.component.$watch('value', componentListener);
        } else {
          switch (this.el.tagName) {
            case 'INPUT':
              this.target.addEventListener('input', nativeListener);
              break;

            case 'SELECT':
              this.target.addEventListener('change', nativeListener);
              break;

            default:
              this.target.addEventListener('input', nativeListener);
          }
        }
      }
    }, {
      key: 'getFieldValue',
      value: function getFieldValue() {
        var _this4 = this;

        if (this.component) {
          return function () {
            return _this4.component.value;
          };
        }

        return function () {
          return _this4.el.value;
        };
      }
    }, {
      key: 'getFieldName',
      value: function getFieldName() {
        var name = this.getDataAttr('name');
        if (!name) {
          throw new ValidateError('value of "data-vd-name" must be given');
        }
        return name;
      }
    }, {
      key: 'getFieldDelay',
      value: function getFieldDelay() {
        return this.getDataAttr('delay') || this.config.delay;
      }
    }, {
      key: 'getDataAttr',
      value: function getDataAttr(prop) {
        return this.el.getAttribute('data-vd-' + prop);
      }
    }, {
      key: 'getDomTarget',
      value: function getDomTarget(el) {
        if (this.component) {
          return el.querySelector('input');
        }

        return el;
      }
    }, {
      key: 'createErrorMsg',
      value: function createErrorMsg() {
        if (this.config.showErrorMsg) {
          var target = this.getDomTarget(this.el);

          if (target && !target.parentNode.classList.contains('vd-error-wrapper')) {
            this.target = target;

            var wrapper = document.createElement('div');
            wrapper.classList.add('vd-error-wrapper');
            target.parentNode.insertBefore(wrapper, target);
            wrapper.appendChild(target);

            var msg = document.createElement('span');
            msg.style.position = 'absolute';
            msg.style.display = 'none';
            msg.classList.add(this.config.customClass);
            this.msg = wrapper.appendChild(msg), msg;
          }
        }
      }
    }]);

    return ValidateListener;
  }();

  var _wait = function _wait(fn) {
    var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var timer = void 0;

    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var later = function later() {
        timer = null;
        fn.apply(undefined, args);
      };
      clearTimeout(timer);
      timer = setTimeout(later, delay);
    };
  };

  var _defaultOptions = {
    showErrorMsg: true
  };

  var _makeMixin = function _makeMixin(config) {
    return {
      beforeCreate: function beforeCreate() {
        this.$validator = new Validator(config);
      }
    };
  };

  var _listenerList = [];

  var _makeDirective = function _makeDirective(config) {
    return {
      inserted: function inserted(el, binding, vnode) {
        var listener = new ValidateListener(el, binding, vnode, config);
        listener.attach();
        _listenerList.push(listener);
      },
      update: function update(el, _ref, _ref2) {
        var modifiers = _ref.modifiers;
        var context = _ref2.context;

        if (modifiers.recreate) {
          var listenerToRecreate = _listenerList.find(function (l) {
            return l.vm === context && l.el === el;
          });
          context.$nextTick(function () {
            listenerToRecreate.attach();
          });
        }
      }
    };
  };

  var install = function install(Vue, options) {
    var config = Object.assign({}, _defaultOptions, options);
    Vue.mixin(_makeMixin(config));
    Vue.directive('validate', _makeDirective(config));
  };

  var index = {
    install: install
  };

  return index;

})();
