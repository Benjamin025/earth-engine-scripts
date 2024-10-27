// Importing the Shape File of Area:



Map.centerObject(roi, 8)        
/*-------------------------------------- // CloudMask-----------------------------------------*/

function mask2Clouds(image){
  var QA = image.select('QA60')
   
  var cloudBitMask = (1 << 10);                            // Bits 10 and 11 cloud and cirrus 
  var cirrusBitMask = (1 << 11);
  
  var mask = QA.bitwiseAnd(cloudBitMask).eq(0)            // setting both to zero indictes clear condition
              .and(QA.bitwiseAnd(cirrusBitMask).eq(0));
  
  return image.updateMask(mask).divide(10000)
              .copyProperties(image)
              .set('system:time_start',
              image.get('system:time_start'));
}

var start_date= '2016-06-01'
var end_date= '2016-11-30'

var Sen2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
              .sort('CLOUDY_COVER', false)
              .filterDate(start_date, end_date)
              .filterBounds(roi)
              .map(mask2Clouds)
              
/*----------------------------------- // Computation NDVI----------------------------------------*/
                   
var NDVI_Sen2 = Sen2.map (function(image) {
return image.addBands(image.normalizedDifference(['B8', 'B4']))
                           .addBands(image.metadata('system:time_start')
                          // .divide(1e18)
                           .rename('time'))
})


function smoother(t){
  // helper function to apply linear regression equation
  function applyFit(img){
      return img.select('time').multiply(fit.select('scale')).add(fit.select('offset'))
              .set('system:time_start',img.get('system:time_start')).rename('nd');
  }
  t = ee.Date(t);
  
  var window = NDVI_Sen2.filterDate(t.advance(-windowSize,'day'),t.advance(windowSize,'day'));
    
  var fit = window.select(['time','nd'])
    .reduce(ee.Reducer.linearFit());
    
  return window.map(applyFit).toList(5);
}

// function to reduce time stacked linear regression results
// requires that a variable 'fitIC' exists from the smooter function

function reduceFits(t){
  t = ee.Date(t);
  return fitIC.filterDate(t.advance(-windowSize,'day'),t.advance(windowSize,'day'))
              .mean().set('system:time_start',t.millis()).rename('nd');
}

var dates = NDVI_Sen2.aggregate_array('system:time_start');

var windowSize = 30; //days on either sides

var fitIC = ee.ImageCollection(dates.map(smoother).flatten());

var smoothed = ee.ImageCollection(dates.map(reduceFits));
// print('smoothed',smoothed)

// var smooth_mos = smoothed.mosaic()

// merge original and smoothed data into one image collection for plotting
// var joined = ee.ImageCollection(smoothed.select(['nd'],['smoothed'])
//                 .merge(NDVI_Sen2.select(['nd'],['original'])));

/*------------------------------------// Plot the Graph----------------------------------------*/

var chart = ui.Chart.image.series({
  imageCollection: smoothed,
  region: roi,
  reducer: ee.Reducer.mean(),
  scale: 30
}).setOptions({title: 'NDVI over time'});

print(chart);


/*------------------------------------ // Export Data-----------------------------------------------------------------------*/

/*
Export.image.toDrive({
  image: NDVI_Sen.select('nd'), 
  description:'NDVI_2019', 
  folder: 'Case_Study2022', 
  region: Dehradun, 
  scale: 20, 
  fileFormat: 'GeoTIFF'
  })
*/

/*------------------------------- // Calculate Aspect of NDVI Image-----------------------------------------------------*/
                           

// Importing the SRTM DEM

// var START ='2016-01-01',
//     END = '2022-07-21'

// var SRTM = ee.Image("CGIAR/SRTM90_V4")
//                 .clip(Dehradun)

// print('SRTM',SRTM)
// Map.addLayer(SRTM,{min:0, max: 9000},'SRTM',false)

/*--------------------------------------//Calculation of Aspect----------------------------------------------------------------------------*/

/*
var aspect = ee.Terrain.aspect(SRTM)

var slope = ee.Terrain.slope(SRTM)

Map.addLayer(aspect,{},'aspect',false)
Map.addLayer(slope,{},'slope',false)

var merge = NDVI_Sen.addBands(aspect).clip(Dehradun);
Map.addLayer(merge,{},'merge',false)
print('merge',merge)

var array = merge.reduceRegion({reducer: ee.Reducer.toList(), geometry: Dehradun, scale: 1000})
                 .toArray(merge.bandNames());
                 
print('array',array)
var x = ee.List(array.get('aspect'));
var y = ee.List(array.get('nd'));


// Define the chart and print it to the console.
var chart = ui.Chart.array.values({array: y, axis: 0, xLabels: x}).setOptions({
  title: 'Relationship between the NDVI and Aspect',
  colors: ['cf513e'],
  hAxis: {
    title: 'Aspect (degree)',
    titleTextStyle: {italic: false, bold: true}
  },
  vAxis: {
    title: 'NDVI values',
    titleTextStyle: {italic: false, bold: true}
  },
  pointSize: 4,
  dataOpacity: 0.4,
  legend: {position: 'none'},
});
print(chart);

*/
