//Main KDTree Object. 
var KDTree = function(x, y, z, size, lvl, points, parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.size = size;
	this.lvl = lvl;
	this.children = [];
	this.points = points;
	this.MAX_POINTS = 1;
	this.parent = parent;
	this.splitpoint = null;
}

function compare(a, b, xyz){
	return a[xyz] - b[xyz];
}

//Check if a given point exists within this section
KDTree.prototype.contains = function(point){
	return point[0] >= this.x && point[0] <= this.x + this.size[0]
       && point[1] >= this.y && point[1] <= this.y + this.size[1]
       && point[2] >= this.z && point[2] <= this.z + this.size[2];
}

//Add object to current section
KDTree.prototype.addPoint = function(point){
	for(var i = 0; i < this.children.length; i++){
		if(this.children[i].contains(point)){
			this.children[i].points.push(point);
			break;
		}
	}
}

//Render kdree
KDTree.prototype.draw = function(){
	//Render self
	var colors = [0xFF5555, 0x55FF55, 0x5555FF];
	if(this.splitpoint != null){
		var split = this.children[1];
		var size = this.children[1].size;
		switch(this.lvl%3){
		case 0:
			drawPolygon(
					[[split.x, split.y, split.z], 
					[split.x, split.y+size[1], split.z], 
					[split.x, split.y+size[1], split.z+size[2]], 
					[split.x, split.y, split.z+size[2]]],
					colors[0], colors[0], true, 0.2);
			break;
		case 1:
			drawPolygon(
					[[split.x, split.y, split.z], 
					[split.x+size[0], split.y, split.z], 
					[split.x+size[0], split.y, split.z+size[2]], 
					[split.x, split.y, split.z+size[2]]],
					colors[1], colors[1], true, 0.2);
			break;
		case 2:
			drawPolygon(
					[[split.x, split.y, split.z], 
					[split.x+size[0], split.y, split.z], 
					[split.x+size[0], split.y+size[1], split.z], 
					[split.x, split.y+size[1], split.z]],
					colors[2], colors[2], true, 0.2);
			break;
		}

		for(var i = 0; i < this.children.length; i++){
			this.children[i].draw();
		}
	}
}

//A single step of kdtree building
KDTree.prototype.buildTree = function(){
	if(this.points.length > this.MAX_POINTS){
		var temp = JSON.parse(JSON.stringify(this.points));
		temp = temp.sort(function(a,b){return compare(a,b,0)});
		this.splitpoint = temp[Math.floor(temp.length/2)];
		
		this.points = [];
		
		var newwidth;
		
		if(this.lvl%3 == 0){
			newwidth = this.splitpoint[0] - this.x;
			this.children[0] = new KDTree(this.x,this.y,this.z, [newwidth,this.size[1],this.size[2]], this.lvl+1, [], this);
			this.children[1] = new KDTree(this.splitpoint[0],this.y,this.z, [this.size[0]-newwidth,this.size[1],this.size[2]], this.lvl+1, [], this);
		} else if(this.lvl%3 == 1){
			newwidth = this.splitpoint[1]-this.y;
			this.children[0] = new KDTree(this.x,this.y,this.z, [this.size[0],newwidth,this.size[2]], this.lvl+1, [], this);
			this.children[1] = new KDTree(this.x,this.splitpoint[1],this.z, [this.size[0],this.size[1]-newwidth,this.size[2]], this.lvl+1, [], this);
		} else {
			newwidth = this.splitpoint[2]-this.z;
			this.children[0] = new KDTree(this.x,this.y,this.z, [this.size[0],this.size[1],newwidth], this.lvl+1, [], this);
			this.children[1] = new KDTree(this.x,this.y,this.splitpoint[2], [this.size[0],this.size[1],this.size[2]-newwidth], this.lvl+1, [], this);
		}

		for(var i = 0; i < temp.length; i++){
			if(temp[i] != this.splitpoint)
				this.addPoint(temp[i]);
		}
		for(var i = 0; i < this.children.length; i++){
			this.children[i].buildTree();
		}
	}
}

