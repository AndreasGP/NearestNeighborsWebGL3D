var RPTree = function(objects, searchPoint, bounds, max_per_partition, parent) {
    this.connectingLine = null;
    this.splittingPlane = null;
    this.splittingVector = null;
    this.bounds_visualized = false;
    this.partition_max = max_per_partition;
    this.children = [];
    this.objects = objects;
    this.bounds = bounds;
    this.searchPoint = searchPoint;
    this.state = State.START;
    this.parent = parent;
    this.colors = [0x4286f4, 0xff0000, 0x00ff00];
};

var State = {
    START: 0,
    WAITING_LINE: 1,
    LINE_MADE: 2, 
    PLANE_MADE: 3,
    DONE_BUILDING: 4,
    SEARCH_INIT: 5,
    SEARCH_WAITING_1: 6,
    SEARCH_WAITING_2: 7,
    SEARCH_FOUND: 8,
    SEARCH_DONE: 9
};

RPTree.prototype.visualizeBounds = function( fillcolour ) {
    
    var vertices = [];
    for (var k in this.bounds){
        var l = this.bounds[k]              
        if (!vertices.includes(l.start)){
            vertices.push(l.start);
        };
        if (!vertices.includes(l.end)){
            vertices.push(l.end);
        }
    }
    this.currentDraw = drawPolygonV3(vertices,fillcolour, 0x4286f4, true, 0.2);
    this.bounds_visualized = true;
};

RPTree.prototype.drawTemp = function(vertices) {
    drawPolygonV3(vertices,0xffFFFF, 0x00FF00, true, 0.2);
};

RPTree.searchRadius = null;
RPTree.nn = null;

RPTree.prototype.draw = function(depth) {
    if(this.parent === null){
        this.drawNN();
    }
    if(isNaN(depth)) {
        depth = 0;
    }
    switch(this.state){
        case State.WAITING_LINE:
            //log("Partitioning highlighted area.");
            console.log("visualizing bounds");
            this.visualizeBounds(0xFFFFFF);
            break;
        case State.LINE_MADE:
            //log("Creating the plane between these two points.");
            console.log("Showing line between two points");
            this.drawConnectingLine();
            break;
        case State.PLANE_MADE:
            console.log("Showing plane between two points");
            this.drawConnectingLine();
            this.drawMidPoint();
            this.drawSplittingPlane(depth);
            break;
        case State.DONE_BUILDING:
            if(this.splittingPlane === null){
                break;
            }
            this.drawSplittingPlane(depth);
            this.drawChildren(depth+1);
            break;
        case State.SEARCH_INIT:
            log("Searching for NN in highlighted area.");
            this.visualizeBounds(0xf4e842);
            if(this.splittingPlane === null){
                break;
            }
            this.drawSplittingPlane(depth);
            this.drawChildren(depth+1);
            break;
        case State.SEARCH_WAITING_1:
            this.drawSplittingPlane(depth);
            this.drawChildren(depth+1);
            break;
        case State.SEARCH_DONE:
            if(this.splittingPlane !== null){
                this.drawSplittingPlane(depth);
            } else {
                this.visualizeBounds(0xFFFFFF);
            }
            this.drawChildren(depth+1);
            break;
        case State.SEARCH_WAITING_2:
            this.drawSplittingPlane(depth);
            this.drawChildren(depth+1);
            break;
    }
};

RPTree.prototype.drawNN = function() {
    if(RPTree.searchRadius !== null){
        console.log("center and radius:")
        var center = RPTree.searchRadius.center;
        console.log(center);
        var radius = RPTree.searchRadius.radius;
        console.log(radius);
        drawSphereV3(center,radius,0xf47442,true,0.4);
    }
    if(RPTree.nn !== null){
        var lineToNN = new THREE.Line3(RPTree.nn,this.searchPoint);
        this.visualizeLine(lineToNN);
    }
};

RPTree.prototype.drawSplittingPlane = function(depth) {
    this.drawPlane(this.splittingPlane, this.colors[depth % this.colors.length]);
};

RPTree.prototype.drawChildren = function(depth) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].draw(depth);
    }
};

