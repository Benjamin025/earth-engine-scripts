     //TUTORIAL[https://www.un-spider.org/advisory-support/recommended-practices/recommended-practice-drought-monitoring-spi/in-detail]
//=====================================================================================================
//                      DROUGHT MONITORING USING THE STANDARDIZED PRECIPITATION INDEX (SPI)
//=====================================================================================================
//The Standardized Precipitation Index (SPI) developed by McKee et al. (1993) describes the probability 
//of variation from the normal precipitation over multiple years of data, on a monthly (or multiple months) 
//time step. The SPI is calculated by taking the precipitation of the pixel i during timeframe j of year k
//minus the mean of pixel i during timeframe j over n years, 
//divided by standard deviation of pixel i during timeframe j over n years.
//Within this script, the monthly SPI will be calculated based on daily CHIRPS data (since 1981) which 
//will be summed up to monthly (or several months of) precipitation data. Furthermore, this script 
//contains a calculation for 16-day SPI products which dates match with the MODIS (MOD13Q1.006) acquisition  
//dates (if the user does not apply a 'shift').
//As precipitation is usually not normaly distributed, a gamma probability function is commonly used,
//but not supported in that script. The resulting SPI values can therefore just be used as an estimator.
//=====================================================================================================
Map.addLayer(roi)
Map.centerObject(roi,7);



//=====================================================================================================
//                                     SET TIME FRAME
var firstImage = ee.Date(ee.List(CHIRPS.get('date_range')).get(0));
var latestImage = ee.Date(CHIRPS.limit(1, 'system:time_start',  false).first().get('system:time_start'));

//=====================================================================================================
//                                     SET RESOLUTION
//CHIRPS datasets have a resolution of 0.05°. However, as GEE is using meter to define the resolution,
//you might have to recalculate the resolution for your AOI. According to

//https://www.usna.edu/Users/oceano/pguth/md_help/html/approx_equivalents.htm

//a resolution of 0.05° corresponds to approximately 5550 meters at the equator.
//Depending on the size of your AOI it might be useful to decrease the resolution to a certain extent 
//(eg. 10000). This shortens the processing time. However, the defined resolution effects the statistic 
//calculations (plotted charts) and the exported image, not the displayed image.
var resolution = 5550;

//=====================================================================================================
//                            SET TIME SCALE INFORMATION FOR SPI
//The SPI can be calculated based on different time scales. The scientific society usually recognizes 
//one month as the shortest timescale for the calculation of the SPI. Shorter timescales might underly
//random  fluctuations in precipitation. However, the SPI can also be calculated for longer timescales,
//like 6 months. The following settings will give you the possibility to set your own time
//frame for the calculation of the SPI.

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!DISCLAIMER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//The calculation works for the following quantity of months: 
//1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 48
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

var timestep = '1'; //Choose the number of months for the SPI. The default setting will calculate the SPI 
                    //for 1 month. Setting the timestep to '6' will calculate the SPI for 6 months.
//=====================================================================================================
//                            SET TIME SHIFT FOR MODIS RELATED SPI
//The 16-day SPI product is an additional product besides the 'normal' SPI and will be calculated for the 
//same dates as MODIS's MOD13Q1.006 (NDVI and EVI) products. As the vegetation might need some time to 
//respond to rainfall, it might be useful to apply a shift for the calculated 16-day SPI. For example: 
//an applied shift of '-5' will cause the (16-day) SPI calculations to be started five days before the 
//MODIS start dates and end the calculations five days earlier than the MODIS end dates as well. This 
//feature might be useful when studying the response on vegetation towards rainfall. The variable "days"
//provides information about the observed days. As MODIS gives 16-Day products, the default value is 
//set to 16. If you wish to increase the number of days anyway, you can change its value.

var shift = '0';
var days = '16';
   

//=====================================================================================================
//                                    INTERACTIVE CHART
//Show interactive chart when clicking on a pixel?
var showInteractiveChart = true; //set to "true" if you want to use the interactive chart. Otherwise set to "false"
   





//                                    START OF THE SCRIPT

//******************************************************************************************************************************
//MONTHLY SPI
var thresholdMonths = ee.Number(12)

  //Create a list with a lag of one month between each list entry. Started from latest image counting backwards
