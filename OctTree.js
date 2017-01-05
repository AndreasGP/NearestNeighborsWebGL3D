//Main Octree Object. 
var OctTree = function(x, y, z, width, objects, Parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = width;
	this.children = [];
	this.objects = objects;
	this.MAX_OBJECTS = 1;
	this.Parent = Parent;
}

//Check if a given point exsists within this octree/octant
OctTree.prototype.contains = function(obj){
	if(obj[0] > this.x && obj[0] <= this.x + this.width){
		if(obj[1] > this.y && obj[1] <= this.y + this.width){
			if(obj[2] > this.z && obj[2] <= this.z + this.width){
				return true;
			}		
			return false;
		}
		return false;
	}
	return false;
}

//Add object to current octree/octant
OctTree.prototype.addObject = function(object){
	for(var i = 0; i < 8; i++){
		if(this.children[i].contains(object)){
			this.children[i].objects.push(object);
			break;
		}
	}
}

//Render octree
OctTree.prototype.draw = function(){
	//Render self
	addCube([this.x/20,this.y/20,this.z/20],[this.width/20,this.width/20,this.width/20],0xFF5555);
	//Render children
	for(var i = 0; i < this.children.length; i++){
		this.children[i].draw();
	}
}

//A single step of octree building
OctTree.prototype.doStep = function(){
	if(this.objects.length > this.MAX_OBJECTS){
		this.children[0] = new OctTree(this.x, this.y, this.z, this.width/2, [], this);
		this.children[1] = new OctTree(this.x+this.width/2, this.y, this.z, this.width/2, [], this);
		this.children[2] = new OctTree(this.x, this.y, this.z+this.width/2, this.width/2, [], this);
		this.children[3] = new OctTree(this.x+this.width/2, this.y, this.z+this.width/2, this.width/2, [], this);
		this.children[4] = new OctTree(this.x, this.y+this.width/2, this.z, this.width/2, [], this);
		this.children[5] = new OctTree(this.x+this.width/2, this.y+this.width/2, this.z, this.width/2, [], this);
		this.children[6] = new OctTree(this.x, this.y+this.width/2, this.z+this.width/2, this.width/2, [], this);
		this.children[7] = new OctTree(this.x+this.width/2, this.y+this.width/2, this.z+this.width/2, this.width/2,[ ], this);

		
		var temp = JSON.parse(JSON.stringify(this.objects));
		
		this.objects = []
		
		for(var i = 0; i < temp.length; i++){
			this.addObject(temp[i]);
		}
		return true;
	} else {
		for(var i = 0; i < this.children.length; i++){
			if(this.children[i].doStep()){
				return true;
			}
		}
	}
	//Done, no more partitioning needed
	return false;
}

var distance = function(p1,p2){
	return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2) +Math.pow(p1.z-p2.z, 2));
}

//Object for radius NN search on octree
var OctTreeNearestNeighbor = function(octree, point){
	this.octree = octree;
	this.point = point;
	this.residingOctant = null;
	this.nearestDistance = null;
	this.nearestPoint = null;
	this.visitedOctants = [];
}
function distanceTo(node, point){
	var x,y,z;
	
	if(Math.abs(node.x-point[0]) < Math.abs(node.x+node.width - point[0])){
		x = node.x;
	}else{
		x = node.x + node.width;
	}
	
	if(Math.abs(node.y-point[1]) < Math.abs(node.y+node.width - point[1])){
		y = node.y;
	}else{
		y = node.y + node.width;
	}
	
	if(Math.abs(node.z-point[2]) < Math.abs(node.z+node.width - point[2])){
		z = node.z;
	}else{
		z = node.z + node.width;
	}
	
	return distance(point,[x,y,z]);
}

//Check the current octant for closest node inside that octant, if any excist.
OctTreeNearestNeighbor.prototype.checkOctant = function(node){
	if(this.nearestDistance == null){
		this.nearestDistance = Infinity;
	}
	var points = node.objects;
	var change = false;
	for(var i = 0; i < points.length; i++){
		console.log(distance(points[i],this.point))
		if(distance(points[i],this.point) < this.nearestDistance){
			this.nearestDistance = distance(points[i],this.point);
			this.nearestPoint = points[i];
			change = true;
		}
	}
	this.visitedOctants.push(node);
	return change;
}

OctTreeNearestNeighbor.prototype.draw = function(){
	//Draw the octree
	this.octree.draw();
	//Draw curent residential octant with different color
	addCube([this.residingOctant.x/20,this.residingOctant.y/20,this.residingOctant.z/20],[this.residingOctant.width/20,this.residingOctant.width/20,this.residingOctant.width/20],0xFF8899);
	//Draw visited octants with different color
	
	//Draw a sphere showing current search radius
	
	//Draw current nearest point with different color
}

//Single step of NN
//Step 1: Find the octant where our node is
//Step 2: Find the nearest node in that ctant to our node
//Step 3 - ...: Check if any other octant within radius contains a node closer to us.
//If closest has been found nothing is done here anymore
OctTreeNearestNeighbor.prototype.doStep = function(){
	if(!this.residingOctant){
		this.residingOctant = this.octree;
		while(this.residingOctant.children.length != 0){
			for(var i = 0; i<8; i++){
				if(this.residingOctant.children[i].contains(this.point)){
					this.residingOctant = this.residingOctant.children[i];
					break;
				}
			}
		}
		return true;
	}
	//Siin mingit huina muinat vaja teha
	if(!this.nearestDistance){
		this.checkOctant(this.residingOctant);
		return true;
	}
	
	//Ei käi kõike läbi... vajab uurimist.
	while(this.residingOctant.Parent != null){
		var Parent = this.residingOctant.Parent;
		for(var i = 0; i < Parent.children.length; i++){
			var node = Parent.children[i];
			if(this.visitedOctants.indexOf(node) == -1 && distanceTo(node,this.point) < this.nearestDistance){
				if(this.checkOctant(node)){
					this.residingOctant = node;
					return true;
				}
			}
		}
		this.residingOctant = Parent;
	}
	//Tagasta midagi, et teaks et on lähim leitud.
	return false
}
