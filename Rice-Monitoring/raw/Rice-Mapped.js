// Create image collection of S2 imagery for period 2017-2018 and
//plot the NDVI course.
//Choose roi
var region = geometry3;

// get the bounding rectangle
var boundingRectangle = geometry;

//Map.addLayer(boundingRectangle, {color: '5F0F6F'}, 'bound polygon');
//Map.addLayer(region, {color: '5F0F6F'}, 'roi polygon');
Map.centerObject(region,10);

// Create image collection of S-2 imagery for the perdiod 2016-2018
var S2 = ee.ImageCollection('COPERNICUS/S2')
//filter start and end date
.filterDate('2017-01-01', '2018-12-31')

//filter according to drawn boundary
.filterBounds(geometry);

// Function to mask cloud from built-in quality band
// information on cloud
var maskcloud1 = function(image) {
var QA60 = image.select(['QA60']);
return image.updateMask(QA60.lt(1).divide(10000));
};

// Function to calculate and add an NDVI band
var addNDVI = function(image) {
return image.addBands(image.normalizedDifference(['B8', 'B4']));
};


// Add NDVI band to image collection
var S2 = S2.map(addNDVI);
// Extract NDVI band and create NDVI median composite image
var NDVI = S2.select(['nd']);
var NDVImed = NDVI.median(); //I just changed the name of this variable ;)
print('S2',S2)
// Create palettes for display of NDVI
var visParams = {
  min: -0.1,
  max: 1.0,
  palette: [
    '0000FF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};

var features = [
  ee.Feature(agriculture_rainfed),
  ee.Feature(builtup),
  ee.Feature(water_body),
  ee.Feature(shrub),
  ee.Feature(rice_rainfed),
  ee.Feature(bare_soil),
];

//print(sentinel1_vh.select('VH'))
// Create a time series chart.
print('features',features)

// Create a time series chart.
var plotNDVI = ui.Chart.image.seriesByRegion(
    S2, features, ee.Reducer.mean(), 'nd', 100, 'system:time_start', 'system:index')
        .setChartType('ScatterChart')
        .setOptions({
          title: 'Sentinel-2 NDVI',
          vAxis: {title: 'NDVI'},
         lineWidth: 1,
          pointSize: 4,
          series: {
           0: {color: '00FF00'}, // rice_rainfed
           1: {color: 'FF0000'}, // builtup
           2: {color: '00ffff'}, // shrub
           3: {color: '#B3E90E'}, //agriculture_rainfed
           4: {color: '#FF0000'}, //water_body
           5: {color: '#E98C0E'}, //bare_soil
}});

// Display.
print(plotNDVI);

// Display NDVI results on map
Map.addLayer(NDVImed.clip(geometry3), visParams, 'NDVI');