var timedif = (latestImage.difference(firstImage, 'month')).divide(ee.Number.parse(timestep));

  //Creates a simple list
var list = ee.List.sequence(0, timedif); 

  //Map the dates (beginning with the latest image) of the months ends over the list, counting backwards in time
var timeListDate = list.map(function(month){
  var zero = ee.Number(0); //Is needed to substract month
  var delta = (zero.subtract(month)).multiply(ee.Number.parse(timestep)); //results in a negative counting in the list (from latest image backwards) in the steps provided by the user
  var latestDate = latestImage.advance(1, 'day');//Advance one day to include the latest image (starts counting at 00:00 o'clock)
  return latestDate.advance(delta, 'month');//returns a list of dates counted from latest date backwards
});
  
  //Sort list according to their dates
var sortedTimeList = timeListDate.sort();

  //Calculate summed CHIRPS. Just those images will be kept, whose timeframe corrensponse to the user provided number of months
var PrecipitationSum = ee.ImageCollection.fromImages(timeListDate.map(function(monthly_sum){
  var startTime = ee.Date(monthly_sum).advance(ee.Number.parse(timestep).multiply(-1), 'month');
  var endTime = ee.Date(monthly_sum);
  var filteredCHIRPS = CHIRPS.filterDate(startTime, endTime);
  var clippedCHIRPS = filteredCHIRPS.map(function(clip){return clip.clip(roi)});
  var imageAmount = clippedCHIRPS.size();
  var summedCollection = clippedCHIRPS
    .sum()
    .set({
      'Used_Images': imageAmount,
      'Start_Date': ee.Date(filteredCHIRPS.first().get('system:time_start')),
      'End_Date': ee.Date(filteredCHIRPS.limit(1, 'system:time_end', false).first().get('system:time_end')),
      'system:time_start': filteredCHIRPS.first().get('system:time_start'), //Add start date to new image
      'system:time_end': filteredCHIRPS.limit(1, 'system:time_end', false).first().get('system:time_end') //Add end date to new image
    });
  var time = ee.Date(summedCollection.get('system:time_end')).difference(ee.Date(summedCollection.get('system:time_start')), 'month').round();
  var summedImage = summedCollection.set({
    'Observed_Months': time
  });
return ee.Algorithms.If(
  time.gte(ee.Number.parse(timestep)), 
  summedImage);
}));


  //Copy properties of CHIRPS collection to monthly collection
var summedChirpsCollection = ee.ImageCollection(PrecipitationSum.copyProperties(CHIRPS));






  //If the SPI should be calculated for more then 12 months, a different approach has to be used.
  //The following lines decide, which approach to use.
var SPI = ee.ImageCollection(ee.Algorithms.If(
  ee.Number.parse(timestep).gte(thresholdMonths), 
  SpiGreaterEqual12(), 
  SpiSmaller12()));

  //If the SPI should be calculated for less than 12 months, the DOY information have to be used
  //to find the correct images.
function SpiSmaller12 (){
    //Calculate Statistics
  var stats = summedChirpsCollection.map(function(toStats){
    var startDOY  = ee.Date(toStats.get('system:time_start')).getRelative('day', 'year');
    var endDOY = ee.Date(toStats.get('system:time_end')).getRelative('day', 'year');
    var collectionForStats = summedChirpsCollection
      .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year'))
      .reduce(ee.Reducer.stdDev().combine(ee.Reducer.mean(), null, true));
    return toStats.addBands(collectionForStats);
  });
  
  
    //Calculate SPI
  var SPI1_11 = stats.map(function(toSPI){
    var bandForSPI = toSPI.select(['precipitation'], ['SPI']);
    var calc = toSPI.expression('(precipitation - mean) / stdDev',
    {
      precipitation: bandForSPI,
      mean: toSPI.select('precipitation_mean'),
      stdDev: toSPI.select('precipitation_stdDev')});
    return toSPI.addBands(calc);
  });
return SPI1_11;
}

  //If the SPI should be calculated for 12 or more months, the DOY information are not necessary.
  //However, from 12 months onwards, it is just possible to calculate the SPI for whole years.
  //Eg. for 24 or 48 months. Calculating an SPI-18 will not work within this script!
