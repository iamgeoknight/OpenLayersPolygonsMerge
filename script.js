/*
Create and Render map on div with zoom and center
*/

let regularStyle = new ol.style.Style({        
    stroke: new ol.style.Stroke({
        color: '#0e97fa',
        width:3
    }),
    fill: new ol.style.Fill({
        color: [0,0,0,0.2]
    }),
});

let highlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: [255,0,0,0.6],
        width: 3
    }),
    fill: new ol.style.Fill({
        color: [255,0,0,0.2]
    }),
    zIndex: 1
});

class OLMap {
    //Constructor accepts html div id, zoom level and center coordinaes
    constructor(map_div, zoom, center) {
        this.map = new ol.Map({
            interactions: ol.interaction.defaults({
                doubleClickZoom: false
            }),
            target: map_div,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(center),
                zoom: zoom
            })
        });
    }
}


/*
Create Vector Layer
*/
class VectorLayer{
    //Constructor accepts title of vector layer and map object
    constructor(title, map) {
        this.layer = new ol.layer.Vector({
            title: title,      
            source: new ol.source.Vector({
                projection:map.getView().projection
            }),
            style: regularStyle
        });
    }
}


/*
Create overlay
*/
class Overlay {
    //Contrctor accepts map object, overlay html element, overlay offset, overlay positioning and overlay class
    constructor(map, element = document.getElementById("popup"), offset = [0, -15], positioning = 'bottom-center',   className = 'ol-tooltip-measure ol-tooltip ol-tooltip-static') {
        this.map = map;
        this.overlay = new ol.Overlay({
            element: element,
            offset: offset,
            positioning: positioning,
            className: className
        });
        this.overlay.setPosition([0,0]);
        this.overlay.element.style.display = 'block';      
        this.map.addOverlay(this.overlay);          
    }
}


class Draw {  
    //Constructor accepts geometry type, map object and vector layer
    constructor(type, map, vector_layer) {
        this.type = type;
        this.vector_layer = vector_layer
        this.map = map;        
        this.interaction = new ol.interaction.Draw({
            type: type,
            stopClick: true
        });                
        this.interaction.on('drawend', this.onDrawEnd);
        this.map.addInteraction(this.interaction);
    }

    onDrawEnd = (e) => {
        this.vector_layer.getSource().addFeature(e.feature);
    }
}


//Create map and vector layer
let map = new OLMap('map', 9, [-96.6345990807462, 32.81890764151014]).map;
let vector_layer = new VectorLayer('Temp Layer', map).layer
map.addLayer(vector_layer);

//Sample Polygon to merge
let polygon1 = new ol.Feature({
    geometry: new ol.geom.Polygon([[[-10717583.549570508, 3833749.5732664512], [-10777554.891503, 3804332.7398631293], [-10864387.34630427, 3834907.5511772], [-10852646.620625805, 3906819.5017894786], [-10717583.549570508, 3833749.5732664512]]]),
});

vector_layer.getSource().addFeature(polygon1);

//Sample polygon to merge
let polygon2 = new ol.Feature({
    geometry: new ol.geom.Polygon([[[-10852646.620625805, 3906819.5017894786], [-10797367.365502242, 3950847.234747086], [-10691456.211645748, 3911711.47159973], [-10687298.044771587, 3848605.062913627], [-10717583.549570508, 3833749.5732664512], [-10852646.620625805, 3906819.5017894786]]]),
});

vector_layer.getSource().addFeature(polygon2);


//Add draw Polygon Interaction to map
let drawPolygon = (e) => {  
    removeInteractions();    

    //Create Polygon Draw interaction    
    new Draw("Polygon", map, vector_layer);
}

let mergePolygon = (e) => {
    /*
        This function is applicable to merge only two polygons
        This function will merge or perform union on two adjacent polygons. For the merge function to work, the polygons should atleast intersect each other.
    */
    
    //Create jsts parser to read openlayers geometry
    let parser = new jsts.io.OL3Parser();       
    
    //Parse Polygons geometry to jsts type
    let a = parser.read(vector_layer.getSource().getFeatures()[0].getGeometry());
    let b = parser.read(vector_layer.getSource().getFeatures()[1].getGeometry());
    
    //Perform union of Polygons. The union function below will merge two polygon together
    let union = a.union(b);    
    let merged_polygon = new ol.Feature({    
        geometry: new ol.geom.Polygon(parser.write(union).getCoordinates())
    });     
    vector_layer.getSource().clear();
    vector_layer.getSource().addFeature(merged_polygon);
    vector_layer.setStyle(highlightStyle);
};


//Remove map interactions except default interactions
let removeInteractions = () => {  
    map.getInteractions().getArray().forEach((interaction, i) => {
        if(i > 7) {
            map.removeInteraction(interaction);
        }
    });
}

//Drag feature
let dragFeature = () => {
    removeInteractions();
    map.addInteraction(new ol.interaction.Translate());
} 


//Clear vector features and overlays and remove any interaction
let clearGraphics = () => {
    removeInteractions();
    map.getOverlays().clear();
    vector_layer.getSource().clear();
    vector_layer.setStyle(regularStyle);
};

//Bind methods to click events of buttons
document.getElementById("btn1").onclick = drawPolygon;

document.getElementById("btn2").onclick = mergePolygon;

document.getElementById("btn3").onclick = dragFeature;

document.getElementById("btn4").onclick = clearGraphics;

