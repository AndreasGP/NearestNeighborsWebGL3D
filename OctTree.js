

var OctTree = function(x,y,z,width, height, depth){
	this.x = x;
	this.y = y;
	this.z = z;
	this.width = width;
	this.height = height;
	this.depth = depth;
	this.children = [];
	this.objects = [];
	this.recursive_depth = 0;
	this.MIN_OBJECTS = 2;
	this.MAX_OBJECTS = 5;
	this.MAX_DEPTH = 8;
}

OctTree.prototype.contains = function(object){
	if(obj.x > this.x && obj.x < this.x + this.width){
		if(obj.y > this.y && obj.y < this.y + this.height){
			if(obj.z > this.z && obj.z < this.z + this.depth){
				return true;
			}		
			return false;
		}
		return false;
	}
	return false;
}

OctTree.prototype.addObject = function(object){
	//Vaja parandada veel
	if(this.contains(object){
		if(this.children.length != 0){
			for(int i = 0; i < 8; i++){
				if(this.children[i].contains(object)){
					this.children[i].addObject(object);
					return true;
				}
			}
		}else{
			this.objects.push(object)
			this.checkFullness();
			return true;
		}
	}
	return false;
}

OctTree.prototype.checkFullness(){
	if(this.objects.length > this.MAX_OBJECTS && recursive_depth < MAX_DEPTH){
		this.children[0] = new OctTree(x,y,z,width/2,height/2,depth/2);
		this.children[1] = new OctTree(x+width/2,y,z,width/2,height/2,depth/2);
		this.children[2] = new OctTree(x,y,z+depth/2,width/2,height/2,depth/2);
		this.children[3] = new OctTree(x+width/2,y,z+depth/2,width/2,height/2,depth/2);
		this.children[4] = new OctTree(x,y+height/2,z,width/2,height/2,depth/2);
		this.children[5] = new OctTree(x+width/2,y+height/2,z,width/2,height/2,depth/2);
		this.children[6] = new OctTree(x,y+height/2,z+depth/2,width/2,height/2,depth/2);
		this.children[7] = new OctTree(x+width/2,y+height/2,z+depth/2,width/2,height/2,depth/2);
		
		for(int i = 0; i < 8; i++){
			this.children[i].recursive_depth += 1;
		}
		
		var temp = JSON.parse(JSON.stringify(this.objects));
		
		this.objects = []
		
		for(var i = 0; i < temp.length; i++){
			this.addObject(temp[i]);
		}
	}
}