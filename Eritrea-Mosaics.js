


// Filter the dataset to only include Eritrea
var eritrea = admin.filter(ee.Filter.eq('ADM0_NAME', 'Eritrea'));

// Make the base map HYBRID.
Map.setOptions('HYBRID');

// Add the filtered boundary of Eritrea to the map
Map.addLayer(eritrea, {color: 'blue'}, 'Eritrea Boundary');

// Set the map's center to Eritrea (based on approximate lat/lon)
Map.setCenter(39.782334, 15.179384, 6);

//
var collection= ee.ImageCollection('COPERNICUS/S1_GRD')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
         .filterBounds(eritrea)
         .filterDate('2021-05-01', '2024-08-31');
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
var after_end='2024-08-31';
// Select images by predefined dates
var before =collection.filterDate(before_start, before_end).filterBounds(eritrea);
var after = collection.filterDate(after_start,after_end).filterBounds(eritrea);

print(before.size());
print(after.size());


var before_image=after.select('VV').mosaic().clip(eritrea);
var after_image=before.select('VV').mosaic().clip(eritrea);

//Map.addLayer(before,{min:-20,max:0},'BEFORE');
//Map.addLayer(after ,{min:-20,max:0},'AFTER');

Map.addLayer(before_image,{min:-25,max:0},'before_image');
Map.addLayer(after_image,{min:-25,max:0},'after_image');


//**********OPTSU THRESHOLDING**************//

// Specify band to use for Otsu thresholding.
var band = 'VV';

// Define a reducer to calculate a histogram of values.
var histogramReducer = ee.Reducer.histogram(255, 0.1);

// Reduce all of the image values.
var globalHistogram = ee.Dictionary(
    after_image.select(band).reduceRegion({
        reducer: histogramReducer,
        geometry: after_image.geometry(),
        scale: 90,
        maxPixels: 1e10
    }).get(band)
);

// Extract out the histogram buckets and counts per bucket.
var x = ee.List(globalHistogram.get('bucketMeans'));
var y = ee.List(globalHistogram.get('histogram'));

// Define a list of values to plot.
var dataCol = ee.Array.cat([x, y], 1).toList();

// Define the header information for data.
var columnHeader = ee.List([
    [
    {
        label: 'Backscatter',
        role: 'domain',
        type: 'number'
    },
    {
        label: 'Values',
        role: 'data',
        type: 'number'
    }, ]
]);

// Concat the header and data for plotting.
var dataTable = columnHeader.cat(dataCol);

// Create plot using the ui.Chart function with the dataTable.
// Use 'evaluate' to transfer the server-side table to the client.
// Define the chart and print it to the console.
dataTable.evaluate(function(dataTableClient) {
    var chart = ui.Chart(dataTableClient)
        .setChartType('AreaChart')
        .setOptions({
            title: band + ' Global Histogram',
            hAxis: {
                title: 'Backscatter [dB]',
                viewWindow: {
                    min: -35,
                    max: 15
                }
            },
            vAxis: {
                title: 'Count'
            }
        });
    print(chart);
});



