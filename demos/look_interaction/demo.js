var demo = (function(window, document) {
  'use strict';
  var core = window.core;
  var T = window.THREE;

  var renderer, scene, camera, effect, controls;

  var ground, ambientLight;

  scene = new T.Scene();
  camera = core.setCameraOptions();
  if (core.isPocketDevice()) {
    camera.position.set(0, 20, 20);
  } else {
    camera.position.set(0, 50, 50);
  }
  scene.add(camera);

  renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(core.options.width, core.options.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.soft = true;
  document.body.appendChild(renderer.domElement);
  controls = core.setControllerMethod(camera, renderer.domElement);

  effect = new T.StereoEffect(renderer);
  effect.eyeSeparation = 1;
  effect.focalLength = 25;
  effect.setSize(core.options.width, core.options.height);

  var groundTexture = T.ImageUtils.loadTexture('grid.png');
  groundTexture.wrapS = groundTexture.wrapT = T.RepeatWrapping;
  groundTexture.repeat.set(1000, 1000); // Number of times to repeat texture
  groundTexture.anisotropy = renderer.getMaxAnisotropy();
  ground = core.build(
    'PlaneBufferGeometry', [2000, 2000, 100],
    'MeshLambertMaterial', [{
      color: 0x222222,
      map: groundTexture
    }]
  );
  ground.position.y = -10;
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);


  ambientLight = new T.AmbientLight(0xf0f0f0, 0.2);
  scene.add(ambientLight);



  // First define each level
  var icons = ['dorito', 'cake', 'cheese', 'donut'];

  var levels = [
    {
      target: 'dorito',
      rows: [
        [0,1,3],
        [3,2,1],
        [1,3,2],
      ]
    },
    {
      target: 'cake',
      rows: [
        [0,3,2],
        [3,1,0],
        [2,0,3],
      ]
    }
  ];


  var levelObjects = [];

  var iconWidth = 8;
  var iconHeight = 6;
  var space = 2;
  var boardWidth = (iconWidth * 3) + (space * 4);

  levels.forEach(function (level) {
    var target = level.target;
    var rows = level.rows;

    var levelObject = new T.Object3D();
    var levelBoard = new T.Object3D();
    levelBoard.name = target;
    var targetBoard = new T.Object3D();
    targetBoard.position.x = boardWidth;
    levelObject.add(levelBoard);
    levelObject.add(targetBoard);

    var targetTexture = T.ImageUtils.loadTexture('icons/' + target + '.png');
      targetTexture.wrapS = targetTexture.wrapT = T.ClampToEdgeWrapping;
      targetTexture.repeat.set(1,1);
      targetTexture.minFilter = T.LinearFilter;

    var targetWidth = (iconWidth * 2) + space;
    var targetHeight = (iconHeight * 2) + space;
    var targetObject = core.build(
      'PlaneBufferGeometry',
      [targetWidth, targetHeight, 1, 1],
      'MeshLambertMaterial',
      [{
        map: targetTexture
      }]
    );
    targetObject.name = target;
    targetObject.position.y = -space;
    targetBoard.add(targetObject);

    var statusTexture = T.ImageUtils.loadTexture('icons/instructions.png');
      statusTexture.wrapS = statusTexture.wrapT = T.ClampToEdgeWrapping;
      statusTexture.repeat.set(1,1);
      statusTexture.minFilter = T.LinearFilter;
    var statusWidth = (iconWidth * 2) + space;
    var statusHeight = (iconHeight);
    var statusObject = core.build(
      'PlaneBufferGeometry',
      [statusWidth, statusHeight, 1, 1],
      'MeshLambertMaterial',
      [{
        map: statusTexture
      }]
    );
    statusObject.position.y = -targetHeight;
    targetBoard.add(statusObject);

    rows.forEach(function (row, r) {
      var rowObject = new T.Object3D();

      row.forEach(function (icon, i) {
        var actualIcon = icons[icon];
        var iconTexture = T.ImageUtils.loadTexture('icons/' + actualIcon + '.png');
        iconTexture.wrapS = iconTexture.wrapT = T.ClampToEdgeWrapping;
        iconTexture.repeat.set(1,1);
        iconTexture.minFilter = T.LinearFilter;

        var iconObject = core.build(
          'PlaneBufferGeometry',
          [iconWidth,iconHeight,1,1],
          'MeshLambertMaterial',
          [{
            map: iconTexture
          }]
        );
        iconObject.name = actualIcon;
        iconObject.position.x = (i * iconWidth) + (space * (i - 1));
        iconObject.position.y = (-r * iconHeight) + (space * -(r - 1));

        var button = core.build(
          'PlaneBufferGeometry',
          [iconWidth, iconHeight, 1, 1],
          'MeshLambertMaterial',
          [{
            color: 0xff0000
          }]
        );
        button.material.visible = false;
        button.position.set(0, 0, 1);
        iconObject.add(button);
        rowObject.add(iconObject);
      });


      levelBoard.add(rowObject);
    });

    targetBoard.position.z = -20;
    levelBoard.lookAt(new T.Vector3(2,0,4));

    levelObject.position.y = 15;
    levelObject.position.z = -5;
    levelObject.position.x = -(((5 * iconWidth) + (2 * space)) / 2);

    levelObjects.push(levelObject);
  });




  var lastViewedThing = null;
  var triggered = [];

  var checkIfViewingSomething = function (items, callback1, callback2, callback3) {
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera(core.center, camera);

    var intersects = raycaster.intersectObjects(items);

    if (intersects.length) {
      var item = intersects[0].object; // the thing we've hit
      if (item.id !== lastViewedThing) {
        lastViewedThing = item.id;
        if (!triggered[item.id]) {
          callback1(item.children[0]);
          triggered[item.id] = true;
        }
        setTimeout(function () {
          if (typeof callback3 === 'function') {
            callback3(item);
          }
        }, 1000);
      }else{
        if (triggered[item.id]) {
          setTimeout(function () {
            triggered[item.id] = null;
            callback2(item);
          }, 250);
        }
      }

    }

  };
  var backDevice = core.addBackDevice();
  scene.add(backDevice);

  var currentLevel = 0;
  var currentLevelIcons;
  var levelPassed = false;
  var currentLevelObject = levelObjects[currentLevel];
  scene.add(currentLevelObject);
  setInterval(function () {
    if (levelPassed && currentLevel < (levelObjects.length - 1)) {
      levelPassed = false;
      scene.remove(currentLevelObject);
      currentLevel++;
      currentLevelObject = levelObjects[currentLevel];
      scene.add(currentLevelObject);
      render();
    }
  }, 100);

  var getCurrentLevelIcons = function (currentLevel) {
    return [
      levelObjects[currentLevel].children[0].children[0].children,
      levelObjects[currentLevel].children[0].children[1].children,
      levelObjects[currentLevel].children[0].children[2].children
    ];
  };


  var highlightBackDevice = function (device){
    device.material.visible = true;
  };
  var triggerBackDevice = function (){
    history.back();
  };
  var highlightIcon = function (icon) {
    // icon.material.visible = true;
  };
  var testIfCorrectIcon = function (icon) {
    var target = icon.parent.parent.name;
    var current = icon.name;
    var color, image;
    var statusMaterial = levelObjects[currentLevel].children[1].children[1].material;
    statusMaterial.visible = false;

    if (current !== target) {
      image = 'icons/wrong.png';
      color = 0xff0000;
    } else {
      image = 'icons/correct.png';
      color = 0x00ff00;
      levelPassed = true;
    }
    var texture = new T.ImageUtils.loadTexture(image);
    texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
    texture.repeat.set(1,1);
    texture.minFilter = T.LinearFilter;
    statusMaterial.map = texture;
    // statusMaterial.needsUpdate = true;
    statusMaterial.color.setHex(color);
    statusMaterial.visible = true;
  };

  var resetIcon = function (icon) {
    icon.children[0].material.visible = false;
  };
  var render = function() {
    controls.update();

    effect.render(scene, camera);
    requestAnimationFrame(render);
    checkIfViewingSomething([backDevice], highlightBackDevice, triggerBackDevice, null);
    currentLevelIcons = getCurrentLevelIcons(currentLevel);
    currentLevelIcons = [].concat.apply([], currentLevelIcons);
    checkIfViewingSomething(currentLevelIcons, highlightIcon, testIfCorrectIcon, resetIcon);

    levelObjects[currentLevel].children[1].lookAt(new T.Vector3(camera.position.x, 0, camera.position.z));
  };
  render();

  window.addEventListener('resize', function() {
    core.resizeRenderer(renderer, scene, camera, effect);
  }, false);

}(window, document));
