//Print ROI and center
Map.addLayer(ROI, {}, 'roi', false)
Map.centerObject(ROI,10)

//Date
var startDate = ee.Date('2023-01-01');
var endDate =  ee.Date('2023-12-31');

// Create image collection of S-2 imagery for the perdiod 2023-2024
var S2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')  //filter start and end date

         //filter start and end date
         .filter(ee.Filter.date(startDate, endDate))
         .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than',100)
         //filter according to drawn boundary
         .filterBounds(ROI)

print(S2.limit(10))
print(S2.aggregate_array('SPACECRAFT_NAME'))

// Function to calculate and add an NDVI band
var addNDWI = function(image) {
 return image.addBands(image.normalizedDifference(['B3', 'B8'] )
              .rename('ndwi')); //'B3', 'B8'
};  
 
// Add NDVI band to image collection
var S2 = S2.map(addNDWI);
var NDWI =S2.select(['ndwi']);
print('ndwis only',NDWI.limit(10)) ;

// For month
var month = 1;

// Calculating number of intervals
var months = endDate.difference(startDate,'month').divide(month).toInt();
// Generating a sequence 
var sequence = ee.List.sequence(0, months); 
print(sequence)
//FIltering the NDVI monthly max valuesusing the end and start end date
var sequence_s1 = sequence.map(function(num){
    num = ee.Number(num);
    var Start_interval = startDate.advance(num.multiply(month), 'month');
  
    var End_interval = startDate.advance(num.add(1).multiply(month), 'month');
    var subset = NDWI.filterDate(Start_interval,End_interval);
    return subset.max().set('system:time_start',Start_interval);
});

print('sequence_s1',sequence_s1)
var byMonthYear = ee.ImageCollection.fromImages(sequence_s1);

print('byMonthYear',byMonthYear)
var multibandNDWI = byMonthYear.toBands().clip(ROI);
print('multiband',multibandNDWI);
Map.addLayer(multibandNDWI)

//Renaming the Bands
var bandsName=['2023-01','2023-02','2023-03','2023-04','2023-05','2023-06','2023-07','2023-08','2023-09','2023-10','2023-11','2023-12']

var multiband1_ndwi = multibandNDWI.rename(bandsName).clip(ROI);//(monList)//
//

//s1
var sentinel1_vh = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .select('VH')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('resolution_meters', 10))
  .filter(ee.Filter.date(startDate, endDate))
  .filter(ee.Filter.bounds(ROI))

print('s1',sentinel1_vh);

// For month
var month = 1;

// Calculating number of intervals
var months = endDate.difference(startDate,'month').divide(month).toInt();
// Generating a sequence 
var sequence = ee.List.sequence(0, months); 
print(sequence)

var sequence_s1 = sequence.map(function(num){
    num = ee.Number(num);
    var Start_interval = startDate.advance(num.multiply(month), 'month');
  
    var End_interval = startDate.advance(num.add(1).multiply(month), 'month');
    var subset = sentinel1_vh.filterDate(Start_interval,End_interval);
    return subset.median().set('system:time_start',Start_interval);
});

print('sequence_s1',sequence_s1)
var byMonthYearS1 = ee.ImageCollection.fromImages(sequence_s1);
var multibands1 = byMonthYearS1.toBands().clip(ROI);

var multibands1 = multibands1.rename(bandsName).clip(ROI);//.rename(monLists1).clip(ROI);//


//combined s1 and s2
var combinedband=multiband1_ndwi.addBands(multibands1);
print('combinedband',combinedband);

//Training 
var training = combinedband.sample({
  region: ROI,
  scale: 10,
  numPixels: 3000,
  tileScale:8,
 // geometries:true
  
});

//Map.addLayer(training,{},'points')
var clusterer = ee.Clusterer.wekaKMeans(30).train({
  features:training
  
});

// Cluster the input using the trained clusterer.
var result_cluster =combinedband.cluster(clusterer).byte();//combands
// print('result_s2',result_s2)

