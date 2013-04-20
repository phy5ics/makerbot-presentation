window.MB = window.MB || {};

MB.Core = function() {
	var container, stats;
	var camera, scene, renderer;
	var projector, plane, cube;
	var mouse2D, mouse3D, raycaster,
		rollOveredFace, isShiftDown = false,
		theta = 45 * 0.5, isCtrlDown = false;

	var rollOverMesh, rollOverMaterial, voxelPosition = new THREE.Vector3(), tmpVec = new THREE.Vector3();
	var cubeGeo, cubeMaterial;
	var i, intersector;

	var geometry = new THREE.Geometry();

	var gui, voxelConfig = {
		orthographicProjection: false
	};
	
	var setup = function() {
        camera = new THREE.CombinedCamera(window.innerWidth, window.innerHeight, 40, 1, 10000, -2000, 10000);
        camera.position.y = 800;

        scene = new THREE.Scene();

        // roll-over helpers

        rollOverGeo = new THREE.CubeGeometry(50, 50, 50);
        rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
        rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
        scene.add(rollOverMesh);

        // cubes

        cubeGeo = new THREE.CubeGeometry(50, 50, 50);
        cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff80 });
        // cubeMaterial = new THREE.MeshNormalMaterial();
        // cubeMaterial.color.setHSV(0.1, 0.7, 1.0);
        cubeMaterial.ambient = cubeMaterial.color;

        // picking
        projector = new THREE.Projector();

        // grid
        plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 20, 20), new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true }));
        plane.rotation.x = - Math.PI / 2;
        scene.add(plane);

        mouse2D = new THREE.Vector3(0, 10000, 0.5);

        // Lights
        var ambientLight = new THREE.AmbientLight(0x606060);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);

        // use WebGLRenderer if possible
        if (Detector.webgl) { 
          renderer = new THREE.WebGLRenderer({antialias: true});
        } else {
          renderer = new THREE.CanvasRenderer();
        }
        renderer.setSize(window.innerWidth, window.innerHeight);

		container = $('#container');
        container.append(renderer.domElement);

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mousedown', onDocumentMouseDown, false);
        document.addEventListener('keydown', onDocumentKeyDown, false);
        document.addEventListener('keyup', onDocumentKeyUp, false);
        window.addEventListener('resize', onWindowResize, false);

		$('#save').click(function() {
			save();
		});

	};
	
	var onWindowResize = function() {
		camera.setSize(window.innerWidth, window.innerHeight);
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
      }

	var getRealIntersector = function(intersects) {
		for(i = 0; i < intersects.length; i++) {
			intersector = intersects[ i ];
          	if (intersector.object != rollOverMesh) {
            	return intersector;
          	}
        }
        return null;
      }

	var setVoxelPosition = function(intersector) {
		tmpVec.copy(intersector.face.normal);
		tmpVec.applyMatrix4(intersector.object.matrixRotationWorld);

		voxelPosition.addVectors(intersector.point, tmpVec);
		voxelPosition.x = Math.floor(voxelPosition.x / 50) * 50 + 25;
		voxelPosition.y = Math.floor(voxelPosition.y / 50) * 50 + 25;
		voxelPosition.z = Math.floor(voxelPosition.z / 50) * 50 + 25;
	}

    var onDocumentMouseMove = function(event) {
        event.preventDefault();
        mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse2D.y = - (event.clientY / window.innerHeight) * 2 + 1;
	}

	var onDocumentMouseDown = function(event) {
		event.preventDefault();
		var intersects = raycaster.intersectObjects(scene.children);
		if(intersects.length > 0) {
			intersector = getRealIntersector(intersects);
          	// delete cube
          	if (isCtrlDown) {
            	if (intersector.object != plane) {
              		scene.remove(intersector.object);
            	}
          	// create cube
          } else {
            intersector = getRealIntersector(intersects);
            setVoxelPosition(intersector);

            var voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
            voxel.position.copy(voxelPosition);
            voxel.matrixAutoUpdate = false;
            voxel.updateMatrix();
            voxel.name = "voxel";
            
            THREE.GeometryUtils.merge(geometry, voxel);
            scene.add(voxel);
          }
		}
	}

      var onDocumentKeyDown = function(event) {
        switch(event.keyCode) {
          case 16: isShiftDown = true; break;
          case 17: isCtrlDown = true; break;
        }
      }

      var onDocumentKeyUp = function(event) {
        switch(event.keyCode) {
          case 16: isShiftDown = false; break;
          case 17: isCtrlDown = false; break;
        }
      }

      var save = function() {
        var stl = startExport();

        var blob = new Blob([stl], {type: 'text/plain'});
        saveAs(blob, 'pixel_printer.stl');
      }

      var animate = function() {
        requestAnimationFrame(animate);
        render();
      }

      var render = function() {
        if (isShiftDown) {
          theta += mouse2D.x * 1.5;
        }

        raycaster = projector.pickingRay(mouse2D.clone(), camera);
        var intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
          intersector = getRealIntersector(intersects);
          if (intersector) {
            setVoxelPosition(intersector);
            rollOverMesh.position = voxelPosition;
          }
        }

        camera.position.x = 1400 * Math.sin(THREE.Math.degToRad(theta));
        camera.position.z = 1400 * Math.cos(THREE.Math.degToRad(theta));

        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      }

      var startExport = function(){
        geometry = removeDuplicateFaces(geometry);
        THREE.GeometryUtils.triangulateQuads(geometry);

        var stl = generateSTL(geometry);
        return stl;
      }
	
	return {
		init: function() {
			setup();
			animate();
		}
	}
	
}();

$(document).ready(function(){
	MB.Core.init();
});
