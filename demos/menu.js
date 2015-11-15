(function (window, core) {
  'use strict';
  // IMPORTS
  var T = window.THREE;
  var urlbase = '/demos/';

  // UTILITIES
  var scale = 0.8;
  var scaledUnit = function (unit) {
    return unit * scale;
  };
  if (core.isPocketDevice()) {
    document.body.classList.add('throwable');
  }

  var renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio||1);
  renderer.setSize(core.options.width, core.options.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  var effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.focalLength = 25;
  effect.setSize(core.options.width, core.options.height);
  var scene = new T.Scene();
  var camera = core.setCameraOptions();
  if (core.isPocketDevice()) {
    camera.position.y = 4;
  } else {
    camera.position.y = 10;
  }
  var controls = core.setControllerMethod(camera, renderer.domElement);
  var cards = [];
  var buttons = [];
  var assetsPath = core.options.assetsPath;

  var data = [
    {
      title: 'Basic VR',
      image: 'image1.png',
      id: 'basic_vr',
      position: {
        x: scaledUnit(-10),
        z: scaledUnit(-4),
      }
    },
    {
      title: 'Look Interaction',
      image: 'image2.png',
      id: 'look_interaction',
      position: {
        x: scaledUnit(-9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Gamepad Interaction',
      image: 'image3.png',
      id: 'gamepad_interaction',
      position: {
        x: scaledUnit(0),
        z: scaledUnit(11),
      }
    },
    {
      title: 'Using getUserMedia',
      image: 'image4.png',
      id: 'getusermedia',
      position: {
        x: scaledUnit(9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Spacial Audio',
      image: 'image5.png',
      id: 'spacial_audio',
      position: {
        x: scaledUnit(10),
        z: scaledUnit(-4),
      }
    }
  ];
  var createPlane = function (geometryOptions, materialOptions) {
    var geometry = core.construct(T.PlaneBufferGeometry, geometryOptions);
    var material = core.construct(T.MeshLambertMaterial, materialOptions);
    return new T.Mesh(geometry, material);
  };
  var handleCardLook = function (card) {
    var button;
    // Greedily reset other cards
    cards.forEach(function (card) {
      card.scale.set(1, 1, 1);
      card.lookAt(core.center);
      button = card.children[0];
    });

    // Make this card prominent
    var scale = 1.4;
    card.scale.set(scale, scale, 1);
    card.lookAt(new T.Vector3(0,1,0));
    button = card.children[0];
  };

  var launchDemo = function (thing) {
    thing.visible = true;
    setTimeout(function () {
      core.construct(thing.callback, null);
    }, 250);
  };

  var createDemoCards = function () {
    data.forEach(function (item, i) {
      var texture;
      if (item.image) {
        texture = new T.ImageUtils.loadTexture(assetsPath + item.image);
        texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
        texture.repeat.set(1,1);
        texture.minFilter = T.LinearFilter;
      }
      var card = createPlane(
        [7, 5.25, 1, 1],
        [{
          map: texture
        }]
      );
      card.position.x = item.position.x;
      card.position.z = item.position.z;
      card.lookAt(core.center);

      // Extra info
      card.name = item.id;
      card.viewid = 'card-' + i;

      var buttonTexture = new T.ImageUtils.loadTexture(assetsPath + 'launchButton.png');
      buttonTexture.wrapS = buttonTexture.wrapT = T.ClampToEdgeWrapping;
      buttonTexture.repeat.set(1,1);
      buttonTexture.minFilter = T.LinearFilter;

      var button = createPlane(
        [2, 1, 1, 1],
        [{
          color: 0xff0000,
          map: buttonTexture,
        }]
      );

      button.position.set(0, 0, 1);
      button.name = item.id + '_button';
      button.viewid = 'button-' + i;
      button.visible = false;
      button.callback = function () {
        window.location.href = urlbase + card.name;
      };
      buttons.push(button);
      card.add(button);

      cards.push(card);
      scene.add(card);
    });
  };
  var createGround = function () {
    var ground = createPlane([200, 200, 4, 4], [{ color: 0x555555 }]);
    ground.position.set(0, -10, -1);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  };
  var createLights = function () {
    var ambientlight = new T.AmbientLight(0xffffff, 1);
    scene.add(ambientlight);

    var spotlight = new T.SpotLight(0xffffff, 0.5);
    spotlight.position.set(0, 100, 0);
    spotlight.castShadow = true;
    spotlight.shadowMapWidth = 1024;
    spotlight.shadowMapHeight = 1024;
    spotlight.shadowCameraNear = 500;
    spotlight.shadowCameraFar = 4000;
    spotlight.shadowCameraFov = core.options.fov;
    scene.add(spotlight);
  };


  var lastViewedThing = null;
  var triggered = [];
  var count;
  var counter;
  var counterMax = 100;

  var checkIfViewingSomething = function (items, callback1, callback2) {
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera(core.center, camera);

    items.forEach(function (item, i) {
      var intersects = raycaster.intersectObject(item);

      if (intersects.length) {
        if (lastViewedThing === item.viewid) {
          if (count) {
            if (counter <= counterMax) {
              counter++;
            } else {
              callback2(item.children[0]);
              counter = 0;
              count = false;
            }
          }
        } else {
          lastViewedThing = item.viewid;
          triggered[i] = false;
          count = false;
          if (!triggered[i]) {
            count = true;
            counter = 0;
            callback1(item);
            triggered[i] = true;
          }
        }
      }
    });
  };

  var buildScene = function () {
    createGround();
    createDemoCards();
    createLights();
    scene.add(camera);
    animateRenderer();
  };


  var animateRenderer = function () {
    effect.render(scene, camera);
    controls.update();
    requestAnimationFrame(animateRenderer);
    checkIfViewingSomething(cards, handleCardLook, launchDemo);
  };

  var init = function () {
    buildScene();
    window.addEventListener('resize', function () {
      core.resizeRenderer(renderer, scene, camera, effect);
    }, false);
    document.body.appendChild(renderer.domElement);
  };

  // START
  init();
}(window, window.core));
