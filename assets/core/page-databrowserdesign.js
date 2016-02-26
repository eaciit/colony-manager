app.section('databrowserdesign');

viewModel.databrowserdesign = {}; var db = viewModel.databrowserdesign;

db.templateConfigProperties= {
    field : "",
    label : "",
    format : "",
    align : "",
    showindex : 0,
    sortable : false,
    simplefilter : false,
    advancefilter : false,
    aggregate : ""
}

db.templateConfig= {
    _id : "",
    browsername : "",
    iddetails : "",
    description : "",
    connection : "",
    database : "",
    tablename : "",
    querytype : "",
    querytext : "",
    properties : []
}

var dummyobj1 = new Object()
dummyobj1.Field = "id"
dummyobj1.label = "ID"
dummyobj1.format = ""
dummyobj1.align = 1
dummyobj1.showindex = 1
dummyobj1.sortable = true
dummyobj1.simplefilter = true
dummyobj1.advfilter = true
dummyobj1.aggregate =  ""

var dummyobj2 = new Object()
dummyobj2.Field = "name"
dummyobj2.label = "Name"
dummyobj2.format = ""
dummyobj2.align = 2
dummyobj2.showindex = 2
dummyobj2.sortable = true
dummyobj2.simplefilter = true
dummyobj2.advfilter = true
dummyobj2.aggregate =  ""

var dummyobj3 = new Object()
dummyobj3.Field = "DateOfBorn"
dummyobj3.label = "Birth Date"
dummyobj3.format = "dd-MMM-yyy"
dummyobj3.align = 1
dummyobj3.showindex = 3
dummyobj3.sortable = true
dummyobj3.simplefilter = false
dummyobj3.advfilter = true
dummyobj3.aggregate =  ""

var dummyobj4 = new Object()
dummyobj4.Field = "Salary"
dummyobj4.label = "Salary"
dummyobj4.format = "N0"
dummyobj4.align = 3
dummyobj4.showindex = 4
dummyobj4.sortable = true
dummyobj4.simplefilter = false
dummyobj4.advfilter = true
dummyobj4.aggregate =  "Sum"


var dummyData = new Array();
dummyData.push(dummyobj1, dummyobj2, dummyobj3, dummyobj4)

db.alignList = ko.observableArray([
    { alignId: 1, name: "Left" },
    { alignId: 2, name: "Center" },
    { alignId: 3, name: "Right" }
]);
db.queryType = ko.observableArray([
	{ value: "SQL", text: "SQL" },
	{ value: "Dbox", text: "Dbox" }
]);
db.connectionList = ko.observableArray([]);
db.tableList = ko.observableArray([]);
db.databrowserData = ko.observableArray([]);
db.databrowserColumns = ko.observableArray([
	{ field: "Field", title: "Field", editable: false },
	{ field: "label", title: "label"},
	{ field: "format", title: "Format"},
	{ title: "Align", field: "align", template: "#= db.alignOption(align) #",
		editor: function(container, options) {
            var input = $('<input id="alignId" name="alignId" data-bind="value:' + options.field + '">');
            input.appendTo(container);
            input.kendoDropDownList({
                dataTextField: "name",
                dataValueField: "alignId",
                //cascadeFrom: "brandId", // cascade from the brands dropdownlist
                dataSource: db.alignList() // bind it to the models array
            }).appendTo(container);
        }
    },
	{ field: "showindex", title: "Show Index"},
	{ title: "Sortable", template: "<input type='checkbox' #= sortable ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Simple Filter", template: "<input type='checkbox' #= simplefilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Advance Filter", template: "<input type='checkbox' #= advfilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ field: "aggregate", title: "Aggregate"},
]);


db.alignOption = function (opt) {
	for (var i = 0; i < db.alignList().length; i++) {
        if (db.alignList()[i].alignId == opt) {
            return db.alignList()[i].name;
        }
    }
}

db.addProperties = function () {
    var property = $.extend(true, {}, ds.templateConfigSetting);    
    db.config.Properties.push(property);
};

db.databrowserData(dummyData);

// dummy connection list
var dummyConn = new Object()
dummyConn._id = "connect_mongo"
var dataConn = new Array();
dataConn.push(dummyConn)
db.connectionList(dataConn);

// dummy table list
var dummyTable = new Object()
dummyTable._id = "mongo-students"
var dataTable = new Array();
dataTable.push(dummyTable)
db.tableList(dataTable);