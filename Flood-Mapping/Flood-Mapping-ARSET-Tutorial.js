// OPTIONAL- Load the shapefile for your area of interest
//var roi = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level1").filter(ee.Filter.eq('ADM1_NAME', 'Kerala'));
//Map.addLayer(roi, {color: 'gray'}, 'Study Area',0);

// Set Google Terrain as the basemap
Map.setOptions('TERRAIN');

///////////////++++++++++++Load Sentinel-1 C-band SAR ground range collection (log scale)++++++++++++/////
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
    .filterMetadata('resolution_meters', 'equals' , 10)
    .filterDate('2018-08-01', '2018-09-10')
    .filterBounds(roi);
print(collection, 'Sentinel-1 Collection');
var collection_list=ee.ImageCollection(collection).toList(999);

var image1=ee.Image(ee.List(collection_list).get(0)).clip(roi); 
var image2 =ee.Image(ee.List(collection_list).get(1)).clip(roi); 
var aug_09 = ee.ImageCollection([image1, image2]).mosaic();

var image3=ee.Image(ee.List(collection_list).get(2)).clip(roi); 
var image4 =ee.Image(ee.List(collection_list).get(3)).clip(roi); 
var aug_21 = ee.ImageCollection([image3, image4]).mosaic();

var image7 =ee.Image(ee.List(collection_list).get(6)).clip(roi);
var image8 =ee.Image(ee.List(collection_list).get(7)).clip(roi); 
var aug_27 = ee.ImageCollection([image7, image8]).mosaic();

var image5 =ee.Image(ee.List(collection_list).get(4)).clip(roi);
var image6 =ee.Image(ee.List(collection_list).get(5)).clip(roi); 
var sep_02 = ee.ImageCollection([image5, image6]).mosaic();

Map.centerObject(roi, 10);
Map.addLayer(aug_09.select('VH'), {min:-25,max:-5}, 'S1 Aug. 09, 2018 VH', 1);
Map.addLayer(aug_21.select('VH'), {min:-25,max:-5}, 'S1 Aug. 21, 2018 VH', 0);
Map.addLayer(aug_27.select('VH'), {min:-25,max:-5}, 'S1 Aug. 27, 2018 VH', 0);
Map.addLayer(sep_02.select('VH'), {min:-25,max:-5}, 'S1 Sep. 02, 2018 VH', 0);

Map.addLayer(aug_09.select('VH').addBands(aug_21.select('VH')).addBands(aug_27.select('VH')), {min: -25, max: -5}, 'Aug09/Aug21/Aug27 VH', 0);
Map.addLayer(aug_21.select('VH').addBands(aug_27.select('VH')).addBands(sep_02.select('VH')), {min: -25, max: -5}, 'Aug21/Aug27/Sep02 VH', 0);

////////////////////////////++++++++++++Apply a speckle filter++++++++++++///////////////////
var SMOOTHING_RADIUS = 30;
var aug_09_filt = aug_09.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');
var aug_21_filt = aug_21.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');
var aug_27_filt = aug_27.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');
var sep_02_filt = sep_02.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');

////////////////++++++++++++Create difference images from before and after the event++++++++++++/////////
//NOTE: In order to substract logarithmic values (dB) - you must perform a division
var aug09_aug21_diff= aug_21_filt.select('VH').divide(aug_09_filt.select('VH'));
var aug09_aug27_diff= aug_27_filt.select('VH').divide(aug_09_filt.select('VH'));
var aug09_sep02_diff= sep_02_filt.select('VH').divide(aug_09_filt.select('VH'));

Map.addLayer(aug09_aug21_diff, {min: 0,max:2}, 'Difference VH filtered', 0);

////////////////++++++++++++Apply a threshold - based on the difference image values ++++++++++++////////
var UPPER_THRESHOLD = 1.25;
var inundation_aug09_aug21 = aug09_aug21_diff.gt(UPPER_THRESHOLD);
var inundation_aug09_aug27 = aug09_aug27_diff.gt(UPPER_THRESHOLD);
var inundation_aug09_sep02 = aug09_sep02_diff.gt(UPPER_THRESHOLD);

Map.addLayer(inundation_aug09_aug21.updateMask(inundation_aug09_aug21),
{palette:"070908"},'Flooding Aug. 21 - Black',0);

