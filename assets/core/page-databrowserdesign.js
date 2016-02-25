app.section('databrowserdesign');

viewModel.databrowserdesign = {}; var db = viewModel.databrowserdesign;

var dummyobj1 = new Object()
dummyobj1.field = "id"
dummyobj1.label = "ID"
dummyobj1.format = ""
dummyobj1.align = "left"
dummyobj1.showindex = 1
dummyobj1.sortable = true
dummyobj1.simplefilter = true
dummyobj1.advfilter = true
dummyobj1.aggregate =  ""

var dummyobj2 = new Object()
dummyobj2.field = "name"
dummyobj2.label = "Name"
dummyobj2.format = ""
dummyobj2.align = "left"
dummyobj2.showindex = 2
dummyobj2.sortable = true
dummyobj2.simplefilter = true
dummyobj2.advfilter = true
dummyobj2.aggregate =  ""

var dummyobj3 = new Object()
dummyobj3.field = "DateOfBorn"
dummyobj3.label = "Birth Date"
dummyobj3.format = "dd-MMM-yyy"
dummyobj3.align = "left"
dummyobj3.showindex = 3
dummyobj3.sortable = true
dummyobj3.simplefilter = false
dummyobj3.advfilter = true
dummyobj3.aggregate =  ""

var dummyobj4 = new Object()
dummyobj4.field = "Salary"
dummyobj4.label = "Salary"
dummyobj4.format = "N0"
dummyobj4.align = "right"
dummyobj4.showindex = 4
dummyobj4.sortable = true
dummyobj4.simplefilter = false
dummyobj4.advfilter = true
dummyobj4.aggregate =  "Sum"


var dummyData = new Array();
dummyData.push(dummyobj1, dummyobj2, dummyobj3, dummyobj4)
// console.log(data)

db.queryType = ko.observableArray([
	{ value: "SQL", text: "SQL" },
	{ value: "Dbox", text: "Dbox" }
]);
db.databrowserData = ko.observableArray([]);
db.databrowserColumns = ko.observableArray([
	{ field: "field", title: "Field" },
	{ field: "label", title: "label"},
	{ field: "format", title: "Format"},
	{ field: "align", title: "Align"},
	{ field: "showindex", title: "Show Index"},
	// { field: "sortable", title: "Sortable"},
	// { field: "simplefilter", title: ""},
	// { field: "advfilter", title: ""},
	
	{ title: "Sortable", template: "<input type='checkbox' #= sortable ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Simple Filter", template: "<input type='checkbox' #= simplefilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Advance Filter", template: "<input type='checkbox' #= advfilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ field: "aggregate", title: "Aggregate"},
]);


db.databrowserData(dummyData);