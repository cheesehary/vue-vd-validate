# vue-vd-validate
a vuejs validate plugin for Vue2.0+

## Installation
```
npm install --save vue-vd-validate
```

## Usage
Put the code below into main.js and you are good to go.
```
import Vue from 'vue'
import Validate from 'vue-vd-validate'

Vue.use(Validate)
```
Simply apply `v-validate` to tags like `<input>` and pass validation rules as value. Other attributes such as `data-vd-name` and `data-vd-delay` can be applied as well. Note that `data-vd-name` is required.
```
<input v-validate="'required|phone'" data-vd-name="telephone" data-vd-delay="500">
```
It is also compatible with custom components, while you need to provide a prop named `value` in the component.
```
<custom-input v-validate="'required|phone'" data-vd-name="telephone" :value="someValue"></custom-input>
```

## Available Rules
* required: `null`, `undefined`, `''` and `[]` will violate this rule.
* number: The input must only consist of numbers.
* phone: The input must be a valid phone number in China.
* identity: The input must be a valid ID card number in China.

## Customization
You can customize this validator in main.js by passing in an object.
```
Vue.use(Validate, {
  showErrorMsg: true,
  customClass: 'some-class',
  delay: 500,
  rules: {
    otherRule: function() { //rule here }
  },
  errors: {
    otherRule: 'You break the otherRule!'
  }
})
```
Or you can use the methods `addRules` and `addErrors` in components for particular rules.
```
mounted() {
  var vm = this;
  this.$validator.addRules({
    biggerThanCount(value) {
      return value > vm.count;
    }
  });
  this.$validator.addErrors({
    biggerThanCount: 'Value should be bigger than the count.'
  });
}
```
For now, the customizable parameters are:
* showErrorMsg | Boolean: display the error message under the input or not, true as default.
* customClass | String: className for the error message.
* delay | Number: delay for the validation on inputs.
* rules | Object: each value should be a function that returns true or false which indicates whether the input passes this rule.
* errors | Object: each value should be a String which will be displayed when the input fails corresponding rule, so the keys should be consistent with keys in `rules`.
