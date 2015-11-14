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
  var setCameraOptions = function () {
    var camera;
    camera = new T.PerspectiveCamera(fov, aspect, near, far);
    if (core.isPocketDevice()) {
      camera.position.y = 4;
    } else {
      camera.position.y = 10;
    }
    camera.lookAt(center);
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
    circle = new T.Line( geometry, material ) ;
    circle.position.z = -10;
    camera.add( circle );

    return camera;
  };

  var center = new T.Vector3(0,0,0);
  var width = window.innerWidth;
  var height = window.innerHeight;
  var aspect = width / height;
  var fov = 40;
  if (core.isPocketDevice()) {
    fov = 90;
  }
  var near = 0.1;
  var far = 10000;
  var renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio||1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  var effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.setSize(width, height);
  var scene = new T.Scene();
  var circle;
  var camera = setCameraOptions();
  var controls = core.setControllerMethod(camera, renderer.domElement);
  var cards = [];
  var buttons = [];
  var assetsPath = 'assets/';

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
      image: 'image2.jpeg',
      id: 'look_interaction',
      position: {
        x: scaledUnit(-9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Gamepad Interaction',
      image: 'image3.jpeg',
      id: 'gamepad_interaction',
      position: {
        x: scaledUnit(0),
        z: scaledUnit(11),
      }
    },
    {
      title: 'Using getUserMedia',
      image: 'image4.jpeg',
      id: 'getusermedia',
      position: {
        x: scaledUnit(9),
        z: scaledUnit(6.5),
      }
    },
    {
      title: 'Spacial Audio',
      image: 'image5.jpeg',
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
      card.lookAt(center);
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
    }, 1000);
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
      card.lookAt(center);

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
    spotlight.shadowCameraFov = 30;
    scene.add(spotlight);
  };


  var lastViewedThing = null;
  var triggered = [];
  var count;
  var counter;
  var counterMax = 250;
  var checkIfViewingSomething = function (items) {
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera(center, camera);

    items.forEach(function (item, i) {
      var intersects = raycaster.intersectObject(item);

      if (intersects.length) {
        var button = item.children[0];
        if (lastViewedThing === item.viewid) {
          if (count) {
            if (counter <= counterMax) {
              counter++;
            } else {
              launchDemo(button);
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
            handleCardLook(item);
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
    checkIfViewingSomething(cards);
  };

  var resizeRenderer = function () {
    width = window.innerWidth;
    height = window.innerHeight;
    aspect = width / height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    effect.setSize(width, height);
    effect.render(scene, camera);

  };
  var init = function () {
    buildScene();
    window.addEventListener('resize', resizeRenderer, false);
    document.body.appendChild(renderer.domElement);
  };

  // START
  init();
}(window, window.core));