//////////////////++++++++++++Refine the flood map results with additional datasets++++++++++++//////////
// Calculate pixel connectivity and remove those connected by 
//8 pixels or less.
var connections = inundation_aug09_aug21.connectedPixelCount();    
var inundation2_aug09_aug21 = inundation_aug09_aug21.updateMask(connections.gte(8));

var connections = inundation_aug09_aug27.connectedPixelCount();    
var inundation2_aug09_aug27 = inundation_aug09_aug27.updateMask(connections.gte(8));

var connections = inundation_aug09_sep02.connectedPixelCount();    
var inundation2_aug09_sep02 = inundation_aug09_sep02.updateMask(connections.gte(8));


Map.addLayer(inundation2_aug09_aug21.updateMask(inundation2_aug09_aug21),
{palette:"ee360c"},'Flooding Aug. 21 - Red',0);

// Remove misclassified pixels in areas where the slope is greater than 
//5% using an SRTM DEM
var srtm = ee.Image('USGS/SRTMGL1_003');
var terrain = ee.Algorithms.Terrain(srtm);
var slope = terrain.select('slope');
var inundation3_aug09_aug21 = inundation2_aug09_aug21.updateMask(slope.lt(5));
var inundation3_aug09_aug27 = inundation2_aug09_aug27.updateMask(slope.lt(5));
var inundation3_aug09_sep02 = inundation2_aug09_sep02.updateMask(slope.lt(5));
//Map.addLayer(srtm, {min:0,max:300}, 'SRTM', 0);

Map.addLayer(inundation3_aug09_aug21.updateMask(inundation3_aug09_aug21),
{palette:"ec11d1"},'Flooding Aug. 21 - Pink',0);

// Remove misclassified pixels in areas where there is pernament open water using 
// the Copernicus Global Land Service (CGLS) land cover map (100m)
var global_landcover = ee.Image("COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019").select('discrete_classification');
var landcover_roi = global_landcover.clip(roi);

// Extract only water pixels from CGLS using class value equal to 80 or 200
//var water = landcover_roi.eq(80,200);
var water = landcover_roi.eq(80).or(landcover_roi.eq(200));
var watermask = inundation3_aug09_aug21.where(water,0);
var inundation4_aug09_aug21 = watermask.updateMask(watermask);
var watermask = inundation3_aug09_aug27.where(water,0);
var inundation4_aug09_aug27 = watermask.updateMask(watermask);
var watermask = inundation3_aug09_sep02.where(water,0);
var inundation4_aug09_sep02 = watermask.updateMask(watermask);

Map.addLayer(inundation4_aug09_aug21.updateMask(inundation4_aug09_aug21),
{palette:"22ec3b"},'Flooding Aug. 21 - Green',1);
Map.addLayer(inundation4_aug09_aug27.updateMask(inundation4_aug09_aug21),
{palette:"ecda02"},'Flooding Aug. 27 - Yellow',1);
Map.addLayer(inundation4_aug09_sep02.updateMask(inundation4_aug09_aug21),
{palette:"ffa927"},'Flooding Sep. 02 - Orange',1);
Map.addLayer(landcover_roi, {}, "Land Cover", 0);

//////////////////////////////++++++++++++Calculate Inundation Extent++++++++++++////////////////
// Calculate inundation extent for Aug. 21. 
var inundation_area_aug21 = inundation4_aug09_aug21.multiply(ee.Image.pixelArea());
 
// Sum the area covered by inundated pixels. 
var inundation_stats_aug21 = inundation_area_aug21.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: roi,
  scale: 10, // Sentinel-1 Resolution
  maxPixels: 1e9,
  bestEffort: false
  });

// Convert inundated extent to hectares  
var inundation_area_ha_aug21 = inundation_stats_aug21.getNumber("VH").divide(10000).round(); 
print(inundation_area_ha_aug21, 'Hectares of Inundated Area for Aug. 21'); 

// Calculate inundation extent for Aug. 27.
var inundation_area_aug27 = inundation4_aug09_aug27.multiply(ee.Image.pixelArea());
 
// Sum the area covered by inundated pixels. 
var inundation_stats_aug27 = inundation_area_aug27.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: roi,
  scale: 10, // Sentinel-1 Resolution
  maxPixels: 1e9,
  bestEffort: false
  });

