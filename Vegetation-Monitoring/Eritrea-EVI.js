

// Set the area of interest
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');
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

// Import the MODIS dataset and select the relevant bands
var modis = ee.ImageCollection('MODIS/006/MOD13A1')
              .filterDate('2010-01-01', '2024-01-01')
              .select(['NDVI', 'EVI', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b01']);

// Function to calculate EVI
var calculateEVI = function(image) {
  var nir = image.select('sur_refl_b02');  // Near-infrared band
  var red = image.select('sur_refl_b01');  // Red band
  var blue = image.select('sur_refl_b03'); // Blue band
  
  // Reproject the image to EPSG:4326 (WGS84) to match the desired geometry
  image = image.reproject({
    crs: 'EPSG:4326',
    scale: 500  // Scale is set to 500 meters
  });
  
  // Calculate the EVI using the expression
  var evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
      'NIR': nir,
      'RED': red,
      'BLUE': blue
    }
  ).rename('EVI');
  
  return evi;
};

// Map the EVI calculation function over the MODIS collection
var eviCollection = modis.map(calculateEVI);

// Reproject the region geometry (Eritrea) to EPSG:4326
var eritreaReprojected = eritrea.geometry().transform('EPSG:4326');

// Get the first image from the collection and reproject it
var firstEVI = eviCollection.first().reproject('EPSG:4326', null, 500).clip(eritreaReprojected);

// Define visualization parameters for EVI
var eviVisParams = {
  min: 0,
  max: 1,
  palette: ['white', 'blue', 'green']
};

// Add the first EVI layer to the map
Map.addLayer(firstEVI, eviVisParams, 'First EVI Image');

// Plot the chart showing monthly EVI trends
var chartEVI = ui.Chart.image.seriesByRegion({
  imageCollection: eviCollection,
  regions: eritreaReprojected,  // Use reprojected region
  reducer: ee.Reducer.mean(),
  band: 'EVI',
  scale: 5000,  // Scale to match the MODIS resolution
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Monthly EVI over Eritrea',
  hAxis: {title: 'Time'},
  vAxis: {title: 'EVI'},
  lineWidth: 2,
  colors: ['green']
});

// Display the chart
print(chartEVI);
