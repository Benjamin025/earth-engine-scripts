//                                PRECIPITATION ANOMALIES BASED ON CHIRPS DATA

//This script calculates precipitation anomalies based on CHIRPS data for a user-defined timeframe.
//The precipitation anomalies are calculated by subtracting the precipitation that has fallen within a defined timeframe
//from the long term mean of precipitation within that timeframe over a long period of time taking into account all available 
//CHIRPS precipitation data since 1981.
//Be careful: This script will only display precipitation anomalies to the long term mean and cannot be used as an indicator for drought severity!


//Example: Precipitation Anomalies for Madagascar for July 2021
//We want to calculate the precipitation anomaly for July 2021 within our area of interest (AOI).
//Therefore, we calculate the mean of the total precipitation that occurred in the month July of all years between 1981 and the current year.
//Then we subtract this long term mean from our current investigation period, which is the precipitation in July 2021.
//Positive values represent the amount of rainfall in mm that was received additionally in July 2021 compared to the long-term July average.
//Negative values on the other hand show the deficit compared to the long-term average.


//Set your AOI
//Delete "//" at the beginning of the following line 20 to run the example for the given AOI of Madagascar. 
//var AOI = ee.Geometry.Polygon([[[42.47811677700697, -11.272259613803493],[42.47811677700697, -26.201873344970554],[51.79452302700697, -26.201873344970554], [51.79452302700697, -11.272259613803493]]], null, false);
//To use a different AOI simply use the tools in the map canvas to draw a polygon. It will appear as "imports" at the very top of the script and
//rename "geometry" with "AOI"

//Provide a data range for which the anomaly should be calculated
//While the start date of the defined timeframe is inclusive (so the precipitation data will be considered for that date),
//the end date is exclusive, and the precipitation data will only be considered to the day before the defined end date.
var start_Date = ee.Date('2021-01-01');
var end_date = ee.Date('2021-07-01');

//Set min and max values for visualization
var min = -300;
var max = 300;

//=============================Start of the script=========================================
//Import the CHIRPS image collection and clip it to the chosen AOI
var imgCol = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").map(function(img){return img.clip(AOI)});

//Set the center of the map to your AOI
Map.centerObject(AOI, 5);

//Calculate the sum of precipitation during the defined timeframe
var pr_sum = imgCol.filterDate(start_Date, end_date)
  .sum()
  .set({
    'system:time_start': start_Date.millis(),
    'system:time_end': end_date.advance(-1, 'day').millis()
  });

//Get the number of days within the provided timeframe
var dif_days = end_date.difference(start_Date, 'day');
//Get the month of the start date
var start_month = start_Date.get('month');
//Get the day of the start day
var start_day = start_Date.get('day');

//Get a list of all years for which CHIRPS data exists
var col_start_year = ee.Date(ee.List(imgCol.get('date_range')).get(0)).get('year');
var col_end_year = ee.Date(ee.List(imgCol.get('date_range')).get(1)).get('year');
var year_list = ee.List.sequence(col_start_year, col_end_year, 1);

//Calculate the long term mean for the defined timeframe by calculating the precipitation sum for the time frame in all years of available data
//and calculate the mean of those summed images
var hist_pr_mean = ee.ImageCollection.fromImages(year_list.map(function(year){
  var start = ee.Date.fromYMD(year, start_month, start_day); //Create the start date based on the year in the list and month and day information from the user provided start day
  var end = start.advance(dif_days, 'day'); //Create the corresponding end date by adding the calculated difference to the start date
  var filt_size = imgCol.filterDate(start, end).size();
  var filt_pr_sum = imgCol.filterDate(start, end).sum();
  //Only return the summed precipitation image if there was an image for each day within the desired timeframe
  return ee.Algorithms.If({
    condition: filt_size.eq(dif_days), 
    trueCase: filt_pr_sum});
})).mean();


//Calculate the difference between the precipitation sum of the provided timeframe and the long term mean
var pr_anomaly = pr_sum.subtract(hist_pr_mean);

//Visualizing the results
var vis = {
  min: min,
  max: max,
  palette: ['d53e4f', 'fc8d59', 'fee08b', 'ffffbf', 'e6f598', '99d594', '3288bd']
};

Map.addLayer(pr_anomaly, vis, 'Precipitation anomaly in mm ('+start_Date.format('YYYY-MM-dd').getInfo()+' to '+end_date.format('YYYY-MM-dd').getInfo()+')');

//==============================================
//Create a legend

//Create an empty panel for the legend
var legendPanel = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
});

//Ad a title to the legend
var legendTitle = ui.Label({
  value: 'Anomaly \nin mm',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 auto',
    padding: '0 auto',
    whiteSpace: 'pre',
    textAlign: 'center'
    }
});
legendPanel.add(legendTitle);

//Add the maximum value to the legend
var legendMax = ui.Panel({
  widgets: [ui.Label(vis.max)],
  style: {
    padding: '0 auto',
    margin: '0 auto',
    position: 'bottom-center'
    }
});
legendPanel.add(legendMax);

//Create thumbnail of the color gradient and add  it to the legend
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((vis.max-vis.min)/100.0).add(vis.min);
var legendImage = gradient.visualize(vis);
var thumbnail = ui.Thumbnail({
  image: legendImage, 
  params: {bbox:'0,0,10,100', dimensions:'10x150'},  
  style: {
    padding: '0 auto',
    margin: '0 auto',
    position: 'bottom-center'
    }
});
legendPanel.add(thumbnail);

//Add the minimum value to the legend
var legendMin = ui.Panel({
  widgets: [ui.Label(vis.min)],
  style: {
    padding: '0 auto',
    margin: '0 auto',
    position: 'bottom-center'
    }
});
legendPanel.add(legendMin);

//Add the legend to the map
Map.add(legendPanel);

//==================================
//Create a precipitation timeline
//Each date in the timeline will display the mean precipitation within the AOI

//Get date infos and create a list with the number of months for the timeframe of CHIRPS data
var col_start_date = ee.Date(ee.List(imgCol.get('date_range')).get(0));
var col_end_date = ee.Date(ee.List(imgCol.get('date_range')).get(1));
var dif_months = col_end_date.difference(col_start_date, 'month');
var list_month = ee.List.sequence(0, dif_months, 1);

//Calculate the total monthly precipitation
var monthly_pr_sum = ee.ImageCollection.fromImages(list_month.map(function(month){
  var start = col_start_date.advance(month, 'month');
  var end = start.advance(1, 'month');
  return imgCol.filterDate(start, end)
    .sum()
    .set({
      'system:time_start': start.millis(),
      'system:time_end': end.advance(-1, 'day').millis()
    });
}));

//Turn the AOi geometry into a Feature Collection and add a label
var aoi = ee.FeatureCollection(AOI).map(function(ft){
  return ft.set('label', 'Precipitation [mm]');
});

//Create a chart of monthly precipitation
var pr_chart = ui.Chart.image.seriesByRegion({
  imageCollection: monthly_pr_sum, 
  regions: aoi, 
  reducer: ee.Reducer.mean(), 
  band: 'precipitation', 
  scale: 5000, 
  xProperty: 'system:time_start', 
  seriesProperty: 'label'
}).setOptions({
  title: 'Monthly Precipitation',
  vAxis: {title: 'Precipitation in mm'},
  xAxis: {title: 'Time'}
});
print(pr_chart);