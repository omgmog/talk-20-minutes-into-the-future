var gl = (function (window, document) {
  'use strict';
  var T = window.THREE;

  var construct = function (constructor, args) {
    function F() {
      return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
  };

  var build = function (geoType, geoProps, matType, matProps) {
    var geo = construct(T[geoType], geoProps);
    var mat = construct(T[matType], matProps);
    var mesh = new T.Mesh(geo, mat);
    return mesh;
  };

  return {
    build: build
  };

}(window, document));