// Convert inundated extent to hectares  
var inundation_area_ha_aug27 = inundation_stats_aug27.getNumber("VH").divide(10000).round(); 
print(inundation_area_ha_aug27, 'Hectares of Inundated Area for Aug. 27'); 


// Calculate inundation extent for Sep. 02.
var inundation_area_sep02 = inundation4_aug09_sep02.multiply(ee.Image.pixelArea());
 
// Sum the area covered by inundated pixels. 
var inundation_stats_sep02 = inundation_area_sep02.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: roi,
  scale: 10, // Sentinel-1 Resolution
  maxPixels: 1e9,
  bestEffort: false
  });

// Convert inundated extent to hectares  
var inundation_area_ha_sep02 = inundation_stats_sep02.getNumber("VH").divide(10000).round(); 
print(inundation_area_ha_sep02, 'Hectares of Inundated Area for Sep. 02'); 

//////////////////////////++++++++++++Calculate Flooded Cropland++++++++++++///////////////////
// Use the Copernicus Global Land Service (CGLS) land cover (100m) map to identify cropland
// Extract only cropland pixels from the CGLS. The cropland class value is equal to 40
var crop = landcover_roi.eq(40);
var cropmask = landcover_roi.updateMask(crop);

// Calculate the affected cropland using the flood layer from Aug. 21
var cropland_affected_aug21 = inundation4_aug09_aug21.updateMask(cropmask);
// Calculate the pixel area where there are crops and it is flooded
var crop_pixelarea = cropland_affected_aug21.multiply(ee.Image.pixelArea()); 
// Sum pixels of affected cropland layer
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: roi,
  scale: 10,
  maxPixels: 1e9
  });
// Convert area to hectares
var crop_area_ha_aug21 = crop_stats.getNumber("VH").divide(10000).round();

// Calculate the affected cropland using the flood layer from Aug. 27
var cropland_affected_aug27 = inundation4_aug09_aug27.updateMask(cropmask);
// Calculate the pixel area where there are crops and it is flooded
var crop_pixelarea = cropland_affected_aug27.multiply(ee.Image.pixelArea()); 
// Sum pixels of affected cropland layer
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: roi,
  scale: 10,
  maxPixels: 1e9
  });
// Convert area to hectares
var crop_area_ha_aug27 = crop_stats.getNumber("VH").divide(10000).round();

// Calculate the affected cropland using the flood layer from Sep. 02
var cropland_affected_sep02 = inundation4_aug09_sep02.updateMask(cropmask);
// Calculate the pixel area where there are crops and it is flooded
var crop_pixelarea = cropland_affected_sep02.multiply(ee.Image.pixelArea()); 
// Sum pixels of affected cropland layer
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: roi,
  scale: 10,
  maxPixels: 1e9
  });
// Convert area to hectares
var crop_area_ha_sep02 = crop_stats.getNumber("VH").divide(10000).round();

// Print results 
print (crop_area_ha_aug21, 'Hectares of Inundated Cropland on Aug. 21');
print (crop_area_ha_aug27, 'Hectares of Inundated Cropland on Aug. 27');
print (crop_area_ha_sep02, 'Hectares of Inundated Cropland on Sep. 02');

// Add crop layer to map
Map.addLayer(cropmask, {}, 'Agriculture', 0);

// Add flooded crop area to map
Map.addLayer(cropland_affected_aug21, {palette:"22ec3b"}, 'Flooded Cropland on Aug. 21 - Green', 0);
Map.addLayer(cropland_affected_aug27, {palette:"ecda02"}, 'Flooded Cropland on Aug. 27 - Yellow', 0);
Map.addLayer(cropland_affected_sep02, {palette:"ffa927"}, 'Flooded Cropland on Sep. 02 - Orange', 0);

/////////////////////////////////++++++++++++Create a Legend++++++++++++////////////

// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
  }
});
 
// Create legend title
var titleTextVis = {
  'margin':'0px 0px 15px 0px',
  'fontSize': '18px', 
  'font-weight':'', 
  'color': '3333ff'
  };

var legendTitle = ui.Label('Flood Extent',titleTextVis);
 
// Add the title to the panel
legend.add(legendTitle);
 
