//Main KDTree Object. 
var KDTree = function(x, y, z, size, lvl, objects, parent = null){
	this.x = x;
	this.y = y;
	this.z = z;
	this.size = size;
	this.lvl = lvl;
	this.children = [];
	this.objects = objects;
	this.MAX_OBJECTS = 0;
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
			this.children[i].objects.push(point);
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
	if(this.objects.length > this.MAX_OBJECTS){
		var temp = JSON.parse(JSON.stringify(this.objects));
		temp = temp.sort(function(a,b){return compare(a,b,0)});
		this.splitpoint = temp[Math.floor(temp.length/2)];
		
		this.objects = [];
		
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
