

var OctTree = function(x,y,z,width, objects, Parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = width;
	this.children = [];
	this.objects = objects;
	this.MAX_OBJECTS = 5;
	this.Parent = Parent;
}

OctTree.prototype.contains = function(object){
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

OctTree.prototype.addObject(object){
	for(var i = 0; i < 8; i++){
		if(this.children[i].contains(object)){
			this.children.objects.push(object);
			break;
		}
	}
}


OctTree.prototype.doStep = function(){
	if(this.objects.length > this.MAX_OBJECTS){
		this.children[0] = new OctTree(x,y,z,width/2,this);
		this.children[1] = new OctTree(x+width/2,y,z,width/2,this);
		this.children[2] = new OctTree(x,y,z+depth/2,width/2,this);
		this.children[3] = new OctTree(x+width/2,y,z+depth/2,width/2,this);
		this.children[4] = new OctTree(x,y+height/2,z,width/2,this);
		this.children[5] = new OctTree(x+width/2,y+height/2,z,width/2,this);
		this.children[6] = new OctTree(x,y+height/2,z+depth/2,width/2,this);
		this.children[7] = new OctTree(x+width/2,y+height/2,z+depth/2,width/2,this);

		
		var temp = JSON.parse(JSON.stringify(this.objects));
		
		this.objects = []
		
		for(var i = 0; i < temp.length; i++){
			this.addObject(temp[i]);
		return true;
	}else{
		for(var i = 0; i < 8; i++){
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
var OctTreeNearestNeighbor = function(octree, point){
	this.octree = octree;
	this.point = point;
	this.residingOctant = null;
	this.nearestDistance = null;
	this.visitedOctants = [];
}

OctTreeNearestNeighbor.prototype.doStep = function(){
	if(!this.residingOctant){
		while(this.octree.children.length != 0){
			for(var i = 0; i<8; i++){
				if(this.octree.children[i].contains(this.point)){
					this.octree = this.octree.children[i];
					break;
				}
			}
		}
		this.residingOctant = this.octree;
		return;
	}
	if(!this.nearestDistance){
		this.checkOctant(node);
		return;
	}
	
	while(this.residingOctant.Parent != null){
		var Parent = this.residingOctant.Parent;
		
		for(var i = 0; i < 8; i++){
			var node = Parent.children[i];
			
			if(!this.visitedOctants.contains(node) && distanceTo(node,this.point) < this.nearestDistance){
				if(this.checkOctant(node)){
					this.residingOctant = node;
					return;
				}
			}
		}
	}
}

OctTree.prototype.checkOctant = function(node){
	if(!this.nearestDistance){
		this.nearestDistance = Infinity;
	}
	var points = node.objects;
	var change = false;
	for(var i = 0; i < points.length; i++){
		if(distance(points[i],this.point) < this.nearestDistance){
			this.nearestDistance = distance(points[i],this.point);
			this.nearestPoint = points[i];
			change = true;
		}
	}
	this.visitedOctants.push(node);
	return change;
}