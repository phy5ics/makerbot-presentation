window.MB = window.MB || {};

MB.Core = function() {
	// internal vars
	var camera,
		scene,
		renderer		= null,
		canvas			= null,
		context			= null,
		$container 		= $('#container'),
		width			= $container.width(),
		height			= $container.height(),
		vars			= [],
		projector		= new THREE.Projector(),
		center			= new THREE.Vector3(),
		orbitCamera		= true,
		orbitValue		= 0,
		image			= null,
		running 		= true,
	// core objects
		surface			= null,
		surfaceVerts	= [],
	// constants
		DAMPEN			= .9,
		AGGRESSION		= 400,
		DEPTH 			= 1000,
		NEAR 			= 1,
		FAR 			= 10000,
		X_RESOLUTION	= 20,
		Y_RESOLUTION	= 20,
		SURFACE_WIDTH	= 400,
		SURFACE_HEIGHT	= 400,
		fin 			= true;

	var pause = function() {
		running = false;
	};

	var play = function() {
		if(!running) {
			running = true;
			update();
		}
	};
	
	var init = function() {
		// stop the user clicking
		document.onselectstart = function(){ return false; };

		$container = $('#container');
		width = $container.width();
		height = $container.height();

		// set up our initial vars
		vars["magnitude"]			= 30;
		vars["orbitSpeed"]			= 0.001;
		vars["orbit"]				= true;
		vars["wireframeOpacity"]	= 1;
		vars["raindrops"]			= true;
		vars["elasticity"]			= 0.001;

		// add listeners
		addEventListeners();

		// create our stuff
		if(createRenderer()) {
			console.log('OK');
			createObjects();
			addLights();

			// start rendering, which will
			// do nothing until the image is dropped
			update();

		} else {
			$('html').removeClass('webgl').addClass('no-webgl');
		}
	};
	
	/**
	 * Simple handler function for 
	 * the events we don't care about
	 */
	var cancel = function(event) {
		if(event.preventDefault)
			event.preventDefault();
		return false;
	}

	/**
	 * Adds some basic lighting to the
	 * scene. Only applies to the centres
	 */
	var addLights = function() {
		// point
		pointLight = new THREE.PointLight(0xFFFFFF);
		pointLight.position.set(10, 400, 10);
		scene.add(pointLight);
	}

	/**
	 * Creates the objects we need
	 */
	var createObjects = function() {
		//controls = new THREE.OrbitControls(camera);
		//controls.addEventListener('change', render);
		
 		//var planeMaterialWire = new THREE.MeshLambertMaterial({color: 0xFFFFFF, wireframe:true});
		var material = new THREE.MeshLambertMaterial({color: 0xEAEAEA});

		surface = new THREE.Mesh(new THREE.PlaneGeometry(SURFACE_WIDTH, SURFACE_HEIGHT, X_RESOLUTION, Y_RESOLUTION), material);
		surface.rotation.x = -Math.PI * .5;
		surface.overdraw = true;
		scene.add(surface);

		// go through each vertex
		surfaceVerts = surface.geometry.vertices;
		sCount = surfaceVerts.length;

		// three.js creates the verts for the
		// mesh in x,y,z order I think
		while(sCount--) {
			var vertex 		= surfaceVerts[sCount];
			vertex.springs 	= [];
			vertex.velocity = new THREE.Vector3();

			// connect this vertex to the ones around it
			if(vertex.x > (-SURFACE_WIDTH * .5)) {
				// connect to left
				vertex.springs.push({start:sCount, end:sCount-1});
			}

			if(vertex.x < (SURFACE_WIDTH * .5)) {
				// connect to right
				vertex.springs.push({start:sCount, end:sCount+1});
			}

			if(vertex.y < (SURFACE_HEIGHT * .5)) {
				// connect above
				vertex.springs.push({start:sCount, end:sCount-(X_RESOLUTION+1)});
			}

			if(vertex.y > (-SURFACE_HEIGHT * .5)) {
				// connect below
				vertex.springs.push({start:sCount, end:sCount+(X_RESOLUTION+1)});
			}
			
			vertex.z += Math.floor(Math.random()*200);
		}
	}

	/**
	 * Creates the WebGL renderer
	 */
	var createRenderer = function() {
		var ok = false;

		try {
			renderer = new THREE.WebGLRenderer();
			// start the renderer
		    renderer.setSize(width, height);
		    $container.append(renderer.domElement);

			scene = new THREE.Scene();
			/*canvas = document.createElement('canvas');
			canvas.width = SURFACE_WIDTH;
			canvas.height = SURFACE_HEIGHT;
			context	= canvas.getContext('2d');

			context.fillStyle = "#000000";
			context.beginPath();
			context.fillRect(0,0,SURFACE_WIDTH,SURFACE_HEIGHT);
			context.closePath();
			context.fill();*/

		    // position the camera
			//camera = new THREE.OrthographicCamera(45, width / height, NEAR, FAR);
			
			camera = new THREE.PerspectiveCamera(
			            35,             // Field of view
			            400 / 400,      // Aspect ratio
			            1,            // Near plane
			            10000          // Far plane
			        );
			
			camera.position.set(180, 1000, 1000);
			camera.lookAt(scene.position);
			

		    ok = true;
		} catch(e) {
			ok = false;
		}
		return ok;
	}
	
	var addEventListeners = function() {
		// window event
		$(window).resize(callbacks.windowResize);
		$(window).keydown(callbacks.keyDown);

		// click handler
		$(document.body).mousedown(callbacks.mouseDown);
		$(document.body).mouseup(callbacks.mouseUp);
		$(document.body).click(callbacks.mouseClick);

		var container = $container[0];
		container.addEventListener('dragover', cancel, false);
		container.addEventListener('dragenter', cancel, false);
		container.addEventListener('dragexit', cancel, false);
	}
	
	/**
	 * Updates the velocity and position
	 * of the particles in the view
	 */
	var update = function() {
		
		//orbitValue += vars["orbit"] ? vars["orbitSpeed"] : 0;
		//camera.position.x 	= Math.sin(orbitValue) * DEPTH;
		//camera.position.z 	= Math.cos(orbitValue) * DEPTH;
		//camera.update();
		//camera.updateProjectionMatrix();

		// surface.materials[1].opacity = vars["wireframeOpacity"];

		var v = surfaceVerts.length;
		while(v--) {
			var vertex			= surfaceVerts[v],
				acceleration 	= new THREE.Vector3(0, 0, -vertex.z * vars["elasticity"]),
				springs			= vertex.springs,
				s				= springs.length;

			vertex.velocity.add(acceleration);

			while(s--) {
				var spring 		= springs[s],
					extension	= surfaceVerts[spring.start].z - surfaceVerts[spring.end].z;

				acceleration 	= new THREE.Vector3(0, 0, extension * vars["elasticity"] * 50);
				surfaceVerts[spring.end].velocity.add(acceleration);
				surfaceVerts[spring.start].velocity.sub(acceleration);
			}

			vertex.add(vertex.velocity);

			vertex.velocity.multiplyScalar(DAMPEN);
		}

		//surface.geometry.computeFaceNormals(true);
		//surface.geometry.verticesNeedUpdate = true;
		//surface.geometry.normalsNeedUpdate = true;

		// set up a request for a render
		requestAnimationFrame(render);
	}
	
	/**
	 * Renders the current state
	 */
	var render = function() {
		// only render
		if(renderer) {
			renderer.render(scene, camera);
		}

		// set up the next frame
		if(running) {
			update();
		}
	}
	
	function disturbSurface(event, magnitude) {
		if(running) {
			
			var sv = surface.geometry.vertices;
			var sc = sv.length;

			// three.js creates the verts for the
			// mesh in x,y,z order I think
			while(sc--) {
				var vertex = sv[sc];
				vertex.z += Math.floor(Math.random()*200);
			}
			
			/*var mouseX = event.offsetX || (event.clientX - 220);
			var mouseY = event.offsetY || event.clientY;

			var vector = new THREE.Vector3((mouseX / width) * 2 - 1, -(mouseY / height) * 2 + 1, 0.5);
			projector.unprojectVector(vector, camera);

			var ray = new THREE.Ray(camera.position, vector.sub(camera.position).normalize());
			console.log(ray);
			var intersects = ray.intersectPlane(surface);

			// if the ray intersects with the
			// surface work out where
			if(intersects.length) {
				var iPoint 	= intersects[0].point,
				 	xVal	= Math.floor((iPoint.x / SURFACE_WIDTH) * X_RESOLUTION),
					yVal	= Math.floor((iPoint.z / SURFACE_HEIGHT) * Y_RESOLUTION);

				xVal 		+= X_RESOLUTION * .5;
				yVal 		+= Y_RESOLUTION * .5;

				index		= (yVal * (X_RESOLUTION + 1)) + xVal;

				if(index >= 0 && index < surfaceVerts.length) {
					surfaceVerts[index].velocity.z += magnitude;
				}
			}*/
		}
	}
	
	/**
	 * Our internal callbacks object - a neat
	 * and tidy way to organise the various
	 * callbacks in operation.
	 */
	callbacks = {
		mouseDown:function() {
			document.addEventListener('mousemove', callbacks.mouseMove, false);
		},
		mouseMove:function(event) {
			disturbSurface(event, vars["magnitude"]);
		},
		mouseClick: function(event) {
			disturbSurface(event, vars["magnitude"] * 5);
		},
		mouseUp:function() {
			document.removeEventListener('mousemove', callbacks.mouseMove, false);
		},
		guiClick:function() {
			var $this 	= $(this),
				varName	= $this.data("guivar"),
				varVal	= $this.data("guival");
			if(vars[varName] !== null) {
				vars[varName] = varVal;
			}

			$this.siblings().addClass('disabled');
			$this.removeClass('disabled');

			return false;
		},
		windowResize: function() {
			/*if(camera)
			{
				width = $container.width(),
				height = $container.height(),
				camera.aspect = width / height,
				renderer.setSize(width, height);

				camera.updateProjectionMatrix();
			}*/
		},
		keyDown: function(event) {
			if(camera) {
				switch(event.keyCode) {
				case 37: // Left
						orbitValue -= 0.1;
						break;
				case 39: // Right
						orbitValue += 0.1;
						break;
				}
				camera.updateProjectionMatrix();
			}
		}
	};
	
	return {
		init: function() {
			init();
		}
	}
	
}();

$(document).ready(function(){
	MB.Core.init();
});