var distance = function(p1,p2){
	return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2) +Math.pow(p1.z-p2.z, 2));
}

//Object for radius NN search on kd-tree
var KDTreeNearestNeighbor = function (kdtree, point) {
    this.kdtree = kdtree;
    this.point = point;
    this.residingArea = null;
    this.searchArea = null;
    this.nearestDistance = null;
    this.nearestPoint = null;
    this.visitedAreas = [];
}

//Distance from our point to plane
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

//Check the current area for closest node inside that area, if any exist.
//Improve area checking
KDTreeNearestNeighbor.prototype.checkArea = function (node) {
    if (this.nearestDistance == null) {
        this.nearestDistance = Infinity;
    }

    var change = false;
    
    //check splitting node
    if (node.splitpoint != null && dist(node.splitpoint, this.point) < this.nearestDistance) {
        this.nearestDistance = dist(node.splitpoint, this.point);
        this.nearestPoint = node.splitpoint;
        change = true;
    }
    
    var points = node.points;
    if (points.length == 0 && node.children.length != 0) {
        for (var i = 0; i < node.children.length; i++) {
			console.log(distanceTo(node.children[i], this.point))
			console.log(this.nearestDistance)
            if (distanceTo(node.children[i], this.point) <= Math.pow(this.nearestDistance,2) && this.visitedAreas.indexOf(node.children[i]) == -1) {
                change = this.checkArea(node.children[i]);
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
		this.visitedAreas.push(node);
		this.searchArea = node;
		return change;
    }
	this.visitedAreas.push(node);
	this.searchArea = node;
    return change;
}

KDTreeNearestNeighbor.prototype.draw = function () {
	
	//Draw the kdtree
	this.kdtree.draw();
    //Draw visited areas with different color
    for (var i = 0; i < this.visitedAreas.length; i++) {
        var area = this.visitedAreas[i];
        drawCube([area.x, area.y, area.z], area.size, 0x00ff00);
    }
    //Draw current residential area with different color
    var size = this.residingArea.size
    drawCube([this.residingArea.x, this.residingArea.y, this.residingArea.z], size, 0xff00ff);
	
	var size = this.searchArea.size
    drawCube([this.searchArea.x, this.searchArea.y, this.searchArea.z], size, 0x00ffff);
	
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
//Step 1: Find the area where our node is
//Step 2: Find the nearest node in that area to our node
//Step 3 - ...: Check if any other area within radius contains a node closer to us.
//If closest has been found nothing is done here anymore
KDTreeNearestNeighbor.prototype.doStep = function () {
    if (!this.residingArea) {
        this.residingArea = this.kdtree;
        while (this.residingArea.children.length != 0) {
            for (var i = 0; i < this.residingArea.children.length; i++) {
                if (this.residingArea.children[i].contains(this.point)) {
                    this.residingArea = this.residingArea.children[i];
                    break;
                }
            }
        }
		log("Found area where point (" + this.point + ") resides.");
        this.searchArea = this.residingArea;
        return true;
    }
	
    if (!this.nearestDistance) {
        this.checkArea(this.residingArea);
		if(this.nearestDistance != Infinity){
			log("Current nearest point is (" + this.nearestPoint + ") at a distance of " + round2(this.nearestDistance) + ".");
		}else{
			log("No points in residing area.");
		}
        return true;
    }
	
	if(this.searchArea.parent != null){
		var parent = this.searchArea.parent;
		for(var i = 0; i < parent.children.length; i++){
			var node = parent.children[i];
			if (this.visitedAreas.indexOf(node) == -1 && distanceTo(node, this.point) <= Math.pow(this.nearestDistance,2)) {
                if (this.checkArea(node)) {
					log("New nearest point is (" + this.nearestPoint + ") at a distance of " + round2(this.nearestDistance) + ".");
                }else{
					log("No closer points in current area.");
				}
				return true;
            }
		}
		this.searchArea = parent;
		return true;
	}

    //Tagasta midagi, et teaks et on lähim leitud.
	log("Final nearest point is (" + this.nearestPoint + ") at a distance of " + round2(this.nearestDistance) + ".");
    return false
}
