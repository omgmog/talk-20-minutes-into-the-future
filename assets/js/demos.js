(function (window, document) {
  'use strict';
  NodeList.prototype.forEach = Array.prototype.forEach;

  var gl = window.gl;


  var qsa = function (sel) {
    return document.querySelectorAll(sel);
  };

  // set specific slide active for debug
  qsa('body > section:nth-child(46)')[0].classList.add('active');

  var hasClass = function (element, className) {
    do {
      if (element.classList && element.classList.contains(className)) {
        return true;
      }
      element = element.parentNode;
    } while (element);
    return false;
  };

  var demos;
  var module = {demos:{}};

  var collateDemos = function () {
    var intervals = [];
    demos = qsa('.demo');

    demos.forEach(function (el, i) {
      // THIS IS SO ROBUST!
      var demo = el.classList[1];

      intervals[i] = setInterval(function () {
        if (hasClass(el, 'active')) {
          module.demos[demo](el);

          // Stop trying to run this
          clearInterval(intervals[i]);
        }
      }, 100);
    });
  };

  var renderDeviceDemo = function (el, axis) {
    var T = window.THREE,
    width = 600,
    height = 300,
    aspect = width/height,
    depth = 1;
    var scene = new T.Scene();
    var camera = new T.OrthographicCamera(
      -depth * aspect,
      depth * aspect,
      depth,
      -depth,
      1,
      1000
    );
    var renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true
    });


    var cube = gl.build(
      'BoxGeometry',
      [1, 1.6, 0.2],
      'MeshBasicMaterial',
      [{
        color: 0x000000,
        opacity: 0,
      }]
    );
    scene.add(cube);

    var edges = new T.EdgesHelper(cube, 0xdd0000);
    edges.material.linewidth = 5;
    scene.add(edges);

    var rotationRanges = {
      x: [-0.9, 2.7],
      y: [-0.9, 0.9],
      z: [-3.6, 3.6]
    };
    var forwards = true;

    renderer.setSize( width, height );
    el.appendChild(renderer.domElement);


    var ambientLight = new T.AmbientLight(0xffffff);
    var pointLight = new T.PointLight(0xffffff, 6, 40);
    pointLight.position.set(10, 20, 20);
    scene.add(ambientLight, pointLight);

    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    function render () {
      var rotMin = rotationRanges[axis][0];
      var rotMax = rotationRanges[axis][1];
      var newRotation = cube.rotation[axis] + (forwards ? 0.04 : -0.04 );

      if (newRotation > rotMax) {
        forwards = false;
      }
      if (newRotation < rotMin) {
        forwards = true;
      }
      cube.rotation[axis] = newRotation;

      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
    render();
  };

  var renderMonolith = function (el) {
    var T = window.THREE;
    // Set it all up...
    var width = window.innerWidth, height = window.innerHeight, aspect = width/height;
    var scene = new T.Scene();
    var renderer = new T.WebGLRenderer({alpha: false, antialias: true, logarithmicDepthBuffer: true});

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.setSize( width, height );
    el.appendChild(renderer.domElement);

    var cube = gl.build(
      'BoxGeometry',
      [8, 18, 2],
      'MeshPhongMaterial',
      [{
        color: 0x000000,
        shading: T.FlatShading
      }]
    );
    cube.position.y = -10;
    cube.position.z = 2;
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);


    var ambientLight = new T.AmbientLight(
      0x222222, 0
    );
    scene.add(ambientLight);

    var lampx = -1;
    var lampy = 4;
    var lampz = -10;

    var bulb = gl.build(
      'SphereGeometry',
      [1,20,20],
      'MeshPhongMaterial',
      [{
        color: 0xffff00,
        shading: T.FlatShading,
      }]
    );
    bulb.position.set(lampx, lampy, lampz);
    // scene.add(bulb);

    var dlight = new T.SpotLight( 0xffffff, 1 );
    dlight.color.setHSL( 0.1, 1, 0.95 );
    dlight.position.set(lampx, lampy, lampz);
    dlight.position.multiplyScalar( 5 );
    dlight.castShadow = true;

    // Increase size for sharper shadows
    dlight.shadowMapWidth = 1024;
    dlight.shadowMapHeight = 1024;

    var d = 64;

    dlight.shadowCameraLeft = -d;
    dlight.shadowCameraRight = d;
    dlight.shadowCameraTop = d;
    dlight.shadowCameraBottom = -d;

    // dlight.shadowCameraFar = 3500;
    // dlight.shadowBias = -0.001;
    dlight.exponent = 1;

    // dlight.shadowCameraVisible = true;
    scene.add( dlight );

    // Create the ground
    var groundTexture = T.ImageUtils.loadTexture('assets/img/desert.jpg');
    groundTexture.wrapS = T.RepeatWrapping;
    groundTexture.wrapT = T.RepeatWrapping;
    groundTexture.repeat.set( 4, 4 );

    var groundMesh = gl.build(
      'PlaneBufferGeometry',
      [200, 200, 4, 4],
      'MeshBasicMaterial',
      [{
        color: 0x222222,
        map: groundTexture,
      }]
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -18;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Create the sky...
    var skyTexture = T.ImageUtils.loadTexture('assets/img/sky.jpg');
    skyTexture.wrapS = T.RepeatWrapping;
    skyTexture.wrapT = T.RepeatWrapping;
    var skyMesh = gl.build(
      'PlaneBufferGeometry',
      [200, 200, 1, 1],
      'MeshLambertMaterial',
      [{
        color: 0xffffff,
        map: skyTexture,
      }]
    );
    skyMesh.position.z = -50;
    skyMesh.position.y = -30;
    // skyMesh.material.opacity = 1;
    scene.add(skyMesh);

    // Camera...
    var minCamY = -10;
    var maxCamY = 15;

    var camera = new T.PerspectiveCamera(30, aspect, 1, 10000);
    camera.position.set(-10, 20, 20);

    camera.lookAt(cube.position);
    camera.position.y = minCamY;

    scene.fog = new T.Fog( 0x222222, 1, 500 );
    scene.fog.color.setHSL( 0.6, 0, 0.2 );

    // Action!
    function render() {
      // skyMesh.rotation.z += 0.005;
      skyMesh.position.y += 0.005;
      if (camera.position.y <= maxCamY) {
        camera.position.y += 0.02;
        camera.position.z += 0.02;
        camera.lookAt(cube.position);
        ambientLight.intensity += 0.02;
        dlight.intensity += 0.0005;
      }
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
    render();
  };

  module.demos.geolocation = function (el) {
    var button = document.createElement('button');
    var buttonLabel = document.createTextNode('DEMO TIME');
    button.appendChild(buttonLabel);

    var success = function (position) {
      var google = window.google;
      var mapcanvas = document.createElement('div');
      mapcanvas.id = 'mapcanvas';
      mapcanvas.style.height = '300px';
      mapcanvas.style.width = '600px';

      el.innerHTML = mapcanvas.outerHTML;

      var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var myOptions = {
        zoom: 16,
        center: latlng,
        mapTypeControl: false,
        // navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      var map = new google.maps.Map(document.getElementById('mapcanvas'), myOptions);

      var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        animation: google.maps.Animation.DROP,
      });
    };
    button.onclick = function (e) {
      e.stopPropagation();
      navigator.geolocation.getCurrentPosition(success, null);
    };

    el.appendChild(button);
  };
  module.demos.rotationx = function (el) {
    renderDeviceDemo(el, 'x');
  };
  module.demos.rotationy = function (el) {
    renderDeviceDemo(el, 'y');
  };
  module.demos.rotationz = function (el) {
    renderDeviceDemo(el, 'z');
  };
  module.demos.webaudio = function (el) {
    var button = document.createElement('button');
    var buttonLabel = document.createTextNode('DEMO TIME');
    button.appendChild(buttonLabel);

    var context = new window.AudioContext();
    var source;
    var file = 'assets/2001.wav';
    var request = new XMLHttpRequest();
    request.open('GET', file, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
      source = context.createBufferSource();
      context.decodeAudioData(request.response, function (buffer) {
        source.buffer = buffer;
      });
    };
    request.send();
    var playing = false;
    var clickHandler = function (e) {
      e.stopPropagation();
      if (!playing) {
        source.connect(context.destination);
        source.start(0);
        playing = true;
      } else {
        source.stop(0);
        source.disconnect();
        button.removeEventListener('click', clickHandler, false);
        button.innerText = 'Moving on...';
      }
      renderMonolith(el);
    };
    button.addEventListener('click', clickHandler, false);

    el.appendChild(button);
  };
  module.demos.r2 = function (el) {
    var context = new window.AudioContext();
    var source;
    var file = 'assets/r2d2.wav';
    var request = new XMLHttpRequest();
    request.open('GET', file, true);
    request.responseType = 'arraybuffer';
    request.onload = function () {
      source = context.createBufferSource();
      context.decodeAudioData(request.response, function (buffer) {
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
      });
    };
    request.send();
  };
  module.demos.threejs = function (el) {
    var T = window.THREE;
    // Set it all up...
    var width = 600, height = 300, aspect = width/height;
    var scene = new T.Scene();
    var renderer = new T.WebGLRenderer({alpha: true, antialias: true, logarithmicDepthBuffer: true});

    renderer.setSize( width, height );
    el.appendChild(renderer.domElement);

    // Create a cube...
    var cubeGeometry = new T.BoxGeometry(10, 10, 10);
    var cubeMaterial = new T.MeshBasicMaterial({color: 0x000000});
    var cube = new T.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Add some edges...
    var cubeEdges = new T.EdgesHelper(cube, 0xdd0000);
    cubeEdges.material.linewidth = 5;
    scene.add(cubeEdges);

      // Lights...
    var ambientLight = new T.AmbientLight(0xffffff);
    scene.add(ambientLight);
    var pointLight = new T.PointLight(0xffffff, 6, 40);
    pointLight.lookAt(scene.position);
    scene.add(pointLight);

    // Camera...
    var camera = new T.PerspectiveCamera(35, aspect, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(scene.position);

    // Action!
    function render() {
      cube.rotation.x += 0.04;
      cube.rotation.y += 0.02;
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
    render();
  };
  module.demos.threejs3d = function (el) {
    var T = window.THREE;
    // Set it all up...
    var width = 600, height = 300, aspect = width/height;
    var scene = new T.Scene();
    var renderer = new T.WebGLRenderer({alpha: true, antialias: true, logarithmicDepthBuffer: true});

    renderer.setSize( width, height );
    el.appendChild(renderer.domElement);

    var effect = new T.StereoEffect(renderer);
    effect.eyeSeparation = 1;
    effect.setSize( width, height );

    // Create a cube...
    var cubeGeometry = new T.BoxGeometry(10, 10, 10);
    var cubeMaterial = new T.MeshBasicMaterial({color: 0x000000});
    var cube = new T.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Add some edges...
    var cubeEdges = new T.EdgesHelper(cube, 0xdd0000);
    cubeEdges.material.linewidth = 5;
    scene.add(cubeEdges);

      // Lights...
    var ambientLight = new T.AmbientLight(0xffffff);
    scene.add(ambientLight);
    var pointLight = new T.PointLight(0xffffff, 6, 40);
    pointLight.lookAt(scene.position);
    scene.add(pointLight);

    // Camera...
    var camera = new T.PerspectiveCamera(35, aspect, 1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(cube.position);


    // Action!
    function render() {
      cube.rotation.x += 0.04;
      cube.rotation.y += 0.02;
      requestAnimationFrame(render);
      effect.render(scene, camera);
    }
    render();

    el.addEventListener('click', function (e) {
      e.stopPropagation();
      document.styleSheets[0].addRule('.threejs3d::after { content: "";');
    });
  };
  module.demos.backdrop = function (el) {
    var last_tick = new Date().getTime(),
    camera_tick = last_tick,
    camera_interval = 2000,
    ROT_90 = Math.PI / 2,
    speed = 1 / 6000,
    dif_x = speed,
    dif_y = speed,
    dif_z = speed;

    var aLight,
    colors = ['yellow', 'magenta', 'lime'],
    size,
    half,
    i,
    y,
    canvas,
    ctx,
    step,
    texture,
    material,
    geometry,
    mesh;

    var T = window.THREE;
    var width = window.innerWidth, height = window.innerHeight;
    var scene = new T.Scene();
    var renderer = new T.WebGLRenderer({alpha: true, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true});

    renderer.setSize( width, height );
    renderer.setClearColor(new T.Color(0x000000));
    el.appendChild(renderer.domElement);

    var camera = new T.PerspectiveCamera(90, 3 / 2, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    scene.add(camera);


    aLight = new T.AmbientLight(0x333333);
    scene.add(aLight);

    size = 512;
    half = size / 2;
    for (i = 0; i < 3; i++) {
      canvas = document.createElement('canvas');
      canvas.id = 'texture' + (i + 1);
      canvas.width = canvas.height = size;
      ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, size, size);
      step = Math.floor(size / 50);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;

      for (y = Math.floor(step / 2); y < size; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
        ctx.closePath();
      }

      texture = new T.Texture(canvas);
      texture.needsUpdate = true;
      material = new T.MeshBasicMaterial({ map: texture });
      geometry = new T.PlaneGeometry(size, size);

      var meshes = [
        {
          0: {
            rot: ['x', -ROT_90],
            pos: ['y', half]
          },
          1: {
            rot: ['y', ROT_90],
            pos: ['x', -half]
          },
          2: {
            rot: ['y', 0],
            pos: ['z', -half]
          }
        },

        {
          0: {
            rot: ['x', ROT_90],
            pos: ['y', half]
          },
          1: {
            rot: ['y', -ROT_90],
            pos: ['x', half]
          },
          2: {
            rot: ['y', 2 * ROT_90],
            pos: ['z', half]
          }
        }
      ];

      meshes.forEach(function (meshdata) {
        mesh = new T.Mesh(geometry, material);
        mesh.doubleSided = true;

        mesh.rotation[meshdata[i].rot[0]] = meshdata[i].rot[1];
        mesh.position[meshdata[i].pos[0]] = meshdata[i].pos[1];

        scene.add(mesh);
      });

    }


    el.appendChild(renderer.domElement);

    function render() {
      var this_tick = new Date().getTime(),
      elapsed = this_tick - last_tick;

      camera.rotation.x += elapsed * dif_x;
      camera.rotation.y += elapsed * dif_y;
      camera.rotation.z += elapsed * dif_z;

      if (this_tick - camera_tick > camera_interval) {
        dif_x = Math.random() * speed;
        dif_y = Math.random() * speed;
        dif_z = Math.random() * speed;
        camera_tick = this_tick;
      }
      last_tick = this_tick;

      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }
    render();

  };

  collateDemos();

}(window, document));
