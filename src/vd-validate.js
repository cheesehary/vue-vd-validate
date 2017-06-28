const _rules = (function() {
  const required = value => {
    if(Array.isArray(value)) {
      return value.length;
    }
    return value;
  };

  const number = value => !isNaN(value);

  const phone = value => {
    const regex = /^1[34578]\d{9}$/;
    return regex.test(value);
  };

  const identity = value => {
    const regex = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$)/;
    return regex.test(value);
  };

  return {
    required,
    number,
    phone,
    identity
  };
})();

const _errors = {
  required: '请填写该项.',
  number: '请填写数字.',
  phone: '请填写手机号.',
  identity: '请填写身份证号.',
};

class ValidateError {
  constructor(msg) {
    this.msg = `[validator-error]: ${msg}`;
  }

  toString() {
    return this.msg;
  }
}

class Validator {
  constructor(config) {
    this.errors = Object.assign({}, _errors, config.errors);
    this.rules = Object.assign({}, _rules, config.rules);
    this.fields = {};
  }

  errors(obj) {
    this.errors = Object.assign({}, this.errors, obj);
  }

  rules(obj) {
    this.rules = Object.assign({}, this.rules, obj);
  }

  validate() {
    const fields = this.fields;
    const promises = Object.keys(fields).map(name => this.validateField(name, fields[name].value()));
    
    return Promise.all(promises).then(results => {     
      const fails = results.filter(r => r.pass !== true);
      
      return {
        valid: !fails.length,
        fails
      };
    });
  }

  fill(name, checks, value, msg) {
    this.fields[name] = {
      msg,
      value,
      checks,
      isReq: ~'required'.indexOf(checks)
    };
  }

  validateField(name, value) {
    const field = this.fields[name];
    const promises = field.checks.split('|').map(check => this.test(name, value, check));

    return Promise.all(promises).then(results => {
      const fails = results.filter(r => r !== true);

      if(field.msg) {
        if(fails.length) {
          this.displayError(field.msg, fails[0].rule);
        }
        else this.hideError(field.msg);
      }

      return {
        pass: !fails.length,
        name,
        rules: fails.map(f => f.rule)
      };
    });
  }

  test(name, value, check) {
    const rule = this.rules[check];
    const result = rule(value);

    if(result) {
      return Promise.resolve(true);
    }
    else return Promise.resolve({ name, rule: check });
  }

  displayError(msg, rule) {
    const error = this.getErrorMessage(rule);
    msg.innerText = error;
    msg.style.display = 'block';
  }

  hideError(msg) {
    msg.style.display = 'none';
  }

  getErrorMessage(rule) {
    return this.errors[rule] || '请检查内容格式.';
  }
}

class ValidateListener {
  constructor(el, binding, vnode, config) {
    this.config = config,
    this.el = el;
    this.vm = vnode.context;
    this.component = vnode.child;
    this.binding = binding;
    this.name = this.getFieldName();
  }

  attach() {
    let checks = this.binding.value;
    this.createErrorMsg();
    this.vm.$validator.fill(this.name, checks, this.getFieldValue(), this.msg);
    this.attachFieldListener();
  }

  attachFieldListener() {
    const componentListener = _wait(value => this.vm.$validator.validateField(this.name, value), this.getFieldDelay());

    const nativeListener = _wait(() => this.vm.$validator.validateField(this.name, this.el.value), this.getFieldDelay());

    if(this.component) {
      this.component.$on(`${this.config.emit || 'input'}`, componentListener);
    }
    else {
      switch(this.el.tagName) {
      case 'INPUT': 
        this.target.addEventListener('input', nativeListener);
        break;

      case 'SELECT': 
        this.target.addEventListener('change', nativeListener);
        break;
        
      default: this.target.addEventListener('input', nativeListener);
      }
    }
  }

  getFieldValue() {
    if(this.component) {
      return () => this.component.value;
    }
    
    return () => this.el.value;
  }

  getFieldName() {
    const name = this.getDataAttr('name');
    if(!name) {
      throw new ValidateError('value of "data-vd-name" must be given');
    }
    return name;
  }

  getFieldDelay() {
    return this.getDataAttr('delay') || this.config.delay;
  }

  getDataAttr(prop) {
    return this.el.getAttribute(`data-vd-${prop}`);
  }
  
  getDomTarget(el) {
    if(this.component) {
      return el.querySelector('input');
    }
    
    return el;
  }

  handleInnerClass(msg) {
    const className = this.getDataAttr('class');

    if(!className) return;

    let map = this.vm.$el.attributes;
    let unique;
    const regex = /^data-v-/;

    for(let i = 0; i < map.length; i++) {
      if(regex.test(map[i].localName)) {
        unique = map[i].localName;
        break;
      }
    }
    
    if(unique) {
      msg.setAttribute(unique, '');
    }
    msg.classList.add(className);
  }

  createErrorMsg() {
    if(this.config.showErrorMsg) {
      const target = this.getDomTarget(this.el);

      if(target && !target.parentNode.classList.contains('vd-error-wrapper')) {
        this.target = target;

        let wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.classList.add('vd-error-wrapper');
        target.parentNode.insertBefore(wrapper, target);
        wrapper.appendChild(target);

        let msg = document.createElement('span');
        msg.style.position = 'absolute';
        msg.style.display = 'none';
        msg.classList.add(this.config.customClass);
        this.handleInnerClass(msg);
        this.msg = wrapper.appendChild(msg), msg;
      }
    }
  }
}

const _wait = (fn, delay = 0) => {
  let timer;

  return (...args) => {
    const later = () => {
      timer = null;
      fn(...args);
    };
    clearTimeout(timer);
    timer = setTimeout(later, delay);
  };
};

const _defaultOptions = {
  showErrorMsg: true
};

const _makeMixin = config => ({
  beforeCreate() {
    this.$validator = new Validator(config);
  }
});

const _listenerList = [];

const _makeDirective = config => ({
  inserted(el, binding, vnode) {
    const listener = new ValidateListener(el, binding, vnode, config);
    listener.attach();
    _listenerList.push(listener);
  },
  update(el, { modifiers }, { context }) {
    if(modifiers.recreate) {
      const listenerToRecreate = _listenerList.find(l => l.vm === context && l.el === el);
      context.$nextTick(() => {
        listenerToRecreate.attach();
      });
    }
  }
});

const install = (Vue, options) => {
  const config = Object.assign({}, _defaultOptions, options);
  Vue.mixin(_makeMixin(config));
  Vue.directive('validate', _makeDirective(config));
};

const index = {
  install
};

export default index;