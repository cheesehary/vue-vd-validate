const _rules = errors => {
  const required = value => {
    let error = false;
    if(_isEmpty(value)) {
      error = errors.required;
    }
    return error;
  };

  const number = value => {
    let error = false;
    if(isNaN(value)) {
      error = errors.number;
    }
    return error;
  };

  const phone = value => {
    let error = false;
    const regex = /^1[34578]\d{9}$/;
    if(!regex.test(value)) {
      error = errors.phone;
    }
    return error;
  };

  const identity = value => {
    let error = false;
    const regex = /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}$)/;
    if(!regex.test(value)) {
      error = errors.identity;
    }
    return error;
  };

  const email = value => {
    let error = false;
    const regex = /\w+@\w+\.\w+/;
    if(!regex.test(value)) {
      error = errors.email;
    }
    return error;
  };

  const length = (value, param) => {
    let error = false;
    const l = value.length;
    const min = param.split('-')[0];
    const max = param.split('-')[1];

    if(min > max) throw new ValidateError('min is bigger than max in rule "length"');
    
    if(min && !max && l < min) {
      error = `长度不小于${min}个字符`;
    }
    if(max && !min && l > max) {
      error = `长度不大于${max}个字符`;
    }
    if(min && max && (l < min || l > max)) {
      error = `长度在${min}到${max}个字符`;
    }
    return error;
  };

  return {
    required,
    number,
    phone,
    identity,
    email,
    length
  };
};

const _errors = {
  required: '请填写该项',
  number: '请填写数字',
  phone: '请填写手机号',
  identity: '请填写身份证号',
  email: '请填写Email地址',
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
    this.rules = Object.assign({}, _rules(this.errors), config.rules);
    this.fields = {};
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
      isReq: ~Object.keys(checks).indexOf('required')
    };
  }

  validateField(name, value) {
    const field = this.fields[name];

    if(!field.isReq && _isEmpty(value)) {
      this.hideError(field.msg);

      return {
        pass: true,
        name,
      };
    }

    try {
      const promises = Object.keys(field.checks).map(check => this.test(check, name, value, field.checks[check]));

      return Promise.all(promises).then(results => {
        const fails = results.filter(r => r !== true);

        if(field.msg) {
          if(fails.length) {
            this.displayError(field.msg, fails[0].error);
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
    catch(err) {
      console.error(err.msg);
    }
  }

  test(check, name, value, param) {
    const rule = this.rules[check];

    try {
      const error = rule(value, param);

      if(!error) {
        return Promise.resolve(true);
      }
      else return Promise.resolve({ name, rule: check, error });
    } 
    catch(err) {
      if(err.constructor.name !== 'ValidateError') {
        throw new ValidateError(`rule '${check}' is not properly defined`);        
      }

      throw err;
    }
  }

  displayError(msg, error) {
    msg.innerText = error;
    msg.style.display = 'block';
  }

  hideError(msg) {
    msg.style.display = 'none';
  }
}

class ValidateListener {
  constructor(el, binding, vnode, config) {
    this.config = config,
    this.el = el;
    this.vm = vnode.context;
    this.component = vnode.child;
    this.binding = binding;
    this.name = null;
    try {
      this.getFieldName();
    }
    catch(err) {
      console.error(err.msg);
    }
  }

  attach() {
    let checks = this.getFieldChecks();
    this.createErrorMsg();
    this.vm.$validator.fill(this.name, checks, this.getFieldValue(), this.msg);
    this.attachFieldListener();
  }

  attachFieldListener() {
    const componentListener = _wait(value => this.vm.$validator.validateField(this.name, value), this.getFieldDelay());

    const nativeListener = _wait(() => this.vm.$validator.validateField(this.name, this.el.value), this.getFieldDelay());

    if(this.component) {
      this.component.$on(this.config.emit, componentListener);
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

  getFieldChecks() {
    const str = this.binding.value;
    const checks = {};
    str.split('|').forEach(item => {
      const check = item.split(':');
      checks[check[0]] = check[1] || null;
    });

    return checks;
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
    this.name = name;
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

const _isEmpty = value => {
  if(Array.isArray(value)) {
    return !value.length;
  }

  return !value;
};

const _defaultOptions = {
  showErrorMsg: true,
  emit: 'input'
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