RPTree.prototype.doStep = function() {
    switch(this.state){
        case State.START:
            if(this.objects.length <= this.partition_max){
                this.state = State.DONE_BUILDING;
                return false;
            }
            this.state = State.WAITING_LINE;
            return true;
        case State.WAITING_LINE:
            this.createLine();
            this.state = State.LINE_MADE;
            return true;
        case State.LINE_MADE:
            this.createPlane();
            this.partition();
            this.state = State.PLANE_MADE;
            return true;
        case State.PLANE_MADE:
            this.state = State.DONE_BUILDING;
            return true;
        case State.DONE_BUILDING:
            if (this.doStepInChildren()){
               return true;
            }
            if (this.parent === null){
                this.state = State.SEARCH_INIT;
                return true;
            }
            return false;
        case State.SEARCH_INIT:
            if (this.children.length === 0){
                if (this.searchForPoint()){
                    this.state = State.SEARCH_FOUND;
                    return true;
                }
                this.state = State.SEARCH_DONE;
                return false;
            }
            var selectedChild = null;
            if (this.partitionPoint(this.searchPoint)){
                selectedChild = this.children[0];
            } else {
                selectedChild = this.children[1];
            }
            selectedChild.state = State.SEARCH_INIT;
            this.state = State.SEARCH_WAITING_1;
            return true;
        case State.SEARCH_WAITING_1:
            if(this.doStepInChildren()){
                return true;
            };
            var selectedChild = null;
            if (this.partitionPoint(this.searchPoint)){
                selectedChild = this.children[1];
            } else {
                selectedChild = this.children[0];
            }
            if(this.radiusClipsEdge()){
                selectedChild.state = State.SEARCH_INIT;
                this.state = State.SEARCH_WAITING_2;
                return true;
            }
            this.state = State.SEARCH_DONE;
            return false;
        case State.SEARCH_FOUND:
            this.state = State.SEARCH_DONE;
            return false;
        case State.SEARCH_WAITING_2:
            if(this.doStepInChildren()){
                return true;
            }
            this.state = State.SEARCH_DONE;
            return false;
    }
};

RPTree.prototype.searchForPoint = function() {
    console.log("Searching for NN");
    var minDistance = null;
    var minPoint = null;
    if (RPTree.searchRadius !== null){
        minDistance = RPTree.searchRadius.radius;
    }
    var updated = false;
    for(var k in this.objects){
        var point = this.array2Vec(this.objects[k]);
        var distance = this.searchPoint.distanceTo(point);
        if (minDistance === null){
            updated = true;
            minDistance = distance;
            minPoint = point;
        } else if(minDistance > distance){
            updated = true;
            minDistance = distance;
            minPoint = point;
        }
    }
    if (updated){
        RPTree.nn = minPoint;
        RPTree.searchRadius = new THREE.Sphere(this.searchPoint,minDistance);
        console.log("RADIUS:")
        console.log(RPTree.searchRadius);
    }
    return updated;
};

RPTree.prototype.radiusClipsEdge = function (point) {
    if(RPTree.searchRadius === null){
        console.log("No search radius? this should not happen!");
        return false;
    }
    return RPTree.searchRadius.intersectsPlane(this.splittingPlane);
};

RPTree.prototype.doStepInChildren = function() {
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].doStep()) {
            return true;
        }
    }
    return false;
};

RPTree.prototype.drawConnectingLine = function() {
    scene.add(this.connectingLine);
};

RPTree.prototype.drawMidPoint = function() {
    function drawSphereOn3D(x, y, z) {
        var geometry = new THREE.SphereGeometry( 0.3, 8, 6 );
        var material = new THREE.MeshLambertMaterial( { color: 0x5BFF4C } );
        var obj = new THREE.Mesh( geometry, material );
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;

        scene.add(obj);
    }
    var v = this.midpoint;
    drawSphereOn3D(v.x,v.y,v.z)
}
RPTree.prototype.test = function (x, y, z) {
        var geometry = new THREE.SphereGeometry( 0.3, 8, 6 );
        var material = new THREE.MeshLambertMaterial( { color: 0x5BFF4C } );
        var obj = new THREE.Mesh( geometry, material );
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;

        scene.add(obj);
    };
    
RPTree.prototype.testWithColour = function (x, y, z, colour) {
        var geometry = new THREE.SphereGeometry( 0.3, 8, 6 );
        var material = new THREE.MeshLambertMaterial( { color: colour} );
        var obj = new THREE.Mesh( geometry, material );
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;

        scene.add(obj);
    };

