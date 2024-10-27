Map.addLayer(train,{palette:['red']},"train")

var collection= ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
         .filterBounds(roi)
         .filterDate('2024-05-01', '2024-05-30');
   print(collection)
   print(collection,'bands')
   var desc = collection.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc =collection.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

print(collection, 'Sentinel-1 Collection');
var collection_list=ee.ImageCollection(collection).toList(999);

//before floods
var before_start= '2024-01-01';
var before_end='2024-01-31';
//after floods
var after_start='2024-05-01';
var after_end='2024-05-30';
// Select images by predefined dates
var before =Collection.filterDate(before_start, before_end).filterBounds(roi);
var after = Collection.filterDate(after_start,after_end).filterBounds(roi);

print(before.size());
print(after.size());


var before_image=after.select('VH').mosaic().clip(roi);
var after_image=before.select('VH').mosaic().clip(roi);

Map.addLayer(before,{min:-20,max:0},'BEFORE');
Map.addLayer(after ,{min:-20,max:0},'AFTER');

var SMOOTHING_RADIUS = 30;
var before_filt = before_image.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');
var after_filt = after_image.focal_mean(SMOOTHING_RADIUS, 'circle', 'meters');

////////////////++++++++++++Create difference images from before and after the event++++++++++++/////////
//NOTE: In order to substract logarithmic values (dB) - you must perform a division
var before_after_diff= after_filt.select('VH').divide(before_filt.select('VH'));

Map.addLayer(before_after_diff, {min: 0,max:2}, 'Difference VH filtered', 0);

////////////////++++++++++++Apply a threshold - based on the difference image values ++++++++++++////////
var UPPER_THRESHOLD = 1.00;
var inundation_before_after = before_after_diff.gt(UPPER_THRESHOLD);

Map.addLayer(inundation_before_after.updateMask(inundation_before_after),
{palette:"070908"},'Flooding may. 21 - Black',0);

//////////////////++++++++++++Refine the flood map results with additional datasets++++++++++++//////////
// Calculate pixel connectivity and remove those connected by 
//8 pixels or less.
var connections = inundation_before_after.connectedPixelCount();    
var inundation2_before_after =inundation_before_after.updateMask(connections.gte(8));

Map.addLayer(inundation2_before_after.updateMask(inundation2_before_after),
{palette:"ee360c"},'Flooding May. 21 - Red',0);


// Remove misclassified pixels in areas where the slope is greater than 
//5% using an SRTM DEM
var terrain = ee.Algorithms.Terrain(srtm);
var slope = terrain.select('slope');
var inundation3_before_after = inundation2_before_after.updateMask(slope.lt(5));

Map.addLayer(inundation3_before_after.updateMask(inundation3_before_after),
{palette:"ec11d1"},'Flooding May. 21 - Pink',0);

// Remove misclassified pixels in areas where there is pernament open water using 
// The European Space Agency (ESA) WorldCover 10 m 2021 
//the Copernicus Global Land Service (CGLS) land cover map (100m)
var global_landcover = ee.Image("COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019").select('discrete_classification');
var landcover_roi = global_landcover.clip(roi);

// Extract only water pixels from EAS using class value equal to 80 or 200
//var water = landcover_roi.eq(80,200);
var water = landcover_roi.eq(80).or(landcover_roi.eq(200));
var watermask = inundation3_before_after.where(water,0);
var inundation4_before_after= watermask.updateMask(watermask);

Map.addLayer(inundation4_before_after.updateMask(inundation4_before_after),
{palette:"22ec3b"},'Flooding May. 21 - Green',1);

Map.addLayer(landcover_roi, {}, "Land Cover", 0);


///*********************EXTENT CALCULATIONS*********//
//////////////////////////////++++++++++++Calculate Inundation Extent++++++++++++////////////////
// Calculate inundation extent for Aug. 21. 
var inundation_area_may21 = inundation4_before_after.multiply(ee.Image.pixelArea());


// Sum the area covered by inundated pixels. 
var inundation_stats_may21 = inundation_area_may21.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: roi,
  scale: 300, // Sentinel-1 Resolution
  maxPixels: 1e15,
  bestEffort: false
  });
  
  
// Convert inundated extent to hectares  
var inundation_area_ha_may21 = inundation_stats_may21.getNumber("VH").divide(10000).round(); 
print(inundation_area_ha_may21, 'Hectares of Inundated Area for May. 21'); 

//////////////////////////++++++++++++Calculate Flooded Cropland++++++++++++///////////////////
// Use the Copernicus Global Land Service (CGLS) land cover (100m) map to identify cropland
// Extract only cropland pixels from the CGLS. The cropland class value is equal to 40
var crop = landcover_roi.eq(40);
var cropmask = landcover_roi.updateMask(crop);

// Calculate the affected cropland using the flood layer from May. 21
var cropland_affected_may21 = inundation4_before_after.updateMask(cropmask);
// Calculate the pixel area where there are crops and it is flooded
var crop_pixelarea = cropland_affected_may21.multiply(ee.Image.pixelArea()); 
// Sum pixels of affected cropland layer
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: roi,
  scale: 300,
  maxPixels: 1e12
  });
// Convert area to hectares
var crop_area_ha_may21 = crop_stats.getNumber("VH").divide(10000).round();

print (crop_area_ha_may21, 'Estimated Hectares of Inundated Cropland on May. 21');

// Add crop layer to map
Map.addLayer(cropmask, {}, 'Agriculture', 0);

