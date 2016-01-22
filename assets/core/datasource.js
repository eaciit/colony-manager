viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray([
	{ value: "weblink", text: "Weblink" },
	{ value: "mongo", text: "MongoDb" },
	{ value: "mssql", text: "SQLServer" },
	{ value: "mysql", text: "MySQL" },
	{ value: "oracle", text: "Oracle" },
	{ value: "erp", text: "ERP" }
]);
ds.section = ko.observable('connection-list');
ds.mode = ko.observable('');
ds.templateConfigSetting = {
	id: "",
	key: "",
	value: ""
};
ds.templateConfig = { 
	_id: "",
	ConnectionName: "",
	Driver: "",
	Host: "",
	Database: "",
	UserName: "",
	Password: "",
	Settings: []
};
ds.templateDataSource = {
	_id: "",
	DataSourceName: "",
	ConnectionID: "",
	QueryInfo : [],
	MetaData: [],
};
ds.templateQuery = {
	select: "",
	from: "",
	where: "",
};
ds.templateLookup = {
	IDFieldOrigin: "",
	DisplayFieldOrigin: "",

	_id: "",
	DataSourceID: "",
	IDField: "",
	DisplayField: "",
	LookupFields: [],
};

ds.config = ko.mapping.fromJS(ds.templateConfig);
ds.confDataSource = ko.mapping.fromJS(ds.templateDataSource);
ds.confDataSourceConnectionInfo = ko.mapping.fromJS(ds.templateConfig);
ds.confLookup = ko.mapping.fromJS(ds.templateLookup);
ds.query = ko.mapping.fromJS(ds.templateQuery);
// ds.lookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray([]);
ds.lookupFields = ko.observableArray([]);
ds.dataSourcesData = ko.observableArray([]);
ds.dataSourceDataForLookup = ko.computed(function () {
	return Lazy(ds.dataSourcesData()).where(function (e) {
		return e._id != ds.confDataSource._id();
	}).toArray();
}, ds);
ds.idThereAnyDataSourceResult = ko.observable(false);
ds.connectionListColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 110 },
	{ field: "ConnectionName", title: "Connection Name" },
	{ field: "Driver", title: "Driver", width: 90 },
	{ field: "Host", title: "Host" },
	{ field: "Database", title: "Database" },
	{ field: "UserName", title: "User Name" },
	// { field: "settings", title: "Settings" },
	{ title: "", width: 150, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-xs btn-primary' onclick='ds.editConnection(\"" + d._id + "\")'><span class='glyphicon glyphicon-edit'></span> Edit</button> <button class='btn btn-xs btn-danger' onclick='ds.removeConnection(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span> Remove</button>"
	} },
]);
ds.dataSourceColumns = ko.observableArray([
	{ field: "_id", title: "ID" },
	{ field: "DataSourceName", title: "Data Source Name" },
	{ field: "ConnectionID", title: "Connection" },
	{ field: "QueryInfo", title: "Query", template: function (d) {
		return "test"
	} },
	{ title: "", width: 150, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-xs btn-primary' onclick='ds.editDataSource(\"" + d._id + "\")'><span class='glyphicon glyphicon-edit'></span> Edit</button> <button class='btn btn-xs btn-danger' onclick='ds.removeDataSource(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span> Remove</button>"
	} },
]);
ds.settingsColumns = ko.observableArray([
	{ field: "key", title: "Key", template: function (d) {
		return "<input style='width: 100%;'>";
	} },
	{ field: "valuue", title: "Value", template: function (d) {
		return "<input style='width: 100%;'>";
	} }
]);
ds.metadataColumns = ko.observableArray([
	{ field: "_id", title: "ID" },
	{ field: "Label", title: "Label" },
	{ field: "Type", title: "Type" },
	{ field: "Format", title: "Format" },
	{ title: "", template: function (d) {
		return "<button class='btn btn-xs btn-success' onclick='ds.showMetadataLookup(\"" + d._id + "\", this)'><span class='glyphicon glyphicon-detail'></span> Lookup</button>";
	}, width: 90, attributes: { style: "text-align: center;" } },
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
	ds.addSettings();
};
ds.addSettings = function () {
	var setting = $.extend(true, {}, ds.templateConfigSetting);
	setting.id = "s" + moment.now();
	ds.config.Settings.push(setting);
};
ds.removeSetting = function (each) {
	return function () {
		console.log(each);
		ds.config.Settings.remove(each);
	};
};
ds.backToFrontPage = function () {
	ds.mode('');
	ds.populateGridConnections();
	ds.populateGridDataSource();
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
	param.Settings = JSON.stringify(param.Settings);
	app.ajaxPost("/datasource/saveconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
};
ds.testConnection = function () {
	if (!app.isFormValid("#form-add-connection")) {
		return;
	}
	
	var param = ko.mapping.toJS(ds.config);
	param.Settings = JSON.stringify(param.Settings);
	
	app.ajaxPost("/datasource/testconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		toastr["success"]("", "Connected");
	}, function (a, b, c) {
		toastr["error"]("", "ERROR: " + a.statusText);
		console.log(a, b, c);
	}, {
		timeout: 5000
	});
};
ds.editConnection = function (_id) {
	ko.mapping.fromJS(ds.templateConfig, ds.config);

	app.ajaxPost("/datasource/selectconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("edit");
		ko.mapping.fromJS(res.data, ds.config);
	});
};
ds.removeConnection = function (_id) {
	var yes = confirm("Are you sure want to delete connection " + _id + " ?");
	if (!yes) {
		return;
	}

	app.ajaxPost("/datasource/removeconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
};
ds.removeDataSource = function (_id) {
	var yes = confirm("Are you sure want to delete connection " + _id + " ?");
	if (!yes) {
		return;
	}

	app.ajaxPost("/datasource/removedatasource", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
	});
}
ds.editDataSource = function (_id) {
	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateQuery, ds.query);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);

	app.ajaxPost("/datasource/selectdatasource", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("editDataSource");
		ko.mapping.fromJS(res.data, ds.confDataSource);
		ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
		qr.valueCommand(ds.parseQuery(res.data.QueryInfo));
		qr.updateQuery();
		
		setTimeout(function () {
			$("select.data-connection").data("kendoDropDownList").trigger("change");
		}, 200);
	});
}
ds.parseQuery = function (commands) {
	var o = [];

	var i = 0;
	for (key in commands) {
		if (commands.hasOwnProperty(key)) {
			i++;
			o.push({ id: i, key: key, value: commands[key] });
		}
	}

	return o;
};
ds.unparseQuery = function (commands) {
	var o = {};
	ko.mapping.toJS(commands).forEach(function (e) {
		o[e.key] = e.value;
	});
	return o;
};
ds.getParamForSavingDataSource = function () {
	var param = ko.mapping.toJS(ds.confDataSource);
	param.MetaData = JSON.stringify(param.MetaData);
	param.QueryInfo = JSON.stringify(ds.unparseQuery(viewModel.query.valueCommand()));
	return param;
};
ds.saveNewDataSource = function(){
	if (!app.isFormValid(".form-datasource")) {
		return;
	}
	var param = ds.getParamForSavingDataSource();
	app.ajaxPost("/datasource/savedatasource", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		if (res.data.needTofetchMetaData) {
			ds.fetchDataSourceMetaData();
		}
	});
};
ds.populateGridDataSource = function () {
	app.ajaxPost("/datasource/getdatasources", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.dataSourcesData(res.data);
	});
};
ds.openDataSourceForm = function(){
	ds.mode('editDataSource');

	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateQuery, ds.query);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);
};
ds.fetchDataSourceMetaData = function () {
	var param = { _id: ds.confDataSource._id() };
	app.ajaxPost("/datasource/fetchdatasourcemetadata", param, function (res) { 
		if (!app.isFine(res)) {
			return;
		}

		res.data.QueryInfo = ds.parseQuery(res.data);
		ko.mapping.fromJS(res.data, ds.confDataSource);
	}, function (a) {
		toastr["error"]("", "ERROR: " + a.statusText);
	}, { 
		timout: 3000 
	});
};
ds.testQuery = function () {
	if (!app.isFormValid(".form-datasource")) {
		return;
	}

	ds.idThereAnyDataSourceResult(false);

	var param = ko.mapping.toJS(ds.confDataSource);
	param.MetaData = JSON.stringify(param.MetaData);
	param.QueryInfo = JSON.stringify(ds.unparseQuery(viewModel.query.valueCommand()));
	app.ajaxPost("/datasource/fetchdatasourcesampledata", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		$('a[data-target="#ds-tab-3"]').tab('show');
		ds.idThereAnyDataSourceResult(true);

		var columns = [{
			title: "&nbsp;",
			width: 20,
			locked: true
		}].concat(res.data.metadata.map(function (e) {
			return { field: e._id, title: e.Label, width: 150 };
		}));

		var gridConfig = {
			columns: columns,
			dataSource: { 
				data: res.data.data,
				pageSize: 15
			},
			resizable: false,
			sortable: true,
			filterfable: false,
			pageable: true
		};

		$("#grid-ds-result").replaceWith("<div id='grid-ds-result'></div>");
		$("#grid-ds-result").kendoGrid(gridConfig);
	});
};
// ds.showMetadataLookup = function (id) {
// 	$("#modal-lookup").modal("show");

