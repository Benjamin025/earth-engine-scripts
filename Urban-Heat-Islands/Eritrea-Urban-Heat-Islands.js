//**********URBAN HEAT ISLANDS*******//
//****Delivering Land surface temparature using MODIS*****

//adding the administrative boundaries
//var admin = ee.FeatureCollection("FAO/GAUL/2015/level0");

// Filter the dataset to only include Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea Boundary');

// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);

//load ' MODIS MYD11A2 version 6 product'
// Load MODIS image collection from the Earth Engine data catalog.
//var modisLst = ee.ImageCollection('MODIS/006/MYD11A2');

// Select the band of interest (in this case: Daytime LST).
var landSurfTemperature = modisLst.select('LST_Day_1km');

//The summertime in Eritrea is received from June 1 to september 30
//June 1 (day 152) september 30 (day 273)
// Create a summer filter.
var sumFilter = ee.Filter.dayOfYear(152, 273);

// Filter the date range of interest using a date filter.
var lstDateInt = landSurfTemperature
    .filterDate('2014-01-01', '2019-01-01').filter(sumFilter);

// Take pixel-wise mean of all the images in the collection.
var lstMean = lstDateInt.mean();


// Multiply each pixel by scaling factor to get the LST values.
var lstFinal = lstMean.multiply(0.02);

// Generate a water mask.
var water = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select(
    'occurrence');
var notWater = water.mask().not();

// Clip data to region of interest, convert to degree Celsius, and mask water pixels.
var lstNewHaven = lstFinal.clip(eritrea).subtract(273.15)
    .updateMask(notWater);

// Add layer to map.
Map.addLayer(lstNewHaven, {
        palette: ['blue', 'white', 'red'],
        min: 25,
        max: 38
    },
    'LST_MODIS');

//********LST from LANDSAT 8********

// Function to filter out cloudy pixels.
function cloudMask(cloudyScene) {
    // Add a cloud score band to the image.
    var scored = ee.Algorithms.Landsat.simpleCloudScore(cloudyScene);

    // Create an image mask from the cloud score band and specify threshold.
    var mask = scored.select(['cloud']).lte(10);

    // Apply the mask to the original image and return the masked image.
    return cloudyScene.updateMask(mask);
}

// Load the collection, apply cloud mask, and filter to date and region of interest.
var col = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterBounds(eritrea)
    .filterDate('2014-01-01', '2019-01-01')
    .filter(sumFilter)
    .map(cloudMask);
    
print('Landsat collection', col);    

//
// Generate median composite.
var image = col.median();

// Select thermal band 10 (with brightness temperature).
var thermal = image.select('B10')
    .clip(eritrea)
    .updateMask(notWater);

Map.addLayer(thermal, {
        min: 295,
        max: 310,
        palette: ['blue', 'white', 'red']
    },
    'Landsat_BT');

//
// Calculate Normalized Difference Vegetation Index (NDVI) 
// from Landsat surface reflectance.
var ndvi = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(eritrea)
    .filterDate('2014-01-01', '2019-01-01')
    .filter(sumFilter)
    .median()
    .normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
    .clip(eritrea)
    .updateMask(notWater);

Map.addLayer(ndvi, {
        min: 0,
        max: 1,
        palette: ['blue', 'white', 'green']
    },
    'ndvi');

//To map NDVI for each pixel to the actual fraction of the pixel with vegetation (fractional vegetation cover),
//we next use a relationship based on the range of NDVI values for each pixel.

// Find the minimum and maximum of NDVI.  Combine the reducers
// for efficiency (single pass over the data).
// Find the minimum and maximum of NDVI.  Combine the reducers
// for efficiency (single pass over the data).
var minMax = ndvi.reduceRegion({
    reducer: ee.Reducer.min().combine({
        reducer2: ee.Reducer.max(),
        sharedInputs: true
    }),
    geometry: eritrea,
    scale: 30,
    maxPixels: 1e9
});
print('minMax', minMax);

var min = ee.Number(minMax.get('NDVI_min'));
var max = ee.Number(minMax.get('NDVI_max'));

// Calculate fractional vegetation.
var fv = ndvi.subtract(min).divide(max.subtract(min)).rename('FV');
Map.addLayer(fv, {
    min: 0,
    max: 1,
    palette: ['blue', 'white', 'green']
}, 'fv');


