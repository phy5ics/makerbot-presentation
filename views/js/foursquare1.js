window.MB = window.MB || {};

MB.Core = function() {
	var container;
	var camera, controls, scene, renderer;
	var cross;

	var init = function() {
		var rowCount = 1;
		var rowMax = 6;
		var columnCount = 1;
		var columnMax = Math.floor(grid.length / rowMax);
		var elementSize = 40;
		
		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
		camera.position.z = 500;

		controls = new THREE.OrbitControls(camera);
		controls.center = new THREE.Vector3((rowMax * elementSize) / 2, 0, (columnMax * elementSize) / 2);
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5;
		controls.addEventListener('change', render);

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

		// world
		var material =  new THREE.MeshLambertMaterial({ color:0xffffff, shading: THREE.FlatShading });
		
		for (var i = 1; i < grid.length; i++) {
			if (rowCount < rowMax) {
				rowCount++;
			} else {
				rowCount = 1;
				columnCount++;
			}
			
			var height = (grid[i].checkins + 1) * 5;
			var geometry = new THREE.CylinderGeometry(0, elementSize, height, 4, 1);
			
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.x = ((rowCount * elementSize) + columnCount);
			mesh.position.y = height / 2;
			mesh.position.z = ((columnCount * elementSize) + rowCount);
			mesh.updateMatrix();
			mesh.matrixAutoUpdate = false;
			scene.add(mesh);
		}

		// lights
		light = new THREE.DirectionalLight(0xffffff);
		light.position.set(1, 1, 1);
		scene.add(light);

		light = new THREE.DirectionalLight(0x000000);
		light.position.set(-1, -1, -1);
		scene.add(light);

		light = new THREE.AmbientLight(0x222222);
		scene.add(light);


		// renderer
		renderer = new THREE.WebGLRenderer({ antialias: false });
		renderer.setClearColor(scene.fog.color, 1);
		renderer.setSize(window.innerWidth, window.innerHeight);

		container = $('#container');
		container.append(renderer.domElement);

		window.addEventListener('resize', onWindowResize, false);
	}

	var onWindowResize = function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		render();
	}

	var animate = function() {
		requestAnimationFrame(animate);
		controls.update();
	}

	var render = function() {
		renderer.render(scene, camera);
	}

	return {
		init: function() {
			init();
			animate();
		}
	}

}();

$(document).ready(function(){
	MB.Core.init();
});