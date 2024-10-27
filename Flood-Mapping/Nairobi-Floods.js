Map.addLayer(roi)
Map.centerObject(roi,8)
var collection= ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
         .filterBounds(roi);
   print(collection)
   print(collection,'bands')
   var desc = collection.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc =collection.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
//before floods
var before_start= '2024-01-01';
var before_end='2024-01-31';
//after floods
var after_start='2024-05-01';
var after_end='2024-05-30';
// Select images by predefined dates
var before =collection.filterDate(before_start, before_end).filterBounds(roi);
var after = collection.filterDate(after_start,after_end).filterBounds(roi);
print(before.size());
print(after.size());

var before_image=after.select('VH').mosaic().clip(roi);
var after_image=before.select('VH').mosaic().clip(roi);

Map.addLayer(before,{min:-20,max:0},'BEFORE');
Map.addLayer(after ,{min:-20,max:0},'AFTER');

//var before_filtered = ee.Image(todB(RefinedLee(toNatural(before_image))))
//var after_filtered = ee.Image(todB(RefinedLee(toNatural(after_image))))

var flood = before_image.gt(-20).and(after_image.lt(-20));
var flood_mask = flood.updateMask(flood.eq(1));

var water = before_image.lt(-20).and(after_image.lt(-20));
var water_mask = water.updateMask(water.eq(1));
Map.centerObject(roi);
//Map.addLayer(before_image,{min:-25,max:0},'before')
//Map.addLayer(after_image,{min:-25,max:0},'after')
Map.addLayer(before_image,{min:-25,max:0},'before_image');
Map.addLayer(after_image,{min:-25,max:0},'after_image');
Map.addLayer(flood_mask,{palette:['Yellow']},'Flood_Inundation');
Map.addLayer(water_mask,{palette:['Blue']},'Water');

print('Total Country Area (Ha)', roi.geometry().area().divide(10000))
//line 47 to line 1 if ok

//new segments of the code
var stats = flood_mask.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 10,
  maxPixels: 1e13,
  tileScale: 16
});
print(stats);

var flood_area = ee.Number(stats.get('sum')).divide(10000).round();
print('Flooded Area (Ha)', flood_area);

function RefinedLee(img) {
  // img must be in natural units, i.e. not in dB!
  // Set up 3x3 kernels 
  var weights3 = ee.List.repeat(ee.List.repeat(1,3),3);
  var kernel3 = ee.Kernel.fixed(3,3, weights3, 1, 1, false);

  var mean3 = img.reduceNeighborhood(ee.Reducer.mean(), kernel3);
  var variance3 = img.reduceNeighborhood(ee.Reducer.variance(), kernel3);

  // Use a sample of the 3x3 windows inside a 7x7 windows to determine gradients and directions
  var sample_weights = ee.List([[0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0], [0,1,0,1,0,1,0], [0,0,0,0,0,0,0], [0,1,0,1,0,1,0],[0,0,0,0,0,0,0]]);

  var sample_kernel = ee.Kernel.fixed(7,7, sample_weights, 3,3, false);

  // Calculate mean and variance for the sampled windows and store as 9 bands
  var sample_mean = mean3.neighborhoodToBands(sample_kernel); 
  var sample_var = variance3.neighborhoodToBands(sample_kernel);

  // Determine the 4 gradients for the sampled windows
  var gradients = sample_mean.select(1).subtract(sample_mean.select(7)).abs();
  gradients = gradients.addBands(sample_mean.select(6).subtract(sample_mean.select(2)).abs());
  gradients = gradients.addBands(sample_mean.select(3).subtract(sample_mean.select(5)).abs());
  gradients = gradients.addBands(sample_mean.select(0).subtract(sample_mean.select(8)).abs());

  // And find the maximum gradient amongst gradient bands
  var max_gradient = gradients.reduce(ee.Reducer.max());

  // Create a mask for band pixels that are the maximum gradient
  var gradmask = gradients.eq(max_gradient);

  // duplicate gradmask bands: each gradient represents 2 directions
  gradmask = gradmask.addBands(gradmask);

  // Determine the 8 directions
  var directions = sample_mean.select(1).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(7))).multiply(1);
  directions = directions.addBands(sample_mean.select(6).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(2))).multiply(2));
  directions = directions.addBands(sample_mean.select(3).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(5))).multiply(3));
  directions = directions.addBands(sample_mean.select(0).subtract(sample_mean.select(4)).gt(sample_mean.select(4).subtract(sample_mean.select(8))).multiply(4));
  // The next 4 are the not() of the previous 4
  directions = directions.addBands(directions.select(0).not().multiply(5));
  directions = directions.addBands(directions.select(1).not().multiply(6));
  directions = directions.addBands(directions.select(2).not().multiply(7));
  directions = directions.addBands(directions.select(3).not().multiply(8));

  // Mask all values that are not 1-8
  directions = directions.updateMask(gradmask);

  // "collapse" the stack into a singe band image (due to masking, each pixel has just one value (1-8) in it's directional band, and is otherwise masked)
  directions = directions.reduce(ee.Reducer.sum());  

  //var pal = ['ffffff','ff0000','ffff00', '00ff00', '00ffff', '0000ff', 'ff00ff', '000000'];
  //Map.addLayer(directions.reduce(ee.Reducer.sum()), {min:1, max:8, palette: pal}, 'Directions', false);

  var sample_stats = sample_var.divide(sample_mean.multiply(sample_mean));

  // Calculate localNoiseVariance
  var sigmaV = sample_stats.toArray().arraySort().arraySlice(0,0,5).arrayReduce(ee.Reducer.mean(), [0]);

  // Set up the 7*7 kernels for directional statistics
  var rect_weights = ee.List.repeat(ee.List.repeat(0,7),3).cat(ee.List.repeat(ee.List.repeat(1,7),4));

  var diag_weights = ee.List([[1,0,0,0,0,0,0], [1,1,0,0,0,0,0], [1,1,1,0,0,0,0], 
    [1,1,1,1,0,0,0], [1,1,1,1,1,0,0], [1,1,1,1,1,1,0], [1,1,1,1,1,1,1]]);

  var rect_kernel = ee.Kernel.fixed(7,7, rect_weights, 3, 3, false);
  var diag_kernel = ee.Kernel.fixed(7,7, diag_weights, 3, 3, false);

  // Create stacks for mean and variance using the original kernels. Mask with relevant direction.
  var dir_mean = img.reduceNeighborhood(ee.Reducer.mean(), rect_kernel).updateMask(directions.eq(1));
  var dir_var = img.reduceNeighborhood(ee.Reducer.variance(), rect_kernel).updateMask(directions.eq(1));

  dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), diag_kernel).updateMask(directions.eq(2)));
  dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), diag_kernel).updateMask(directions.eq(2)));

  // and add the bands for rotated kernels
  for (var i=1; i<4; i++) {
    dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)));
    dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), rect_kernel.rotate(i)).updateMask(directions.eq(2*i+1)));
    dir_mean = dir_mean.addBands(img.reduceNeighborhood(ee.Reducer.mean(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)));
    dir_var = dir_var.addBands(img.reduceNeighborhood(ee.Reducer.variance(), diag_kernel.rotate(i)).updateMask(directions.eq(2*i+2)));
  }

  // "collapse" the stack into a single band image (due to masking, each pixel has just one value in it's directional band, and is otherwise masked)
  dir_mean = dir_mean.reduce(ee.Reducer.sum());
  dir_var = dir_var.reduce(ee.Reducer.sum());

  // A finally generate the filtered value
  var varX = dir_var.subtract(dir_mean.multiply(dir_mean).multiply(sigmaV)).divide(sigmaV.add(1.0));

  var b = varX.divide(dir_var);

  var result = dir_mean.add(b.multiply(img.subtract(dir_mean)));
  return(result.arrayFlatten([['sum']]));
}
var landcover = ee.ImageCollection("ESA/WorldCover/v200");
print(landcover, 'Land Cover');

