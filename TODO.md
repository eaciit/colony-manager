# TODO

This is what we do!

## Unresolved issues until 02 Mar 2015

- [ ] [**Connection**] prepare defaults settings for each driver (cannot be deleted)
- [ ] [**Connection**] prepare at least 5 sample connection
- [ ] [**Data Source**] add timeout when run the query
- [ ] [**Data Source**] show sub data which type is object as tree view
- [ ] [**Data Source**] prepare at least 5 sample data source
- [ ] [**Data Serializer**] complete the add wizard
- [ ] [**Data Serializer**] on wizard, auto create datasource based on the selected connections & tables
- [ ] [**Data Serializer**] on wizard, add input prefix, used as prefix of generated ID 
- [ ] [**Data Serializer**] on wizard, add button to execute all of the transofrmation
- [ ] [**Data Serializer**] remove the blink whenever check stat
- [ ] [**Data Serializer**] on map, change destination field selection as text box with suggestion
- [ ] [**Data Serializer**] improve the log
- [ ] [**Data Serializer**] prepare example to serialize data from mongo to json
- [ ] [**Web Grabber**] make the edit work
- [ ] [**Web Grabber**] grab for excel?
- [ ] [**Web Grabber**] remove the blink whenever check stat
- [ ] [**Web Grabber**] prepare user interface for scheduler
- [ ] [**Data Browser**] use query builder on data source on the dbox query part
- [ ] [**Data Browser**] implements the format, text alignment, and etc
- [ ] [**Data Browser**] add new options to hide/show the field
- [ ] [**Data Browser**] implements aggregate
- [ ] [**Data Browser**] complete the filter
- [ ] [**Data Browser**] make the grid scrollable if the total columns is much enough
- [ ] [**Data Browser**] icon up/down to change position. move the column to side
- [ ] [**Data Browser**] delete feature on data browser
- [ ] [**Data Browser**] prepare example to show serialized data from example on data source, from both mongo and json
- [ ] [**Application**] show error when path is invalid
- [ ] [**Application**] add command and variable (both key-valued-pair), later this will be used to control the application
- [ ] [**Application**] prepare sample app to test accessing data from example on data source
- [ ] [**Application**] can upload app in zip/gz/tar.gz/tar
- [ ] [**Server**] connect to hadoop server
- [ ] [**Server**] fix bug on add wizard add IP
- [ ] [**File Browser**] completing the things
- [ ] [**Other**] sedotan could be placed on server
- [ ] [**Other**] decouple the query builder on data source, so it can be used on data browser
- [ ] [**Other**] create stable branch every week
- [ ] [**Other**] move sedotand, sedotans, sedotanw on `$EC_APP_ROOT/cli`

### Resolved issues

- [x] [**Connection**] show all the drivers (add mark for untested drivers)
- [x] [**Data Source**] on query result tab, on field which type is object, make it clickable, and it'll show a modal contains the detail data of the field
- [x] [**Application**] query wizard needs to support pattern
- [x] [**Application**] sample to deploy web-based-application to server until the app itself running
- [x] [**Application**] add log on app deployment
- [x] [**Server**] add new type of server
- [x] [**Server**] add log on server creation
- [x] [**Data Serializer**] rename the menu to "Data Serializer"
- [x] [**Data Serializer**] if there is "pre transfer command", use it to process the mapped data, fetch the result (if exists) then save it to database (done already, but need to check again)
- [x] [**Web Grabber**] sync the UI and the decoupled sedotan
- [x] [**Web Grabber**] prepare some control to start/stop sedotan
- [x] [**Data Browser**] prepare the designer and view
- [x] [**Data Browser**] show real data
- [x] [**Colony JS - eclookup**] fix the click mechanism
