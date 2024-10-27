


// Filter the dataset to only include Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);

// Get the Sentinel-1 collection and filter by space/time.
var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(eritrea)
    .filterDate('2024-05-01', '2024-08-31')
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'));

// Function to apply Otsu thresholding and create water masks for each image
function applyWaterMask(image) {
  // Get VV band for the image
  var band = 'VV';
  
  // Get the histogram for thresholding
  var histogramReducer = ee.Reducer.histogram(255, 0.1);
  var globalHistogram = ee.Dictionary(
      image.select(band).reduceRegion({
          reducer: histogramReducer,
          geometry: image.geometry(),
          scale: 90,
          maxPixels: 1e10
      }).get(band)
  );
  
  // Otsu thresholding function (same as in the previous code)
  function otsu(histogram) {
      histogram = ee.Dictionary(histogram);
      var counts = ee.Array(histogram.get('histogram'));
      var means = ee.Array(histogram.get('bucketMeans'));
      var size = means.length().get([0]);
      var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
      var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
      var mean = sum.divide(total);
      var indices = ee.List.sequence(1, size);
      var bss = indices.map(function(i) {
          var aCounts = counts.slice(0, 0, i);
          var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
          var aMeans = means.slice(0, 0, i);
          var aMean = aMeans.multiply(aCounts).reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
          var bCount = total.subtract(aCount);
          var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
          return aCount.multiply(aMean.subtract(mean).pow(2))
              .add(bCount.multiply(bMean.subtract(mean).pow(2)));
      });
      return means.sort(bss).get([-1]);
  }
  
  // Apply Otsu threshold to the image
  var globalThreshold = otsu(globalHistogram);
  
  // Create a water mask based on the threshold
  var globalWater = image.select(band).lt(globalThreshold);
  
  // Mask the image and add it as a new band (binary water mask)
  return image.addBands(globalWater.rename('water_mask').selfMask());
}

// Apply the water mask function to the entire collection
var s1WithWater = s1Collection.map(applyWaterMask);

// Define visualization parameters for Sentinel-1 and water mask
var visParams = {
  bands: ['VV'],
  min: -25,
  max: 0,
  palette: ['blue', 'black', 'white']
};

var waterVisParams = {
  bands: ['water_mask'],
  palette: ['0000FF'], // blue for water
  min: 0,
  max: 1
};

// Create a time-lapse animation
var animationFrames = s1WithWater.map(function(image) {
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd');
  
  // Visualize the image and water mask, and annotate with the date
  var imageVis = image.visualize(visParams);
  var waterVis = image.select('water_mask').visualize(waterVisParams);
  var composite = ee.ImageCollection([imageVis, waterVis])
      .mosaic()
      .set({'system:time_start': image.get('system:time_start')});
  
  // Add date annotation to the image
  var annotated = composite.visualize({forceRgbOutput: true})
    .set('Label', date);
  return annotated;
});

// Parameters for exporting the animation as a GIF
var gifParams = {
  region: eritrea.geometry(),
  dimensions: 600,
  framesPerSecond: 2,
  crs: 'EPSG:4326'
};

// Export the animation as a GIF to the console
print(ui.Thumbnail(animationFrames, gifParams));
