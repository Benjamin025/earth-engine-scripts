Map.addLayer(roi);
print(roi)
 //Set start and end dates of a period BEFORE the flood. Make sure it is long enough for 
   //Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   //your ImageCollections (see Console) do not contain any elements.*/

var before_start= '2012-01-01';
var before_end='2021-01-31';
// Now set the same parameters for AFTER the flood.
var after_start='2024-04-01';
var after_end='2024-04-30';
//seting the parameters for the SAR
var polarization = "VH"; 
var pass_direction = "DESCENDING";
var difference_threshold = 1.25; 
//var relative_orbit = 79; //based on the known orbit of your area

var roi = ee.FeatureCollection(roi);
// Load and filter Sentinel-1 GRD data by predefined parameters 
var imageCollection= ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
  .filter(ee.Filter.eq('resolution_meters',10))
  //.filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))
  .filterBounds(roi)
  .select(polarization);
// Select images by predefined dates
var before_collection =imageCollection.filterDate(before_start, before_end);
var after_collection = imageCollection.filterDate(after_start,after_end);
// Print selected tiles to the console

      // Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }
  // print dates of before images to console
      var before_count = before_collection.size();
      print(ee.String('Tiles selected: Before Flood ').cat('(').cat(before_count).cat(')'),
        dates(before_collection), before_collection);
// print dates of after images to console
      var after_count = before_collection.size();
      print(ee.String('Tiles selected: After Flood ').cat('(').cat(after_count).cat(')'),
        dates(after_collection), after_collection);     
// Create a mosaic of selected tiles and clip to study area
var before = before_collection.mosaic().clip(roi);
var after = after_collection.mosaic().clip(roi);


// Step 2: Identify images for flood pre-event and images with flood event
var SAR_non_flood_img = imageCollection.filterDate('2021-01-01', '2021-01-31').median()
Map.addLayer(SAR_non_flood_img,{min:-25,max:0},'SAR_non_flood_img')

// SAR images for flood event
var SAR_flood_img =imageCollection.filterDate('2024-04-01', '2024-04-30').median()
Map.addLayer(SAR_flood_img,{min:-25,max:0},'SAR_flood_img')

// Step 3: Reduce the SAR speckle effect by focal mean smoothing 
var smoothing_radius = 50;
var SAR_non_flood_img_smooth = SAR_non_flood_img.focal_mean(smoothing_radius, 'circle', 
'meters').clip(roi);
var SAR_flood_img_smooth = SAR_flood_img.focal_mean(smoothing_radius, 'circle', 'meters').clip(roi);

// Apply reduce the radar speckle by smoothing  
var smoothing_radius = 50;
var before_filtered = before.focal_mean(smoothing_radius, 'circle', 'meters');
var after_filtered = after.focal_mean(smoothing_radius, 'circle', 'meters');

//continuation code 1
// Calculate the difference between the before and after images
var difference = after_filtered.divide(before_filtered);
// Apply the predefined difference-threshold and create the flood extent mask 
var threshold = difference_threshold;
var difference_binary = difference.gt(threshold);
// Refine flood result using additional datasets
      
// Include JRC layer on surface water seasonality to mask flood pixels from areas
// of "permanent" water (where there is water > 10 months of the year)
      var swater = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('seasonality');
      var swater_mask = swater.gte(10).updateMask(swater.gte(10));
// Flooded layer where perennial water bodies (water > 10 mo/yr) is assigned a 0 value
      var flooded_mask = difference_binary.where(swater_mask,0);
 // final flooded area without pixels in perennial waterbodies
      var flooded = flooded_mask.updateMask(flooded_mask);
 // Compute connectivity of pixels to eliminate those connected to 8 or fewer neighbours
// This operation reduces noise of the flood extent product 
var connections = flooded.connectedPixelCount();    
var flooded = flooded.updateMask(connections.gte(8)); 
//adding the dem
var dataset = ee.Image('WWF/HydroSHEDS/03VFDEM');
var elevation = dataset.select('b1');
var elevationVis = {
  min: -50.0,
  max: 3000.0,
  gamma: 2.0,
};
Map.setCenter(37.19775159770131,1.8399004715151697, 8);
Map.addLayer(elevation, elevationVis, 'Elevation');
// Mask out areas with more than 5 percent slope using a Digital Elevation Model 
var DEM = ee.Image('WWF/HydroSHEDS/03VFDEM');
var terrain = ee.Algorithms.Terrain(DEM);
var slope = terrain.select('slope');
var flooded = flooded.updateMask(slope.lt(5));

// Calculate flood extent area
// Create a raster layer containing the area information of each pixel 
var flood_pixelarea = flooded.select(polarization)
  .multiply(ee.Image.pixelArea());
// Sum the areas of flooded pixels
// default is set to 'bestEffort: true' in order to reduce computation time, for a more 
// accurate result set bestEffort to false and increase 'maxPixels'. 
var flood_stats = flood_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: roi,
  scale: 10, // native resolution 
  //maxPixels: 1e9,
  bestEffort: true
  });
// Convert the flood extent to hectares (area calculations are originally given in meters)  
var flood_area_ha = flood_stats
  .getNumber(polarization)
  .divide(10000)
  .round();
  // Set position of panel where the results will be displayed 
var results = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    width: '350px'
  }
});

// Prepare the visualization parameters of the labels 
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
// Create labels of the results 
// Title and time period
var title = ui.Label('Results', titleTextVis);
var text1 = ui.Label('Flood status between:',textVis);
var number1 = ui.Label(after_start.concat(" and ",after_end),numberVIS);

