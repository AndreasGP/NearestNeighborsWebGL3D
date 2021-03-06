//Main Octree Object. 
var OctTree = function (x, y, z, size, points, maxElems, parent) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    //Child octants
    this.children = [];
    this.points = points;
    this.MAX_POINTS_IN_OCTANT = maxElems;
    //parent octant
    this.parent = parent;
}

//Checks if a given point exsists within this octree/octant
//Point is expected to be a 3 element array [X, Y, Z]
//Some kind of precision error.
OctTree.prototype.contains = function (point) {
    return point[0] >= this.x && point[0] <= this.x + this.size[0]
            && point[1] >= this.y && point[1] <= this.y + this.size[1]
            && point[2] >= this.z && point[2] <= this.z + this.size[2];
}

//Add the point to the current octree's/octant's children 
OctTree.prototype.addPoint = function (point) {
    for (var i = 0; i < 8; i++) {
        if (this.children[i].contains(point)) {
            this.children[i].points.push(point);
            break;
        }
    }
}

//Render octree
OctTree.prototype.draw = function () {
    //Render self except for the root octant
    if(this.parent) {
        if(this.cube) {
            removeFromScene(this.cube);
        }
        this.cube = drawCube([this.x, this.y, this.z], this.size, 0xFF5555);
    }
    //Render children
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].draw();
    }
}