// Create and modify the style for 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: color,
          // padding gives the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
 
      // Create the label the following description
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
 
//  Palette with the colors
var palette =['#22ec3b', '#ecda02', 'ffa927'];
 
// description for each box
var names = ['Aug. 21','Aug. 27','Sep. 02'];
 
// Add color and and names
for (var i = 0; i < 3; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  

// add the legend to the map (you can also print the legend to the console)
Map.add(legend);


/////////////////////++++++++++++Create a description of your results++++++++++++///////////////////

// This sets the position where the panel will be displayed 
var results = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    width: '350px'
  }
});

// Set the visualtization parameters of the labels 
var textVis = {
  'margin':'0px 8px 2px 0px',
  'fontWeight':'bold'
  };
var numberVIS = {
  'margin':'0px 0px 15px 0px', 
  'color':'bf0f19',
  'fontWeight':'bold'
  };
var subTextVis = {
  'margin':'0px 0px 2px 0px',
  'fontSize':'12px',
  'color':'grey'
  };

var titleTextVis = {
  'margin':'0px 0px 15px 0px',
  'fontSize': '18px', 
  'font-weight':'', 
  'color': '3333ff'
  };

// Create lables for each of the results 
var title = ui.Label('Results', titleTextVis);

// Print flood extent 
var text1 = ui.Label('Estimated flood extent from Monsoon flooding in Kerala, India in 2018:',textVis);
var text1_2 = ui.Label ('using Sentinel-1 data from 2018-08-09 to 2018-09-02', subTextVis);
var number1 = ui.Label('Please wait...',numberVIS); 
inundation_area_ha_aug21.evaluate(function(val){number1.setValue(val+' hectares on Aug. 21')}),numberVIS;
var number1_2 = ui.Label('Please wait...',numberVIS); 
inundation_area_ha_aug27.evaluate(function(val){number1_2.setValue(val+' hectares on Aug. 27')}),numberVIS;
var number1_3 = ui.Label('Please wait...',numberVIS); 
inundation_area_ha_sep02.evaluate(function(val){number1_3.setValue(val+' hectares on Sep. 02')}),numberVIS;

// Print affected cropland 
var text2 = ui.Label('Estimated flooded cropland area:',textVis);
var text2_2 = ui.Label('based on the CGLS landcover map', subTextVis);
var number2 = ui.Label('Please wait...',numberVIS);
crop_area_ha_aug21.evaluate(function(val){number2.setValue(val+' hectares on Aug. 21')}),numberVIS;
var number2_2 = ui.Label('Please wait...',numberVIS);
crop_area_ha_aug27.evaluate(function(val){number2_2.setValue(val+' hectares on Aug. 27')}),numberVIS;
var number2_3 = ui.Label('Please wait...',numberVIS);
crop_area_ha_sep02.evaluate(function(val){number2_3.setValue(val+' hectares on Sep. 02')}),numberVIS;

// Disclaimer
var text3 = ui.Label('Note- This is a demo product only. It has not been validated. Parts of this code were adapted from a UN-SPIDER December 2019 flooding script.',subTextVis);

// Add the labels to the panel 
results.add(ui.Panel([
        title,
        text1,
        text1_2,
        number1,
        number1_2,
        number1_3,
        text2,
        text2_2,
        number2,
        number2_2,
        number2_3,
        text3]
      ));

// Add the panel to the map 
Map.add(results);

//////////////////////////////////++++++++++++Export your results++++++++++++///////////
// Export Aug. 21 flooded area as a TIFF file 
Export.image.toDrive({
  image: inundation4_aug09_aug21, 
  description: 'Flood_extent_Aug21',
  scale: 10,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e10,
});

// Export flooded area as a shapefile
// First convert your flood raster to polygons
var inundation4_aug09_aug21_vec = inundation4_aug09_aug21.reduceToVectors({
  scale: 10,
  geometryType:'polygon',
  geometry: roi,
  eightConnected: false,
  bestEffort:true,
  tileScale:2,
});

// Export your flood polygons to a shapefile
Export.table.toDrive({
  collection:inundation4_aug09_aug21_vec,
  description:'Flood_extent_aug21_vector',
  fileFormat:'SHP',
  fileNamePrefix:'flooded_vec'
});