# vue-vd-validate
a vuejs validate plugin for Vue2.0+

## Installation
```
npm install --save vue-vd-validate
```

## Usage
Put the code below into your main.js and you are good to go.
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
<custom-input v-validate="'required|phone'" data-vd-name="telephone" :value="someValue">
```

## Options
