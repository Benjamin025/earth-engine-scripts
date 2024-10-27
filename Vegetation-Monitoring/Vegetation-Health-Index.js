/*===========================================================================================
                      Agriculture Drought Monitoring and Hazard Assessment
                                 Vegetation Health Index (VHI)
  ===========================================================================================
  Within this script MODIS data is used to calculate the Vegetation Health Index (VHI)
  for a specific time and location. 
  The VHI is a combination of the constructed VCI and TCI and can be used effectively for 
  drought assessments.

  ===========================================================================================

  :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
                                      RUN A DEMO (optional)

   If you would like to run an example, you can use the predefined geometry below as well as 
   the other predefined parameter settings. 
   The code will take you to the Sindh Province, Pakistan, looking at the drought situation 
   in March 2019.  

   --> Remove the comment-symbol (//) below so Earth Engine recognizes the polygon.*/
  
// var geometry = ee.Geometry.Polygon([[[67.0438497, 24.74674177],[67.3075216, 28.323637774435067],[70.6913106898558, 28.594081948857962],[70.3836935023558, 24.666896799718423]]]);

/* 
    Now hit Run to start the demo! 
    Do not forget to delete/outcomment this geometry before creating a new one!
  :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*/

//******************************************************************************************* 
//                                        USER INPUT

// 1. Import the shapefile of your study area, or draw a polygon in the map window below.
//
// 2. At the top, change the name of the import or drawn polygon to AOI.

//    a) If a shapefile import is used, remove // symbols in next line:
// var geometry = AOI.geometry();

//    b) If a polygon was drawn in Google Earth Engine Map, remove // symbols in next line:
// var geometry = AOI;

// 3. Set variable for which month (format 'MM'), and year (format 'YYYY') you want to 
// calculate the index:

var month = '03';
var year = '2019';

/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  ----> The final flood product will be ready for download on the right (under Console) <----
  ******************************************************************************************/

// Transformations for dates
var monthn = +month; // numerical
var yearn = +year; // numerical
var monthn1 = monthn+1;
if (monthn1 == 13) {
  var monthn1 = 01;
}
var month1 = padLeadingZeros(monthn1,2);

// Zoom to AOI
Map.centerObject(roi,5);

// Visualization Palette
var vis =  ['d7191c', 'fdae61', 'ffffc0', 'a6d96a', '1a9641'];
// Filterout Specific Month for analysis
var imageFilter = ee.Filter.calendarRange(monthn,monthn,'month');

// selection of Historical time period for analysis
var startDate = ee.String('2000-').cat(month);
var endDate = ee.String((yearn-1).toString()).cat('-').cat(month1);
if (monthn1 == 1) {
  var endDate = ee.String((yearn).toString()).cat('-').cat(month1);
}



// Load Terra Vegetation Indices 16-Day Global 250m Collection of Past time period
var collection = ee.ImageCollection('MODIS/061/MOD13Q1').filterDate(startDate, endDate).filter(imageFilter);

// Scale factor for NDVI
var factor_NDVI = function(image){
  return image.multiply(0.0001).divide(3.2768);
};

// Map factor function for NDVI
var ndvi = collection.select('NDVI').map(factor_NDVI);

// minimum and maximum NDVI
var minNDVI = ndvi.min();
var maxNDVI = ndvi.max();

// Specific month time to see the drought like condition
var imageStartDate = year.concat('-',month);
var imageEndDate = ee.String((yearn).toString()).cat('-').cat(month1);
if (monthn1 == 1) {
  var imageEndDate = ee.String((yearn+1).toString()).cat('-').cat(month1);
}

// Terra Vegetation Indices 16-Day Global 250m Collection of drought monitroing time period
var image = ee.ImageCollection('MODIS/061/MOD13Q1').filterDate(imageStartDate, imageEndDate).filter(imageFilter).max();

//calculation of VCI and clipping according to the AOI
var imageNDVI = image.select('NDVI');
imageNDVI = factor_NDVI(imageNDVI);
var cal1 = imageNDVI.subtract(minNDVI);
var cal2 = maxNDVI.subtract(minNDVI);
var VCI = cal1.divide(cal2).clip(roi);

// VCI display to map
Map.addLayer(VCI,{
  min: -1,
  max: 1,
  palette: vis}, 'VCI',false);


// Load collection for TCI
var collection = ee.ImageCollection('MODIS/061/MOD11A2').filterDate(startDate, endDate).filter(imageFilter);
var lst = collection.select('LST_Day_1km');

// minimum and maximum LST
var minLST = lst.min();
var maxLST = lst.max();

// LST Collection of drought monitroing time period
var image = ee.ImageCollection('MODIS/061/MOD11A2').filterDate(imageStartDate, imageEndDate).filter(imageFilter).max();
var imageLST = image.select('LST_Day_1km');

// calculation of TCI and clipping according to the AOI
var TCI = (maxLST.subtract(imageLST)).divide(maxLST.subtract(minLST)).clip(roi);

// TCI display to map
Map.addLayer(TCI,{
  min: -1,
  max: 1,
  palette: vis}, 'TCI',false);

// calculation of VHI
var VHI = (VCI.multiply(0.5)).add(TCI.multiply(0.5));

// VHI display to map
Map.addLayer(VHI,{
  min: -1,
  max: 1,
  palette: vis}, 'VHI',false);

// VHI classification into classes based on threshold values to calculate Drought Index
var image02 = ee.Image(VHI.lt(0.1).and(VHI.gte(-1)));
var image04 = ee.Image(((VHI.gte(0.1)).and(VHI.lt(0.2))).multiply(2));
var image06 = ((VHI.gte(0.2)).and(VHI.lt(0.3))).multiply(3);
var image08 = ((VHI.gte(0.3)).and(VHI.lt(0.4))).multiply(4);
var image10 = (VHI.gte(0.4)).multiply(5);
var Drought_Index = (image02.add(image04).add(image06).add(image08).add(image10));
var Drought_Index = Drought_Index.float();

// Export to Google Drive
Export.image.toDrive({
  image: Drought_Index,
  description: 'Drought_Index_VHI',
  fileNamePrefix: 'Drought_Index_VHI',
  region: roi,
  scale: 1000,
  crs: 'EPSG:4326',
  skipEmptyTiles: true
});

// Drought display to map
Map.addLayer(Drought_Index,{
  min: 1,
  max: 5,
  palette: vis}, 'Drought Index');


//////////////////////////////////////////////////////////////////////////////////
//Drought Index Legend
///////////////////////////////////////////////////////////////////////////////

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Drought Index (VHI)',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

// Legend Rows
legend.add(makeRow('d7191c', 'Extreme'));//1
legend.add(makeRow('fdae61', 'Severe'));//2
legend.add(makeRow('ffffc0', 'Moderate'));//3
legend.add(makeRow('a6d96a', 'Mild'));//4
legend.add(makeRow('1a9641', 'No Drought'));//5

// Add Legend to Map
Map.add(legend);


// Function used for transforming dates to string and having leading 0, if necessary
function padLeadingZeros(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}