RPTree.prototype.createLine = function() {
    var indices = this.genRand(0,this.objects.length-1,2);
    var firstPoint = this.array2Vec(this.objects[indices[0]]);
    var secondPoint = this.array2Vec(this.objects[indices[1]]);

    var geometry = new THREE.Geometry();
    geometry.vertices.push(firstPoint);
    geometry.vertices.push(secondPoint);
    var material = new THREE.LineBasicMaterial({
        color: 0xFF0000
    });
    this.midpoint = new THREE.Line3(firstPoint,secondPoint).getCenter()
    this.connectingLine = new THREE.Line(geometry,material);
    scene.add(this.connectingLine);
    var sv = new THREE.Vector3();
    sv.subVectors(secondPoint,firstPoint);
    sv.normalize();
    this.splittingVector = sv;
};

RPTree.prototype.createPlane = function() {
    var sv = this.splittingVector;
    var centerPlane = new THREE.Plane(sv);
    var distance = centerPlane.distanceToPoint(this.midpoint);
    var p = new THREE.Plane(sv,-distance);
    this.splittingPlane = p;
};

RPTree.prototype.drawPlane = function( plane , colour) {
    var edges = [];
    for (var k in this.bounds){
        var line = this.bounds[k];
        if (plane.intersectsLine(line)){
            var intersect = plane.intersectLine(line);
            edges.push(intersect);
        }
    };
    return drawPolygonV3(edges,colour, colour, true, 0.2);
};

RPTree.prototype.partition = function() {
    var p = this.splittingPlane;
    var linesToPartition = [];
    var intersectionPoints = [];
    for (var k in this.bounds){
        var line = this.bounds[k];
        if (p.intersectsLine(line)){
            var intersect = p.intersectLine(line);
            intersectionPoints.push(intersect);
            linesToPartition.push(new THREE.Line3(line.start,intersect));
            linesToPartition.push(new THREE.Line3(line.end,intersect));
        }else{
            linesToPartition.push(line);
        }
    };
    
    var beyondPlaneBounds = [];
    var beyondPlanePoints = [];
    
    var otherBounds = [];
    var otherPoints = [];
    
    for(var k in linesToPartition){
        var line = linesToPartition[k];
        var center = line.getCenter();
        if(this.partitionPoint(center)){
            beyondPlaneBounds.push(line);
        } else{
            otherBounds.push(line);
        }
    }
    var convexGeometry = new THREE.ConvexGeometry(intersectionPoints);
    var verts = convexGeometry.vertices;
    
    var pointsToMap = [];
    for (var k in verts){
        pointsToMap.push(verts[k].clone());
    }
    var planeLines = this.GrahamScan(pointsToMap);
    
    for(var k in planeLines){
        beyondPlaneBounds.push(planeLines[k]);
        otherBounds.push(planeLines[k]);        
        //this.visualizeLine(planeLines[k]);
    }
    
    for(var k in this.objects){
        var pt = this.objects[k];
        if(this.partitionPoint(this.array2Vec(pt))){
            beyondPlanePoints.push(pt);
        } else{
            otherPoints.push(pt);
        }
    }
    this.children.push(new RPTree(beyondPlanePoints,this.searchPoint,beyondPlaneBounds,this.partition_max,this));
    this.children.push(new RPTree(otherPoints,this.searchPoint,otherBounds,this.partition_max,this));
};

RPTree.prototype.LinearTransformation = function(points) {
        if(!points.length > 3){
        return;
    }
    var z = new THREE.Vector3(0,0,0);
    
    var p1 = points[0];
    var p2 = points[1];
    
    var v1 = this.splittingVector.clone().normalize();
    
    var v2 = new THREE.Vector3();
    v2.subVectors(p2,p1).normalize();
    
    var v3 = new THREE.Vector3();
    v3.crossVectors(v1,v2).normalize();
    
    var line1 = new THREE.Line3(z,v1);
    var line2 = new THREE.Line3(z,v2);
    var line3 = new THREE.Line3(z,v3);
    /*
     * //Uncomment to show image basis
    this.visualizeLine(line1);
    this.visualizeLine(line2);
    this.visualizeLine(line3);
    */
    
    var transformationMatrix = new THREE.Matrix3();
    var base = new THREE.Matrix3();
    base.identity();
    
    transformationMatrix.set(
            v1.x,v1.y,v1.z,
            v2.x,v2.y,v2.z,
            v3.x,v3.y,v3.z);
    
    var inv = new THREE.Matrix3();
    inv.getInverse(transformationMatrix,true);
    inv.transpose();
    
    var mappedPoints = [];
    var restoreMap = new Map();
    
    for (var k in points){
        var p = points[k];
        var mp = p.clone().applyMatrix3(inv);
        restoreMap.set(mp,p);
        var r = restoreMap.get(mp);
        mappedPoints.push(mp);
    }
    
    
    
    //Uncomment this if you want to see the transformed image of the plane.
    //var colour = 0xf4b042;
    //drawPolygonV3(mappedPoints,colour, colour, true, 0.2);
    return [mappedPoints,restoreMap];
};


