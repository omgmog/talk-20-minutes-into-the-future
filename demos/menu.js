var menu = (function (window, document) {
  'use strict';

  // Three vars
  var T = window.THREE;
  var gl = window.gl;
  var console = window.console;


  var renderer, effect, scene, camera, controls, center, width, height, aspect, fov, spotlight;


  var demos = [
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
    },
    {
      title: 'Basic VR',
      color: 0xff0000,
      image: 'image1.png',
      url: 'basic_vr'
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

    card = gl.build(
      'PlaneBufferGeometry',
      [4, 3, 2, 2],
      'MeshLambertMaterial',
      [{
        color: 0xffffff,
        map: texture
      }]
    );

    cards.push(card);
  };

  var positionCards = function (cards) {
    var theta = [];
    var totalCards = cards.length;
    var segments = -180 / totalCards;
    var radius = 10;

    for (var i = 0; i < totalCards; i++) {
      theta.push((segments / 150) * i * Math.PI);
    }

    cards.forEach(function (card, i) {
      cards[i].position.y = 0;
      cards[i].position.x = radius * (Math.cos(theta[i]));
      cards[i].position.z = radius * (Math.sin(theta[i]));
      cards[i].lookAt(center);
    });

    console.log('Cards positioned');
  };

  var setupThree = function () {
    height = window.innerHeight;
    width = window.innerWidth;
    aspect = width / height;
    fov = 30;
    scene = new T.Scene();
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    center = new T.Vector3(0,1,0);


    effect = new T.StereoEffect(renderer);
    effect.eyeSeparation = 1;
    effect.setSize( width, height );

    camera = new T.PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.position.set(0, 10, 0);
    scene.add(camera);


    controls = new T.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;
    controls.enablePan = false;

    var deviceOrientationEvent = function () {
      camera.position.y = 4;
      controls = new T.DeviceOrientationControls(camera, true);
      window.removeEventListener('deviceorientation', deviceOrientationEvent, false);
    };

    window.addEventListener('deviceorientation', deviceOrientationEvent, false);

    document.body.appendChild(renderer.domElement);
    console.log('Three setup');
  };

  var render = function () {
    effect.render(scene, camera);
    requestAnimationFrame(render);
    controls.update();
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
    demos.forEach(function (demo, i) {
      createCard(demo);
    });
    cards.forEach(function (card, i) {
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

    console.log('Menu displayed');
  };

  var buildAxes = function () {
    var axes = new THREE.Object3D();

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
      renderer.setSize(w, h);
      effect.setSize(w, h);
      effect.render(scene, camera);
    };
  };

  var init = function () {
    setupThree();
    displayMenu();
    buildAxes();
    render();
    fullScreen();
    screenResize();
  };

  return {
    init: init
  };
}(window, document));

menu.init();