// 	var row = ko.mapping.toJS(Lazy(ds.confDataSource.MetaData()).find(function (e) {
// 		return e.id() == id;
// 	}));

// 	var item = $.extend(true, ds.templateLookup, {
// 		idField: row.id,

// 		dataSourceId: row.lookup.dataSourceId,
// 		displayField: row.label,
// 		lookupFields: row.lookup.lookupFields
// 	});

// 	console.log("selected lookup", item, row);
// 	ko.mapping.fromJS(item, ds.confLookup);

// 	// $("[name='lookup-datasource']").data("kendoDropDownList").trigger("change");
// 	// setTimeout(function () {
// 	// 	$("[name='lookup-fields']").data("kendoMultiSelect").value(row.lookup.lookupFields);
// 	// }, 2000);
// };
ds.showMetadataLookup = function (_id, o) {
	var $grid = $(o).closest(".k-grid").data("kendoGrid");
	var uid = $(o).closest("[data-uid]").attr("data-uid");
	var row = JSON.parse(kendo.stringify($grid.dataSource.getByUid(uid)));

	ko.mapping.fromJS(row.Lookup, ds.confLookup);
	ds.confLookup.IDFieldOrigin(row._id);
	ds.confLookup.DisplayFieldOrigin(row.Label);

	$("#modal-lookup").modal("show");
};
ds.changeDataSourceConnection = function () {
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);

	var param = { _id: this.value() };
	app.ajaxPost("/datasource/selectconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ko.mapping.fromJS(res.data, ds.confDataSourceConnectionInfo);
	});
};
ds.changeLookupDataSource = function () {
	ds.lookupFields([]);

	var dataSourceId = this.value();
	app.ajaxPost("/datasource/selectdatasource", { _id: dataSourceId }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.lookupFields(res.data.MetaData);
	});
};
ds.saveLookup = function () {
	var metadata = ko.mapping.toJS(ds.confDataSource.MetaData());
	var lookup = ko.mapping.toJS(ds.confLookup);

	var row = Lazy(metadata).find({ _id: lookup.IDFieldOrigin });
	var index = metadata.indexOf(row);

	var rowLookup = ds.confDataSource.MetaData()[index].Lookup;
	rowLookup._id(lookup._id);
	rowLookup.DataSourceID(lookup.DataSourceID);
	rowLookup.IDField(lookup.IDField);
	rowLookup.DisplayField(lookup.DisplayField);
	rowLookup.LookupFields(lookup.LookupFields);

	var param = ds.getParamForSavingDataSource();
	app.ajaxPost("/datasource/savedatasource", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		$("#modal-lookup").modal("hide");
	});
};

$(function () {
	ds.populateGridConnections();
	ds.populateGridDataSource();
});