// Emissivity calculations.
var a = ee.Number(0.004);
var b = ee.Number(0.986);
var em = fv.multiply(a).add(b).rename('EMM').updateMask(notWater);

Map.addLayer(em, {
        min: 0.98,
        max: 0.99,
        palette: ['blue', 'white', 'green']
    },
    'EMM');


//
// Calculate LST from emissivity and brightness temperature.
var lstLandsat = thermal.expression(
    '(Tb/(1 + (0.001145* (Tb / 1.438))*log(Ep)))-273.15', {
        'Tb': thermal.select('B10'),
        'Ep': em.select('EMM')
    }).updateMask(notWater);

Map.addLayer(lstLandsat, {
        min: 25,
        max: 35,
        palette: ['blue', 'white', 'red'],
    },
    'LST_Landsat');

//*******EARTH ENGINE MODULE******************//
//Earth Engine module developed for this purpose to calculate LST

// Link to the module that computes the Landsat LST.
var landsatLST = require(
    'projects/gee-edu/book:Part A - Applications/A1 - Human Applications/A1.5 Heat Islands/modules/Landsat_LST.js');

// Select region of interest, date range, and Landsat satellite.
var geometry = eritrea.geometry();
var satellite = 'L8';
var dateStart = '2014-01-01';
var dateEnd = '2019-01-01';
var useNdvi = true;

// Get Landsat collection with additional necessary variables.
var landsatColl = landsatLST.collection(satellite, dateStart, dateEnd,
    geometry, useNdvi);

// Create composite, clip, filter to summer, mask, and convert to degree Celsius.
var landsatComp = landsatColl
    .select('LST')
    .filter(sumFilter)
    .median()
    .clip(eritrea)
    .updateMask(notWater)
     .subtract(273.15);

Map.addLayer(landsatComp, {
        min: 25,
        max: 38,
        palette: ['blue', 'white', 'red']
    },
    'LST_SMW');


///****creating a COSTANT BUFFER*****

// Function to subtract the original urban cluster from the buffered cluster 
// to generate rural references.
function bufferSubtract(feature) {
    return ee.Feature(feature.geometry()
        .buffer(2000)
        .difference(feature.geometry()));
}

var ruralRef = Asmara.map(bufferSubtract);

Map.addLayer(ruralRef, {
    color: 'green'
}, 'Buffer_ref');


//********Defining a sequence of buffers*********//

//*******using ITERATIVE methods to create the buffer*****//
// Define sequence of buffer widths to be tested.
var buffWidths = ee.List.sequence(30, 3000, 30);

// Function to generate standardized buffers (approximately comparable to area of urban cluster).
function bufferOptimize(feature) {
    function buff(buffLength) {
        var buffedPolygon = ee.Feature(feature.geometry()
                .buffer(ee.Number(buffLength)))
            .set({
                'Buffer_width': ee.Number(buffLength)
            });
        var area = buffedPolygon.geometry().difference(feature
            .geometry()).area();
        var diffFeature = ee.Feature(
            buffedPolygon.geometry().difference(feature
                .geometry()));
        return diffFeature.set({
            'Buffer_diff': area.subtract(feature.geometry()
                .area()).abs(),
            'Buffer_area': area,
            'Buffer_width': buffedPolygon.get('Buffer_width')
        });
    }

    var buffed = ee.FeatureCollection(buffWidths.map(buff));
    var sortedByBuffer = buffed.sort({
        property: 'Buffer_diff'
    });
    var firstFeature = ee.Feature(sortedByBuffer.first());
    return firstFeature.set({
        'Urban_Area': feature.get('Area'),
        'Buffer_width': firstFeature.get('Buffer_width')
    });
}

// Map function over urban feature collection.
var ruralRefStd = ruralRef.map(bufferOptimize);

Map.addLayer(ruralRefStd, {
    color: 'brown'
}, 'Buffer_ref_std');

print('ruralRefStd', ruralRefStd);


//*********Create Urban and Non urban pixels****

// Select the NLCD land cover data.
var landCover = ee.Image('USGS/NLCD/NLCD2016').select('landcover');
var urban = landCover;

