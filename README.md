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
It is also compatible with custom components, while you need to emit an event named `input` with the input value from inside the component. Note that this event name can be customized.
```
<custom-input v-validate="'required|phone'" data-vd-name="telephone"></custom-input>

//custom-input
<input @input="onInput">

methods: {
  onInput(e) {
    this.$emit('input', e.target.value);
  }
}
```

## Available Rules
You may pass `parameter` as a second argument to rules. The parameter is a String concatenated to the rule by a colon.


The format is `v-validate="'rule:parameter'"`.

- **required**: `null`, `undefined`, `''` and `[]` will violate this rule.
- **number**: The input must only consist of numbers.
- **phone**: The input must be a valid phone number in China.
- **identity**: The input must be a valid ID card number in China.
- **email**: The input must be a valid email.
- **length**: [parameter]. The input length must be in valid length range. The parameter format is `'length:min-max'`. When there is no min or max restriction, just leave it blank. e.g. `length:-5` means that the max length is 5.

## Attributes
Attributes affect the particular field that they have been applied to, with higher priority than global customization.
- **data-vd-name**: *required*. name of the field. Cannot be repeated in one component.
- **data-vd-delay**: delay for the validation on inputs.
- **data-vd-class**: className for the error message.

## Customization
You can customize this validator globally in main.js by passing in an object.
```
Vue.use(Validate, {
  showErrorMsg: true,
  customClass: 'some-class',
  delay: 500,
  rules: {
    otherRule: function() { //rule here }
  },
  errors: {
    required: 'error message of rule "required" in your way'
  }
})
```
Or you can use the method `rules` in components for particular rules.
```
mounted() {
  let vm = this;
  this.$validator.rules({
    biggerThanCount(value) {
      let error = false;
      if(value <= vm.count) {
        error = 'value should be bigger than the count';
      }
      return error;
    }
  });
}
```
For now, the customizable parameters are:
- **showErrorMsg** | Boolean: display the error message under the input or not, true as default.
- **customClass** | String: className for the error message.
- **delay** | Number: delay for the validation on inputs.
- **emit** | String: event name to emit from inside the custom components, defaults to `input`.
- **rules** | Object: each value should be a function that returns `false` when the input passes this rule, or a String as the error message when it fails. The function accepts two arguments, `value` and `parameter`.
- **errors** | Object: you can change error messages of available rules above. Each value should be a String which represents the new error. Notice that the error of rule `length` cannot be changed.

## Modifiers
Modifiers are meant to handle some special needs through the validation.
```
<custom-upload-input v-validate.recreate="'required'" data-vd-name="picture"></custom-upload-input>
```
- **recreate**: recreate the error message when the template has updated. It is used when 3rd party components, such as some upload components, destroy the dom input and thus the error message in certain actions.

## Validate Methods
```
methods: {
  validate() {
    this.$validator.validate().then(result => {
      if(result.valid) {
        //you pass all the validations!
      }
      else {
        //do something when failing with result.fails...
        /**
         * result.fails is an Array, with each element being an Object.
         * The Object contains name of the field and rules that it violates.
         */
      }
    }
  }
}
```
If you want to communicate validation between child components and parent ones, you may use [Event Bus](https://vuejs.org/v2/guide/components.html#Non-Parent-Child-Communication).
