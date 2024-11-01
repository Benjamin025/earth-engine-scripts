///////////////////////////////////////////////////////////////
//                    1) Import Layers of Interest           //
///////////////////////////////////////////////////////////////







//Mosaic the Simard data to an Image so we can clip it later
var hba = simard.mosaic()



///////////////////////////////////////////////////////////////
//      2) Begin setting up map appearance and app layers   //
///////////////////////////////////////////////////////////////


//2.1) Set up general display

//Set up a satellite background
Map.setOptions('Satellite')

//Center the map to Guyana
Map.centerObject(Guyana,9)

//Change style of cursor to 'crosshair'
Map.style().set('cursor', 'crosshair');


//2.2) We want to set up a Viridis color pallete to display the Simard data
var viridis = {min: 0 , max : 25,palette : ['#481567FF','#482677FF','#453781FF','#404788FF','#39568CFF',
                                              '#33638DFF','#2D708EFF','#287D8EFF','#238A8DFF','#1F968BFF',
                                              '#20A387FF','#29AF7FFF','#3CBB75FF','#55C667FF',
                                              '#73D055FF','#95D840FF','#B8DE29FF','#DCE319FF','#FDE725FF' 
]};


//2.3) Create variables for GUI layers for each layer

//We set each layer to "false" so the user can turn them on later
var simHBA = ui.Map.Layer(hba,viridis,'Simard Canopy Hba',false)
var ext2000 = ui.Map.Layer(extent2000, {palette:['6D63EB'], min:1, max:1}, 'Extent 2000',false)
var ext2010 = ui.Map.Layer(extent2010, {palette:['34BFDE'], min:1, max:1}, 'Extent 2010',false)
var ext2020 = ui.Map.Layer(extent2020, {palette:['71F4B7'], min:1, max:1}, 'Extent 2020',false)

//Add these layers to our map. They will be added but not displayed
Map.add(ext2000)
Map.add(ext2010)
Map.add(ext2020)
Map.add(simHBA)





///////////////////////////////////////////////////////////////
//      3) Set up panels and widgets for display             //
///////////////////////////////////////////////////////////////

//3.1) Set up title and summary widgets

//App title
var header = ui.Label('Guyana Mangrove Height, Extent, and Loss Explorer', {fontSize: '25px', fontWeight: 'bold', color: '4A997E'});

//App summary
var text = ui.Label(
  'This tool maps mangrove extent in the Guyana in 2000, 2010, and 2020 using a Random Forest Classification derived from Landsat imagery. ' +
  'Use the tools below to explore changes in mangrove extent, mangrove canopy height in 2000, and drivers of mangrove loss.',
    {fontSize: '15px'});


//3.2) Create a panel to hold text
var panel = ui.Panel({
  widgets:[header, text],//Adds header and text
  style:{width: '300px',position:'middle-right'}});
  
//3.3) Create variable for additional text and separators

//This creates another panel to house a line separator and instructions for the user
var intro = ui.Panel([
  ui.Label({
    value: '____________________________________________',
    style: {fontWeight: 'bold',  color: '4A997E'},
  }),
  ui.Label({
    value:'Select layers to display.',
    style: {fontSize: '15px', fontWeight: 'bold'}
  })]);

//Add this new panel to the larger panel we created 
panel.add(intro)

//3.4) Add our main panel to the root of our GUI
ui.root.insert(1,panel)






///////////////////////////////////////////////////////////////
//         4) Add checkbox widgets and legends               //
///////////////////////////////////////////////////////////////

//4.1) Create a new label for this series of checkboxes

var extLabel = ui.Label({value:'Mangrove Extent',
style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 5px'}
});

//4.2) Add checkboxes to our display

//Create checkboxes that will allow the user to view the extent map for different years
//Creating the checkbox will not do anything yet, we add functionality further 
// in the code

var extCheck = ui.Checkbox('2000').setValue(false); //false = unchecked

var extCheck2 = ui.Checkbox('2010').setValue(false);

var extCheck3 = ui.Checkbox('2020').setValue(false);

//Now do the same for the Simard Height map

var heightLab = ui.Label({value:'Mangrove Height (Simard et al. 2019)',
style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 5px'}
});