// Select urban pixels in image.
var urbanUrban = urban.updateMask(urban.eq(23).or(urban.eq(24)));

// Select background reference pixels in the image.
var nonUrbanVals = [41, 42, 43, 51, 52, 71, 72, 73, 74, 81, 82];
var nonUrbanPixels = urban.eq(ee.Image(nonUrbanVals)).reduce('max');
var urbanNonUrban = urban.updateMask(nonUrbanPixels);

Map.addLayer(urbanUrban.clip(eritrea), {
    palette: 'red'
}, 'Urban pixels');

Map.addLayer(urbanNonUrban.clip(eritrea), {
    palette: 'blue'
}, 'Non-urban pixels');

//*****Calculating the Surface Urban Heat Island Intensity***
// Define function to reduce regions and summarize pixel values 
// to get mean LST for different cases.
// Function to calculate mean LST for urban and rural pixels
function polygonMean(feature) {
    var reducedLstUrb = lstFinal.subtract(273.15).updateMask(notWater)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 100,  // Adjust scale
            maxPixels: 1e9
        });
    var reducedLstUrbMask = lstFinal.subtract(273.15).updateMask(
            notWater)
        .updateMask(urbanUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 100,  // Adjust scale
            maxPixels: 1e9
        });
    var reducedLstUrbPix = lstFinal.subtract(273.15).updateMask(
            notWater)
        .updateMask(urbanUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 100,  // Adjust scale
            maxPixels: 1e9
        });
    var reducedLstLandsatUrbPix = landsatComp.updateMask(notWater)
        .updateMask(urbanUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 30,  // Scale appropriate for Landsat
            maxPixels: 1e9
        });
    var reducedLstRurPix = lstFinal.subtract(273.15).updateMask(
            notWater)
        .updateMask(urbanNonUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 100,  // Adjust scale
            maxPixels: 1e9
        });
    var reducedLstLandsatRurPix = landsatComp.updateMask(notWater)
        .updateMask(urbanNonUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 30,  // Scale appropriate for Landsat
            maxPixels: 1e9
        });

    return feature.set({
        'MODIS_LST_urb': reducedLstUrb.get('LST_Day_1km'),
        'MODIS_LST_urb_mask': reducedLstUrbMask.get('LST_Day_1km'),
        'MODIS_LST_urb_pix': reducedLstUrbPix.get('LST_Day_1km'),
        'MODIS_LST_rur_pix': reducedLstRurPix.get('LST_Day_1km'),
        'Landsat_LST_urb_pix': reducedLstLandsatUrbPix.get('LST'),
        'Landsat_LST_rur_pix': reducedLstLandsatRurPix.get('LST')
    });
}

// Apply the polygonMean function over urban boundaries
var reduced = eritrea.map(polygonMean);

// RefMean function for rural boundaries
function refMean(feature) {
    var reducedLstRur = lstFinal.subtract(273.15).updateMask(notWater)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 1000,  // Adjust scale
            maxPixels: 1e9,
            bestEffort: true  // Add bestEffort to avoid pixel limit issues
        });
    var reducedLstRurMask = lstFinal.subtract(273.15).updateMask(
            notWater)
        .updateMask(urbanNonUrban)
        .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: feature.geometry(),
            scale: 1000,
            maxPixels: 1e9,
            bestEffort: true
        });
    return feature.set({
        'MODIS_LST_rur': reducedLstRur.get('LST_Day_1km'),
        'MODIS_LST_rur_mask': reducedLstRurMask.get('LST_Day_1km'),
    });
}

// Apply refMean function over rural areas
var reducedRural = ee.FeatureCollection(ruralRef).map(refMean);
var reducedRuralStd = ruralRefStd.map(refMean);

// Print results for inspection
print('reduced', reduced);
print('reducedRural', reducedRural);
print('reducedRuralStd', reducedRuralStd);

// Calculate and display the SUHI effect
var suhi = landsatComp
    .updateMask(urbanUrban)
    .subtract(ee.Number(ee.Feature(reduced.first()).get('Landsat_LST_rur_pix')));

Map.addLayer(suhi, {
    palette: ['blue', 'yellow', 'red'],
    min: 0,  // Adjust to the appropriate LST difference range
    max: 5,
    maxPixels: 1e9
}, 'SUHI');
