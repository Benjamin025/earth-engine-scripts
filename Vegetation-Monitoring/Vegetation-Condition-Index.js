/*===========================================================================================
                      Agriculture Drought Monitoring and Hazard Assessment
                                 Vegetation Condition Index (VCI)
  ===========================================================================================
  Within this script MODIS data is used to calculate the Vegetation Condition Index (VCI)
  for a specific time and location. 
  The VCI is an indicator of the status of vegetation cover as a function of NDVI minima and 
  maxima encountered for a given ecosystem over many years. It is a better indicator of water 
  stress condition than the NDVI. The deviation of the vegetation condition is an indicator 
  of the intensity of the impact of drought on vegetation growth.

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
var monthn = +month; //numerical
var yearn = +year; //numerical
var monthn1 = monthn+1;
if (monthn1 == 13) {
  var monthn1 = 01;
}
var month1 = padLeadingZeros(monthn1,2);

// Zoom to AOI
Map.centerObject(roi,5);

//Visualization Palette
var vis =  ['d7191c', 'fdae61', 'ffffc0', 'a6d96a', '1a9641'];

// Selection of Specific Month for analysis

var imageFilter = ee.Filter.calendarRange(monthn,monthn,'month');

//selection of Historical datasets 
var startDate = ee.String('2000-').cat(month);
var endDate = ee.String((yearn-1).toString()).cat('-').cat(month1);
if (monthn1 == 1) {
  var endDate = ee.String((yearn).toString()).cat('-').cat(month1);
}

var collection = ee.ImageCollection('MODIS/061/MOD13Q1').filterDate(startDate, endDate).filter(imageFilter);

var factor_NDVI = function(image){
  return image.multiply(0.0001).divide(3.2768);
};

var ndvi = collection.select('NDVI').map(factor_NDVI);

// minimum and maximum NDVI

var minNDVI = ndvi.min();
var maxNDVI = ndvi.max();

// Specific month time to see the drought like condition.
var imageStartDate = year.concat('-',month);
var imageEndDate = ee.String((yearn).toString()).cat('-').cat(month1);
if (monthn1 == 1) {
  var imageEndDate = ee.String((yearn+1).toString()).cat('-').cat(month1);
}

var image = ee.ImageCollection('MODIS/061/MOD13Q1').filterDate(imageStartDate, imageEndDate).filter(imageFilter).max();

var imageNDVI = image.select('NDVI');
imageNDVI = factor_NDVI(imageNDVI);
var cal1 = imageNDVI.subtract(minNDVI);
var cal2 = maxNDVI.subtract(minNDVI);
//calculation of VCI and clipping according to the AOI
var VCI = cal1.divide(cal2).clip(roi);

Map.addLayer(VCI,{
  min: -1,
  max: 1,
  palette: vis}, 'VCI',false);

// applying Classification criteria 
var image02 = ee.Image(VCI.lt(0.1).and(VCI.gte(-1)));
var image04 = ee.Image(((VCI.gte(0.1)).and(VCI.lt(0.2))).multiply(2));
var image06 = ((VCI.gte(0.2)).and(VCI.lt(0.3))).multiply(3);
var image08 = ((VCI.gte(0.3)).and(VCI.lt(0.4))).multiply(4);
var image10 = (VCI.gte(0.4)).multiply(5);
var Drought_Index = (image02.add(image04).add(image06).add(image08).add(image10));
var Drought_Index = Drought_Index.float();

// Export to Google Drive
Export.image.toDrive({
  image: Drought_Index,
  description: 'Drought_Index_VCI',
  fileNamePrefix: 'Drought_Index_VCI',
  region: roi,
  scale: 1000,
  crs: 'EPSG:4326',
  skipEmptyTiles: true
});


Map.addLayer(Drought_Index,{
  min: 1,
  max: 5,
  palette: vis}, 'Drought Index');


//////////////////////////////////////////////////////////////////////////////////
//Creation of Classification Legend 
///////////////////////////////////////////////////////////////////////////////

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'Drought Index (VCI)',
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
legend.add(makeRow('d7191c', 'Extreme'));//1
legend.add(makeRow('fdae61', 'Severe'));//2
legend.add(makeRow('ffffc0', 'Moderate'));//3
legend.add(makeRow('a6d96a', 'Mild'));//4
legend.add(makeRow('1a9641', 'No Drought'));//5

Map.add(legend);

// Function used for transforming dates to string and having leading 0, if necessary
function padLeadingZeros(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}
