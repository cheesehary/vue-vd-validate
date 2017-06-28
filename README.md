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
- **required**: `null`, `undefined`, `''` and `[]` will violate this rule.
- **number**: The input must only consist of numbers.
- **phone**: The input must be a valid phone number in China.
- **identity**: The input must be a valid ID card number in China.

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
    otherRule: 'You break the otherRule!'
  }
})
```
Or you can use the methods `rules` and `errors` in components for particular rules.
```
mounted() {
  var vm = this;
  this.$validator.rules({
    biggerThanCount(value) {
      return value > vm.count;
    }
  });
  this.$validator.errors({
    biggerThanCount: 'Value should be bigger than the count.'
  });
}
```
For now, the customizable parameters are:
- **showErrorMsg** | Boolean: display the error message under the input or not, true as default.
- **customClass** | String: className for the error message.
- **delay** | Number: delay for the validation on inputs.
- **emit** | String: event name to emit from inside the custom components, defaults to `input`.
- **rules** | Object: each value should be a function that returns true or false which indicates whether the input passes this rule or not. The function accepts an argument which represents the input value.
- **errors** | Object: each value should be a String which will be displayed when the input fails corresponding rule, so the keys should be consistent with keys in `rules`.

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
      }
    }
  }
}
```
If you want to communicate validation between child components and parent ones, you may use Event Bus.
