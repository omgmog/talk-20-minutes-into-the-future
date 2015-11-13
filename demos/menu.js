var menu = (function (window, document) {
  'use strict';

  // Three vars
  var T = window.THREE;
  var gl = window.gl;
  var core = window.core;
  var console = window.console;


  var renderer, effect, scene, camera, controls, center, width, height, aspect, fov, spotlight;

  var scalingFactor = .8;
  var lookTargets = [
    {
      x: -10 * scalingFactor,
      z: -4 * scalingFactor
    },
    {
      x: -9 * scalingFactor,
      z: 6.5 * scalingFactor
    },
    {
      x: 0 * scalingFactor,
      z: 11 * scalingFactor
    },
    {
      x: 9 * scalingFactor,
      z: 6.5 * scalingFactor
    },
    {
      x: 10 * scalingFactor,
      z: -4 * scalingFactor
    }
  ];

  var demos = [
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Look Interaction',
      color: 0x00ff00,
      image: 'image1.png',
      url: 'look_interaction'
    },
    {
      title: 'Gamepad Interaction',
      color: 0x0000ff,
      image: 'image1.png',
      url: 'gamepad_interaction'
    },
    {
      title: 'getUserMedia',
      color: 0xff00ff,
      image: 'image1.png',
      url: 'getusermedia'
    },
    {
      title: 'Spacial Audio',
      color: 0xffff00,
      image: 'image1.png',
      url: 'spacial_audio'
    }
  ];

  var cards = [];

  var createCard = function (cardData) {
    var card;
    var texture = T.ImageUtils.loadTexture(cardData.image);
    texture.wrapS = T.ClampToEdgeWrapping;
    texture.wrapT = T.ClampToEdgeWrapping;
    texture.repeat.set( 1, 1 );
    texture.minFilter = T.LinearFilter;

    var scalingFactor = 0.8;
    var unit = 8;
    var ratio = (1/4)*3;
    var width = unit * scalingFactor;
    var height = unit * ratio * scalingFactor;
    card = gl.build(
      'PlaneBufferGeometry',
      [width, height, 2, 2],
      'MeshLambertMaterial',
      [{
        color: cardData.color,
        map: texture
      }]
    );
    card.url = cardData.url;

    cards.push(card);
  };

  var positionCards = function (cards) {
    cards.forEach(function (card, i) {
      var target = lookTargets[i];
      card.position.x = target.x;
      card.position.z = target.z;
      card.lookAt(center);
    });
  };

  var setupThree = function () {
    height = window.innerHeight;
    width = window.innerWidth;
    aspect = width / height;
    fov = 90;
    scene = new T.Scene();
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    center = new T.Vector3(0,1,0);


    effect = new T.StereoEffect(renderer);
    effect.eyeSeparation = 1;
    effect.setSize( width, height );

    camera = new T.PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.position.set(0, 10, 0);

    scene.add(camera);

    controls = core.controllerMethod(controls, camera, renderer.domElement);

    if (core.isThrowable()) {
      camera.position.y = 4;
    }

    document.body.appendChild(renderer.domElement);
    console.log('Three setup');
  };

  var viewedItem = null;
  var previousViewedItem = null;
  var getViewedItem = function () {
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera(new T.Vector3(0,0,0), camera);

    cards.forEach(function (card, i) {
      var intersects = raycaster.intersectObject(card);

      if (intersects.length) {
        card = intersects[0].object;
        viewedItem = card;
        card.material.color.setHex(0xffffff);
        card.material.transparent = true;
        card.material.opacity = 0.5;
      }else{
        card.material.color.setHex(demos[i].color);
        card.material.transparent = false;
        card.material.opacity = 1;
      }
    });
    console.log(viewedItem);
  };
  var render = function () {
    effect.render(scene, camera);
    requestAnimationFrame(render);
    controls.update();
    getViewedItem();
  };

  var lightScene = function () {
    var ambientLight = new T.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    spotlight = new T.SpotLight(0xffffff, 0.5);
    spotlight.position.set(0, 100, 0);
    spotlight.castShadow = true;

    spotlight.shadowMapWidth = 1024;
    spotlight.shadowMapHeight = 1024;

    spotlight.shadowCameraNear = 500;
    spotlight.shadowCameraFar = 4000;
    spotlight.shadowCameraFov = 30;
    scene.add(spotlight);

    console.log('Scene lit');
  };

  var displayMenu = function () {
    demos.forEach(function (demo) {
      createCard(demo);
    });
    cards.forEach(function (card) {
      scene.add(card);
      card.receiveShadow = true;
      card.castShadow = true;
    });
    positionCards(cards);
    lightScene();
    var ground = gl.build(
      'PlaneBufferGeometry',
      [200, 200, 4, 4],
      'MeshLambertMaterial',
      [{
        color: 0x777777
      }]
    );
    scene.add(ground);
    ground.position.y = -10;
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -1;
    ground.receiveShadow = true;
  };

  var buildAxes = function () {
    var axes = new T.Object3D();

    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( 100, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( -100, 0, 0 ), 0x800000, true) ); // -X
    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( 0, 100, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( 0, -100, 0 ), 0x008000, true ) ); // -Y
    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( 0, 0, 100 ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new T.Vector3( 0, 0, 0 ), new T.Vector3( 0, 0, -100 ), 0x000080, true ) ); // -Z

    scene.add( axes );

  };
  function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new T.Geometry(),
      mat;

    if(dashed) {
      mat = new T.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: 5, gapSize: 5 });
    } else {
      mat = new T.LineBasicMaterial({ linewidth: 1, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );

    var axis = new T.Line( geom, mat );

    return axis;

  }
  var fullScreen = function () {
    document.querySelector('button').addEventListener('click', function () {
      document.body.webkitRequestFullScreen();
    }, false);
  };
  var screenResize = function () {

    window.onresize = function () {
      var w = window.innerWidth;
      var h = window.innerHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      effect.setSize(w, h);
      effect.render(scene, camera);
    };
  };

  var init = function () {
    setupThree();
    displayMenu();
    buildAxes();
    getViewedItem();
    render();
    fullScreen();
    screenResize();
  };

  return {
    init: init
  };
}(window, document));

menu.init();