var lc = landcover.mosaic().clip(roi);

var dict = {
  "names": ["Tree cover", "Shrubland", "Grassland", "Cropland", "Built-up", "Bare / sparse vegetation", 
    "Snow and ice", "Permanent water bodies", "Herbaceous wetland", "Mangroves", "Moss and lichen"],

  "colors": ["006400", "ffbb22", "ffff4c", "f096ff", "fa0000", "b4b4b4", "f0f0f0", 
    "0064c8", "0096a0", "00cf75", "fae6a0"]
};

Map.addLayer(lc, { min: 10, max: 100, palette: dict['colors'] }, 'ESA Earth Cover');  

// B. Cropland Exposed
var cropland = lc.select('Map').eq(40).selfMask();
var cropland_affected = flood_mask.updateMask(cropland).rename('crop');

// Calculate the area of affected cropland in hectares
var crop_pixelarea = cropland_affected.multiply(ee.Image.pixelArea());
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 10,
  maxPixels: 1e12,
});

var floodAffectedCroplandAreaHa = ee.Number(crop_stats.get('crop')).divide(10000).round();
print('Flood Affected Cropland Area (Ha)', floodAffectedCroplandAreaHa);

// C. Built-up Exposed
var builtup = lc.select('Map').eq(50).selfMask();
var builtup_affected = flood_mask.updateMask(builtup).rename('builtup');

// Calculate the area of affected built-up areas in hectares
var builtup_pixelarea = builtup_affected.multiply(ee.Image.pixelArea());
var builtup_stats = builtup_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 10,
  maxPixels: 1e12,
});

var floodAffectedBuiltupAreaHa = ee.Number(builtup_stats.get('builtup')).divide(10000).round();
print('Flood Affected Built-up Area (Ha)', floodAffectedBuiltupAreaHa);

// D. Population Exposed
var population_count = ee.Image("JRC/GHSL/P2016/POP_GPW_GLOBE_V1/2015").clip(roi);
var population_exposed = population_count.updateMask(flood_mask).selfMask();

var stats = population_exposed.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: roi,
  scale: 250,
  maxPixels: 1e9,
});

var numberPeopleExposed = stats.getNumber('population_count').round();
print('Number of People Exposed', numberPeopleExposed);

