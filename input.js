//TODO: Make this file read actual input from the UI

var minX = minY = minZ = 10000;
var maxX = maxY = maxZ = -10000;

function generatePoints() {
    var points = [];
    
    for(var i = 0; i < 50; i++) {
	var x = Math.random() * 15 + 2;
	var y = Math.random() * 15 + 2;
	var z = Math.random() * 15 + 2;
	points.push([x, y, z]);
    }

    points.push([1, 1, 1]);
    points.push([2, 1, 2]);
    points.push([0, 3, 2]);
    points.push([3, 2, 0]);
    points.push([1, 3, 1]);
    points.push([2, 0, 4]);
    points.push([4, 0, 0]);
    
    return points;
}

function updateMinMax() {
    	if(points.length == 0) {
		console.log("No points provided!");
		return;
	}
        minX = minY = minZ = 10000;
        maxX = maxY = maxZ = -10000;
        
	for(var index in points) {
		var point = points[index];
		var x = point[0];
		var y = point[1];
		var z = point[2];

		if(x < minX) minX = x;
		if(y < minY) minY = y;
		if(z < minZ) minZ = z;
		if(x > maxX) maxX = x;
		if(y > maxY) maxY = y;
		if(z > maxZ) maxZ = z;
	}
}


function getSearchablePoint() {
    //TODO: read from UI
    var x = Math.random() * (maxX - minX) + minX;
    var y = Math.random() * (maxY - minY) + minY;
    var z = Math.random() * (maxZ - minZ) + minZ;
    
    return [x, y, z];
}

var points = generatePoints();
updateMinMax();

var searchablePoint = getSearchablePoint();