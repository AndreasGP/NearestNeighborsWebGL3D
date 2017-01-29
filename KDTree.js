//Main KDTree Object. 
var KDTree = function(x, y, z, size, lvl, points, maxElems, parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.size = size;
	this.lvl = lvl;
	this.children = [];
	this.points = points;
	this.MAX_POINTS = maxElems;
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
		var xyz = this.lvl%3;
		temp = temp.sort(function(a,b){return compare(a,b,xyz)});
		this.splitpoint = temp[Math.floor(temp.length/2)];
		
		this.points = [];
		
		var newwidth;
		
		if(this.lvl%3 == 0){
			newwidth = this.splitpoint[0] - this.x;
			this.children[0] = new KDTree(this.x,this.y,this.z, [newwidth,this.size[1],this.size[2]], this.lvl+1, [], this.MAX_POINTS, this);
			this.children[1] = new KDTree(this.splitpoint[0],this.y,this.z, [this.size[0]-newwidth,this.size[1],this.size[2]], this.lvl+1, [], this.MAX_POINTS, this);
		} else if(this.lvl%3 == 1){
			newwidth = this.splitpoint[1]-this.y;
			this.children[0] = new KDTree(this.x,this.y,this.z, [this.size[0],newwidth,this.size[2]], this.lvl+1, [], this.MAX_POINTS, this);
			this.children[1] = new KDTree(this.x,this.splitpoint[1],this.z, [this.size[0],this.size[1]-newwidth,this.size[2]], this.lvl+1, [], this.MAX_POINTS, this);
		} else {
			newwidth = this.splitpoint[2]-this.z;
			this.children[0] = new KDTree(this.x,this.y,this.z, [this.size[0],this.size[1],newwidth], this.lvl+1, [], this.MAX_POINTS, this);
			this.children[1] = new KDTree(this.x,this.y,this.splitpoint[2], [this.size[0],this.size[1],this.size[2]-newwidth], this.lvl+1, [], this.MAX_POINTS, this);
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
    this.nearestDistance = Infinity;
    this.nearestPoint = null;
    this.visitedAreas = [];
    this.visitedPoints = [];
    this.nearestFound = false;
    this.goingDown = false;
    this.parentsToCheck = [];
}

function difference(p, l,u){
	if(p < l)return l-p;
	if(p > u)return p-u;
	return 0;
}
//Distance from our point to plane
function distanceTo(node, point) {
	var dx = difference(point[0], node.x, node.x+node.size[0]),
	dy =  difference(point[1], node.y, node.y+node.size[1]),
	dz = difference(point[2], node.z, node.z+node.size[2]);
	return dx*dx + dy*dy + dz*dz;
}

//Check the current area for closest node inside that area, if any exist.
//Improve area checking
KDTreeNearestNeighbor.prototype.checkArea = function (node) {
	var change = false;
    var points = node.points;
    if (this.goingDown) {
    	if (points.length == 0 && node.children.length != 0) {
            this.visitedAreas.push(node);
            return change;
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
    }
    if (points.length == 0 && node.children.length != 0) {
        for (var i = 0; i < node.children.length; i++) {
            if (distanceTo(node.children[i], this.point) <= Math.pow(this.nearestDistance,2) && this.visitedAreas.indexOf(node.children[i]) == -1) {
                change = this.checkArea(node.children[i]);
				return change;
            }
        }
        if (distanceTo(node.children[0], this.point) <= Math.pow(this.nearestDistance,2) && distanceTo(node.children[1], this.point) <= Math.pow(this.nearestDistance,2)){
        	this.visitedAreas.push(node);
        	log("Checking if splitpoint is closer");
        	return this.checkSplitpoint(node.splitpoint);
        }
        this.visitedAreas.push(node);
        return change;
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

KDTreeNearestNeighbor.prototype.checkSplitpoint = function (splitpoint) {
	var change = false;
	if(dist(splitpoint, this.point) < this.nearestDistance) {
	    this.nearestDistance = dist(splitpoint, this.point);
	    this.nearestPoint = splitpoint;
		log("Splitpoint " + arrayPointToString(splitpoint) + " is closer.");
	    change = true;
	}
	else {
		log("Splitpoint was not closer.");
	}
	this.visitedPoints.push(splitpoint);
	return change;
}

KDTreeNearestNeighbor.prototype.draw = function () {
	
	//Draw the kdtree
	this.kdtree.draw();
    //Draw visited areas with different color
    for (var i = 0; i < this.visitedAreas.length; i++) {
        var area = this.visitedAreas[i];
        drawCube([area.x, area.y, area.z], area.size, 0x00cc11, -0.1); //green
    }
    //Draw current residential area with different color
    var size = this.residingArea.size
    drawCube([this.residingArea.x, this.residingArea.y, this.residingArea.z], size, 0x9400ff, -0.05); //pink
	
    if(this.searchArea != null){
		var size = this.searchArea.size
	    drawCube([this.searchArea.x, this.searchArea.y, this.searchArea.z], size, 0x00ffff, -0.15); //light blue
    }
	
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
		this.checkSplitpoint(this.residingArea.splitpoint);
        log("Searching for the area where point " + arrayPointToString(this.point) + " resides.");
        log("Current nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
		return true;
	}
	if (this.residingArea.children.length != 0) {
        for (var i = 0; i < this.residingArea.children.length; i++) {
            if (this.residingArea.children[i].contains(this.point)) {
                this.residingArea = this.residingArea.children[i];
                break;
            }
        }
        if(this.residingArea.children.length == 0){
        	log("Found area where point " + arrayPointToString(this.point) + " resides.");
        } else {
    		this.checkSplitpoint(this.residingArea.splitpoint);
        } 
        log("Current nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
        return true;
	}
	
    if (this.visitedAreas.indexOf(this.residingArea) == -1) {
    	this.searchArea = this.residingArea;
        if(this.checkArea(this.residingArea)){
	        log("New nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
		}else{
			log("No closer point in residing area.");
		}
        return true;
    }

    if(!this.nearestFound){
    	if(this.searchArea.parent.parent != null && !this.goingDown){
    		var parent = this.searchArea.parent;
    		for(var i = 0; i < parent.children.length; i++){
    			var node = parent.children[i];
    			if (this.visitedAreas.indexOf(node) == -1 && distanceTo(node, this.point) <= Math.pow(this.nearestDistance,2)) {
                    if (this.checkArea(node)) {
    					log("New nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
                    }else{
    					log("No closer points in current area.");
    				}
    				return true;
                }
    		}
    		log("Moving up");
    		this.searchArea = parent;
    		return true;
    	} 
		else {
			if(this.searchArea.parent.parent == null && !this.goingDown){
				this.visitedAreas.push(this.searchArea);
				this.searchArea = this.searchArea.parent;
				this.goingDown = true;
			}
    		if(this.searchArea.children.length != 0){
	    		var child1 = this.searchArea.children[0];
	    		var child2 = this.searchArea.children[1];
	    		var unvisited = [];
	    		if(this.visitedAreas.indexOf(child1) == -1) unvisited.push(child1);
	    		if(this.visitedAreas.indexOf(child2) == -1) unvisited.push(child2);
	    		if(unvisited.length == 2){
	    			if(distanceTo(child1, this.point) <= Math.pow(this.nearestDistance,2) && 
	    					distanceTo(child2, this.point) <= Math.pow(this.nearestDistance,2)){
	    				if(this.visitedPoints.indexOf(this.searchArea.splitpoint) == -1){
		    				log("Both subareas need to be checked.");
	    					this.checkSplitpoint(this.searchArea.splitpoint);
	    					return true;
	    				}
	    				log("Checking the first subarea.");
	    				this.parentsToCheck.push(this.searchArea);
	    				this.searchArea = child1;
	    				return true;
	    			} else if (distanceTo(child1, this.point) <= Math.pow(this.nearestDistance,2)){
	    				this.visitedAreas.push(this.searchArea);
	    				this.searchArea = child1;
	    				log("One of the subareas needs to be checked.");
	    				return true;
	    			} else if (distanceTo(child2, this.point) <= Math.pow(this.nearestDistance,2)){
	    				this.visitedAreas.push(this.searchArea);
	    				this.searchArea = child2;
	    				log("One of the subareas needs to be checked.");
	    				return true;
	    			} else {
	    				log("No subareas need to be checked.");
	    				this.visitedAreas.push(this.searchArea);
	    				return true;
	    			}
	    		} else if(unvisited.length == 1){
	    			if (distanceTo(unvisited[0], this.point) <= Math.pow(this.nearestDistance,2)){
	    				this.visitedAreas.push(this.searchArea);
	    				this.searchArea = unvisited[0];
	    				log("The other subarea needs to be checked.");
	    				return true;
	    			} else {
	    				log("The other subarea doesn't need to be checked.");
	    				this.visitedAreas.push(this.searchArea);
	    				var index = this.parentsToCheck.indexOf(this.searchArea); 
		    			if(index != -1){
		    				this.parentsToCheck.splice(index, 1);
		    			}
		    			if(this.parentsToCheck.length != 0){
		    				this.searchArea = this.searchArea.parent;
			    			return true;
		    			} else {
		    				this.nearestFound = true;
		    			}
	    			}
	    		} else {
	    			log("All subareas visited.");
	    			this.visitedAreas.push(this.searchArea);
	    			var index = this.parentsToCheck.indexOf(this.searchArea); 
	    			if(index != -1){
	    				this.parentsToCheck.splice(index, 1);
	    			}
	    			if(this.parentsToCheck.length != 0){
	    				this.searchArea = this.searchArea.parent;
		    			return true;
	    			} else {
	    				this.nearestFound = true;
	    			}
	    		}
    		} else {
    			if(this.checkArea(this.searchArea)){
    				log("New nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
                }else{
					log("No closer points in current area.");
				}
    			if(this.parentsToCheck.length == 0){
    				log("No more areas to check.");
    				this.nearestFound = true;
    			}else{
    				this.searchArea = this.parentsToCheck.pop();
    			}
    			return true;
    		}
    	}
    }
    if(this.nearestFound){
	    //Tagasta midagi, et teaks et on lähim leitud.
		log("Final nearest point is " + arrayPointToString(this.nearestPoint) + " at a distance of " + this.nearestDistance.toFixed(2) + ".");
    }
    else {log("Could not find the point.");}
    return false
}
