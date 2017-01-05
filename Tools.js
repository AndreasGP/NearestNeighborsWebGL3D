var camera, scene, renderer, controls;


//Adds a cube to the 3D scene. INPUT EXPECTED TO BE IN RANGE [0, 0, 0] to [1, 1, 1] FOR POS AND SIZE
//#pos - bottom corner of the cube (3 element array [] containing XYZ)
//#size - the size of the cube (3 element array [] containing XYZ)
//#color - the color of the cube (color has hex code, eg. 0x00FF00)
//Returns the instance of the object made so it's possible to later remove it
//from the scene
function addCube(pos, size, color) {

	//Convert pos [0, 1] range to [-10, 10] range
	pos[0] = pos[0] * 20 - 10
	pos[1] = pos[1] * 20 - 10
	pos[2] = pos[2] * 20 - 10

	//Convert size [0, 1] range to [0, 20] range
	size[0] = size[0] * 20
	size[1] = size[1] * 20
	size[2] = size[2] * 20

	var material = new THREE.LineBasicMaterial({
            color: color
        });
    var geometry = new THREE.EdgesGeometry( new THREE.CubeGeometry( size[0], size[1], size[2] ) );
    var wireframe = new THREE.LineSegments( geometry, material);
    
    //By default the cube is positioned at the middle point, we want it to be at the min XYZ corner
    wireframe.position.set(pos[0] + size[0]/2, pos[1] + size[1]/2, pos[2] + size[2]/2)

    scene.add( wireframe );
}