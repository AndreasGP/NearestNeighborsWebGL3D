//generic shared variables
var canvasXY = document.getElementById("XYcanvas");
var canvasXZ = document.getElementById("XZcanvas");
var canvasYZ = document.getElementById("YZcanvas");

var contextXY = canvasXY.getContext("2d");
var contextXZ = canvasXZ.getContext("2d");
var contextYZ = canvasYZ.getContext("2d");

var width = canvasXY.width;

contextXY.fillStyle = "#000000";
contextXZ.fillStyle = "#000000";
contextYZ.fillStyle = "#000000";

contextXY.rect(0, 0, width, width);
contextXY.stroke();
contextXZ.rect(0, 0, width, width);
contextXZ.stroke();
contextYZ.rect(0, 0, width, width);
contextYZ.stroke();

var imgXY = contextXY.getImageData(0, 0, width, width);
var imgXZ = contextXY.getImageData(0, 0, width, width);
var imgYZ = contextXY.getImageData(0, 0, width, width);

//Size of the points on 2D canvases
var pointRadius = 6;

var points = [];

for(var i = 0; i < 50; i++) {
	var x = Math.random() * 20;
	var y = Math.random() * 20;
	var z = Math.random() * 20;
	points.push([x, y, z]);
}

points.push([1, 1, 1]);
points.push([2, 1, 2]);
points.push([0, 3, 2]);
points.push([3, 2, 0]);
points.push([1, 3, 1]);
points.push([2, 0, 4]);
points.push([4, 0, 0]);

var minX = minY = minZ = 10000;
var maxX = maxY = maxZ = -10000;

function generate() {
	if(points.length == 0) {
		console.log("No points provided!");
		return;
	}

	//Update min, max
	for(var index in points) {
		var point = points[index];
		var x = point[0];
		var y = point[1];
		var z = point[2];

		if(x < minX) minX = x;
		if(y < minY) minY = y;
		if(z < minZ) minZ = z;
		if(x > maxX) maxX = x;
		if(y > maxY) maxY = y;
		if(z > maxZ) maxZ = z;
	}

	//Add the points to projections
	for(var index in points) {
		var point = points[index];

		var x = point[0];
		var y = point[1];
		var z = point[2];

		var xLerp = lerpPoint(x, minX, maxX) * width;
		var yLerp = lerpPoint(y, minY, maxY) * width;
		var zLerp = lerpPoint(z, minZ, maxZ) * width;

		drawCircle(contextXY, xLerp, yLerp, xLerp/width, yLerp/width, zLerp/width);
		drawCircle(contextXZ, xLerp, zLerp, xLerp/width, yLerp/width, zLerp/width);
		drawCircle(contextYZ, yLerp, zLerp, xLerp/width, yLerp/width, zLerp/width);
	}
}
generate();

//Find the position of 'value' between min and max.
//if value == min, 0 is returned; if value == max, 1 is returned
//otherwise it's inbetween 0 and 1
function lerpPoint(value, min, max) {
	return 1 - (max - value)/(max - min);
}

function drawCircle(context, x, y, r, g, b) {

	context.fillStyle = "rgb(" + Math.floor(r*255) + ", " 
	+ Math.floor(g*255) + ", " + Math.floor(b*255) + ")";

	context.strokeStyle = "rgb(0, 0, 0)";

	context.beginPath();
	context.arc(x, y, pointRadius, 0, 2*Math.PI);
	context.fill();
	context.stroke();
}


//NOT USED
function getPixel(image, x, y) {
	return image.data[(y * image.width + x) * 4];
}

function setPixel(image, x, y, v) {
	image.data[(y * image.width + x) * 4] = v;
	image.data[(y * image.width + x) * 4 + 1] = v;
	image.data[(y * image.width + x) * 4 + 2] = v;
}