var heightCheck = ui.Checkbox('2000').setValue(false);

//4.3) Create legends

//The following code creates legends we can add to the panel

//Extent Legend
///////////////

// Set position of panel
var extentLegend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// The following creates and styles 1 row of the legend.
var makeRowa = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
 
      // Create a label with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // Return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

//Create a palette using the same colors we used for each extent layer
var paletteMAPa = [
'6D63EB',//2000
'34BFDE',//2010
'71F4B7',//2020
];

// Name of each legend value
var namesa = ['2000','2010','2020']; 
           
 
// Add color and names to legend
for (var i = 0; i < 3; i++) {
  extentLegend.add(makeRowa(paletteMAPa[i], namesa[i]));
  }  


//Height Legend
///////////////

// This uses function to construct a legend for the given single-band vis
// parameters.  Requires that the vis parameters specify 'min' and 
// 'max' but not 'bands'.
function makeLegend2 (viridis) {
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((viridis.max-viridis.min)/100.0).add(viridis.min);
  var legendImage = gradient.visualize(viridis);
  
  var thumb = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,100,8', dimensions:'256x20'},  
    style: {position: 'bottom-center'}
  });
  var panel2 = ui.Panel({
    widgets: [
      ui.Label('5 m'), 
      ui.Label({style: {stretch: 'horizontal'}}), 
      ui.Label('45 m')
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal', maxWidth: '270px', padding: '0px 0px 0px 8px'}
  });
  return ui.Panel().add(panel2).add(thumb);
}

//4.4) Add these new widgets to the panel in the order you want them to appear
panel.add(extLabel)
      .add(extCheck)
      .add(extCheck2)
      .add(extCheck3)
      .add(extentLegend)
      .add(heightLab)
      .add(makeLegend2(viridis))
      .add(heightCheck)
      
      
      
      
      
      
      
///////////////////////////////////////////////////////////////
//          5) Add functionality to widgets                  //
///////////////////////////////////////////////////////////////

//For each checkbox we create function so that clicking the checkbox
//Turns on layers of interest

//Extent 2000
var doCheckbox = function() {
  
  extCheck.onChange(function(checked){
  ext2000.setShown(checked)
  })
}
doCheckbox();

//Extent 2010
var doCheckbox2 = function() {
  
  extCheck2.onChange(function(checked){
  ext2010.setShown(checked)
  })
  

}
doCheckbox2();

//Extent 2020
var doCheckbox3 = function() {
  
  extCheck3.onChange(function(checked){
  ext2020.setShown(checked)
  })
  

}
doCheckbox3();

//Simard Height Data
var doCheckbox4 = function() {
  
  heightCheck.onChange(function(checked){
  simHBA.setShown(checked)

  })
  

}
doCheckbox4();


////////////////////////////////////////////////////////
//       6) Add a clicking feature to get tree Height //
////////////////////////////////////////////////////////

// Create an inspector panel with a horizontal layout.
var inspector = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal')
});

// Add a label to the panel.
inspector.add(ui.Label('Click to get HBA'));

// Add the panel to the default map.
Map.add(inspector);

//Create a function to be invoked when the map is clicked
Map.onClick(function(coords){
  
// Clear the panel and show a loading message.
inspector.clear();
inspector.style().set('shown', true);
inspector.add(ui.Label('Loading...', {color: 'gray'}));
  
//Computer the HBA value
var point = ee.Geometry.Point(coords.lon, coords.lat);
var reduce = hba.reduce(ee.Reducer.first());
var sampledPoint = reduce.reduceRegion(ee.Reducer.first(), point, 30);
var computedValue = sampledPoint.get('first');  

// Request the value from the server and use the results in a function.
computedValue.evaluate(function(result) {
inspector.clear();

// Add a label with the results from the server.
inspector.add(ui.Label({
      value: 'HBA: ' + result.toFixed(2),
      style: {stretch: 'vertical'}
    }));

// Add a button to hide the Panel.
    inspector.add(ui.Button({
      label: 'Close',
      onClick: function() {
        inspector.style().set('shown', false);
      }
    }));
  });
});


