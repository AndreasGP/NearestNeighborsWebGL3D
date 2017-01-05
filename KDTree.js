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
	this.MAX_OBJECTS = 3;
	this.Parent = Parent;
}

function compare(a, b, xyz){
	return a[xyz] - b[xyz];
}

//Check if a given point exists within this section
KDTree.prototype.contains = function(obj){
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
	for(var i = 0; i < this.children.length; i++){
		if(this.children[i].contains(object)){
			this.children[i].objects.push(object);
			break;
		}
	}
}

//Render kdree
KDTree.prototype.draw = function(){
	//Render self
	var colors = [0xFF5555, 0x55FF55, 0x5555FF];
	if(this.children.length>1){
		var split = this.children[1];
		switch(this.lvl%3){
		case 0:
			addCube([split.x/20+0.001,split.y/20+0.001,split.z/20+0.001],[0,split.ywidth/20-0.002,split.zwidth/20-0.002],colors[0]);
		case 1:
			addCube([split.x/20+0.001,split.y/20+0.001,split.z/20+0.001],[split.xwidth/20-0.002,0,split.zwidth/20-0.002],colors[1]);
		case 2:
			addCube([split.x/20+0.001,split.y/20+0.001,split.z/20+0.001],[split.xwidth/20-0.002,split.ywidth/20-0.002,0],colors[2]);
		}
	}
	//Render children
	for(var i = 0; i < this.children.length; i++){
		this.children[i].draw();
	}
}

//A single step of kdtree building
KDTree.prototype.doStep = function(){
	if(this.objects.length > this.MAX_OBJECTS){

		var temp = JSON.parse(JSON.stringify(this.objects));
		temp = temp.sort(function(a,b){return compare(a,b,0)});
		var splitpoint = temp[Math.floor(temp.length/2)];
		
		this.objects = [];
		
		var newwidth;
		
		if(this.lvl%3 == 0){
			newwidth = splitpoint[0] - this.x;
			this.children[0] = new KDTree(this.x,this.y,this.z, newwidth,this.ywidth,this.zwidth, this.lvl+1, [], this);
			this.children[1] = new KDTree(splitpoint[0],this.y,this.z, this.xwidth-newwidth,this.ywidth,this.zwidth, this.lvl+1, [], this);
		} else if(this.lvl%3 == 1){
			newwidth = splitpoint[1]-this.y;
			this.children[0] = new KDTree(this.x,this.y,this.z, this.xwidth,newwidth,this.zwidth, this.lvl+1, [], this);
			this.children[1] = new KDTree(this.x,splitpoint[1],this.z, this.xwidth,this.ywidth-newwidth,this.zwidth, this.lvl+1, [], this);
		} else {
			newwidth = splitpoint[2]-this.z;
			this.children[0] = new KDTree(this.x,this.y,this.z, this.xwidth,this.ywidth,newwidth, this.lvl+1, [], this);
			this.children[1] = new KDTree(this.x,this.y,splitpoint[2], this.xwidth,this.ywidth,this.zwidth-newwidth, this.lvl+1, [], this);
		}

		
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
