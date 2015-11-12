var menu = (function (window, document) {
  'use strict';

  // Three vars
  var T = window.THREE;
  var renderer, scene, camera, controls, center, width, height, aspect, fov, spotlight;


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
    }
  ];

  var cards = [];
  var hits = [];

  var createCard = function (cardData) {
    var card;
    var texture = T.ImageUtils.loadTexture(cardData.image);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    texture.repeat.set( 1, 1 );

    card = gl.build(
      'PlaneBufferGeometry',
      [4, 3, 1, 1],
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
      cards[i].position.x = Math.round(radius * (Math.cos(theta[i])));
      cards[i].position.z = Math.round(radius * (Math.sin(theta[i])));
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

    camera = new T.PerspectiveCamera(fov, aspect, 0.1, 10000);
    camera.position.set(0, 10, 0);
    scene.add(camera);

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;
    controls.enablePan = false;

    document.body.appendChild(renderer.domElement);
    console.log('Three setup');
  };

  var render = function () {
    renderer.render(scene, camera);
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

  var setupInteraction = function () {

    renderer.domElement.addEventListener('mousedown', function (e){
      var pointx = (e.pageX - this.offsetLeft) / this.width * 2 - 1;
      var pointy = (e.pageY - this.offsetTop) / this.height * 2 - 1;
      var pointz = 0.5;
      console.log(pointx, pointy);

      var vector = new T.Vector3(
        pointx,
        pointy,
        pointz
      );
      vector.unproject(camera);

      var hit = gl.build(
        'BoxGeometry',
        [1,1,1],
        'MeshPhongMaterial',
        [{
          color: 0x0000dd,
          specular: 0xffffff,
          shininess: 30,
          shading: T.FlatShading,
          transparent: true,
          opacity: 0.2
        }]
      );
      hit.position.set(
        pointx,
        pointy,
        pointz
      );
      scene.add(hit);
      hits.push(hit);

      var raycaster = new T.Raycaster(
        camera.position,
        vector.sub(camera.position).normalize()
      );
      var intersects = raycaster.intersectObjects(cards);

      if (intersects.length > 0) {
        intersects[0].object.material.transparent = true;
        if (intersects[0].object.material.opacity === 0.5) {
          intersects[0].object.material.opacity = 1;
        } else {
          intersects[0].object.material.opacity = 0.5;
        }

        var points = [];
        points.push(new T.Vector3(camera.position.x,camera.position.y - 0.2, camera.position.z));
        points.push(intersects[0].point);

        var tube = gl.build(
          'TubeGeometry',
          [new T.CatmullRomCurve3(points), 60, 0.001],
          'MeshBasicMaterial',
          [{
            color: 0xff0000,
          }]
        );
        scene.add(tube);
      }


    }, false);
  };

  var buildAxes = function () {
    var axes = new THREE.Object3D();

    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 100, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -100, 0, 0 ), 0x800000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 100, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -100, 0 ), 0x008000, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 100 ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -100 ), 0x000080, true ) ); // -Z

    scene.add( axes );

  };
  function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),
      mat;

    if(dashed) {
      mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: 5, gapSize: 5 });
    } else {
      mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
    }

    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );

    var axis = new THREE.Line( geom, mat );

    return axis;

  }

  var init = function () {
    setupThree();
    displayMenu();
    // setupInteraction();
    buildAxes();
    render();
  };

  return {
    init: init
  };
}(window, document));

menu.init();