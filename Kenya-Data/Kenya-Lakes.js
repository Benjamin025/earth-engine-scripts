//Example of GLORIA in situ data locations for 7-15-2019
//
 Map.addLayer(table,{color: 'purple'},'July 15, 2019');
//
// See the rectangular polygon covering western portion of Lake Erie where GLORIA in-situ meausrements are available
// This script is to select Sentinel-2 MSI images for the the area of our interest defined above
/*
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */ 
function maskS2clouds(image) {
  var qa = image.select('QA60');

// Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
//
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}
//Through the GEE catalog we have selected Atmospherically Corrected  Surface Reflectance (SR) images 
// Access Sentine-2 image collection, filter them my a date-range, mask cloudy pixels, and 
// clip to the region of interest (polygon 'Erie') 
//
 var dataset = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') 
                  .filterDate('2019-07-01', '2019-10-31')
                  .map(maskS2clouds).filterBounds(Erie);
                  
print(dataset); // lists the image collection features on the Console -------->
//
//
// Select dates based on in situ measurements dates in the file GLORIA_WesternErie.csv
// Our first choice is to select satellite images for the same day when the measurements were taken.
// If not available, select a date range one day before and 1 day after the measurements dates.
//
// Dates of measurements: 2019: 3 June; 1, 8, 15,22,29 July; 12, 19, 28 August; 3,9,24 September;
// 7 October
// Dates of measurements 2020: 20, 28 July; 10,24, August; 21 September;5 October
//
// Collocated S2 data found for : 15 July, 3 September 2019; 20, 28 July;24 August; 
// 21 September 2020; 
//
// Example of S2 images not collocated with in situ measurements
//
var date_060319 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2019-06-02', '2019-06-04')
                  .map(maskS2clouds).filterBounds(Erie);
                  
print(date_060319);
//
var date_071519 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2019-07-14', '2019-07-16')
                  .map(maskS2clouds).filterBounds(Erie);
                  
print(date_071519);
//
// Examples of S2 images collocated with in situ measurements
//
var date_092120 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2020-09-20', '2020-09-22')
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds).filterBounds(Erie);
                  
print(date_092120);
//
// Visualize RGB images
//
var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2'],
};

Map.setCenter(-81.0, 41.5, 8);


Map.addLayer(date_060319.mean(), visualization, 'RGB_1');
Map.addLayer(date_071519.mean(), visualization, 'RGB_2');
Map.addLayer(date_092120.mean(), visualization, 'RGB_3');
