

var OctTree = function(x,y,z,width, objects){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = width;
	this.children = [];
	this.objects = objects;
	this.MAX_OBJECTS = 5;
	this.NNpoint = [];
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
		this.children[0] = new OctTree(x,y,z,width/2);
		this.children[1] = new OctTree(x+width/2,y,z,width/2);
		this.children[2] = new OctTree(x,y,z+depth/2,width/2);
		this.children[3] = new OctTree(x+width/2,y,z+depth/2,width/2);
		this.children[4] = new OctTree(x,y+height/2,z,width/2);
		this.children[5] = new OctTree(x+width/2,y+height/2,z,width/2);
		this.children[6] = new OctTree(x,y+height/2,z+depth/2,width/2);
		this.children[7] = new OctTree(x+width/2,y+height/2,z+depth/2,width/2);

		
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
//FUncion to put this object to right subcube.
OctTree.prototype.NearestNeighbor = function(object){
	this.NNpoint = object;
}

//Chec subcubes get current closest
OctTree.prototype.doNNStep() = function(){
	
}