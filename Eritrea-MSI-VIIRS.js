
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

// 1. Import the VIIRS dataset
var viirs = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG")
                .filterDate('2010-01-01', '2024-01-01')
                .select(['avg_rad']);  // Select relevant band

// Function to calculate MSI (dummy calculation since we don't have the exact SWIR/NIR bands)
// Here you might consider using alternative calculations based on available data.
var calculateMSI_VIIRS = function(image) {
  var avgRad = image.select('avg_rad'); // Using available band
  
  // Dummy MSI calculation: Replace with your actual calculation logic as needed
  var msi = avgRad.divide(1000).rename('MSI');  // Scale it down or adjust as per your need

  return msi.set('system:time_start', image.get('system:time_start'));
};

// Map the MSI calculation function over the VIIRS collection
var msiVIIRSCollection = viirs.map(calculateMSI_VIIRS);

// 2. Import the IMERG dataset for precipitation data
var imerg = ee.ImageCollection("NASA/GPM_L3/IMERG_MONTHLY_V06")
              .filterDate('2010-01-01', '2024-01-01');

// Function to get monthly mean IMERG precipitation
var calculateMonthlyMeanIMERG = function(month) {
  var monthlyImages = imerg.filter(ee.Filter.calendarRange(month, month, 'month'));
  var monthlyMean = monthlyImages.mean().set('month', month);
  return monthlyMean;
};

// List of months from 1 (January) to 12 (December)
var months = ee.List.sequence(1, 12);

// Map the monthly mean calculation over all months for IMERG
var monthlyMeanIMERG = ee.ImageCollection.fromImages(
  months.map(function(month) {
    return calculateMonthlyMeanIMERG(month);
  })
);

// 3. Use a different land cover map
var landCover = ee.ImageCollection("ESA/WorldCover/v100") // Example land cover dataset
                  .filterDate('2020-01-01', '2020-12-31')
                  .first(); // Get the most recent land cover data

// Visualize Land Cover
var landCoverVis = {
  min: 10,
  max: 100,
  palette: ['green', 'brown', 'yellow', 'gray']
};
Map.addLayer(landCover.clip(eritrea.geometry()), landCoverVis, 'Land Cover');

// Define visualization parameters for MSI
var msiVisParams = {
  min: 0,
  max: 1,  // Adjust as per the MSI range
  palette: ['blue', 'white', 'red']
};

// Create a function to calculate monthly mean MSI
var calculateMonthlyMeanMSI = function(month) {
  var monthlyImages = msiVIIRSCollection.filter(ee.Filter.calendarRange(month, month, 'month'));
  var monthlyMean = monthlyImages.mean().set('month', month);
  return monthlyMean;
};

// Calculate monthly mean MSI for each month
var monthlyMeanMSI = ee.ImageCollection.fromImages(
  months.map(function(month) {
    return calculateMonthlyMeanMSI(month);
  })
);

// Add monthly mean MSI layers to the map
monthlyMeanMSI.getInfo(function(images) {
  images.forEach(function(feature) {
    var monthNumber = feature.properties.month; // Use the month number from server-side
    var image = ee.Image(feature.id); // Use the ID to create an Image object

    Map.addLayer(image.clip(eritrea.geometry()), msiVisParams, 'Monthly Mean MSI - Month ' + monthNumber);
  });
});

// Plot the chart showing monthly MSI trends
var chartMSI = ui.Chart.image.seriesByRegion({
  imageCollection: monthlyMeanMSI,
  regions: eritrea.geometry(),  // Use Eritrea region
  reducer: ee.Reducer.mean(),
  band: 'MSI',
  scale: 5000,  // Scale to match the VIIRS resolution
  xProperty: 'month'
}).setOptions({
  title: 'Monthly Mean MSI over Eritrea (VIIRS)',
  hAxis: {title: 'Month'},
  vAxis: {title: 'Moisture Stress Index (MSI)'},
  lineWidth: 2,
  colors: ['red']
});

// Display the chart
print(chartMSI);

// Function to add a legend to the map
function addLegend() {
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
  });

  var legendTitle = ui.Label('Land Cover Legend', {fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0'});
  legend.add(legendTitle);

  // Define land cover classes and colors
  var landCoverClasses = [
    {name: 'Cropland', color: 'green'},
    {name: 'Forest', color: 'brown'},
    {name: 'Urban', color: 'gray'},
    {name: 'Water', color: 'blue'}
    // Add more classes as necessary
  ];

  // Add each class to the legend
  landCoverClasses.forEach(function(landCoverClass) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: landCoverClass.color,
        width: '20px',
        height: '20px',
        margin: '0 4px 4px 0'
      }
    });
    var description = ui.Label(landCoverClass.name);
    legend.add(ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal')));
  });

  Map.add(legend);
}

// Call the function to add the legend
addLegend();
