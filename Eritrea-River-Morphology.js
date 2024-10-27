// Filter the dataset to only include Eritrea
var eritrea = adminBoundaries.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea Boundary');

// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);


//***RIVER MORPHOLOGY*****//
// IMPORT AND VISUALIZE SURFACE WATER MASK.
// Surface water occurrence dataset from the JRC (Pekel et al., 2016).

//***RIVER MORPHOLOGY*****//
// IMPORT AND VISUALIZE SURFACE WATER MASK.
// Surface water occurrence dataset from the JRC (Pekel et al., 2016).

// Filter the dataset to only include Eritrea
var eritrea = adminBoundaries.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea Boundary');

// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);

//***RIVER MORPHOLOGY*****//
// IMPORT AND VISUALIZE SURFACE WATER MASK.
// Surface water occurrence dataset from the JRC (Pekel et al., 2016).

//***RIVER MORPHOLOGY*****//
// IMPORT AND VISUALIZE SURFACE WATER MASK.
// Surface water occurrence dataset from the JRC (Pekel et al., 2016).

// Select the seasonal and permanent pixels image representing the year 2000
var watermask = jrcYearly.filter(ee.Filter.eq('year', 2000)).first()
    .gte(2).unmask(0)
    .clip(eritrea);

// Center the map to Eritrea
Map.centerObject(eritrea);
Map.addLayer(ee.Image.constant(0), {
    min: 0,
    palette: ['black']
}, 'bg', false);
Map.addLayer(watermask, {}, 'watermask', false);

// REMOVE NOISE AND SMALL ISLANDS TO SIMPLIFY THE TOPOLOGY.

// a. Image closure operation to fill small holes.
watermask = watermask.focal_max().focal_min();

// b. Identify small bars and fill them in to create a filled water mask.
var MIN_SIZE = 2000; // Set minimum size for noise removal
var barPolys = watermask.not().selfMask()
    .reduceToVectors({
        geometry: eritrea,
        scale: 30, // Adjust scale as necessary to control the resolution
        eightConnected: true,
        maxPixels: 1e10, // Increase the maxPixels limit
        bestEffort: true // Allow best effort processing
    })
    .filter(ee.Filter.lte('count', MIN_SIZE)); // Get small polygons.

var filled = watermask.paint(barPolys, 1);

// Add the filled water mask layer to the map
Map.addLayer(filled, {
    min: 0,
    max: 1,
    palette: ['blue', 'lightblue']
}, 'Filled Water Mask', false);


// 1. Filter the dataset to only include Eritrea
var eritrea = adminBoundaries.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// 2. Make the base map HYBRID.
Map.setOptions('HYBRID');

// 3. Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea Boundary');

// 4. Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);

//***RIVER MORPHOLOGY*****//
// 5. IMPORT AND VISUALIZE SURFACE WATER MASK.
// Surface water occurrence dataset from the JRC (Pekel et al., 2016).

// 6. Select the seasonal and permanent pixels image representing the year 2000
var watermask = jrcYearly.filter(ee.Filter.eq('year', 2000)).first()
    .gte(2).unmask(0)
    .clip(eritrea);

// 7. Center the map to Eritrea
Map.centerObject(eritrea);
Map.addLayer(ee.Image.constant(0), {
    min: 0,
    palette: ['black']
}, 'bg', false);
Map.addLayer(watermask, {}, 'watermask', false);

// REMOVE NOISE AND SMALL ISLANDS TO SIMPLIFY THE TOPOLOGY.

// a. Image closure operation to fill small holes.
watermask = watermask.focal_max().focal_min();

// b. Identify small bars and fill them in to create a filled water mask.
var MIN_SIZE = 2000; // Set minimum size for noise removal
var barPolys = watermask.not().selfMask()
    .reduceToVectors({
        geometry: eritrea,
        scale: 30, // Adjust scale as necessary to control the resolution
        eightConnected: true,
        maxPixels: 1e10, // Increase the maxPixels limit
        bestEffort: true // Allow best effort processing
    })
    .filter(ee.Filter.lte('count', MIN_SIZE)); // Get small polygons.

var filled = watermask.paint(barPolys, 1);

// 8. Add the filled water mask layer to the map
Map.addLayer(filled, {
    min: 0,
    max: 1,
    palette: ['blue', 'lightblue']
}, 'Filled Water Mask', false);


