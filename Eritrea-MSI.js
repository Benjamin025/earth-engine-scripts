
// Make the base map HYBRID.
Map.setOptions('HYBRID');
// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);
// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Set the area of interest: Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Center the map on Eritrea
Map.setCenter(39.782334, 15.179384, 6);

// Import the MODIS MODOCGA dataset and select the relevant bands
var modis = ee.ImageCollection("MODIS/006/MODOCGA")
              .filterDate('2010-01-01', '2024-01-01')
              .select(['sur_refl_b10', 'sur_refl_b11']);  // NIR (b10), SWIR (b11)

// Function to calculate MSI
var calculateMSI = function(image) {
  var nir = image.select('sur_refl_b10');  // Near-infrared band (NIR - b10)
  var swir = image.select('sur_refl_b11'); // Shortwave infrared band (SWIR - b11)
  
  // Calculate the MSI = SWIR / NIR
  var msi = swir.divide(nir).rename('MSI');  // MSI = SWIR / NIR
  
  return msi.set('system:time_start', image.get('system:time_start'));
};

// Map the MSI calculation function over the MODIS collection
var msiCollection = modis.map(calculateMSI);

// Function to calculate the monthly mean MSI
var calculateMonthlyMean = function(month) {
  // Filter the collection for the given month
  var monthlyImages = msiCollection.filter(ee.Filter.calendarRange(month, month, 'month'));
  
  // Calculate the mean for the month
  var monthlyMean = monthlyImages.mean().set('month', month);
  
  return monthlyMean;
};

// List of months from 1 (January) to 12 (December)
var months = ee.List.sequence(1, 12);

// Map the monthly mean calculation over all months
var monthlyMeanMSI = ee.ImageCollection.fromImages(
  months.map(function(month) {
    return calculateMonthlyMean(month);
  })
);

// Define visualization parameters for MSI
var msiVisParams = {
  min: 0,
  max: 2,
  palette: ['blue', 'white', 'red']
};

// Reproject the region geometry (Eritrea) to EPSG:4326
var eritreaReprojected = eritrea.geometry().transform('EPSG:4326');

// Add monthly mean MSI layers to the map using evaluate
monthlyMeanMSI.evaluate(function(images) {
  images.features.forEach(function(feature) {
    var monthNumber = feature.properties.month; // Use the month number from server-side
    var image = ee.Image(feature.id); // Use the ID to create an Image object

    Map.addLayer(image.clip(eritreaReprojected), msiVisParams, 'Monthly Mean MSI - Month ' + monthNumber);
  });
});

// Plot the chart showing monthly MSI trends
var chartMSI = ui.Chart.image.seriesByRegion({
  imageCollection: monthlyMeanMSI,
  regions: eritreaReprojected,  // Use reprojected region
  reducer: ee.Reducer.mean(),
  band: 'MSI',
  scale: 5000,  // Scale to match the MODIS resolution
  xProperty: 'month'
}).setOptions({
  title: 'Monthly Mean MSI over Eritrea',
  hAxis: {title: 'Month'},
  vAxis: {title: 'Moisture Stress Index (MSI)'},
  lineWidth: 2,
  colors: ['red']
});

// Display the chart
print(chartMSI);
