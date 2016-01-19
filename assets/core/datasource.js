var dataSourceTemp = [
	{ id: "ds001", connectionName: "Connection 1", driver: "MongoDB", host: "192.168.0.200:27123", username: "root", settings: "" },
	{ id: "ds002", connectionName: "Connection 2", driver: "MongoDB", host: "cloud.eaciit.com", username: "root", settings: "" },
	{ id: "ds003", connectionName: "Connection 3", driver: "MySQL", host: "127.0.0.1", username: "root", settings: "" },
];

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
ds.config = ko.mapping.fromJS(ds.templateConfig);
ds.dataSourcesData = ko.observableArray(dataSourceTemp);
ds.dataSourcesColumns = ko.observableArray([
	{ field: "id", title: "ID", width: 70 },
	{ field: "connectionName", title: "Connection Name" },
	{ field: "driver", title: "Driver", width: 90 },
	{ field: "host", title: "Host" },
	{ field: "username", title: "User Name", width: 90 },
	// { field: "settings", title: "Settings" },
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
ds.openDataSourceForm = function () {
	ds.mode('edit');
	ko.mapping.fromJS(ds.templateConfig, ds.config);
};
ds.backToFrontPage = function () {
	ds.mode('');
};
ds.saveNewDataSource = function () {
	alert("not yet implemented");
};
ds.editDataSource = function (id) {
	alert("not yet implemented");
};
ds.removeDataSource = function (id) {
	alert("not yet implemented");
};




// - Connection List
//     - Driver (Weblink, MongoDb, SQLServer, MySQL, Oracle, ERP) 
//     - Host
//     - UserName
//     - Password
//     - Settings - map[string]interface{}
