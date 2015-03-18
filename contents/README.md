# D3 Graphs

## Integration
Check index.html to view how graphs are integrated to html.
* Add the JS and style sheet files in the order they are in index.html
* Use div elements to create graphs.
* The class of div element is used to detect graph type. Classes are - bubblecloud/streamgraph/bargraph/sungraph
* Use data-*** attributes to provide configurable values.
* Set data-url attribute and width and height style for all divs. Ths will be the picked up by graph plugin.
* Bubble cloud and bar graph are more configurable.
   
## Bar Graph Config
Bar graph is a generic graph, provide as many fields and matching number of colours and that many bars will be created.
Configuration values are -
* data-field : Field names separated by comma, a bar is created for each field name
* data-color : Colours that will represent the above fields
* data-refreshtime : number of seconds after which to load new list of bars
* data-barheight : bar height in pixels
* data-maxbars : maximum number of bars to show at a time, extra bars will be removed.
* data-fakerotate : Keep rotating bars, removes first bar from top and adds it back at random interval
* data-tooltipfields: Key of fields that will appear in mouseover tooltip 

## Bar Graph Generic Config
Bar graph is a generic graph, provide as many fields and matching number of colours and that many bars will be created.
Configuration values are -
* data-idfield : key of the field that will be used as identifying field, change in data of a row reflects in the bar
* data-field : Field names separated by comma, a bar is created for each field name
* data-color : Colours that will represent the above fields
* data-refreshtime : number of seconds after which to load new list of bars and update data
* data-barheight : bar height in pixels
* data-maxbars : maximum number of bars to show at a time, extra bars will be removed.
* data-fakerotate : Keep rotating bars, removes first bar from top and adds it back at random interval
* data-tooltipfields: Key of fields that will appear in mouseover tooltip 

## Bubble Graph Config
Bubble graph is a generic graph, provide rows of title and value fields and matching number of bubbles will be created.
Configuration values are -
* data-titlefield : Column name that will become the title.
* data-valuefield : Column name that will become the value.
* data-rmin : Radius of smallest bubble
* data-rmax : Radius of largest bubble
