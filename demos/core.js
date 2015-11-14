var core = (function (window) {
  'use strict';
  var T = window.THREE;

  var construct = function (constructor, args) {
    var F = function () {
      return constructor.apply(this, args);
    };
    F.prototype = constructor.prototype;
    return new F();
  };

  var build = function (geoType, geoProps, matType, matProps) {
    var geo = construct(T[geoType], geoProps);
    var mat = construct(T[matType], matProps);
    var mesh = new T.Mesh(geo, mat);
    return mesh;
  };

  var throttle = function (fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last, deferTimer;
    return function () {
      var context = scope || this;
      var now = +new Date,
          args = arguments;
      if (last && now < last + threshhold) {
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  var isPocketDevice = function () {
    // Assuming this is only available on mobile
    return (typeof window.orientation !== 'undefined');
  };

  var setControllerMethod = function (camera, domElement) {
    var controls;
    if (isPocketDevice()) {
      controls = new T.DeviceOrientationControls(camera, true);
    } else {
      controls = new T.OrbitControls(camera, domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = false;
      controls.enablePan = false;
    }
    return controls;
  };

  return {
    construct: construct,
    build: build,
    throttle: throttle,
    isPocketDevice: isPocketDevice,
    setControllerMethod: setControllerMethod
  };
}(window));
