var connectionListTemp = [
	{ id: "ds001", connectionName: "Connection 1", driver: "MongoDB", host: "192.168.0.200:27123", username: "root", settings: "" },
	{ id: "ds002", connectionName: "Connection 2", driver: "MongoDB", host: "cloud.eaciit.com", username: "root", settings: "" },
	{ id: "ds003", connectionName: "Connection 3", driver: "MySQL", host: "127.0.0.1", username: "root", settings: "" },
], dataSourceTemp = [];

viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray(["Weblink", "MongoDb", "SQLServer", "MySQL", "Oracle", "ERP"]);
ds.section = ko.observable('connection-list');
ds.mode = ko.observable('');
ds.templateConfig = { 
	id: "",
	connectionName: "",
	driver: "",
	host: "",
	username: "",
	password: "",
	settings: ""
};
ds.templateDataSource = {
	id: "",
	connection : "",
	query : "",
	metadata: [],
}
ds.templateField = {
	id: "",
	label: "",
	type: "",
	format: "",
	lookup : {},
}
ds.templateLookup = {
	dataSourceID : "",
	idField: "",
	displayField: "",
	lookupFields: [],
}

ds.config = ko.mapping.fromJS(ds.templateConfig);
ds.confDataSource = ko.mapping.fromJS(ds.templateDataSource);
ds.field = ko.mapping.fromJS(ds.templateField);
ds.lookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray(connectionListTemp);
ds.dataSourcesData = ko.observableArray(dataSourceTemp);
ds.connectionListColumns = ko.observableArray([
	{ field: "id", title: "ID", width: 70 },
	{ field: "connectionName", title: "Connection Name" },
	{ field: "driver", title: "Driver", width: 90 },
	{ field: "host", title: "Host" },
	{ field: "username", title: "User Name", width: 90 },
	// { field: "settings", title: "Settings" },
	{ title: "", width: 150, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-xs btn-primary' onclick='ds.editConnection(\"" + d.id + "\")'><span class='glyphicon glyphicon-edit'></span> Edit</button> <button class='btn btn-xs btn-danger' onclick='ds.removeConnection(\"" + d.id + "\")'><span class='glyphicon glyphicon-remove'></span> Remove</button>"
	} },
]);
ds.dataSourceColumns = ko.observableArray([
	{field:"connection", title:"ID Connection"},
	{field:"query", title:"Query"},
	{field:"metadata.label", title:"Field"},
	{ title: "", width: 150, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-xs btn-primary' onclick='ds.editDataSource(\"" + d.id + "\")'><span class='glyphicon glyphicon-edit'></span> Edit</button> <button class='btn btn-xs btn-danger' onclick='ds.removeDataSource(\"" + d.id + "\")'><span class='glyphicon glyphicon-remove'></span> Remove</button>"
	} },
]);
ds.changeActiveSection = function (section) {
	return function (self, e) {
		$(e.currentTarget).parent().siblings().removeClass("active");
		ds.section(section);
		ds.mode('');
	};
};
ds.openConnectionForm = function () {
	ds.mode('edit');
	ko.mapping.fromJS(ds.templateConfig, ds.config);
};
ds.backToFrontPage = function () {
	ds.mode('');
};
ds.saveNewConnection = function () {
	alert("not yet implemented");
};
ds.editConnection = function (id) {
	alert("not yet implemented");
};
ds.removeConnection = function (id) {
	alert("not yet implemented");
};
ds.removeDataSource = function(id){
	alert("not yet implemented");
}
ds.editDataSource = function(id){
	alert("not yet implemented");
}
ds.saveNewDataSource = function(){
	alert("not yet implemented");
}
ds.openDataSourceForm = function(){
	ds.mode('editDataSource');
	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateField, ds.field);
	ko.mapping.fromJS(ds.templateLookup, ds.lookup);
}

// - Connection List
//     - Driver (Weblink, MongoDb, SQLServer, MySQL, Oracle, ERP) 
//     - Host
//     - UserName
//     - Password
//     - Settings - map[string]interface{}
