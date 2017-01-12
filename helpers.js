//Find the position of 'value' between min and max.
//if value == min, 0 is returned; if value == max, 1 is returned
//otherwise it's inbetween 0 and 1
function lerpPoint(value, min, max) {
	return 1 - (max - value)/(max - min);
}

function round2(value){
	return Math.round(value * 100) / 100;
}

function pointSpaceTo2DRenderSpace(point) {
    x = lerpPoint(point[0], min, max) * width;
    y = lerpPoint(point[1], min, max) * width;
    z = lerpPoint(point[2], min, max) * width;
    
    return [x, y, z]
}

function pointSpaceTo3DRenderSpace(point) {
    x = (lerpPoint(point[0], min, max)*2 - 1) * 10;
    y = (lerpPoint(point[1], min, max)*2 - 1) * 10;
    z = (lerpPoint(point[2], min, max)*2 - 1) * 10;
    
    return [x, y, z]
}

function pointSpaceSizeTo3DRenderSpaceSize(point) {
    x = lerpPoint(point[0], min, max)*20;
    y = lerpPoint(point[1], min, max)*20;
    z = lerpPoint(point[2], min, max)*20;
    
    return [x, y, z]
}

function arrayPointToString(point) {
    return "(" + +point[0].toFixed(2) + ", " 
                + +point[1].toFixed(2) + ", " 
                + +point[2].toFixed(2) + ")";
}

//Not in active use functions
function getPixel(image, x, y) {
	return image.data[(y * image.width + x) * 4];
}

function setPixel(image, x, y, v) {
	image.data[(y * image.width + x) * 4] = v;
	image.data[(y * image.width + x) * 4 + 1] = v;
	image.data[(y * image.width + x) * 4 + 2] = v;
}

function setPixelRGB(image, x, y, r, g, b) {
	image.data[(y * image.width + x) * 4] = r;
	image.data[(y * image.width + x) * 4 + 1] = g;
	image.data[(y * image.width + x) * 4 + 2] = b;
}