function SpiGreaterEqual12 (){
    //Calculate Statistics
  var stats = summedChirpsCollection.map(function(toStats){
    var collectionForStats = summedChirpsCollection
      .reduce(ee.Reducer.stdDev().combine(ee.Reducer.mean(), null, true));
    return toStats.addBands(collectionForStats);
  });
  
    //Calculate SPI
  var SPI12_n = stats.map(function(toSPI){
    var bandForSPI = toSPI.select(['precipitation'], ['SPI']);
    var calc = toSPI.expression('(precipitation - mean) / stdDev',
    {
      precipitation: bandForSPI,
      mean: toSPI.select('precipitation_mean'),
      stdDev: toSPI.select('precipitation_stdDev')});
    return toSPI.addBands(calc);
  });
return SPI12_n;
}

//******************************************************************************************************************************
//16-DAY SPI
//SPI from CHIRPS date in MODIS 16-days timeline


//Create a list with MODIS start Dates for each 16-day period
var listMillis = MODIS.aggregate_array('system:time_start');

//Turns the millis format of the list into a normal date format. A user provided shift in time will be reognised here as well
var listDates = listMillis.map(function(getDate){
  return ee.Date(getDate).advance(ee.Number.parse(shift), 'day');
});


//Sum up the CHIRPS precipitation data for each 16 day MODIS interval
var precipitation16Days = ee.ImageCollection.fromImages(listDates.map(function(summarize_16Days){
  var filterChirps = CHIRPS.filterDate(ee.Date(summarize_16Days), ee.Date(summarize_16Days).advance(ee.Number.parse(days), 'day'));
  var clippedCHIRPS = filterChirps.map(function(clip){return clip.clip(roi)});
  var imageAmount = clippedCHIRPS.size();
  return ee.Algorithms.If(
    imageAmount.gte(ee.Number.parse(days)), 
    clippedCHIRPS
      .sum()
      .setMulti({
        'Used_Images': imageAmount,
        'system:time_start': filterChirps.first().get('system:time_start'),
        'Start_Date': ee.Date(filterChirps.first().get('system:time_start')),
        'system:time_end': filterChirps.limit(1, 'system:time_end', false).first().get('system:time_end'),
        'End_Date': ee.Date(filterChirps.limit(1, 'system:time_end', false).first().get('system:time_end'))
      }));
}));


//Calculate statistics for each image
var stats16DayCollection = precipitation16Days.map(function(stats){
  var startDOY = ee.Date(stats.get('system:time_start')).getRelative('day', 'year');
  var endDOY = ee.Date(stats.get('system:time_end')).getRelative('day', 'year');
    //Calculate number of images used for mean and stdev calculations
  var imageAmount = precipitation16Days.filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')).size();
  var collectionForStats = precipitation16Days
    .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year'))
    .reduce(ee.Reducer.stdDev().combine(ee.Reducer.mean(), null, true));
  return stats.addBands(collectionForStats).setMulti({'Images_for_Stats': imageAmount});
});


//Calculate SPI
var Final16DayCollection = stats16DayCollection.map(function(toSPI16Days){
  var bandForSPI = toSPI16Days.select(['precipitation'], ['SPI_16Days']);
  var calc = toSPI16Days.expression('(precipitation - mean) / stdDev',
  {
    precipitation: bandForSPI,
    mean: toSPI16Days.select('precipitation_mean'),
    stdDev: toSPI16Days.select('precipitation_stdDev')});
  return toSPI16Days.addBands(calc);
});


//************************************************************************************************************* 
//Add layers to map 
print('The observed time period for the SPI-'+timestep+' begins on ', firstImage.format('YYYY-MM-dd'),'and ends on ', latestImage.format('YYYY-MM-dd'));


 
Map.addLayer(
  Final16DayCollection.limit(1, 'system:time_start', false).first(), 
  SPI16DayVis, 
  'SPI '+days+' days from '+ee.Date(Final16DayCollection.limit(1, 'system:time_start', false).first().get('system:time_start')).format('YYYY-MM-dd').getInfo());

Map.addLayer(SPI.limit(1, 'system:time_start', false), 
  SPImonthlyVis, 
  'SPI-'+timestep+' from '+ee.Date(SPI.limit(1, 'system:time_start', false).first().get('system:time_start')).format('YYYY-MM').getInfo())
  
  
