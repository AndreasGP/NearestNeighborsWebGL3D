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
    clearEverything();
    
    points = generatePoints();
    
    algorithm = document.getElementById("chosenalgorithm").value
    log("Chosen algorithm is " + algorithm +".");
    
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
    
    
    //TODO: Manage algorithm switching properly
    oct = new OctTree(0, 0, 0, [max - min, max - min, max - min], points);
    oct.buildTree();
	oct.draw();
    algorithm = new OctTreeNearestNeighbor(oct, searchPoint);
//    while (algorithm.doStep());
//    algorithm.draw();

    //kd = new KDTree(0,0,0,20,20,20,0,points);
    //algorithm = kd
    //kd.draw();

    //TODO: Make it work with this
    //doNextStep(algorithm)
    //instead of this
    //while(algorithm.doStep());
}



var doNextStep = function(){
	clearEverything();
	addDataPointsToRendering();
    drawSearchPoint();
    var cont = algorithm.doStep()
	algorithm.draw();
    if(cont) {
        setTimeout(doNextStep, 1000)
    }
}

function onDoNextStepClicked() {
    log("Do next step pressed");
	doNextStep();
}

function onConsoleClearClicked() {
    document.getElementById("algortihmconsole").value = "";
}

function log(text) {
    document.getElementById("algortihmconsole").value += text + "\n";
}