//Build the full octree
OctTree.prototype.buildTree = function () {
    if (this.points.length > this.MAX_POINTS_IN_OCTANT) {
        this.children[0] = new OctTree(this.x, this.y, this.z, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[1] = new OctTree(this.x + this.size[0] / 2, this.y, this.z, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[2] = new OctTree(this.x, this.y, this.z + this.size[2] / 2, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[3] = new OctTree(this.x + this.size[0] / 2, this.y, this.z + this.size[2] / 2, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[4] = new OctTree(this.x, this.y + this.size[1] / 2, this.z, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[5] = new OctTree(this.x + this.size[0] / 2, this.y + this.size[1] / 2, this.z, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[6] = new OctTree(this.x, this.y + this.size[1] / 2, this.z + this.size[2] / 2, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);
        this.children[7] = new OctTree(this.x + this.size[0] / 2, this.y + this.size[1] / 2, this.z + this.size[2] / 2, 
			[this.size[0] / 2,this.size[1] / 2,this.size[2] / 2], [], this.MAX_POINTS_IN_OCTANT,this);

        //Deep copy array
        var temp = JSON.parse(JSON.stringify(this.points));

        this.points = []

        for (var i = 0; i < temp.length; i++) {
            this.addPoint(temp[i]);
        }
		
		for(var i = 0; i < this.children.length; i++){
			this.children[i].buildTree();
		}
    }
}

var dist = function (p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
}

//Object for radius NN search on octree
var OctTreeNearestNeighbor = function (octree, point) {
    this.octree = octree;
    this.point = point;
    this.residingOctant = null;
    this.searchOctant = null;
    this.nearestDistance = null;
    this.nearestPoint = null;
    this.visitedOctants = [];
}

//Distance from ourpoint to octant
function distanceTo(node, point) {
	var dmin = 0;
	if(point[0] < node.x){
		dmin += Math.pow(point[0] - node.x, 2);
	} else if (point[0] > node.x+node.size[0]) {
        dmin += Math.pow(point[0] - node.x+node.size[0], 2);
    }
	
	if(point[1] < node.y){
		dmin += Math.pow(point[1] - node.y, 2);
	} else if (point[1] > node.y+node.size[1]) {
        dmin += Math.pow(point[1] - node.y+node.size[1], 2);
    }
	
	if(point[2] < node.z){
		dmin += Math.pow(point[2] - node.z, 2);
	} else if (point[2] > node.z+node.size[2]) {
        dmin += Math.pow(point[2] - node.z+node.size[2], 2);
    }
	
    return dmin;
}

//Check the current octant for closest node inside that octant, if any exist.
//Improve octand checking
OctTreeNearestNeighbor.prototype.checkOctant = function (node) {
    if (this.nearestDistance == null) {
        this.nearestDistance = Infinity;
    }
	
    var points = node.points;
    var change = false;
    if (points.length == 0 && node.children.length != 0) {
        for (var i = 0; i < node.children.length; i++) {
            if (distanceTo(node.children[i], this.point) <= Math.pow(this.nearestDistance,2) && this.visitedOctants.indexOf(node.children[i]) == -1) {
                change = this.checkOctant(node.children[i]);
				return change;
            }
        }
    } else if (points.length != 0) {
        for (var i = 0; i < points.length; i++) {
            if (dist(points[i], this.point) < this.nearestDistance) {
                this.nearestDistance = dist(points[i], this.point);
                this.nearestPoint = points[i];
                change = true;
            }
        }
		this.visitedOctants.push(node);
		this.searchOctant = node;
		return change;
    }
	this.visitedOctants.push(node);
	this.searchOctant = node;
    return change;
}

OctTreeNearestNeighbor.prototype.draw = function () {
	
	//Draw the octree
	this.octree.draw();
    //Draw visited octants with different color
    for (var i = 0; i < this.visitedOctants.length; i++) {
        var oct = this.visitedOctants[i];
        drawCube([oct.x, oct.y, oct.z], oct.size, 0x00ff00);
    }
    //Draw curent residential octant with different color
    if(this.residingOctant == null){
    	return
    }
    var size = this.residingOctant.size
    drawCube([this.residingOctant.x, this.residingOctant.y, this.residingOctant.z], size, 0xff00ff);
	
	var size = this.searchOctant.size
    drawCube([this.searchOctant.x, this.searchOctant.y, this.searchOctant.z], size, 0x00ffff);
	
	var pointCoord = pointSpaceTo3DRenderSpace(this.point);
	if(this.nearestPoint == null) return;
	var nearestCoord = pointSpaceTo3DRenderSpace(this.nearestPoint);
    //Draw a sphere showing current search radius
    //drawSphere(pointCoord, dist(pointCoord,nearestCoord), 0xff0000, true, 0.2);
    updateSearchRadius(dist(pointCoord, nearestCoord));
	
    //Draw current nearest point with different color
    var geometry = new THREE.SphereGeometry(0.3, 8, 6);
    var material = new THREE.MeshLambertMaterial({color: new THREE.Color(0xffff00)});
    var obj = new THREE.Mesh(geometry, material);
    obj.position.x = nearestCoord[0];
    obj.position.y = nearestCoord[1];
    obj.position.z = nearestCoord[2];
    scene.add(obj);
}

//Single step of NN
//Step 1: Find the octant where our node is
//Step 2: Find the nearest node in that ctant to our node
//Step 3 - ...: Check if any other octant within radius contains a node closer to us.
//If closest has been found nothing is done here anymore
OctTreeNearestNeighbor.prototype.doStep = function () {
    if (!this.residingOctant) {
        this.residingOctant = this.octree;
        while (this.residingOctant.children.length != 0) {
            for (var i = 0; i < this.residingOctant.children.length; i++) {
                if (this.residingOctant.children[i].contains(this.point)) {
                    this.residingOctant = this.residingOctant.children[i];
                    break;
                }
            }
        }
		log("Found octant where point " + arrayPointToString(this.point) + " resides.");
        this.searchOctant = this.residingOctant;
        return true;
    }
	
    if (!this.nearestDistance) {
        this.checkOctant(this.residingOctant);
		if(this.nearestDistance != Infinity){
			log("Current nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " +  this.nearestDistance.toFixed(2));
		}else{
			log("No points in residing octant.");
		}
        return true;
    }
	
	if(this.searchOctant.parent != null){
		var parent = this.searchOctant.parent;
		for(var i = 0; i < parent.children.length; i++){
			var node = parent.children[i];
			if (this.visitedOctants.indexOf(node) == -1 && distanceTo(node, this.point) <= Math.pow(this.nearestDistance,2)) {
                if (this.checkOctant(node)) {
					log("New nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " +  this.nearestDistance.toFixed(2));
                }else{
					log("No points in current octant.");
				}
				return true;
            }
		}
		this.searchOctant = parent;
		return true;
	}

    //Tagasta midagi, et teaks et on lähim leitud.
	log("Final nearest point is " + arrayPointToString(this.nearestPoint)  + " at a distance of " +  this.nearestDistance.toFixed(2));
    return false
}
