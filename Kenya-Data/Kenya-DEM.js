//see the information of the data
print (srtm);

var kenya = ee.FeatureCollection("USDOS/LSIB/2013")
  .filter(ee.Filter.inList('name',['KENYA']));
//displaying the data in interactive map

Map.addLayer(srtm.clip(kenya), {min:0, max: 300, 
palette: ['90EE90','FFFF00','FF0000']}, 'Raw SRTM'); //Light green, yellow, red

Export.image.toDrive({
  image: srtm,
  description: 'rawSTRM',
  fileNamePrefix: 'strm',
  scale: 50,
  region: kenya,
  maxPixels: 2117979342,
});

//display hillshading and slope
var exaggeration = 100;
var hillshade = ee.Terrain.hillshade(srtm.multiply(exaggeration));
Map.addLayer(hillshade.clip(kenya), {min:150, max:255,}, 'Hillshade');
print(hillshade);

Export.image.toDrive({
  image: hillshade,
  description: 'Exaggerated_slope',
  fileNamePrefix: 'slope',
  scale: 50,
  region: kenya,
  maxPixels: 2117979342,
});

var slope = ee.Terrain.slope(srtm);
Map.addLayer(slope.clip(kenya), {min:0, max:20, pallete: ['FFFFFF']},'Slope');
print(slope);

Export.image.toDrive({
  image: slope,
  description: 'slope',
  fileNamePrefix: 'slope',
  scale: 50,
  region: kenya,
  maxPixels: 2117979342,
});


// Export an ee.FeatureCollection as an Earth Engine asset.
Export.table.toAsset({
  collection: kenya,
  description:'kenya',
  assetId: 'kenyafull',
});
      