RPTree.prototype.GrahamScan = function( points ) {

    //Using Graham scan (https://en.wikipedia.org/wiki/Graham_scan)
     var res = this.LinearTransformation(points);
     var mappedPoints = res[0];
     var restoreMap = res[1];
     var n = mappedPoints.length;

    function compareFunction(a,b) {
        var diff = a.y - b.y;
        if (diff===0){
            return a.z - b.z;
        } else{
            return diff;
        }
    }
    mappedPoints.sort(compareFunction);
    
    var lowest = mappedPoints[0].clone();
    
    function polarCompare(a,b) {
        
        var an = a.clone().normalize();
        var bn = b.clone().normalize()
        var angleDeg1 = Math.atan2(a.z - lowest.z, a.y - lowest.x) * 180 / Math.PI;
        var angleDeg2 = Math.atan2(b.z - lowest.z, b.y - lowest.x) * 180 / Math.PI;
        
        return angleDeg1-angleDeg2
    }
    
    mappedPoints.sort(polarCompare);
    var n = mappedPoints.length

    function ccw(p1,p2,p3){
        return (p2.y - p1.y)*(p3.z - p1.z) - (p2.z - p1.z)*(p3.y-p1.y);
    }
    
    var m = 1;
    mappedPoints.unshift(mappedPoints.slice(-1)[0]);
    for(var i = 2;i<=n;i++){
        while(ccw(mappedPoints[m-1],mappedPoints[m],mappedPoints[i]) <= 0){
            if (m>1){
                m -= 1;
                continue
            } else if (i===n){
                break
            } else{
                i += 1;
            }      
        }
        m++;
        var tmp = mappedPoints[m];
        mappedPoints[m] = mappedPoints[i];
        mappedPoints[i] = tmp;
    }
    
    mappedPoints.pop();
    var resLines = [];
    for(var i = 0;i<n;i++){        
        var source = restoreMap.get(mappedPoints[i]);
        var t = mappedPoints[i];        
        var j = (i+1)%mappedPoints.length;
        var destination = restoreMap.get(mappedPoints[j]);
        var line2 = new THREE.Line3(source,destination);
        resLines.push(line2);
    }
    return resLines;
};

RPTree.prototype.visualizeLine = function(l) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(l.start);
    geometry.vertices.push(l.end);
    var material = new THREE.LineBasicMaterial({
        color: 0xFF0000
    });
    var line = new THREE.Line(geometry,material);
    scene.add(line);
}

RPTree.prototype.partitionPoint = function (point) {
    var l = new THREE.Line3(THREE.Vector3(0,0,0),point)
    return this.splittingPlane.intersectsLine(l);
}

RPTree.prototype.vertsFromLine = function(line){
    return [line.start,line.end];
};

RPTree.prototype.array2Vec = function(array) {
    a = pointSpaceTo3DRenderSpace(array);
    return new THREE.Vector3(a[0],a[1],a[2]);
};

RPTree.prototype.genRand = function(min,max,cnt) {
    //http://stackoverflow.com/questions/14021351/two-random-numbers
    var arr = [];
    for (var i = min, j = 0; i <= max; j++, i++)
    arr[j] = i;
    arr.sort(function () {
        return Math.floor((Math.random() * 3) - 1);
    });
    return arr.splice(0, cnt);
};

RPTree.initBounds = function(min, max){
    var squares = [];
    var heights = [min,max];
    var lines = [];
    for (var zi in heights){
        var z = heights[zi];
        var squareBefore = [
        pointSpaceTo3DRenderSpace([min,min,z]),
        pointSpaceTo3DRenderSpace([max,min,z]),
        pointSpaceTo3DRenderSpace([max,max,z]),
        pointSpaceTo3DRenderSpace([min,max,z])
        ];
        square = [];
        for (var k in squareBefore){
            var p = squareBefore[k];
            square.push(new THREE.Vector3(p[0],p[1],p[2]))
        }
        squares.push(square);
        for (var i = 0; i<4;i++){
            var j = (i+1)%4;
            var source = square[i];
            var target = square[j];
            lines.push(new THREE.Line3(source,target));
        }
    }
    for(var i=0; i<4;i++){
        var source = squares[0][i];
        var target = squares[1][i];
        lines.push(new THREE.Line3(source,target));
    }
    return lines;
};