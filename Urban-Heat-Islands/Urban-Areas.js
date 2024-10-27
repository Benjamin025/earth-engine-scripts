// Functions to prepare the data

//Function to mask clouds using the Sentinel-2 QA band
function maskS2clouds(image) {
  var qa = image.select('QA60');
  // Bits 10 and 11 are clouds and cirrus, respectively
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

// Function to calculate spectral indices
var getND = function(image){
  // the normalized difference vegetation index
  var ndvi = image.normalizedDifference(['B8', 'B4']);
  // the normalized difference bare index
  var ndbi = image.normalizedDifference(['B12', 'B8']).rename('ndbi');
  // the normalize difference water index
 // var ndwi = image.normalizedDifference(['B3', 'B8']);
  var original = image.addBands(ndvi).addBands(ndbi)
  return original;
};


 

// Get Sentinel 2 data and filter it by time, location and cloud cover
var dataset = ee.ImageCollection('COPERNICUS/S2_SR')
                  .filterDate('2020-05-01', '2020-09-30')
                  .filterBounds(roi)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds) // apply function to mask cloudy pixels
                  .map(getND); // apply function to add spectral indices

var visualization = {  min: 0.0, max: 0.3, bands: ['B4', 'B3', 'B2'],};
Map.addLayer(dataset.mean(), visualization, 'RGB');


// Mask the input for clouds.  Compute the min of the input mask to mask
var s2_maximum = dataset.max()
var input = dataset.median().addBands(s2_maximum);

// Visualise vegetation using NDVI treshold
var vegetationThreshold = 0.65
var ndvi_th = input.select('nd').gt(vegetationThreshold)
var ndvi = ndvi_th.updateMask(ndvi_th).clip(roi)
var ndvi_viz = {palette:"#088222"};
Map.addLayer(ndvi, ndvi_viz, 'Vegetation');

// Load reference data points. The numeric property 'class' stores known labels.
// The randomColumn() method will add a column of uniform random
// numbers in a column named 'random' by default.
var withRandom = ref.randomColumn('random');
var split = 0.7;  // split the reference data: 70% training, 30% testing.
var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
var testingPartition = withRandom.filter(ee.Filter.gte('random', split));

// Sample the input imagery to get a FeatureCollection of training data.
var training = input.sampleRegions({
  // Get the sample from the polygons FeatureCollection.
  collection:trainingPartition,
  properties: ['class'],
  tileScale: 16,
  scale: 10
});


// Make a Random Forest classifier and train it.
var classifier = ee.Classifier.smileRandomForest(300)
    .train({
      features: training,
      classProperty: 'class',
      inputProperties: ['B2', 'B3', 'B4', "B8",  "ndbi", 'nd', "nd_1"]
    });

// Classify the input imagery.
var classified = input.classify(classifier);
// Display the input and the classification.
Map.centerObject(roi, 10);
Map.addLayer(classified, {palette: ["white", "black"], min: 0, max: 1}, 'classification');


// Sample the input with validation data.
var testing = input.sampleRegions({
  collection:testingPartition,
  properties: ['class'],
  tileScale: 16,
  scale: 10
});

// Classify the validation data.
var validated = testing.classify(classifier);

// Get a confusion matrix representing expected accuracy.
var testAccuracy = validated.errorMatrix('class', 'classification');
print('Validation error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());