function setPixelRGB(image, x, y, r, g, b) {
	image.data[(y * image.width + x) * 4] = r;
	image.data[(y * image.width + x) * 4 + 1] = g;
	image.data[(y * image.width + x) * 4 + 2] = b;
}

//Generating the Three.js preview

var camera, scene, renderer;
var mesh;
var cameraRadius = 27;
var clock = new THREE.Clock();

init();
animate();
generateGrid();
generatePoints();

function generateGrid() {

	var material = new THREE.LineBasicMaterial({
            color: 0x000000
        });

	var geometry = new THREE.Geometry();

	//bottom corners + at each corner go up once 
    geometry.vertices.push(new THREE.Vector3(-10, -10, -10));


    geometry.vertices.push(new THREE.Vector3(-10, -10, 10));
	geometry.vertices.push(new THREE.Vector3(-10, 10, 10));
	geometry.vertices.push(new THREE.Vector3(-10, -10, 10));

    geometry.vertices.push(new THREE.Vector3(10, -10, 10));
	geometry.vertices.push(new THREE.Vector3(10, 10, 10));
	geometry.vertices.push(new THREE.Vector3(10, -10, 10));

    geometry.vertices.push(new THREE.Vector3(10, -10, -10));
	geometry.vertices.push(new THREE.Vector3(10, 10, -10));
	geometry.vertices.push(new THREE.Vector3(10, -10, -10));

    geometry.vertices.push(new THREE.Vector3(-10, -10, -10));
    geometry.vertices.push(new THREE.Vector3(-10, 10, -10));

    //top
    geometry.vertices.push(new THREE.Vector3(-10, 10, 10));
    geometry.vertices.push(new THREE.Vector3(10, 10, 10));
    geometry.vertices.push(new THREE.Vector3(10, 10, -10));
    geometry.vertices.push(new THREE.Vector3(-10, 10, -10));

    var line = new THREE.Line(geometry, material);

    scene.add(line);
}


function generatePoints() {
	//TODO: Use billboarding or particles instead of expensive spheres

	for(var index in points) {
		var point = points[index];
		var x = point[0];
		var y = point[1];
		var z = point[2];

		var xLerp = (lerpPoint(x, minX, maxX)*2 - 1) * 9.7;
		var yLerp = (lerpPoint(y, minY, maxY)*2 - 1) * 9.7;
		var zLerp = (lerpPoint(z, minZ, maxZ)*2 - 1) * 9.7;

		var r = Math.floor(lerpPoint(x, minX, maxX)*255)
		var g = Math.floor(lerpPoint(y, minY, maxY)*255)
		var b = Math.floor(lerpPoint(z, minZ, maxZ)*255)

		var color = new THREE.Color("rgb(" + r + ", " + g + ", " + b + ")");

		//var geometry = new THREE.BoxGeometry( 1, 1, 1 );
		var geometry = new THREE.SphereGeometry( 0.3, 8, 6 );
    	var material = new THREE.MeshLambertMaterial( { color: color } );
    	var obj = new THREE.Mesh( geometry, material );
    	obj.position.x = xLerp;
    	obj.position.y = yLerp;
    	obj.position.z = zLerp;

    	scene.add(obj);
	}
}


function init() {
	camera = new THREE.PerspectiveCamera( 70, width / width, 1, 5000 );

	scene = new THREE.Scene();
	var ambientLight = new THREE.AmbientLight(0x999999);
	scene.add(ambientLight);

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xdddddd )
	renderer.setPixelRatio( width / width);
	renderer.setSize( width * 3, width * 3 );
	document.getElementById("3D").appendChild( renderer.domElement );
}


function animate() {

	requestAnimationFrame( animate );

	var time = clock.getElapsedTime();
	
	camera.position.set(Math.sin(time / 3) * cameraRadius, cameraRadius * 0.3 - 2, Math.cos(time / 3) * cameraRadius);
	camera.lookAt(new THREE.Vector3(0, -2, 0));
	//console.log(camera.position);

	renderer.render( scene, camera );

}