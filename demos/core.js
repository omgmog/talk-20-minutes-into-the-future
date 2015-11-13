var core = (function (window, document) {
  'use strict';
  var T = window.THREE;
  var console = window.console;


  var isThrowable = function () {
    return (typeof window.orientation !== 'undefined');
  };
  if (isThrowable()) {
    document.body.classList.add('throwable');
  }
  var controllerMethod = function (controls, camera, domElement) {
    if (isThrowable()) {
      controls = new T.DeviceOrientationControls(camera, true);
    } else {
      controls = new T.OrbitControls( camera, domElement );
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = false;
      controls.enablePan = false;
    }
    return controls;
  };

  var init = function () {
    console.log('Core');
  };

  return {
    controllerMethod: controllerMethod,
    isThrowable: isThrowable,

    init: init
  };
}(window, document));

core.init();