////////////////////////////////////////////////////////
//  7) Constuct graphs to measure extent for each year //
////////////////////////////////////////////////////////

//2000
//Calculate area in Hectares
var get2000 = extent2000.multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
      reducer:ee.Reducer.sum(),
      geometry:Guyana,
      scale: 1000,
      maxPixels:1e13,
      tileScale: 16
      }).get('classification');
      

//Get area for the Guyana region
var feature = ee.Feature(Guyana)
var feature2000 = feature.set('2000', ee.Number(get2000))



//Construct Bar Chart

var chart2000 = ui.Chart.feature.byProperty(feature2000, ['2000'], ['Total'])

//Set up title and labels for chart
chart2000.setOptions({
  title: 'Total Mangrove Area',
  vAxis: {title: 'Area in Hectares'},
  legend: {position: 'none'},
  hAxis: {
    title: 'Year',
    logScale: false
  }
});

//2010
//Calculate area in Hectares
var get2010 = extent2010.multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
      reducer:ee.Reducer.sum(),
      geometry:Guyana,
      scale: 1000,
      maxPixels:1e13,
      tileScale: 16
      }).get('classification');
      

//Get area for the Guyana region
var feature2010 = feature.set('2010', ee.Number(get2010))



//Construct Bar Chart

var chart2010 = ui.Chart.feature.byProperty(feature2010, ['2010'], ['Total'])

//Set up title and labels for chart
chart2010.setOptions({
  title: 'Total Mangrove Area',
  vAxis: {title: 'Area in Hectares'},
  legend: {position: 'none'},
  hAxis: {
    title: 'Year',
    logScale: false
  }
});

//2020
//Calculate area in Hectares
var get2020 = extent2020.multiply(ee.Image.pixelArea()).divide(10000).reduceRegion({
      reducer:ee.Reducer.sum(),
      geometry:Guyana,
      scale: 1000,
      maxPixels:1e13,
      tileScale: 16
      }).get('classification');
      

//Get area for the Guyana region
var feature2020 = feature.set('2020', ee.Number(get2020))



//Construct Bar Chart

var chart2020 = ui.Chart.feature.byProperty(feature2020, ['2020'], ['Total'])

//Set up title and labels for chart
chart2020.setOptions({
  title: 'Total Mangrove Area',
  vAxis: {title: 'Area in Hectares'},
  legend: {position: 'none'},
  hAxis: {
    title: 'Year',
    logScale: false
  }
});


////////////////////////////////////////////////////////
//  8) Create a dropdown menu to display graph results //
////////////////////////////////////////////////////////

//Add a panel to hold graphs within main panel
var panelGraph = ui.Panel({
  style:{width: '300px',position:'middle-right'}
})



//Create key of items for dropdown
var y2000 = '2000'
var y2010 = '2010'
var y2020 = '2020'

//Construct Dropdown
var graphSelect = ui.Select({
  items:[y2000,y2010,y2020],
  placeholder:'Choose year',
  onChange: selectLayer,
  style: {position:'top-right'}
})

var constraints = []

//Write a function that runs on change of Dropdown
function selectLayer(){
  
  var graph = graphSelect.getValue() // get value from dropdown selection
  panelGraph.clear() //clear graph panel between selections so only one graph displays
  
  //We use "if else" statements to write instructions for drawing graphs
  if (graph == y2000){
    panelGraph.add(chart2000)
    
  }
  else if (graph == y2010){
    panelGraph.add(chart2010)

  }
  
  else if (graph == y2020){
    panelGraph.add(chart2020)
  }
  

  for (var i = 0; i < constraints.length; ++i) {
    var constraint = select[i];
    var mode = constraint.mode.getValue();
    var value = parseFloat(constraint.value.getValue());
    if (mode == GREATER_THAN) {
      image = image.updateMask(constraint.image.gt(value));
    } else {
      image = image.updateMask(constraint.image.lt(value));
    }
}
}

//Create a new label

var graphLabel = ui.Label({value:'Select year to display mangrove extent',
style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 5px'}
});


//Add selecter and graph panel to main panel
panel.add(graphLabel)
      .add(graphSelect)
      .add(panelGraph)
      
  

