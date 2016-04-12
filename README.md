# Angular Hammer v3.0-jsdw

An [Angular.js](https://angularjs.org/) module that enables you to bind custom behavior to [Hammer.js](http://hammerjs.github.io/) touch events. It is a heavily modified version of Ryan Mullins' [angular-hammer](https://github.com/RyanMullins/angular-hammer) module, which itself was derived from the [Angular Hammer](https://github.com/monospaced/angular-hammer) project by [Monospaced](https://github.com/monospaced).

Tweaks from Ryan Mullins version include an additional directive to allow setting of global presets and importing of global presets from `Hammer.defaults.presets`, and other general tidyup.

## Installation 

Install using [Bower](http://bower.io/).

```bash
$ bower install --save ryanmullins-angular-hammer
```

Install using [NPM](https://www.npmjs.com/).

```shell
$ npm install --save angular-hammer
```

Add `hmTouchEvents` to your app or module's dependencies. This module is designed to work with Angular.js v1.2.0+, and Hammer.js v2.0.0+. 

#### A Note on Version Naming

Angular Hammer uses the semantic version naming convention `major.minor.patch` typical of most Bower projects, with one small difference. The `major` version will _only_ change when the major version of Hammer.js changes. Changes to `minor` should be thought of as possibly breaking, though typically they will be breaking changes to the API (i.e. changing the name of some directive or attribute). Changes to `patch` should be thought of as bug fixes or small feature additions that may require changing or adding HTML attribute values.

#### A Note on Angular.js 2.0 

At this time Angular Hammer has been tested with both Angular.js v1.2.x and v1.3.0. Angular.js v2.0 presents massive changes to the framework. Until such time as this README indicates otherwise, it should be assumed that Angular Hammer **will not** be moving forward to Angular.js v2.0. I reserve the right to change my mind once the v2.0 spec come out and I am able to assess the transition path.

## Usage

The `hmTouchEvents` module provides a series of attribute [directives](https://docs.angularjs.org/guide/directive) for hooking into the standard Hammer.js events. 

### Standard Directives

The following list shows the Hammer event and corresponding Angular directive (format: &lt;eventName&gt; : &lt;directiveName&gt;). Events on the top level are fired every time a gesture of that type happens. The second-level events are more specific to the gesture state (i.e. direction, start/stop), but trigger events of their top level type. 

* pan : hmPan
    - panstart : hmPanstart
    - panmove : hmPanmove
    - panend : hmPanend
    - pancancel : hmPancancel
    - panleft : hmPanleft
    - panright : hmPanright
    - panup : hmPanup
    - pandown : hmPandown
* pinch : hmPinch
    - pinchstart : hmPinchstart
    - pinchmove : hmPinchmove
    - pinchend : hmPinchend
    - pinchcancel : hmPinchcancel
    - pinchin : hmPinchin
    - pinchout : hmPinchout
* press : hmPress
    - pressup : HmPressup
* rotate : hmRotate
    - rotatestart : hmRotatestart
    - rotatemove : hmRotatemove
    - rotateend : hmRotateend
    - rotatecancel : hmRotatecancel
* swipe : hmSwipe
    - swipeleft : hmSwipeleft
    - swiperight : hmSwiperight
    - swipeup : hmSwipeup
    - swipedown : hmSwipedown
* tap : hmTap
* doubletap : hmDoubletap 

Behaviors to be executed on an event are defined as values of the attribute. This value is parsed as an [Angular expression](https://docs.angularjs.org/guide/expression). Beware, invalid Angular expressions will throw an Angular error with those terrible call stacks.

Example Definition:

```html
<div hm-tap="onHammer"></div>
<div hm-tap="model.name = 'Ryan'"></div>
```

### Manager Options

Each element that responds to Hammer events contains it's own [manager](http://hammerjs.github.io/api/#hammer.manager), which keeps track of the various gesture [recognizers](http://hammerjs.github.io/api/#hammer.recognizer) attached to that element. Angular Hammer does not make use of the standard [Hammer() constructor](http://hammerjs.github.io/api/#hammer), instead instantiating an empty manager and adding only the required recognizers. However, if you were to add the same series of directives to an element, the default behavior would be the same as if they had been instantiated using the Hammer() constructor.

The behavior of any manager can be customized using the hmManagerOptions attribute. This attribute value should be a stringified JSON Object that has one or more of the properties listed below. If you choose to set the `cssProps` option, lease make sure that you are using the properties listed in the [Hammer Documentation](http://hammerjs.github.io/jsdoc/Hammer.defaults.cssProps.html). If you define the `preventGhosts` property, that value will be attributed to all recognizers associated with that manager.  

Possible Properties: 

```javascript
{
    "cssProps": Object
    "domEvents": Boolean
    "enable": Boolean
    "preventGhosts": Boolean
}
```

Example Definition: 

```html
<div hm-tap="onHammer" hm-manager-options='{"enable":true,"preventGhosts":true}'></div>
```

### Recognizer Options

[Gesture recognizers](http://hammerjs.github.io/api/#hammer.recognizer) are responsible for linking events and handlers. Each element has a manager that maintains a list of these recognizers. Hammer defines some default behavior for each type of recognizer (see the links in the table below), but that behavior can be customized using the hmRecognizerOptions attribute. The value of the hmRecognizerOptions should be stringified JSON, either an Object or an Array of Objects. 

Recognizer options objects may have any of the properties listed in the table below, a checkmark in a column means that either Hammer or Angular Hammer (denoted AH) will make use of this option when instantiating the recognizer. A couple of things to be aware of:

* If the type is provided, the options will only be applied to recognizers of that type. If this type does cannot be resolved to any of the six gesture types, the recognizer will not be created and the options will not be applied.
* If no type property is specified, those options will be applied to all of the recognizers associated with that element/manager. When you are defining recognizer options, it is best to define an options object with no type before defining those with types. 
* The `event` property is stripped from recognizer options associated standard gestures as a safeguard. It can be used to define custom gestures (see below).
* Some Hammer recognizers that accept a `direction` option. For these recognizers, use the `directions` option to specify which directions you would like to support. The value of this property should be a string of [`DIRECTION_*` values](http://hammerjs.github.io/api/#directions) separated by a `|` and containing no spaces. Angular Hammer will parse this field into the proper Hammer value, and set the `direction` option for the recognizer.
* Setting [`preventDefault`](http://devdocs.io/dom/event.preventdefault), `preventGhosts`, or [`stopPropagation`](http://devdocs.io/dom/event.stoppropagation) will enable that behavior for all events recognized by that Recognizer, use this judiciously.
* By default, event callbacks are run inside `scope.$apply()`. Set `invokeApply: false` to disable this behavior, just like for `$timeout`. This is useful for high-frequency events like `panmove`.
* Defining options not supported by that recognizer type will have no effect on that recognizers behavior.

| Option                  | Type    | [Pan][1] | [Pinch][2] | [Press][3] | [Rotate][4] | [Swipe][5] | [Tap][6] |
| :---------------------- | :-----: | :------: | :--------: | :--------: | :---------: | :--------: | :------: |
| `directions`            | String  | &#10003; |            |            |             | &#10003;   |          |
| `event`                 | String  | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `interval`              | Number  |          |            |            |             |            | &#10003; |
| `invokeApply` (AH)  | Boolean | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `pointers`              | Number  | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `posThreshold`          | Number  |          |            |            |             |            | &#10003; |
| `preventDefault` (AH)   | Boolean | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `preventGhosts` (AH)    | Boolean | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `stopPropagation` (AH)  | Boolean | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `taps`                  | Number  |          |            |            |             |            | &#10003; |
| `threshold`             | Number  | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `time`                  | Number  |          |            | &#10003;   |             |            | &#10003; |
| `type` (AH)             | String  | &#10003; | &#10003;   | &#10003;   | &#10003;    | &#10003;   | &#10003; |
| `velocity`              | Number  |          |            |            |             | &#10003;   |          |

[1]:http://hammerjs.github.io/recognizer-pan/ 
[2]:http://hammerjs.github.io/recognizer-pinch/
[3]:http://hammerjs.github.io/recognizer-press/
[4]:http://hammerjs.github.io/recognizer-rotate/
[5]:http://hammerjs.github.io/recognizer-swipe/
[6]:http://hammerjs.github.io/recognizer-tap/

Example definition:

```html
<div hm-tap="onHamer" hm-recognizer-options='{"threshold":200}'></div>
<div hm-tap="onHamer" hm-pan="onHamer" hm-recognizer-options='[
    {"type":"tap","enable":false,},
    {"type":"pan","directions":"DIRECTION_HORIZONTAL|DIRECTION_UP"}
]'></div>
```

### Custom Gesture Recognizers 

You can add custom gesture recognizers using the `hmCustom` directive. Custom gestures are defined using the hmRecognizerOptions attribute. You can define a single custom gesture using an object, or a series of custom gestures using an array of objects. However, only a single handler, set as the value of the hmCustom attribute, will be triggered when any of these custom gestures are recognized. 

When defining a custom gesture, the recognizer options object must have a value for the `type` and `event` properties. 

The behavior that is executed when this gesture is recognized is the value of this attribute. Currently (as of v2.1), only a single behavior handling function can be passed as the custom directive value. This decision was made to unify the use of the `hmManagerOptions` and `hmRecognizerOptions`, but may be changed in future versions to support multiple behavior handlers. The `type` property is used to determine which base type of gesture recognizer to modify. The `event` property is the name of the gesture as well as the name of the only event that Hammer will fire when it recognizes this gesture. **Do not mix custom and standard gesture recognizers attributes in a single element as the behaviors will be in conflict**.

Example: Defining a Custom Gesture Recognizer 

```html
<div 
    hm-custom="onHammer"
    hm-recognizer-options='[
      {"type":"pan","event":"twoFingerPan","pointers":2,"directions":"DIRECTION_ALL"},
      {"type":"tap","event":"dbltap","pointers":2,"taps":1}
    ]'></div>
```

## Demo

* [Using the default set of recognizers](http://ryanmullins.github.io/angular-hammer/examples/raw/default)
* [Defining a custom gesture recognizer](http://ryanmullins.github.io/angular-hammer/examples/raw/custom).
* [Dragging a div around on the screen](http://ryanmullins.github.io/angular-hammer/examples/raw/dragging).
