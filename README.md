# Hillary Events Map
This project displays Hillary events on a Google Map. This is based on the [Fusion Table Searchable Map Template].
(http://derekeder.github.io/FusionTable-Map-Template/)

We are not currently using fusion tables though. 
  
## Dependencies

* [Google Maps API V3](https://developers.google.com/maps/documentation/javascript)
* [jQuery](http://jquery.org)
* [jQuery Address](https://github.com/asual/jquery-address)
* [Bootstrap 3.2.0](http://getbootstrap.com/)

## MapsLib options

You can configure your map by passing in a dictionary of options when you create a new `MapsLib` instance in `index.html` or `index_iframe.html`. Here's an example:

```javascript
var myMap = new MapsLib({
  googleApiKey:       "The google API key",
  locationColumn:     "geometry",
  map_center:         [41.8781136, -87.66677856445312],
  locationScope:      "chicago"
});
```

## Custom Filters and Views

Take a look at the [wiki](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples) to see how to add your own custom filters and views like:

* [Checkboxes](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-checkboxes)
* [Radio buttons](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-radiobuttons)
* [Drop down lists](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#drop-down-lists)
* [Text searches](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-textsearches)
* [Results lists](https://github.com/derekeder/FusionTable-Map-Template/wiki/List-search-results)
* [Text searches](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-textsearches)
* [Sliders](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-sliders)
* [Date sliders](https://github.com/derekeder/FusionTable-Map-Template/wiki/Filter-examples#wiki-date-sliders)

Reference Guides

* [Google Maps API](http://code.google.com/apis/maps/documentation/javascript/overlays.html#FusionTables)

## Common issues/troubleshooting

If your map isn't displaying any data, try the following:

1. Use the [Chrome developer console](https://developers.google.com/chrome-developer-tools/docs/console) or install [Firebug](http://getfirebug.com/) for FireFox. This will allow you to debug your javascript.
1. Load your map in the browser and open the javascript console 
   * Chrome developer console on a Mac: Option+Command+J
   * Chrome developer console on a PC: Control+Shift+J
   * Firebug in Firefox: Tools => Web Developer => Firebug => Open Firebug) 
1. If you aren't seeing any javascript errors:
   * Make sure that you have at least one column with address or lat/long points set to type 'Location'. You can check this in Fusion Tables under Edit => Modify Columns.
   * Make sure that Fusion Tables has geocoded your column. You check this by going to View => Map. If you see your points on the map, you're good!
   * Check that your Fusion Table is public (in Fusion Tables, upper right corner => Share button)
1. If you do see javascript errors:
   * The error will tell you what line it is failing on. Best to start by going there!
   * Columns in Fusion Tables are case sensitive, so make sure they are correct.
   * For columns that have multiple words in the title, make sure to surround the column name in your code with single quotes (example: "'first name'") 

#### My custom map styles won't display! 

This is due to a recent change to the FusionTablesLayer and only effects tables created after mid-November 2012. A __styleId__ and __templateId__ must be defined.

When you create custom styles for the first time, the styleId will be 2. For custom info window layouts, the first templateId will also be 2. The __latest version of this template has these defaults set__, but in case you want to add it to an existing project, use the following code:

```javascript
   MapsLib.searchrecords = new google.maps.FusionTablesLayer({
     query: {
       from:   MapsLib.fusionTableId,
       select: MapsLib.locationColumn,
       where:  whereClause
     },
     styleId: 2,
     templateId: 2
   });
```

For reference, styleId 1 is the default look - usually small red dots or red polygons. templateId 1 is the default info window that just shows the first few columns in your table.

For more information, see [Working with styles](https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles) and [Working with templates](https://developers.google.com/fusiontables/docs/v1/using#WorkingInfoWindows) in the Fusion Tables documentation.

#### My map works, but the results count returns 0

The results counter uses the Fusion Tables API, which requires an API key and some specific sharing permissions. Try the following in this order:

1. Make sure you set fusionTableId to a valid API key. It should look something like `AIzaSyA3FQFrNr5W2OEVmuENqhb2MBB2JabdaOY`. To get a new one, go to the [Google API Console](https://code.google.com/apis/console/)

#### Still can't figure it out or more detail needed?
Contact seeyew@gmail.com

## Bug fixes and pull requests

1. Fork the project.
1. Make your feature addition or bug fix.
1. Commit and send me a pull request.

## Copyright and attribution

Copyright (c) 2015 Derek Eder. Released under the MIT License.

If you use this template, please provide the following attribution in the footer: 

```html
<a href='http://derekeder.com/searchable_map_template/'>Searchable Map Template</a> 
by <a href='http://derekeder.com'>Derek Eder</a>.
```

See [LICENSE](https://github.com/derekeder/FusionTable-Map-Template/blob/master/LICENSE) for more details.