//var result_cluster = result_cluster.remap(clusters,values0);
var remapped_cluster = result_cluster.rename('remapped');// .remap(clusters, values0).byte().clip(ROI);//.updateMask(slope.lt(slope_th))


//Charts

///
var comb_ndwi_cluster=multiband1_ndwi.addBands(remapped_cluster);
print("comb_ndwi_cluster",comb_ndwi_cluster);
// Define chart customization options.
var options = {
  lineWidth: 1,
  pointSize: 2,
  hAxis: {title: 'Year-Month'},
  vAxis: {title: 'NDWI'},
  title: 'Sentinel-2 NDWI spectra in classified regions'
};

// Make the chart, set the options.
var chart_class_ndwi = ui.Chart.image.byClass(
    comb_ndwi_cluster, 'remapped', ROI, ee.Reducer.median(), 500)//, classNames, wavelengths)
    .setOptions(options)
    .setChartType('ScatterChart');

//Print the chart.
print(chart_class_ndwi);

//
var comb_vh_cluster=multibands1.addBands(remapped_cluster);
print("comb_vh_cluster",comb_vh_cluster);
// Define chart customization options.
var options = {
  lineWidth: 1,
  pointSize: 2,
  hAxis: {title: 'Year-Month'},
  vAxis: {title: 'VH'},
  title: 'Senetinel-1 VH spectra in classified regions'
};

// Make the chart, set the options.
var chart_class_vh = ui.Chart.image.byClass(
    comb_vh_cluster, 'remapped', ROI, ee.Reducer.median(), 500)//, classNames, wavelengths)
    .setOptions(options)
    .setChartType('ScatterChart');

// Print the chart.
print(chart_class_vh);




Map.addLayer(multiband1_ndwi ,  {min: 0.2, max: 0.8}, 'NDWI',0);
Map.addLayer(multibands1 ,  {min: -25, max: -10}, 'VH',0);

var clusters = [0, 1, 2, 3, 4,5,6,7,8,9,
10,11,12,13,14,15,16,17,18,19,
20,21,22,23,24,25,26,27,28,29];



var values0 =   [1, 2, 3, 4,5,
                 6,7,8,9,10,
                 11,12,13,14,15,
                 16,17,18,19,20,
                 21,22,23,24,25,
                 26,27,28,29,30];
                 
var values1 =   [0, 0, 1, 0, 0,
                0,0,1,0,0,
                1,1,0,1,0,
                0,0,0,1,0,
                0,1,1,0,0,
                1,1,1,0,1];
/*                
var values1 =   [0, 0, 0, 0,1,
                0,1,0,1,0,
                0,0,0,1,0,
                0,1,1,0,0,
                0,0,0,0,0,
                0,0,0,0,0];                
 */               
var values2 =    [0, 0, 1, 0, 0,
                0,0,2,0,0,
                3,4,0,5,0,
                0,0,0,6,0,
                0,7,8,0,0,
                9,10,11,0,12];
/*                
var values2 =    [0, 0, 0, 0, 2,0,
                3,0,4,0,0,
                0,0,1,0,0,
                2,3,0,0,0,
                0,0,0,4,0,
                0,0,0,0];
 */               
                

//Adding the Layers
var remapped_cluster1=remapped_cluster.remap(values0,values1);
var remapped_cluster1=remapped_cluster1.updateMask(remapped_cluster1);
var remapped_cluster2=remapped_cluster.remap(values0,values2).updateMask(remapped_cluster1);
//Look for where the above code fits


  Map.addLayer(multiband1_ndwi ,  {min: 0.2, max: 0.8}, 'NDWI',0);
Map.addLayer(multibands1 ,  {min: -25, max: -10}, 'VH',0);

Map.addLayer(remapped_cluster.randomVisualizer(), {}, 're_groups_s2',0);
Map.addLayer(remapped_cluster1, {min:1,max:1,palette:['white','red']}, 'binary_rice',1);
Map.addLayer(remapped_cluster2.randomVisualizer(), {}, 'pattern_rice',1);  

