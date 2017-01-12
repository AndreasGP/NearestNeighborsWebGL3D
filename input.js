var min = 0;
var max = 10;

function generatePoints() {
    var points = [];
    
    var numberOfPoints = document.getElementById("randomElementsCount").value
    
    for(var i = 0; i < numberOfPoints; i++) {
	var x = Math.random() * (max - min) + min;
	var y = Math.random() * (max - min) + min;
	var z = Math.random() * (max - min) + min;
	points.push([x, y, z]);
    }
    
    log(numberOfPoints + " random points generated.");
    return points;
}
var algorithm;
function onGenerateClicked() {
    
    onConsoleClearClicked();
    
    clearEverything();
    
    points = generatePoints();
    
    algorithmName = document.getElementById("chosenalgorithm").value
    log("Chosen algorithm is " + algorithmName +".");
    
    var x = document.getElementById("searchX").value;
    var y = document.getElementById("searchY").value;
    var z = document.getElementById("searchZ").value;
    
    if(x == "" || y == "" || z == "" || isNaN(x) || isNaN(y) || isNaN(z)) {
        var x = Math.random() * (max - min) + min;
        var y = Math.random() * (max - min) + min;
        var z = Math.random() * (max - min) + min;
    }
    
    searchPoint = [parseInt(x), parseInt(y), parseInt(z)];
    
    log("Searching for the nearest neighbour of point " + arrayPointToString(searchPoint) + ".");
    
    addDataPointsToRendering();
    drawSearchPoint();
    
    //TODO: Make algorithms use this
    maxPartitionElements = document.getElementById("maxElements").value
   
    if(algorithmName == "octree") {
        oct = new OctTree(0, 0, 0, [max - min, max - min, max - min], points);
        oct.buildTree();
        oct.draw();
        
        algorithm = new OctTreeNearestNeighbor(oct, searchPoint);
        algorithm.draw();
    } else if(algorithmName == "kdtree") {
        kd = new KDTree(0, 0, 0, [max - min, max - min, max - min], 0, points);
        kd.buildTree();
        kd.draw();
        
        algorithm = new KDTreeNearestNeighbor(kd, searchPoint);
        //algorithm.draw();
    } else if(algorithmName == "rptree") {
        RPTree.searchRadius = null;
        RPTree.nn = null;
        var sT = pointSpaceTo3DRenderSpace(searchPoint);
        var searchVector = new THREE.Vector3(sT[0],sT[1],sT[2]);
        var initialBounds = RPTree.initBounds(min,max);
        rp = new RPTree(points,searchVector,initialBounds,maxPartitionElements,null)
        algorithm = rp
    }
    
    if(doStepsAutomatically) {
        doNextStep();
    }
}

doStepsAutomatically = false;
stepInterval = 500;

function onDoStepsAutomaticallyChanged() {
    doStepsAutomatically = document.getElementById("autoUpdate").checked;
    if(doStepsAutomatically) {
        doNextStep();
    }
}

var doNextStep = function(){
    clearEverything();
    addDataPointsToRendering(); 
    drawSearchPoint();
    
    var cont = algorithm.doStep();
    
    algorithm.draw();
    if(cont && doStepsAutomatically) {
        setTimeout(doNextStep, stepInterval)
    }
}

function onDoNextStepClicked() {
    doNextStep();
}

function updateUpdateInterval(value) {
    document.getElementById("updaterIntervalValue").value = value + " ms";
    stepInterval = value;
}

function onConsoleClearClicked() {
    document.getElementById("algortihmconsole").value = "";
}

function log(text) {
    var console = document.getElementById("algortihmconsole")
    console.value += text + "\n";
    console.scrollTop = console.scrollHeight;
}
