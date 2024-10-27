
var admin = ee.FeatureCollection("FAO/GAUL/2015/level0")


var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea');
// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);





//**********VEGETATION INDICES AND DROUGHT INDICES

// Import the MOD16 dataset.
var mod16 = ee.ImageCollection('MODIS/006/MOD16A2').select('ET');

// Filter for relevant time period.
mod16 = mod16.filterDate(startDate, endDate);

// Import and filter the MOD13 dataset.

mod13 = mod13.filterDate(startDate, endDate);

// Select the EVI.
var EVI = mod13.select('EVI');

// Import and filter the MODIS Terra surface reflectance dataset.
// Import and filter the MODIS Terra surface reflectance dataset.
var mod09 = mod092;
mod09 = mod09.filterDate(startDate, endDate);

// We use a function to remove clouds and cloud shadows.
// We map over the mod09 image collection and select the StateQA band.
// We mask pixels and return the image with clouds and cloud shadows masked.
mod09 = mod09.map(function(image) {
    var quality = image.select('StateQA');
    var mask = image.and(quality.bitwiseAnd(1).eq(
            0)) // No clouds.
        .and(quality.bitwiseAnd(2).eq(0)); // No cloud shadow.

    return image.updateMask(mask);
});

// We use a function to calculate the Moisture Stress Index.
// We map over the mod09 image collection and select the NIR and SWIR bands
// We set the timestamp and return the MSI.
var MSI = mod09.map(function(image) {
    var nirband = image.select('sur_refl_b02');
    var swirband = image.select('sur_refl_b06');

    var msi = swirband.divide(nirband).rename('MSI')
        .set('system:time_start', image.get(
            'system:time_start'));
    return msi;
});

// We apply a nested loop where we first map over 
// the relevant years and then map over the relevant 
// months. The function returns an image with bands for 
// water balance (wb), rainfall (P), evapotranspiration (ET),
// EVI and MSI for each month. A flatten is applied to 
// convert an collection of collections 
// into a single collection.
var ic = ee.ImageCollection.fromImages(
    years.map(function(y) {
        return months.map(function(m) {
            // Calculate rainfall.
            var P = CHIRPS.filter(ee.Filter
                    .calendarRange(y, y, 'year'))
                .filter(ee.Filter.calendarRange(m, m,
                    'month'))
                .sum();

            // Calculate evapotranspiration.
            var ET = mod16.filter(ee.Filter
                    .calendarRange(y, y, 'year'))
                .filter(ee.Filter.calendarRange(m, m,
                    'month'))
                .sum()
                .multiply(0.1);

            // Calculate EVI.
            var evi = EVI.filter(ee.Filter
                    .calendarRange(y, y, 'year'))
                .filter(ee.Filter.calendarRange(m, m,
                    'month'))
                .mean()
                .multiply(0.0001);

            // Calculate MSI.
            var msi = MSI.filter(ee.Filter
                    .calendarRange(y, y, 'year'))
                .filter(ee.Filter.calendarRange(m, m,
                    'month'))
                .mean();

            // Calculate monthly water balance.
            var wb = P.subtract(ET).rename('wb');

            // Return an image with all images as bands.
            return ee.Image.cat([wb, P, ET, evi, msi])
                .set('year', y)
                .set('month', m)
                .set('system:time_start', ee.Date
                    .fromYMD(y, m, 1));

        });
    }).flatten()
);

// Add the mean monthly EVI and MSI to the map.
var eviVis = {
    min: 0,
    max: 0.7,
    palette: 'red, orange, yellow, green, darkgreen'
};


Map.addLayer(ic.select('EVI').mean().clip(eritrea),
    eviVis,
    'EVI');

var msiVis = {
    min: 0.25,
    max: 1,
    palette: 'darkblue, blue, yellow, orange, red'
};

Map.addLayer(ic.select('MSI').mean().clip(eritrea),
    msiVis,
    'MSI');

// Define the water balance chart and print it to the console.
var chartWB =
    ui.Chart.image.series({
        imageCollection: ic.select(['wb', 'precipitation', 'ET']),
        region: eritrea,
        reducer: ee.Reducer.mean(),
        scale: 5000,
        xProperty: 'system:time_start'
    })
    .setSeriesNames(['wb', 'P', 'ET'])
    .setOptions({
        title: 'water balance',
        hAxis: {
            title: 'Date',
            titleTextStyle: {
                italic: false,
                bold: true
            }
        },
        vAxis: {
            title: 'Water (mm)',
            titleTextStyle: {
                italic: false,
                bold: true
            }
        },
                lineWidth: 1,
        colors: ['green', 'blue', 'red'],
        curveType: 'function'
    });

// Print the water balance chart.
print(chartWB);

// Define the indices chart and print it to the console.
var chartIndices =
    ui.Chart.image.series({
        imageCollection: ic.select(['EVI', 'MSI']),
        region: eritrea,
        reducer: ee.Reducer.mean(),
        scale: 5000,
        xProperty: 'system:time_start'
    })
    .setSeriesNames(['EVI', 'MSI'])
    .setOptions({
        title: 'Monthly indices',
        hAxis: {
            title: 'Date',
            titleTextStyle: {
                italic: false,
                bold: true
            }
        },
        vAxis: {
            title: 'Index',
            titleTextStyle: {
                italic: false,
                bold: true
            }
        },
        lineWidth: 1,
        colors: ['darkgreen', 'brown'],
        curveType: 'function'
    });

print(chartIndices);