// Data url for all earthquakes in the past 7 days from USGS
const eqUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
// Data url for tectonic plates
      tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Load two urls asynchronously
Promise.all([
  d3.json(eqUrl),
  d3.json(tectonicPlatesUrl)
]).then((data) => {
  
  // .......... OVERLAY LAYERS .......... //
  // Create GeoJSON LAYER FOR TECTONIC PLATES 
  let tectonicBndr = L.geoJson(data[1], {
    color: "orange",
    weight: 2
  });

  // Variable for features array from earthquake data
  let features = data[0].features;

  // Create GeoJSON LAYERS FOR EARTHQUAKES
  let earthquakes = L.geoJSON(features, {

    // 1. Cricles determined by "mag"
    pointToLayer: (feature, latlng) => {
      return new L.circle(latlng, {
        radius: radiusPuller(feature),
        fillColor: colorPuller(feature.properties.mag),
        fillOpacity: 1,
        stroke: true,
        weight: 0.5
      });
      
    },
    
    // 2. Event listener for "mouseover" and "mouseout"
    onEachFeature: (feature, layer) => {

      layer.on({
        mouseover: (e) => {
          layer = e.target;
          layer.setStyle({
            fillColor: "black"    // Fill hovered circle with black color
          });
          layer.openPopup();
        },
        mouseout: (e) => {
          layer = e.target;
          layer.setStyle({
            fillColor: colorPuller(feature.properties.mag)   // Reset circle fill color once mouse moved away
          });
          layer.closePopup();
        } 
      });

      layer.bindPopup(`<h6><strong>${feature.properties.place}</strong></h6><hr>
      <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
      <p><strong>Time:</strong> ${new Date(feature.properties.time)}</p>`);

    }

  // end of earthquake layers creation
  });

  // Create OVERLAY OBJECT to hold overlay layers
  let overlayMaps = {
    "Fault Lines": tectonicBndr,
    "Earthquakes": earthquakes
  }; 

    // .......... BASE MAP LAYERS .......... //
  // Define map layers
  let streetsSatelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets-satellite",
    accessToken: API_KEY
  }),
      lightMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
      }),
      outdoorMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.outdoors",
        accessToken: API_KEY
      });
  
  // Create BASE MAP OBJECT to hold base map layers
  let baseMaps = {
    "Satellite": streetsSatelliteMap,
    "Grayscale": lightMap,
    "Outdoors": outdoorMap
  };

  // .......... MAP .......... //
  // Create MAP OBJECT and set default layers
  let myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 3,
    layers: [streetsSatelliteMap, tectonicBndr, earthquakes]
  });  

  // Create a layer control for base map and overlay layers and add it to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Create legend on bottom right of the map
  // https://gis.stackexchange.com/questions/133630/adding-leaflet-legend
  let legend = L.control({
    position: "bottomright"
  });

  legend.onAdd = function() {

    let div = L.DomUtil.create('div', "legend"),
        dummyMagArr = [0, 1, 2, 3, 4, 5];
    
    for (let i = 0; i < dummyMagArr.length; i++) {      
      div.innerHTML +=
        "<i style=\"background-color: " + colorPuller(dummyMagArr[i] + 1) + "\"></i> " +
        dummyMagArr[i] + (dummyMagArr[i + 1] ? "-" + dummyMagArr[i + 1] + "<br>" : "+");
    }

    return div;

  };

  // Add legend to the map
  legend.addTo(myMap);


  // |||||||||| FUNCTIONS |||||||||| //
  /**
   * Determine the visualization color for each datapoint based on its magnitude point value
   * @param {*} feature feature of each datapoint retrieved from earthquake url
   */
  // https://leafletjs.com/examples/choropleth/
  function colorPuller(mag) {

    return mag > 5 ? "orangered" :
            mag > 4 ? "lightcoral" :
            mag > 3 ? "darkorange" :
            mag > 2 ? "goldenrod" :
            mag > 1 ? "yellow" : "greenyellow";
  
  }

  /**
   * Determine the radius (relative) of circle for each datapoint based on its magnitude point value
   * @param {*} feature feature of each datapoint retrieved from earthquake url
   */
  function radiusPuller(feature) {  
   
    return feature.properties.mag * 25000;
  }

});