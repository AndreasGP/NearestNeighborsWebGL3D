//Main KDTree Object. 
var KDTree = function(x, y, z, xwidth, ywidth, zwidth, lvl, objects, Parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.xwidth = xwidth;
	this.ywidth = ywidth;
	this.zwidth = zwidth;
	this.lvl = lvl;
	this.children = [];
	this.objects = objects;
	this.MAX_OBJECTS = 5;
	this.Parent = Parent;
}

function compare(a, b, xyz){
	return a[xyz] - b[xyz];
}

//Check if a given point exists within this section
KDTree.prototype.contains = function(object){
	if(obj[0] > this.x && obj[0] <= this.x + this.xwidth){
		if(obj[1] > this.y && obj[1] <= this.y + this.ywidth){
			if(obj[2] > this.z && obj[2] <= this.z + this.zwidth){
				return true;
			}
		}
	}
	return false;
}

//Add object to current section
KDTree.prototype.addObject = function(object){
	for(var i = 0; i < 2; i++){
		if(this.children[i].contains(object)){
			this.children.objects.push(object);
			break;
		}
	}
}

//Render kdree
KDTree.prototype.draw = function(){
	//Render self
	
	//Render children
	for(var i = 0; i < this.children.length; i++){
		this.children[i].draw();
	}
}

//A single step of kdtree building
KDTree.prototype.doStep = function(){
	if(this.objects.length > this.MAX_OBJECTS){

		var temp = JSON.parse(JSON.stringify(this.objects));
		temp.sort(function(a,b){compare(a,b,lvl%3)});
		var splitpoint = temp[temp.length/2]
		
		this.objects = []
		
		var newwidth;
		
		if(this.lvl%3 == 0){
			newwidth = splitpoint[0]-x;
			this.children[0] = new OctTree(x,y,z, newwidth,ywidth,zwidth, lvl+1, this);
			this.children[1] = new OctTree(splitpoint[0],y,z, xwidth-newwidth,ywidth,zwidth, lvl+1, this);
		} else if(this.lvl%3 == 1){
			newwidth = splitpoint[1]-y;
			this.children[0] = new OctTree(x,y,z, xwidth,newwidth,zwidth, lvl+1, this);
			this.children[1] = new OctTree(x,splitpoint[1],z, xwidth,ywidth-newwidth,zwidth, lvl+1, this);
		} else {
			newwidth = splitpoint[2]-z;
			this.children[0] = new OctTree(x,y,z, xwidth,ywidth,newwidth, lvl+1, this);
			this.children[1] = new OctTree(x,y,splitpoint[2], xwidth,ywidth,zwidth-newwidth, lvl+1, this);
		}

		
		for(var i = 0; i < temp.length; i++){
			this.addObject(temp[i]);
			return true;
		}
		
	} else {
		for(var i = 0; i < 2; i++){
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
