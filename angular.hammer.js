// ---- Angular Hammer ----

// Copyright (c) 2014 Ryan S Mullins <ryan@ryanmullins.org>
// Licensed under the MIT Software License

(function (window, angular, Hammer) {
  'use strict';

  /**
   * Mapping of the gesture event names with the Angular attribute directive
   * names. Follows the form: <directiveName>:<eventName>.
   *
   * @type {Array}
   */
  var gestureTypes = [
    'hmCustom:custom',
    'hmSwipe:swipe',
    'hmSwipeleft:swipeleft',
    'hmSwiperight:swiperight',
    'hmSwipeup:swipeup',
    'hmSwipedown:swipedown',
    'hmPan:pan',
    'hmPanstart:panstart',
    'hmPanmove:panmove',
    'hmPanend:panend',
    'hmPancancel:pancancel',
    'hmPanleft:panleft',
    'hmPanright:panright',
    'hmPanup:panup',
    'hmPandown:pandown',
    'hmPress:press',
    'hmPressup:pressup',
    'hmRotate:rotate',
    'hmRotatestart:rotatestart',
    'hmRotatemove:rotatemove',
    'hmRotateend:rotateend',
    'hmRotatecancel:rotatecancel',
    'hmPinch:pinch',
    'hmPinchstart:pinchstart',
    'hmPinchmove:pinchmove',
    'hmPinchend:pinchend',
    'hmPinchcancel:pinchcancel',
    'hmPinchin:pinchin',
    'hmPinchout:pinchout',
    'hmTap:tap',
    'hmDoubletap:doubletap'
  ];

  // ---- Module Definition ----

  /**
   * @module hmTouchEvents
   * @description Angular.js module for adding Hammer.js event listeners to HTML
   * elements using attribute directives
   * @requires angular
   * @requires hammer
   */
  var NAME = "hmTouchEvents";
  var hmTouchEvents = angular.module(NAME, []);

  /**
   * Provides a common interface for configuring global manager and recognizer
   * options. Allows things like tap duration etc to be defaulted globally and
   * overridden on a per-directive basis as needed.
   *
   * @return {Object} functions to add manager and recognizer options.
   */
  hmTouchEvents.provider(NAME, function(){

    var self = this;
    var defaultRecognizerOpts = false;
    var recognizerOptsHash = {};
    var managerOpts = {};

    //
    // Make use of presets from Hammer.defaults.preset array
    // in angular-hammer events.
    //
    self.applyHammerPresets = function(){
      //force hammer to extend presets with more info:
      Hammer(document.createElement("i"));
      var hammerPresets = Hammer.defaults.preset;

      //add each preset to defaults list so long as there
      //is associated config with it:
      angular.forEach(hammerPresets, function(presetArr){

        var data = presetArr[1];
        if(!data) return;
        var name = data.event;

        if(!name) throw Error(NAME+"Provider: useHammerPresets: preset event expected by now");
        recognizerOptsHash[name] = data;

      });
    }

    //
    // Add a manager option (key/val to extend or object to set all):
    //
    self.addManagerOption = function(name, val){
      if(typeof name == "object"){
        angular.extend(managerOpts, name);
      }
      else {
        managerOpts[name] = val;
      }
    }

    //
    // Add a recognizer option (key/val or object with "type" set):
    //
    self.addRecognizerOption = function(name, val){
      if(Array.isArray(name)){
        for(var i = 0; i < name.length; i++) self.addRecognizerOption(name[i]);
        return;
      }
      if(typeof name == "object") {
        val = name;
        name = val.type;
      }
      if(typeof val != "object") {
        throw Error(NAME+"Provider: recognizer value expected to be object");
      }
      if(!name){
        defaultRecognizerOpts = val;
      } else {
        recognizerOptsHash[val.type] = val;
      }
    }

    // internal helper funcs:
    function doRecognizerOptsExist(type, arr){
      for(var i = 0; i < arr.length; i++){
        if(arr[i].type == type) return true;
      }
      return false;
    }
    function doDefaultRecognizerOptsExist(arr){
      for(var i = 0; i < arr.length; i++){
        if(!arr[i].type) return true;
      }
      return false;
    }

    //provide an interface to this that the hm-* directives use
    //to extend their recognizer/manager opts.
    self.$get = function(){
      return {
        extendWithDefaultManagerOpts: function(opts){
          if(typeof opts != "object"){
            opts = {};
          }
          var out = {};
          for(var name in managerOpts) {
            if(!opts[name]) opts[name] = angular.copy(managerOpts[name]);
          }
          return angular.extend({}, managerOpts, opts);
        },
        extendWithDefaultRecognizerOpts: function(opts){
          if(typeof opts != "object") {
            opts = [];
          } else if(!Array.isArray(opts)) {
            opts = [opts];
          }
          //default opts go first if they exist and arent provided:
          if(defaultRecognizerOpts && !doDefaultRecognizerOptsExist(opts)){
            opts.unshift(defaultRecognizerOpts);
          }
          //other opts get pushed to the end:
          for(var type in recognizerOptsHash) {
            if(!doRecognizerOptsExist(type, opts)) {
              opts.push( angular.copy(recognizerOptsHash[type]) );
            }
          }
          return opts;
        }
      };
    };

  });

  /**
   * Iterates through each gesture type mapping and creates a directive for
   * each of the
   *
   * @param  {String} type Mapping in the form of <directiveName>:<eventName>
   * @return None
   */
  angular.forEach(gestureTypes, function (type) {
    var directive = type.split(':'),
        directiveName = directive[0],
        eventName = directive[1];

    hmTouchEvents.directive(directiveName, ['$parse', '$window', NAME, function ($parse, $window, hmTouchDefaults) {
        return {
          'restrict' : 'A',
          'link' : function (scope, element, attrs) {

            // Check for Hammer and required functionality
            // If no Hammer, maybe bind tap and doubletap to click and dblclick

            if (!Hammer || !$window.addEventListener) {
              if (directiveName === 'hmTap') {
                element.bind('click', handler);
              }

              if (directiveName === 'hmDoubletap') {
                element.bind('dblclick', handler);
              }

              return;
            }

            var hammer = element.data('hammer'),
                managerOpts = hmTouchDefaults.extendWithDefaultManagerOpts( scope.$eval(attrs.hmManagerOptions) ),
                //if custom event, dont touch recognizer opts, else extend them with defaults:
                recognizerOpts = directiveName === "hmCustom"
                  ? scope.$eval(attrs.hmRecognizerOptions)
                  : hmTouchDefaults.extendWithDefaultRecognizerOpts( scope.$eval(attrs.hmRecognizerOptions) );

            // Check for a manager, make one if needed and destroy it when
            // the scope is destroyed

            if (!hammer) {
              hammer = new Hammer.Manager(element[0], managerOpts);
              element.data('hammer', hammer);
              scope.$on('$destroy', function () {
                hammer.destroy();
              });
            }

            // Instantiate the handler

            var handlerName = attrs[directiveName],
                handlerExpr = $parse(handlerName),
                handler = function (event) {
                  var phase = scope.$root.$$phase,
                      recognizer = hammer.get(event.type);

                  event.element = element;

                  if (recognizer) {
                    if (recognizer.options.preventDefault) {
                      event.preventDefault();
                    }

                    if (recognizer.options.stopPropagation) {
                      event.srcEvent.stopPropagation();
                    }
                  }

                  if (phase === '$apply' || phase === '$digest') {
                    callHandler();
                  } else {
                    scope.$apply(callHandler);
                  }

                  function callHandler () {
                    var fn = handlerExpr(scope, {'$event':event});

                    if (typeof fn === 'function') {
                      fn.call(scope, event);
                    }
                  }
                };

            // If we are not working with a custom event, set up a
            // default recognizer for this directive's event. This
            // may be overridden below.
            if (directiveName !== 'hmCustom') {

              var newRecognizerOpts = {
                'type': getRecognizerTypeFromeventName(eventName)
              };

              if (directiveName === 'hmDoubletap') {
                newRecognizerOpts.event = eventName;
                newRecognizerOpts.taps = 2;

                if (hammer.get('tap')) {
                  newRecognizerOpts.recognizeWith = 'tap';
                }
              }

              if (newRecognizerOpts.type.indexOf('pan') > -1 &&
                  hammer.get('swipe')) {
                newRecognizerOpts.recognizeWith = 'swipe';
              }

              if (newRecognizerOpts.type.indexOf('pinch') > -1 &&
                  hammer.get('rotate')) {
                newRecognizerOpts.recognizeWith = 'rotate';
              }

              setupRecognizerWithOptions(
                hammer,
                applyManagerOptions(managerOpts, newRecognizerOpts),
                element);
            } 

            // iterate over any recognizerOpts that are provided (including
            // global defaults from the directive and local events supplied
            // in attribute) and, if any match this event (or this is hmCustom),
            // apply them on top of any defaults set above.
            angular.forEach(recognizerOpts, function (options) {
              if (directiveName === 'hmCustom') {
                eventName = options.event;
              } else {
                if (!options.type) {
                  options.type = getRecognizerTypeFromeventName(eventName);
                }
                if (options.event) {
                  delete options.event;
                }
              }
              if (directiveName === 'hmCustom' ||
                  eventName.indexOf(options.type) > -1) {
                setupRecognizerWithOptions(
                  hammer,
                  applyManagerOptions(managerOpts, options),
                  element);
              }
            });

            // dont both creating an event if we're asking for a custom event
            // and have no recognizers to apply to it.
            if(directiveName === 'hmCustom' && recognizerOpts.length || directiveName !== 'hmCustom') {
              hammer.on(eventName, handler);
            }

          }
        };
      }]);
  });

  // ---- Private Functions -----

  /**
   * Adds a gesture recognizer to a given manager. The type of recognizer to
   * add is determined by the value of the options.type property.
   *
   * @param {Object}  manager Hammer.js manager object assigned to an element
   * @param {String}  type    Options that define the recognizer to add
   * @return {Object}         Reference to the new gesture recognizer, if
   *                          successful, null otherwise.
   */
  function addRecognizer (manager, type) {
    if (manager === undefined || type === undefined) { return null; }

    var recognizer;

    if (type.indexOf('pan') > -1) {
      recognizer = new Hammer.Pan();
    } else if (type.indexOf('pinch') > -1) {
      recognizer = new Hammer.Pinch();
    } else if (type.indexOf('press') > -1) {
      recognizer = new Hammer.Press();
    } else if (type.indexOf('rotate') > -1) {
      recognizer = new Hammer.Rotate();
    } else if (type.indexOf('swipe') > -1) {
      recognizer = new Hammer.Swipe();
    } else {
      recognizer = new Hammer.Tap();
    }

    manager.add(recognizer);
    return recognizer;
  }

  /**
   * Applies certain manager options to individual recognizer options.
   *
   * @param  {Object} managerOpts    Manager options
   * @param  {Object} recognizerOpts Recognizer options
   * @return None
   */
  function applyManagerOptions (managerOpts, recognizerOpts) {
    if (managerOpts) {
      recognizerOpts.preventGhosts = managerOpts.preventGhosts;
    }

    return recognizerOpts;
  }

  /**
   * Extracts the type of recognizer that should be instantiated from a given
   * event name. Used only when no recognizer options are provided.
   *
   * @param  {String} eventName Name to derive the recognizer type from
   * @return {string}           Type of recognizer that fires events with that name
   */
  function getRecognizerTypeFromeventName (eventName) {
    if (eventName.indexOf('pan') > -1) {
      return 'pan';
    } else if (eventName.indexOf('pinch') > -1) {
      return 'pinch';
    } else if (eventName.indexOf('press') > -1) {
      return 'press';
    } else if (eventName.indexOf('rotate') > -1) {
      return 'rotate';
    } else if (eventName.indexOf('swipe') > -1) {
      return 'swipe';
    } else {
      return 'tap';
    }
  }

  /**
   * Applies the passed options object to the appropriate gesture recognizer.
   * Recognizers are created if they do not already exist. See the README for a
   * description of the options object that can be passed to this function.
   *
   * @param  {Object} manager Hammer.js manager object assigned to an element
   * @param  {Object} options Options applied to a recognizer managed by manager
   * @return None
   */
  function setupRecognizerWithOptions (manager, options, element) {
    if (manager == null || options == null || options.type == null) {
      return console.error('ERROR: Angular Hammer could not setup the' +
        ' recognizer. Values of the passed manager and options: ', manager, options);
    }

    var recognizer = manager.get(options.type);

    if (!recognizer) {
      recognizer = addRecognizer(manager, options.type);
    }

    if (!options.directions) {
      if (options.type === 'pan' || options.type === 'swipe') {
        options.directions = 'DIRECTION_ALL';
      } else if (options.type.indexOf('left') > -1) {
        options.directions = 'DIRECTION_LEFT';
      } else if (options.type.indexOf('right') > -1) {
        options.directions = 'DIRECTION_RIGHT';
      } else if (options.type.indexOf('up') > -1) {
        options.directions = 'DIRECTION_UP';
      } else if (options.type.indexOf('down') > -1) {
        options.directions = 'DIRECTION_DOWN';
      } else {
        options.directions = '';
      }
    }

    options.direction = parseDirections(options.directions);
    recognizer.set(options);

    if (typeof options.recognizeWith === 'string') {
      var recognizeWithRecognizer;

      if (manager.get(options.recognizeWith) == null){
        recognizeWithRecognizer = addRecognizer(manager, options.recognizeWith);
      }

      if (recognizeWithRecognizer != null) {
        recognizer.recognizeWith(recognizeWithRecognizer);
      }
    }

    if (typeof options.dropRecognizeWith  === 'string' &&
        manager.get(options.dropRecognizeWith) != null) {
      recognizer.dropRecognizeWith(manager.get(options.dropRecognizeWith));
    }

    if (typeof options.requireFailure  === 'string') {
      var requireFailureRecognizer;

      if (manager.get(options.requireFailure) == null){
        requireFailureRecognizer = addRecognizer(manager, {type:options.requireFailure});
      }

      if (requireFailureRecognizer != null) {
        recognizer.requireFailure(requireFailureRecognizer);
      }
    }

    if (typeof options.dropRequireFailure === 'string' &&
        manager.get(options.dropRequireFailure) != null) {
      recognizer.dropRequireFailure(manager.get(options.dropRequireFailure));
    }

    if (options.preventGhosts === true && element != null) {
      preventGhosts(element);
    }
  }

  /**
   * Parses the value of the directions property of any Angular Hammer options
   * object and converts them into the standard Hammer.js directions values.
   *
   * @param  {String} dirs Direction names separated by '|' characters
   * @return {Number}      Hammer.js direction value
   */
  function parseDirections (dirs) {
    var directions = 0;

    angular.forEach(dirs.split('|'), function (direction) {
      if (Hammer.hasOwnProperty(direction)) {
        directions = directions | Hammer[direction];
      }
    });

    return directions;
  }

  // ---- Preventing Ghost Clicks ----

  /**
   * Modified from: https://gist.github.com/jtangelder/361052976f044200ea17
   *
   * Prevent click events after a touchend.
   *
   * Inspired/copy-paste from this article of Google by Ryan Fioravanti
   * https://developers.google.com/mobile/articles/fast_buttons#ghost
   */

  function preventGhosts (element) {
    if (!element) { return; }

    var coordinates = [],
        threshold = 25,
        timeout = 2500;

    if ('ontouchstart' in window) {
      element[0].addEventListener('touchstart', resetCoordinates, true);
      element[0].addEventListener('touchend', registerCoordinates, true);
      element[0].addEventListener('click', preventGhostClick, true);
      element[0].addEventListener('mouseup', preventGhostClick, true);
    }

    /**
     * prevent clicks if they're in a registered XY region
     * @param {MouseEvent} ev
     */
    function preventGhostClick (ev) {
      for (var i = 0; i < coordinates.length; i++) {
        var x = coordinates[i][0];
        var y = coordinates[i][1];

        // within the range, so prevent the click
        if (Math.abs(ev.clientX - x) < threshold &&
            Math.abs(ev.clientY - y) < threshold) {
          ev.stopPropagation();
          ev.preventDefault();
          break;
        }
      }
    }

    /**
     * reset the coordinates array
     */
    function resetCoordinates () {
      coordinates = [];
    }

    /**
     * remove the first coordinates set from the array
     */
    function popCoordinates () {
      coordinates.splice(0, 1);
    }

    /**
     * if it is an final touchend, we want to register it's place
     * @param {TouchEvent} ev
     */
    function registerCoordinates (ev) {
      // touchend is triggered on every releasing finger
      // changed touches always contain the removed touches on a touchend
      // the touches object might contain these also at some browsers (firefox os)
      // so touches - changedTouches will be 0 or lower, like -1, on the final touchend
      if(ev.touches.length - ev.changedTouches.length <= 0) {
        var touch = ev.changedTouches[0];
        coordinates.push([touch.clientX, touch.clientY]);

        setTimeout(popCoordinates, timeout);
      }
    }
  }
})(window, window.angular, window.Hammer);