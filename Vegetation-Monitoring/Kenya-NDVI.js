// MODIS Vegetation indices as the basis for the showcase 
var NDVI = ee.ImageCollection('MODIS/061/MOD13Q1').select('NDVI')
 print('Modis Collection:', NDVI );

 
// filter the collection to make use of two years at start and end 
var ndvi2001 = NDVI
  .filterDate('2001-01-01', '2002-12-31');
print('Ndvi 2001:', ndvi2001 );
  
var ndvi2010 = NDVI
  .filterDate('2010-01-01', '2011-12-31');
  

// to create an NDVI mean for the first  and the second timestep and clip it to kenya
var mean2001 = ndvi2001.mean().clip(roi)
print('Mean 2001', mean2001)
var mean2010 = ndvi2010.mean().clip(roi)


// Set visualization parameters


Map.addLayer(mean2001, VisParamNDVI)
Map.addLayer(mean2010, VisParamNDVI)

var difference = mean2010.subtract(mean2001)
Map.addLayer(difference, VisParamChange)


var plotIrrigation = ui.Chart.image.seriesByRegion(NDVI, Increase, ee.Reducer.mean(), 'NDVI', 500)
.setOptions({ title: 'NDVI Time Series INCREASE',  hAxis: {title: 'Date'}, 
vAxis: {title: 'NDVI'}
});
print(plotIrrigation);


var plotRainfed = ui.Chart.image.seriesByRegion(NDVI, Decrease, ee.Reducer.mean(), 'NDVI', 500)
.setOptions({ title: 'NDVI Time Series DECREASE',  hAxis: {title: 'Date'}, 
vAxis: {title: 'NDVI'}
});
print(plotRainfed);
