viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray(["Weblink", "MongoDb", "SQLServer", "MySQL", "Oracle", "ERP"]);
ds.section = ko.observable('connection-list');
ds.mode = ko.observable('');
ds.templateConfig = { 
	id: "",
	name: "",
	driver: "",
	host: "",
	username: "",
	password: "",
	settings: ""
};
ds.templateDataSource = {
	id: "",
	connectionId: "",
	name: "",
	query : "",
	metadata: [],
},
ds.templateQuery = {
	select: "",
	from: "",
	where: "",
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
ds.query = ko.mapping.fromJS(ds.templateQuery);
ds.field = ko.mapping.fromJS(ds.templateField);
ds.lookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray([]);
ds.dataSourcesData = ko.observableArray([]);
ds.connectionListColumns = ko.observableArray([
	{ field: "id", title: "ID", width: 110 },
	{ field: "name", title: "Connection Name" },
	{ field: "driver", title: "Driver", width: 90 },
	{ field: "host", title: "Host" },
	{ field: "username", title: "User Name" },
	// { field: "settings", title: "Settings" },
	{ title: "", width: 150, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-xs btn-primary' onclick='ds.editConnection(\"" + d.id + "\")'><span class='glyphicon glyphicon-edit'></span> Edit</button> <button class='btn btn-xs btn-danger' onclick='ds.removeConnection(\"" + d.id + "\")'><span class='glyphicon glyphicon-remove'></span> Remove</button>"
	} },
]);
ds.dataSourceColumns = ko.observableArray([
	{field:"connectionId", title:"ID Connection"},
	{field:"name", title:"Name"},
	{field:"query", title:"Query"},
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
	ds.populateGridConnections();
};
ds.populateGridConnections = function () {
	var param = ko.mapping.toJS(ds.config);
	app.ajaxPost("/datasource/getconnections", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.connectionListData(res.data);
	});
};
ds.saveNewConnection = function () {
	if (!app.isFormValid("#form-add-connection")) {
		return;
	}
	
	var param = ko.mapping.toJS(ds.config);
	app.ajaxPost("/datasource/saveconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
};
ds.editConnection = function (id) {
	app.ajaxPost("/datasource/selectconnection", { id: id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("edit");
		ko.mapping.fromJS(res.data, ds.config);
	});
};
ds.removeConnection = function (id) {
	var yes = confirm("Are you sure want to delete connection " + id + " ?");
	if (!yes) {
		return;
	}

	app.ajaxPost("/datasource/removeconnection", { id: id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
};
ds.removeDataSource = function(id){
	var yes = confirm("Are you sure want to delete connection " + id + " ?");
	if (!yes) {
		return;
	}

	app.ajaxPost("/datasource/removedatasource", { id: id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
}
ds.editDataSource = function(id){
	app.ajaxPost("/datasource/selectdatasource", { id: id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("editDataSource");
		ko.mapping.fromJS(res.data, ds.confDataSource);
		
		setTimeout(function () {
			$("select.data-connection").data("kendoDropDownList").value(ds.confDataSource.connectionId());
		}, 1000);
	});
}
ds.saveNewDataSource = function(){
	if (!app.isFormValid(".form-datasource")) {
		return;
	}
	
	var param = ko.mapping.toJS(ds.config);
	app.ajaxPost("/datasource/saveconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
}
ds.populateGridDataSource = function () {
	var param = ko.mapping.toJS(ds.config);
	app.ajaxPost("/datasource/getdatasources", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.dataSourcesData(res.data);
	});
};
ds.openDataSourceForm = function(){
	ds.mode('editDataSource');
	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateField, ds.field);
	ko.mapping.fromJS(ds.templateLookup, ds.lookup);
};

$(function () {
	ds.populateGridConnections();
	ds.populateGridDataSource();
});