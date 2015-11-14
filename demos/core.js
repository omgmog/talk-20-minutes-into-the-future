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
  var resizeRenderer = function (renderer, scene, camera, effect) {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var aspect = width / height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effect.setSize(width, height);
    effect.render(scene, camera);
  };

  var setCameraOptions = function () {
    var camera;
    camera = new T.PerspectiveCamera(core.options.fov, core.options.aspect, core.options.near, core.options.far);

    var radius = 0.125;
    var segments = 32;
    var material = new T.LineBasicMaterial(
      {
        color: 0x111111,
        linewidth: 5,
        transparent: true,
        opacity: 0.8
      }
    );
    var geometry = new T.CircleGeometry( radius, segments );
    geometry.vertices.shift();
    var circle = new T.Line( geometry, material ) ;
    circle.position.z = -10;
    camera.add(circle);

    return camera;
  };

  var options = {
    fov: 40,
    width: window.innerWidth,
    height: window.innerHeight,
    aspect: 1,
    near: 0.1,
    far: 1000,
  };
  // Override some options based on context
  options.aspect = options.width / options.height;
  if (isPocketDevice()) {
    options.fov = 90;
  }

  return {
    options: options,
    construct: construct,
    build: build,
    throttle: throttle,
    isPocketDevice: isPocketDevice,
    setControllerMethod: setControllerMethod,
    resizeRenderer: resizeRenderer,
    setCameraOptions: setCameraOptions
  };
}(window));