// Estimated flood extent 
var text2 = ui.Label('Estimated flood extent:',textVis);
var text2_2 = ui.Label('Please wait...',subTextVis);
dates(after_collection).evaluate(function(val){text2_2.setValue('based on Sentinel-1 imagery '+val)});
var number2 = ui.Label('Please wait...',numberVIS); 
flood_area_ha.evaluate(function(val){number2.setValue(val+' hectares')}),numberVIS;

results.add(ui.Panel([
        title,
        text1,
        number1,
        text2,
        text2_2,
        number2,
       ]
      ));
Map.add(results);
// Before and after flood SAR mosaic
Map.centerObject(roi,3);
Map.addLayer(before_filtered, {min:-25,max:0}, 'Before Flood',0);
Map.addLayer(after_filtered, {min:-25,max:0}, 'After Flood',1);

// Difference layer
Map.addLayer(difference,{min:0,max:2},"Difference Layer",1);

// Flooded areas
Map.addLayer(flooded,{palette:"0000FF"},'Flooded areas');
 // Export Flood Extent Raster
var projection = after_collection.first().projection().getInfo() // This gets the projection for the aoi
Export.image.toDrive({
  image: flooded,
  description: 'Flood_extent_raster',
  crs: projection.crs,
  crsTransform: projection.transform,
  region: roi
});


var before_start= '2012-01-01';
var before_end='2021-01-31';
// Now set the same parameters for AFTER the flood.
var after_start='2024-04-01';
var after_end='2024-04-30';
//seting the parameters for the SAR
var polarization = "VH"; 
var pass_direction = "DESCENDING";
var difference_threshold = 1.25; 
//var relative_orbit = 79; //based on the known orbit of your area

var roi = ee.FeatureCollection(roi);
// Load and filter Sentinel-1 GRD data by predefined parameters 
var imageCollection= ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
  .filter(ee.Filter.eq('resolution_meters',10))
  //.filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))
  .filterBounds(geometry)
  .select(polarization);
// Select images by predefined dates
var before_collection =imageCollection.filterDate(before_start, before_end);
var after_collection = imageCollection.filterDate(after_start,after_end);
// Print selected tiles to the console

      // Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }
  // print dates of before images to console
      var before_count = before_collection.size();
      print(ee.String('Tiles selected: Before Flood ').cat('(').cat(before_count).cat(')'),
        dates(before_collection), before_collection);
// print dates of after images to console
      var after_count = before_collection.size();
      print(ee.String('Tiles selected: After Flood ').cat('(').cat(after_count).cat(')'),
        dates(after_collection), after_collection);     
// Create a mosaic of selected tiles and clip to study area
var before = before_collection.mosaic().clip(geometry);
var after = after_collection.mosaic().clip(geometry);

var before_start= '2012-01-01';
var before_end='2021-01-31';
// Now set the same parameters for AFTER the flood.
var after_start='2024-04-01';
var after_end='2024-04-30';
//seting the parameters for the SAR
var polarization = "VH"; 
var pass_direction = "DESCENDING";
var difference_threshold = 1.25; 
//var relative_orbit = 79; //based on the known orbit of your area

var roi = ee.FeatureCollection(roi);
// Load and filter Sentinel-1 GRD data by predefined parameters 
var imageCollection= ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
  .filter(ee.Filter.eq('resolution_meters',10))
  //.filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))
  .filterBounds(geometry2)
  .select(polarization);
// Select images by predefined dates
var before_collection =imageCollection.filterDate(before_start, before_end);
var after_collection = imageCollection.filterDate(after_start,after_end);
// Print selected tiles to the console

      // Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }
  // print dates of before images to console
      var before_count = before_collection.size();
      print(ee.String('Tiles selected: Before Flood ').cat('(').cat(before_count).cat(')'),
        dates(before_collection), before_collection);
// print dates of after images to console
      var after_count = before_collection.size();
      print(ee.String('Tiles selected: After Flood ').cat('(').cat(after_count).cat(')'),
        dates(after_collection), after_collection);     
// Create a mosaic of selected tiles and clip to study area
var before = before_collection.mosaic().clip(geometry2);
var after = after_collection.mosaic().clip(geometry2);

var before_start= '2012-01-01';
var before_end='2021-01-31';
// Now set the same parameters for AFTER the flood.
var after_start='2024-04-01';
var after_end='2024-04-30';
//seting the parameters for the SAR
var polarization = "VH"; 
var pass_direction = "DESCENDING";
var difference_threshold = 1.25; 
//var relative_orbit = 79; //based on the known orbit of your area

var roi = ee.FeatureCollection(roi);
// Load and filter Sentinel-1 GRD data by predefined parameters 
var imageCollection= ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
  .filter(ee.Filter.eq('resolution_meters',10))
  //.filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))
  .filterBounds(geometry3)
  .select(polarization);
// Select images by predefined dates
var before_collection =imageCollection.filterDate(before_start, before_end);
var after_collection = imageCollection.filterDate(after_start,after_end);
// Print selected tiles to the console

      // Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }
  // print dates of before images to console
      var before_count = before_collection.size();
      print(ee.String('Tiles selected: Before Flood ').cat('(').cat(before_count).cat(')'),
        dates(before_collection), before_collection);
// print dates of after images to console
      var after_count = before_collection.size();
      print(ee.String('Tiles selected: After Flood ').cat('(').cat(after_count).cat(')'),
        dates(after_collection), after_collection);     
// Create a mosaic of selected tiles and clip to study area
var before = before_collection.mosaic().clip(geometry3);
var after = after_collection.mosaic().clip(geometry3);



