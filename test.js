/**
 * Created by andreas on 09.06.16.
 */

var container=document.getElementById('mapid');
var mapframe=document.getElementById('mapframe');


var layer=new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw',
    })
});
var layer2=new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'http://t1.openseamap.org/seamark//{z}/{x}/{y}.png',
    })
});
var map = new ol.Map({
    target: 'mapid',
    layers: [
        layer,
        layer2
    ],
    controls: [],
    view: new ol.View({
        center: ol.proj.fromLonLat([ 13.45,54.1]),
        zoom: 12
    }),
    interactions:[
        new ol.interaction.MouseWheelZoom({useAnchor: false}),
        new ol.interaction.DragZoom(),
        new ol.interaction.DragPan(),
        new ol.interaction.PinchZoom()
    ]
});

//the slider
var range = document.getElementById('sliderRotate');
var valueDiv = document.getElementById('sliderRValue');

noUiSlider.create(range, {
    start: [ 1], // Handle start position
    step: 0.1, // Slider moves in increments of '10'
    margin: 0.3, // Handles must be more than '20' apart
    direction: 'ltr', // Put '0' at the bottom of the slider
    orientation: 'horizontal',
    range: {
        'min': 0.1,
        'max': 5
    },
    pips: { // Show a scale with the slider
        mode: 'steps',
        density: 0.2
    }
});
var scale=1;
// When the slider value changes, update the input and span
range.noUiSlider.on('update', function( values, handle ) {
    var v=values[handle];
    valueDiv.innerHTML = v;
    scale=parseFloat(v);
    container.style.transform="scale("+scale+")";
    var fscale=(scale-1.0)*0.5+1;
    document.getElementById('positionDisplay').style.fontSize=fscale+"rem";
    document.getElementById('mousePositionDisplay').style.fontSize=fscale+"rem";
    map.render();

});

/**
 *
 * @param {number} coordinate
 * @param axis
 * @returns {string}
 */
function formatLonLatsDecimal(coordinate,axis){
    coordinate = (coordinate+540)%360 - 180; // normalize for sphere being round

    var abscoordinate = Math.abs(coordinate);
    var coordinatedegrees = Math.floor(abscoordinate);

    var coordinateminutes = (abscoordinate - coordinatedegrees)/(1/60);
    var numdecimal=2;
    //correctly handle the toFixed(x) - will do math rounding
    if (coordinateminutes.toFixed(numdecimal) == 60){
        coordinatedegrees+=1;
        coordinateminutes=0;
    }
    if( coordinatedegrees < 10 ) {
        coordinatedegrees = "0" + coordinatedegrees;
    }
    if (coordinatedegrees < 100 && axis == 'lon'){
        coordinatedegrees = "0" + coordinatedegrees;
    }
    var str = coordinatedegrees + "\u00B0";

    if( coordinateminutes < 10 ) {
        str +="0";
    }
    str += coordinateminutes.toFixed(numdecimal) + "'";
    if (axis == "lon") {
        str += coordinate < 0 ? "W" :"E";
    } else {
        str += coordinate < 0 ? "S" :"N";
    }
    return str;
};

//when we scale, the original computation within ol will not work correctly
//as it uses getBoundingClientRectangle of the scaled container
//and this changes with the scale
//instead we use here the unscaled outer container
//afterwards we have to apply the (invers) scale considering the center being the scale origin
function onClick(ev){
    var evpixel=[ev.originalEvent.clientX,ev.originalEvent.clientY];
    var containerRectangle=mapframe.getBoundingClientRect();
    evpixel=[evpixel[0]-containerRectangle.left,evpixel[1]-containerRectangle.top];
    var coord=map.getCoordinateFromPixel(evpixel);
    var center=map.getView().getCenter();
    var diff=[coord[0]-center[0],coord[1]-center[1]];
    diff=[diff[0]/scale,diff[1]/scale];
    var scaledCoord=[center[0]+diff[0],center[1]+diff[1]];

    var clickPos=ol.proj.toLonLat(scaledCoord);
    var lat = formatLonLatsDecimal(clickPos[1], "lat");
    var lon = formatLonLatsDecimal(clickPos[0], "lon");
    document.getElementById('mousePosLat').innerHTML = lat;
    document.getElementById('mousePosLon').innerHTML = lon;
};
map.on('postrender',updatePos);
map.on('click',onClick);


document.getElementById('zoomIn').onclick=function(){
    map.getView().setZoom(map.getView().getZoom()+1);
};
document.getElementById('zoomOut').onclick=function(){
    map.getView().setZoom(map.getView().getZoom()-1);
};

function updatePos(){
    var containerPos = ol.proj.toLonLat(map.getView().getCenter());
    var lat = formatLonLatsDecimal(containerPos[1], "lat");
    var lon = formatLonLatsDecimal(containerPos[0], "lon");
    document.getElementById('posLat').innerHTML = lat;
    document.getElementById('posLon').innerHTML = lon;
}
updatePos();

