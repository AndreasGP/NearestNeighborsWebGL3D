/* BEGIN GENERIC SHARED CANVAS VARIABLES */
//Size of the points on 2D canvases
var pointRadius = 2;

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
/* END GENERIC SHARED CANVAS VARIABLES */

/* BEGIN THREE.JS 3D VIEW INITIALIZATION */
function init3D() {
	camera = new THREE.PerspectiveCamera( 70, width / width, 1, 5000 );

        setupScene();
        
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xdddddd )
	renderer.setPixelRatio( width / width);
	renderer.setSize( width * 3, width * 3 );
	document.getElementById("3D").appendChild( renderer.domElement );

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enablePan = false;
	controls.enableZoom = true;
	controls.minDistance = 10;
	controls.maxDistance = 35;

	//Initial camera position
	var angle = 5;
        var cameraRadius = 27
	camera.position.set(Math.sin(angle) * cameraRadius, cameraRadius * 0.3 - 2, Math.cos(angle) * cameraRadius);
	camera.lookAt(new THREE.Vector3(0, -2, 0));
        
}

function setupScene() {
    scene = new THREE.Scene();
    var ambientLight = new THREE.AmbientLight(0x999999);
    scene.add(ambientLight);

    var axisHelper = new THREE.AxisHelper(5)
    axisHelper.position.set(-10.5, -10.5, -10.5)
    scene.add(axisHelper)

    //Draw the outline grid with some offset
    var o = 0.1;
    drawCube([min - o / 2, min - o / 2, min - o / 2], [max - min + o, max - min + o, max - min + o], 0x000000)
}

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
}

init3D();
animate();
/* END THREE.JS 3D VIEW INITIALIZATION */

/* BEGIN FUNCTIONS FOR RENDERING */
function drawDataPoint(x, y, z) {
    var renderPoint = pointSpaceTo2DRenderSpace([x, y, z])
    var xLerp = renderPoint[0];
    var yLerp = renderPoint[1];
    var zLerp = renderPoint[2];
    var r = Math.floor(xLerp / width * 255);
    var g = Math.floor(yLerp / width * 255);
    var b = Math.floor(zLerp / width * 255);

    function drawCircleOnCanvas(context, x, y, r, g, b) {
	context.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
	context.strokeStyle = "rgb(0, 0, 0)";

	context.beginPath();
	context.arc(x, y, pointRadius, 0, 2*Math.PI);
	context.fill();
	context.stroke();
    }
    drawCircleOnCanvas(contextXY, xLerp, yLerp, r, g, b);
    drawCircleOnCanvas(contextXZ, xLerp, zLerp, r, g, b);
    drawCircleOnCanvas(contextYZ, yLerp, zLerp, r, g, b);
    
    function drawSphereOn3D(x, y, z, r, g, b) {
        var color = new THREE.Color("rgb(" + r + ", " + g + ", " + b + ")");
        var geometry = new THREE.SphereGeometry( 0.3, 8, 6 );
    	var material = new THREE.MeshLambertMaterial( { color: color } );
    	var obj = new THREE.Mesh( geometry, material );
    	obj.position.x = x;
    	obj.position.y = y;
    	obj.position.z = z;

    	scene.add(obj);
    }
    var renderPoint3D = pointSpaceTo3DRenderSpace([x, y, z])
    drawSphereOn3D(renderPoint3D[0], renderPoint3D[1], renderPoint3D[2], r, g, b);
}

function drawSearchPoint() {
        //2D
        var rPoint2D = pointSpaceTo2DRenderSpace(searchPoint);
        var col1 = [255, 70, 0]//orange
        var col2 = [64, 224, 208]//cyan
        var smallRadius = 2;
        var bigRadius = 4;
        
       function drawCircleOnCanvas(context, x, y, radius, r, g, b) {
            context.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
            context.strokeStyle = "rgb(0, 0, 0)";

            context.beginPath();
            context.arc(x, y, radius, 0, 2*Math.PI);
            context.fill();
            context.stroke();
        }
        drawCircleOnCanvas(contextXY, rPoint2D[0], rPoint2D[1], bigRadius, col1[0], col1[1], col1[2]);
        drawCircleOnCanvas(contextXY, rPoint2D[0], rPoint2D[1], smallRadius, col2[0], col2[1], col2[2]);
        
        drawCircleOnCanvas(contextXZ, rPoint2D[0], rPoint2D[2], bigRadius, col1[0], col1[1], col1[2]);
        drawCircleOnCanvas(contextXZ, rPoint2D[0], rPoint2D[2], smallRadius, col2[0], col2[1], col2[2]);
        
        drawCircleOnCanvas(contextYZ, rPoint2D[1], rPoint2D[2], bigRadius, col1[0], col1[1], col1[2]);
        drawCircleOnCanvas(contextYZ, rPoint2D[1], rPoint2D[2], smallRadius, col2[0], col2[1], col2[2]);
    
        //3D
        var radius = 0.5;
        var geometry = new THREE.SphereGeometry( radius, 8, 6 );
        var material = new THREE.MeshNormalMaterial();
    	var sphere = new THREE.Mesh( geometry, material );
        var renderPoint3D = pointSpaceTo3DRenderSpace(searchPoint)
    	sphere.position.x = renderPoint3D[0];
    	sphere.position.y = renderPoint3D[1];
    	sphere.position.z = renderPoint3D[2];
    	scene.add(sphere);
        
        //Also add an outline to the point
        var geometry = new THREE.SphereGeometry( radius * 1.4, 8, 6 );
        var outlineMat = new THREE.MeshBasicMaterial( { color: 0xFF4F00, side: THREE.BackSide } );
    	var outlineSphere = new THREE.Mesh( geometry, outlineMat );
    	outlineSphere.position.set(sphere.position.x, sphere.position.y, sphere.position.z); 
    	scene.add(outlineSphere);
        
        return [sphere, outlineSphere];
}