//************************printing of the results************///
// Create a title label
var titleLabel = ui.Label('Kenya Floods - 2024', {
  fontWeight: 'bold',
  fontSize: '24px',
  margin: '10px 0',
});

// Add the title label to the map
Map.add(titleLabel);

// Set the position of the panel where the results will be displayed
var results = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
  }
});

// Prepare the visualization parameters of the labels
var titleTextVis = {
  'margin': '0px 0px 15px 0px',
  'fontSize': '18px',
  'font-weight': 'bold',
  'color': '3333ff'
};

var textVis = {
  'margin': '0px 8px 2px 0px',
  'fontWeight': 'bold'
};

var subtextVis = {
  'margin': '0px 0px 2px 0px',
  'fontSize': '12px',
  'color': 'grey'
};

var numberVis = {
  'margin': '0px 0px 15px 0px',
  'color': 'bf0f19',
  'fontWeight': 'bold'
};

// Create labels for the results
var titleLabel = ui.Label('IMPACT', titleTextVis);
var floodTimeline = ui.Label('Flood Timeline:', textVis);
var floodTimelineLabel = ui.Label(after_start.concat(' and ', after_end), numberVis);
var floodExtentLabel = ui.Label('Flood Extent:', textVis);
var floodExtentAreaLabel = ui.Label('Please Wait...', numberVis);
var croplandAreaLabel = ui.Label('Estimated Cropland Area Affected:', textVis);
var croplandAffectedAreaLabel = ui.Label('Please wait...', numberVis);
var builtupAreaLabel = ui.Label('Estimated Built-up Area Affected:', textVis);
var builtupAffectedAreaLabel = ui.Label('Please Wait...', numberVis);
var populationExposedLabel = ui.Label('Estimated Population Exposed:', textVis);
var populationExposedNumberLabel = ui.Label('Please Wait...', numberVis);
var datasetsUsed = ui.Label('Datasets Used:', textVis);
var gaul = ui.Label('FAO Global Administrative Unit Layers 2015', subtextVis);
var sentinel2 = ui.Label('Sentinel-1 SAR GRD', subtextVis);
var permanentWater = ui.Label('JRC Global Surface Water Mapping Layers', subtextVis);
var hydro = ui.Label('Hydrologically Conditioned DEM 3 Arc-Seconds', subtextVis);
var esaLC = ui.Label('ESA WorldCover 10m v200', subtextVis);
var ghsl = ui.Label('Global Human Settlement Layers, Population Grid - 2015', subtextVis);
//var scriptBy = ui.Label('Script Produced By:', textVis);
//var scriptByStatement = ui.Label('UN-SPIDER, Edited By Er. Sunil Bogati', subtextVis);

// Update the labels with the calculated values
flood_area.evaluate(function (val) {
  floodExtentAreaLabel.setValue(val + ' hectares');
});

floodAffectedCroplandAreaHa.evaluate(function (val) {
  croplandAffectedAreaLabel.setValue(val + ' hectares');
});

floodAffectedBuiltupAreaHa.evaluate(function (val) {
  builtupAffectedAreaLabel.setValue(val + ' hectares');
});

numberPeopleExposed.evaluate(function (val) {
  populationExposedNumberLabel.setValue(val);
});

// Add the labels to the panel
results.add(ui.Panel([
  titleLabel,
  floodTimeline,
  floodTimelineLabel,
  floodExtentLabel,
  floodExtentAreaLabel,
  croplandAreaLabel,
  croplandAffectedAreaLabel,
  builtupAreaLabel,
  builtupAffectedAreaLabel,
  populationExposedLabel,
  populationExposedNumberLabel,
  datasetsUsed,
  gaul,
  sentinel2,
  permanentWater,
  hydro,
  esaLC,
  ghsl,
  //scriptBy,
  //scriptByStatement
]));

// Add the panel to the map
Map.add(results);

// Create a legend for the land cover classes
var legend = ui.Panel({ style: { position: 'bottom-right' } });

// Add legend title
var legendTitle = ui.Label('Legend', { fontWeight: 'bold' });
legend.add(legendTitle);

var addLegendItem = function (color, name) {
  var item = ui.Panel({
    widgets: [
      ui.Label('', { backgroundColor: '#' + color, width: '15px', height: '15px', margin: '0px 8px 0px 0px' }),
      ui.Label(name, { fontWeight: 'bold', margin: '0px 0px 0px 4px' })
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });

  legend.add(item);
};

// Add legend items for each land cover class
for (var i = 0; i < dict['names'].length; i++) {
  addLegendItem(dict['colors'][i], dict['names'][i]);
}

// Add flooded area legend item
addLegendItem('000000', 'Flooded Area');
addLegendItem('964B00', 'Affected Crop');
addLegendItem('FFC0CB', 'Affected Built-up');
addLegendItem('8B0000', 'Exposed Population');

// Add the legend to the map
Map.add(legend);


///****************EXPORTING OF OUTPUT******************////
Export.image.toDrive({
  image: lc,
  description: 'ESA Earth Cover',

  region: roi
});




