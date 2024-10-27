var dataset = ee.Image('JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1');
var builtUpMultitemporal = dataset.select('built');
var visParams = {
  min: 1.0,
  max: 6.0,
  palette: ['0c1d60', '000000', '448564', '70daa4', '83ffbf', 'ffffff'],
};


var builtUp2000 = dataset.select('built').gt(3);
Map.addLayer(builtUp2000)
Map.addLayer(builtUp2000, {min: 0, max:1, palette:["white","red"]}, "recent buield up")
print(dataset)