function drawCube(pos, size, color, modifier = 0) {
    var renderPos = pointSpaceTo3DRenderSpace([pos[0] - modifier/2, pos[1] - modifier/2, pos[2] - modifier/2]);

    var renderSize = pointSpaceSizeTo3DRenderSpaceSize([size[0] + modifier, size[1] + modifier, size[2] + modifier]);

    var material = new THREE.LineBasicMaterial({
        color: color
    });
    var geometry = new THREE.EdgesGeometry(new THREE.CubeGeometry(renderSize[0], renderSize[1], renderSize[2]));
    var wireframe = new THREE.LineSegments(geometry, material);

    //By default the cube is positioned at the middle point, we want it to be at the min XYZ corner
    wireframe.position.set(renderPos[0] + renderSize[0]/2, renderPos[1] + renderSize[1]/2, renderPos[2] + renderSize[2]/2)

    scene.add(wireframe);
    
    return wireframe;
}

function drawSphere(pos, radius, color, transparent, opacity) {
    var geometry = new THREE.SphereGeometry(radius, 32, 16);
    var material = new THREE.MeshBasicMaterial({
        color: color, 
        transparent: transparent, 
        opacity: opacity
    });
    
    console.log(opacity);
    
    var sphere = new THREE.Mesh(geometry, material);
    
    var renderPos = pointSpaceTo3DRenderSpace(pos);
    
    sphere.position.set(renderPos[0], renderPos[1], renderPos[2]);
    console.log(sphere.position);
    scene.add(sphere);
    
    radiusSphere = sphere;
    
    return sphere;
}

function updateSearchRadius(radius) {
    if(typeof radiusSphere !== 'undefined') {
        scene.remove(radiusSphere);
    }
    radiusSphere = drawSphere(searchPoint, radius, 0xff00ff, true, 0.2);
}

//Only supports convex shapes, 3 vertices minimum.
//Example:
//drawPolygon([[2, 0, 0], [2, 5, 0], [2, 5, 8], [2, 0, 8], [2, 3, 9]], 0xff0000, 0xaa0000, true, 0.2);
function drawPolygon(vertices, fillColor, edgeColor, transparent, opacity) {
    var material = new THREE.MeshBasicMaterial({
        color: fillColor,
        transparent: transparent,
        opacity: opacity
    });
    var verts = new Array();

    for(var i = 0; i < vertices.length; i++) {
        var renderP = pointSpaceTo3DRenderSpace(vertices[i]);
        var vec = new THREE.Vector3(renderP[0], renderP[1], renderP[2]);
        verts.push(vec);
    }
   
    var convexGeometry = new THREE.ConvexGeometry(verts);
    mesh = new THREE.Mesh(convexGeometry, material);
    scene.add(mesh);
    
    //Reusing the same variables
    var material = new THREE.LineBasicMaterial({
        color: edgeColor
    });
    var geometry = new THREE.EdgesGeometry(convexGeometry);
    var outline = new THREE.LineSegments(geometry, material);
    scene.add(outline);
    
    return [mesh, outline]
}

function drawPolygonV3(vertices, fillColor, edgeColor, transparent, opacity) {
    var material = new THREE.MeshBasicMaterial({
        color: fillColor,
        transparent: transparent,
        opacity: opacity
    });
    var convexGeometry = new THREE.ConvexGeometry(vertices);
    mesh = new THREE.Mesh(convexGeometry, material);
    scene.add(mesh);
    
    //Reusing the same variables
    var material = new THREE.LineBasicMaterial({
        color: edgeColor
    });
    var geometry = new THREE.EdgesGeometry(convexGeometry);
    var outline = new THREE.LineSegments(geometry, material);
    scene.add(outline);
    
    return [mesh, outline]
}

function removeFromScene(object) {
    scene.remove(object);
}
/* END FUNCTIONS FOR RENDERING */

/* BEGIN RENDERING CALLS AND MAIN LOGIC */
function clearEverything() {
    setupScene();
    //TODO: Clear 2D projections
}

function addDataPointsToRendering() {
    //Add the points to projections
    for(var index in points) {
        var point = points[index];
        drawDataPoint(point[0], point[1], point[2]);
    }
}	
/* END RENDERING CALLS AND MAIN LOGIC */
