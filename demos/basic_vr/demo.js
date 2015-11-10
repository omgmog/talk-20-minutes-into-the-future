var demo = (function (window, document) {
  'use strict';
  var gl = window.gl;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls,
  width = window.innerWidth,
  height = window.innerHeight;

  var cube, ground, ambientLight, light, bulb;

  var fov = 100;
  var el = document.body;

  var init = function () {
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(fov, width/height, 1, 1000);
    controls = new T.DeviceOrientationControls(camera, true);

    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    el.appendChild(renderer.domElement);

    effect = new T.StereoEffect(renderer);
    effect.eyeSeparation = 1;
    effect.setSize( width, height );

    var groundTexture = T.ImageUtils.loadTexture('grid.png');
    groundTexture.wrapS = groundTexture.wrapT = T.RepeatWrapping;
    groundTexture.repeat.set( 100, 100 ); // Number of times to repeat texture
    ground = gl.build(
      'PlaneBufferGeometry',
      [200, 200, 4, 4],
      'MeshLambertMaterial',
      [{
        color: 0x222222,
        map: groundTexture
      }]
    );
    ground.position.y = -10;
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    cube = gl.build(
      'BoxGeometry',
      [10, 10, 10],
      'MeshPhongMaterial',
      [{
        color: 0xdd0000,
        shading: T.FlatShading,
      }]
    );
    cube.position.set(0, 10, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
    scene.add(ambientLight);

    var lampx = 0;
    var lampy = 20;
    var lampz = -10;

    bulb = gl.build(
      'SphereGeometry',
      [1,20,20],
      'MeshPhongMaterial',
      [{
        color: 0xffff00,
        shading: T.FlatShading,
      }]
    );
    bulb.position.set(lampx, lampy, lampz);
    scene.add(bulb);

    camera.position.set(0, 20, 15);
    camera.lookAt(bulb.position);

    light = new T.DirectionalLight( 0xffffff, 1 );
    light.color.setHSL( 0.1, 1, 0.95 );
    light.position.set(lampx, lampy, lampz);
    light.position.multiplyScalar( 40 );
    light.castShadow = true;

    // Increase size for sharper shadows
    light.shadowMapWidth = 512;
    light.shadowMapHeight = 512;

    var d = 128;

    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;

    light.shadowCameraFar = 3500;
    light.shadowBias = -0.0001;

    // light.shadowCameraVisible = true;
    scene.add( light );


    render();

    window.onresize = function () {
      var w = window.innerWidth;
      var h = window.innerHeight;
      camera.aspect = w/h;
      renderer.setSize(w, h);
      effect.setSize(w, h);
      effect.render(scene, camera);
    };

    document.querySelector('button').addEventListener('click', function () {
      document.body.webkitRequestFullScreen();
    }, false);
  };

  var render = function () {
    cube.rotation.x += 0.04;
    cube.rotation.y += 0.02;

    controls.update();

    effect.render(scene, camera);
    requestAnimationFrame(render);
  };

  return {
    init: init
  };

}(window, document));

demo.init();