//************************************************************************************************************* 
//Create a chart of SPIs over time
//Add labels to ROI feature collection. Labels will be used for the charts
var RoiWithLabels = roi.map(function(addLabels){
  var labelNames = addLabels
    .set('labelSpiMonth','SPI-'+timestep)
    .set('labelSpi16', 'SPI ('+days+' days)')
    .set('labelMonthlyPrecip', timestep+' Month(s) Precipitation Sum');
  return labelNames;
});

//Plot monthly precipitation chart
var ChartMonthlyPrecipitation = ui.Chart.image.seriesByRegion(
  summedChirpsCollection, 
  RoiWithLabels, 
  ee.Reducer.mean(),
  'precipitation', 
  resolution, //Scale in meter
  'system:time_start', 
  'labelMonthlyPrecip' //label
  ).setOptions({
    title: timestep+' Month(s) Precipitation Time Series (based on CHIRPS)',
    vAxis: {title: 'Precipitation in mm'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
    });
    
print(timestep+' month(s) precipitation chart based on mean values within AOI:',ChartMonthlyPrecipitation);

//Plot SPI Chart
var spiChart = ui.Chart.image.seriesByRegion(
  SPI, 
  RoiWithLabels, 
  ee.Reducer.mean(),
  'SPI', 
  resolution, //Scale in meter
  'system:time_start', 
  'labelSpiMonth' //label
  ).setOptions({
    title:  'SPI-'+timestep+' Time Series (based on CHIRPS)',
    vAxis: {title: 'SPI'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
    });
    
print('SPI-'+timestep+' chart based on mean values within AOI:',spiChart);

//Plot SPI-16-Day Chart
var spiChart16Days = ui.Chart.image.seriesByRegion(
  Final16DayCollection, //Image collection to be used
  RoiWithLabels, //Region that will be observed in Chart
  ee.Reducer.mean(), //Reducer type
  'SPI_16Days', //Band to be used
  resolution, //Scale in meter
  'system:time_start', 
  'labelSpi16' //label
  ).setOptions({
    title: 'SPI '+days+'-Day Time Series (based on CHIRPS)',
    vAxis: {title: 'SPI'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
});
print(days+'-days SPI chart based on mean values within AOI:',spiChart16Days);

//*************************************************************************************************
//Inspector Chart
// Create a panel to hold the chart.
if (showInteractiveChart === true){
  var inspectorPanel = ui.Panel({
    style:{
      width: '400px',
      position: 'bottom-right'
    }
  });
  Map.add(inspectorPanel);
  
  // Register a function to draw a chart when a user clicks on the map.
  Map.onClick(function(coords) {
  inspectorPanel.clear();
  var point = ee.FeatureCollection(ee.Geometry.Point(coords.lon, coords.lat)).map(function(addLabels){
    var labelNames = addLabels.set('labelSPI', 'SPI-'+timestep);
  return labelNames;
  });
  
    //Button to hide Panel once the chart is loaded
  var hideButton = ui.Button({
    label: 'X',
    onClick: function(){
      inspectorPanel.clear();
    },
    style:{
      color: 'red',
    }
  });
  inspectorPanel.add(hideButton);
  
    //Chart to display data history of clicked point
  var inspectorChart = ui.Chart.image.seriesByRegion(
  SPI, 
  point, 
  ee.Reducer.mean(),
  'SPI', 
  resolution, //Scale in meter
  'system:time_start', 
  'labelSPI' //label
  ).setOptions({
    title: 'SPI-'+timestep+' Time Series (based on CHIRPS)',
    vAxis: {title: 'SPI'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
    });
  inspectorChart.setOptions({title: 'SPI-'+timestep+' for requested pixel'});
  inspectorPanel.add(inspectorChart);
  });
}

//************************************************************************************************* 
//Create title
//Add Title
var title = ui.Label({
  value: 'Drought monitoring using the Standardized Precipitation Index (SPI)',
  style:{
  fontWeight: 'bold',
  fontSize: '18px'
  }});
title.style().set('position', 'top-center');
Map.add(title);

//************************************************************************************************* 
//Create legend

//Get Max and Min values from imports-section with one decimal 
var getMonthlyVisMax = Math.round(SPImonthlyVis.max*10)/10;
var getMonthlyVisMin = Math.round(SPImonthlyVis.min*10)/10;

var get16DayVisMax = Math.round(SPI16DayVis.max*10)/10;
var get16DayVisMin = Math.round(SPI16DayVis.min*10)/10;

var vizMonthly = {min: getMonthlyVisMin, max:getMonthlyVisMax, palette:SPImonthlyVis.palette};
var viz16Days = {min: get16DayVisMin, max:get16DayVisMax, palette:SPI16DayVis.palette};

//Add main panel which will contain smaller panels for each legend (SVI, EVI, Mean EVI)
    var mainPanel = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal'),
      style: {
        position: 'bottom-left',
        padding: '8px 15px'
      }
    });
//****************************************************
//Add new panel for monthly SPI legend within the main Panel
        var monthlySpiLegend = ui.Panel({
          style: {
             //position: 'bottom-left',
             padding: '0 0'
           }
        });
        mainPanel.add(monthlySpiLegend);
          
         //Create a checkbox which will enable a toggle function to show the SVI legend
        var monthlySpiCheckbox = ui.Checkbox('Show SPI-'+timestep+' Legend', false);
          //Provide information what happens if the checkbox is checked or unchecked
        monthlySpiCheckbox.onChange(function(checked) {
          if (checked) { //if it is checked, fill the SVI legend panel with information
              //Create first line of legend title
              var monthlySpiLegendTitle = ui.Label({
                value: 'SPI-'+timestep,
                style: {
                  fontWeight: 'bold',
                  fontSize: '18px',
                  margin: '0 auto',
                  padding: '0 auto'
                  }
              });
              
               // Add the title to the panel
              monthlySpiLegend.add(monthlySpiLegendTitle);
              
              // create the legend image
              var monthlySpiLon = ee.Image.pixelLonLat().select('latitude');
              var monthlySpiGradient = monthlySpiLon.multiply((vizMonthly.max-vizMonthly.min)/100.0).add(vizMonthly.min);
              var monthlySpiLegendImage = monthlySpiGradient.visualize(vizMonthly);
              
              // create text on top of legend
              var monthlySpiPanelMax = ui.Panel({
                  widgets: [
                    ui.Label(vizMonthly['max'])
                  ],
                  style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
                });
              
              monthlySpiLegend.add(monthlySpiPanelMax);
                
              // create thumbnail from the image
              var monthlySpiThumbnail = ui.Thumbnail({
                image: monthlySpiLegendImage, 
                params: {bbox:'0,0,10,100', dimensions:'10x150'},  
                style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
              });
              
              // add the thumbnail to the legend
              monthlySpiLegend.add(monthlySpiThumbnail);
              
              // create text on top of legend
              var monthlySpiPanelMin = ui.Panel({
                  widgets: [
                    ui.Label(vizMonthly['min'])
                  ],
                  style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
                  });
              
              monthlySpiLegend.add(monthlySpiPanelMin);
        
        
          } else {
            monthlySpiLegend.clear();
          }
        });
        print(monthlySpiCheckbox);

//****************************************************
//Add new panel for 16 Day SPI legend within the main Panel
        var Spi16Legend = ui.Panel({
          style: {
             //position: 'bottom-left',
             padding: '0 0'
           }
        });
        mainPanel.add(Spi16Legend);
         //Create a checkbox which will enable a toggle function to show the SVI legend
        var Spi16Checkbox = ui.Checkbox('Show '+days+'-Day SPI Legend', false);
          //Provide information what happens if the checkbox is checked or unchecked
        Spi16Checkbox.onChange(function(checked) {
          if (checked) { //if it is checked, fill the SVI legend panel with information
          //Create first line of legend title
            var Spi16LegendTitle = ui.Label({
              value: days+'-Day',
              style: {
                fontWeight: 'bold',
                fontSize: '18px',
                margin: '0 auto',
                padding: '0 auto'
                }
            });
            
             // Add the title to the panel
            Spi16Legend.add(Spi16LegendTitle);
              //Create second line of title
            var Spi16LegendTitle2 = ui.Label({
              value: 'SPI',
              style: {
                fontWeight: 'bold',
                fontSize: '18px',
                margin: '0 auto',
                padding: '0 auto'
                }
            });
            
             // Add the title to the panel
            Spi16Legend.add(Spi16LegendTitle2);
            
            // create the legend image
            var Spi16Lon = ee.Image.pixelLonLat().select('latitude');
            var Spi16Gradient = Spi16Lon.multiply((viz16Days.max-viz16Days.min)/100.0).add(viz16Days.min);
            var Spi16LegendImage = Spi16Gradient.visualize(viz16Days);
            
            // create text on top of legend
            var spi16PanelMax = ui.Panel({
                widgets: [
                  ui.Label(viz16Days['max'])
                ],
                style: {
                  padding: '0 auto',
                  margin: '0 auto',
                  position: 'bottom-center'
                }
              });
            
            Spi16Legend.add(spi16PanelMax);
              
            // create thumbnail from the image
            var spi16Thumbnail = ui.Thumbnail({
              image: Spi16LegendImage, 
              params: {bbox:'0,0,10,100', dimensions:'10x150'},  
              style: {
                  padding: '0 auto',
                  margin: '0 auto',
                  position: 'bottom-center'
                }
            });
            
            // add the thumbnail to the legend
              Spi16Legend.add(spi16Thumbnail);
            
            // create text on top of legend
            var spi16PanelMin = ui.Panel({
                widgets: [
                  ui.Label(viz16Days['min'])
                ],
                style: {
                  padding: '0 auto',
                  margin: '0 auto',
                  position: 'bottom-center'
                }
                });
            
            Spi16Legend.add(spi16PanelMin);
      
      
        } else {
          Spi16Legend.clear()
          }
        });
        print(Spi16Checkbox);


Map.add(mainPanel);

//************************************************************************************************* 
print('List of dates for SPI-'+timestep,sortedTimeList);
print('CHIRPS collection with SPI-'+timestep+':',SPI);
print('List of dates for '+days+'-day SPI',listDates);
print(days+'-Day SPI collection', Final16DayCollection);
//Add exports to tasks tab
//var batch = require('users/fitoprincipe/geetools:batch');

//if (exportdata===true){
//var ImageCollectionForExportMonthly = SPI.select(['SPI']).filterDate(startDateForDownload, endDateForDownload);
//print('Selected images for SPI-'+timestep+' export',ImageCollectionForExportMonthly);
//var ImageCollectionForExport16Day = Final16DayCollection.select(['SPI_16Days']).filterDate(startDateForDownload, endDateForDownload);
//print('Selected images for 16-day SPI export',ImageCollectionForExport16Day);

//batch.Download.ImageCollection.toDrive(ImageCollectionForExportMonthly, "SPI_ImageCollection",{
 // name: 'SPI-'+timestep+'_from_{system_date}',
 // scale: resolution,
 // region: AOI
//});

//batch.Download.ImageCollection.toDrive(ImageCollectionForExport16Day, "SPI_ImageCollection",{
 // name: 'SPI_'+days+'Days_{system_date}',
 // scale: resolution,
//  region: AOI
//});  
//}

//=====================================================================================================
//                                          DISCLAIMER
//Map disclaimer
//The designations employed and the presentation of the material on this map do not imply the expression 
//of any opinion whatsoever on the part of the Secretariat of the United Nations concerning the legal status 
//of any country, territory, city or area or of its authorities, or concerning the delimitation of its 
//frontiers or boundaries.
//Every effort is made to ensure this map is free of errors but there is no warrant the map or its 
//features are either spatially or temporally accurate or fit for a particular use. This map is provided 
//without any warranty of any kind whatsoever, either express or implied.


//When adjusting the visualisation parameters in the 'Layers' menu, the information within the legends
//will not change automatically. Import the new visualisation settings, delete the predefined  parameters
//from the 'Imports' section and rename your new parameters to the same name, that was used by 
//the default parameter.

//Precipitation is usually not normal distributed. Therefore, a gamma probability function is typically applied.
//Due to limitations within the GEE, this script does not apply a gamma function and assumes a normal distribution
//of the precipitation data. Hence, the resulting SPI values can just be used as an estimator.

