window.MB = window.MB || {};

MB.Core = function() {
	var container;
	var camera, controls, scene, renderer;
	var cross;

	var init = function() {
		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
		camera.position.z = 500;

		controls = new THREE.OrbitControls(camera);
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5;
		controls.addEventListener('change', render);

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

		// world

		// var geometry = new THREE.CylinderGeometry(0, 10, 30, 4, 1);
		var material =  new THREE.MeshLambertMaterial({ color:0xffffff, shading: THREE.FlatShading });

		for (var i = 0; i < 500; i ++) {
			var height = Math.floor(Math.random()*100);
			var geometry = new THREE.CylinderGeometry(0, 10, height, 4, 1);
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.x = (Math.random() - 0.5) * 1000;
			mesh.position.y = height / 2;
			mesh.position.z = (Math.random() - 0.5) * 1000;
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