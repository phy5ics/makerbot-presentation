window.MB = window.MB || {};

MB.Core = function() {
	var map;
	
	var init = function() {
		console.log('initializing');
		var mapOptions = {
			center: new google.maps.LatLng(40.721860, -73.949404),
	   		zoom: 14,
	   		mapTypeId: google.maps.MapTypeId.ROADMAP
	 	};
	
		map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	
		var rectangle = new google.maps.Rectangle({
		  strokeColor: '#333',
	    strokeOpacity: 0.8,
	    strokeWeight: 1,
	    fillColor: '#eaeaea',
	    fillOpacity: 0.35,
	    map: map,
	    bounds: new google.maps.LatLngBounds(
	      new google.maps.LatLng(40.739584, -73.96657),
				//new google.maps.LatLng(40.760423, -74.003520),
	      new google.maps.LatLng(40.706799, -73.941336))
	  });
	
		for (var i = 0; i < grid.length; i++) {
			createRectangles(grid[i]);
		}
	
	}

	var createRectangles = function(coords) {
		console.log('creating rectangles');
		var rectangle = new google.maps.Rectangle({
		  strokeColor: '#FF0000',
	    strokeOpacity: 0.8,
	    strokeWeight: 0,
	    fillColor: '#000000',
	    fillOpacity: (0.01 * coords.checkins),
	    map: map,
	    bounds: new google.maps.LatLngBounds(
	      new google.maps.LatLng(coords.nw[0], coords.nw[1]),
	      new google.maps.LatLng(coords.se[0], coords.se[1]))
	  });
	}
	
	return {
		init: function() {
			init();
		}
	}

}();

$(document).ready(function(){
	MB.Core.init();
});