// Add flooded crop area to map
Map.addLayer(cropland_affected_may21, {palette:"#158430"}, 'Flooded Cropland on May. 21 - Green', 0);



//**********BUILT UP AREAS*********//
// Extract only BUILT UP pixels from the CGLS. The built up  class value is equal to 40
// C. Built-up Exposed
var builtup =landcover_roi.select('Map').eq(50).selfMask();
var builtup_affected = inundation4_before_after.updateMask(builtup).rename('builtup');

// Calculate the area of affected built-up areas in hectares
var builtup_pixelarea = builtup_affected.multiply(ee.Image.pixelArea());
var builtup_stats = builtup_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 300,
  maxPixels: 1e12,
});

// Convert area to hectares
var builtup_ha_may21 = builtup_stats.getNumber("VH").divide(10000).round();

print (builtup_ha_may21, 'Estimated Hectares of Inundated Built up on May. 21');

//**********POPULATION EXPOSED**********//
// D. Population Exposed
var population_count = ee.Image("JRC/GHSL/P2016/POP_GPW_GLOBE_V1/2015").clip(roi);
var population_exposed = population_count.updateMask(inundation4_before_after).selfMask();

var stats = population_exposed.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 300,
  maxPixels: 1e12,
});

var numberPeopleExposed = stats.getNumber('population_count').round();
print('Estimated Number of People Exposed', numberPeopleExposed);
////***************WATER LAYER**********//
///adding the global surface water dataset
var gsw = ee.Image("JRC/GSW1_4/GlobalSurfaceWater")
          .clip(roi);
// Select the 'max_extent' band
var water = gsw.select('max_extent');

// max_extent band has values 0 or 1
// We can remove the 0 values by masking the layer
// Mask needs to have 0 or 1 values
// 0 - remove the pixel
// 1 - keep the pixel

var masked = water.updateMask(water)
// There is a handy short-hand for masking out 0 values for a layer
// You can call selfMask() which will mask the image with itself
// Effectively removing 0 values and retaining non-zero values
var masked = water.selfMask()
//Map.addLayer(masked, {}, 'Water mask');
Map.addLayer(masked,{palette:['BLUE']},'Water mask');


//************LEGEND****************//
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
var palette =['#ee360c', '#22ec3b', 'ffa927'];
 
// description for each box
var names = ['May 21','May 21'];
 
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
var text1 = ui.Label('Estimated flood extent for Kenya in 2024:',textVis);
var text1_2 = ui.Label ('using Sentinel-1 data from 2024-05-01 to 2024-05-30',textVis);
var number1 = ui.Label('Please wait...',numberVIS); 
inundation_area_ha_may21.evaluate(function(val){number1.setValue(val+' hectares on May. 21')}),numberVIS;

// Print affected cropland 
var text2 = ui.Label('Estimated flooded cropland area:',textVis);
var text2_2 = ui.Label('based on the CGLS landcover map', subTextVis);
var number2 = ui.Label('Please wait...',numberVIS);
crop_area_ha_may21.evaluate(function(val){number2.setValue(val+' hectares on May. 21')}),numberVIS;
var number2_2 = ui.Label('Please wait...',numberVIS);

// Disclaimer
var text3 = ui.Label('Note- Parts of this code, were adapted from a UN-SPIDER December 2019 flooding script.',subTextVis);
// Disclaimer
var text4 = ui.Label('Note-The validation was performed using  CGLS landcover map which is not up-to-date.',subTextVis);
// Disclaimer
var text5 = ui.Label('Note-The estimate for the flooded cropland was obtained using the landcover which is NOT up-to-date.',subTextVis);
//********DATASETS USED***********//
var datasetsUsed = ui.Label('Datasets Used:', textVis);
var gaul = ui.Label('FAO Global Administrative Unit Layers 2015', subTextVis);
var sentinel2 = ui.Label('Sentinel-1 SAR GRD', subTextVis);
var permanentWater = ui.Label('JRC Global Surface Water Mapping Layers', subTextVis);
var hydro = ui.Label('Hydrologically Conditioned DEM 3 Arc-Seconds', subTextVis);
var cglsLC = ui.Label('Copernicus Global Land Service (CGLS) land cover (100m) Map 2019',subTextVis);
var ghsl = ui.Label('Global Human Settlement Layers, Population Grid - 2015', subTextVis);
var populationExposedLabel = ui.Label('Estimated Population Exposed:', textVis);





// Add the labels to the panel 
results.add(ui.Panel([
        title,
        text1,
        text1_2,
        number1,
        text2,
        text2_2,
        number2,
        text3,
        text4,
        datasetsUsed,
         gaul,
         sentinel2,
         permanentWater,
        hydro,
        cglsLC,
        ghsl,
        populationExposedLabel,
        text5]
      ));

// Add the panel to the map 
Map.add(results);

numberPeopleExposed.evaluate(function (val) {
  populationExposedLabel.setValue(val);
});

// Create labels for the results
var datasetsUsed = ui.Label('Datasets Used:', textVis);
var gaul = ui.Label('FAO Global Administrative Unit Layers 2015', subTextVis);
var sentinel2 = ui.Label('Sentinel-1 SAR GRD',subTextVis);
var permanentWater = ui.Label('JRC Global Surface Water Mapping Layers',subTextVis);
var hydro = ui.Label('Hydrologically Conditioned DEM 3 Arc-Seconds', subTextVis);
var esaLC = ui.Label('ESA WorldCover 10m v200', subTextVis);
var ghsl = ui.Label('Global Human Settlement Layers, Population Grid - 2015',subTextVis);
