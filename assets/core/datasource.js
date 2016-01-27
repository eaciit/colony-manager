viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray([
	{ value: "json", text: "Weblink" },
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
	QueryInfo : {},
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
ds.connectionListMode = ko.observable('');
ds.dataSourceMode = ko.observable('');
ds.confDataSource = ko.mapping.fromJS(ds.templateDataSource);
ds.confDataSourceConnectionInfo = ko.mapping.fromJS(ds.templateConfig);
ds.confLookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray([]);
ds.lookupFields = ko.observableArray([]);
ds.dataSourcesData = ko.observableArray([]);
ds.collectionNames = ko.observableArray([]);
ds.lokupModalLabel = ko.observable("");
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
	{ title: "", width: 100, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-primary' onclick='ds.editConnection(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='ds.removeConnection(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
	} },
]);
ds.dataSourceColumns = ko.observableArray([
	{ field: "_id", title: "ID" },
	{ field: "DataSourceName", title: "Data Source Name" },
	{ field: "ConnectionID", title: "Connection" },
	{ field: "QueryInfo", title: "Query", template: function (d) {
		return "test"
	} },
	{ title: "", width: 100, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-primary' onclick='ds.editDataSource(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='ds.removeDataSource(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
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
	{ field: "Label", title: "Label", editor: function (container, options) {
		$('<input required data-text-field="Label" data-value-field="Label" data-bind="value:' + options.field + '" style="width: 100%;" onkeyup="ds.gridMetaDataChange(this)" />').appendTo(container);
	}, headerTemplate: "Label <span style='color: red;'>*</span>" },
	{ field: "Type", title: "Type" },
	{ field: "Format", title: "Format", editor: function (container, options) {
		$('<input data-text-field="Format" data-value-field="Format" data-bind="value:' + options.field + '" style="width: 100%;" onkeyup="ds.gridMetaDataChange(this)" />').appendTo(container);
	} },
	{ title: "_id", template: function (d) {
		return "<button class='btn btn-xs btn-success' onclick='ds.showMetadataLookup(\"" + d._id + "\", this)'><span class='fa fa-eye'></span> Lookup</button>";
	}, width: 100, attributes: { style: "text-align: center;" } },
]);
ds.gridMetaDataSchema = {
	pageSize: 15,
	schema: {
		model: {
			id: "_id",
			fields: {
				_id: { type: "string", editable: false },
				Label: { type: "string" },
				Type: { type: "string", editable: false },
				Format: { type: "string", editable: false },
			}
		}
	}
};
ds.gridMetaDataChangeTimer = undefined;
ds.gridMetaDataChange = function (o) {
	if (ds.gridMetaDataChangeTimer != undefined) {
		clearTimeout(ds.gridMetaDataChangeTimer);
	}
	ds.gridMetaDataChangeTimer = setTimeout(function () {
		var data = JSON.parse(kendo.stringify($("#grid-metadata").data("kendoGrid").dataSource.data()));
		ds.confDataSource.MetaData(data);
	}, 800);
};
ds.fetchDataSourceMetaData = function (from) {
	var param = {
		connectionID: ds.confDataSource.ConnectionID(),
		from: from
	};

	ds.confDataSource.MetaData([]);
	app.ajaxPost("/datasource/fetchdatasourcemetadata", param, function (res) {
		if (!res.success && res.message == "[eaciit.dbox.dbc.mongo.Cursor.Fetch] Not found") {
			ds.confDataSource.MetaData([]);
			// toastr["error"]("", 'ERROR: Table "' + from + '" not found');
			return;
		}
		if (!app.isFine(res)) {
			return;
		}

		ds.confDataSource.MetaData(res.data);
		ds.saveDataSource();
	}, function (a) {
        sweetAlert("Oops...", a.statusText, "error");
	}, {
		timeout: 10000
	});
};
ds.changeActiveSection = function (section) {
	return function (self, e) {
		$(e.currentTarget).parent().siblings().removeClass("active");
		ds.section(section);
		ds.mode('');
	};
};
ds.resetValidation = function (selectorID) {
	var $form = $(selectorID).data("kendoValidator");
	if ($form == undefined) {
		$(selectorID).kendoValidator();
		$form = $(selectorID).data("kendoValidator");
	}

	$form.hideMessages();
};
ds.openConnectionForm = function () {
	ds.mode('edit');
	ds.connectionListMode('');
	ds.resetValidation("#form-add-connection");
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
		if (ds.config.Driver() == "json") {
			var err = $("#form-add-connection").data("kendoValidator").errors();
			if (err.length == 1 && (err.indexOf("Database is required") > -1)) {
				// no problem
			} else {
				return;
			}
		} else {
			return;
		}
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

		swal({ title: "Connected", type: "success" });
	}, function (a, b, c) {
        sweetAlert("Oops...", a.statusText, "error");
		console.log(a, b, c);
	}, {
		timeout: 10000
	});
};
ds.editConnection = function (_id) {
	ko.mapping.fromJS(ds.templateConfig, ds.config);

	app.ajaxPost("/datasource/selectconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("edit");
		ds.connectionListMode('edit');
		ds.resetValidation("#form-add-connection");
		ko.mapping.fromJS(res.data, ds.config);
	});
};
ds.removeConnection = function (_id) {
	swal({
	    title: "Are you sure?",
	    text: 'Data connection with id "' + _id + '" will be deleted',
	    type: "warning",
	    showCancelButton: true,
	    confirmButtonColor: "#DD6B55",
	    confirmButtonText: "Delete",
	    closeOnConfirm: true
	}, function() {
	    app.ajaxPost("/datasource/removeconnection", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			ds.backToFrontPage();
			swal({ title: "Data successfully deleted", type: "success" });
		});
	});
};
ds.removeDataSource = function (_id) {
	swal({
	    title: "Are you sure?",
	    text: 'Data source with id "' + _id + '" will be deleted',
	    type: "warning",
	    showCancelButton: true,
	    confirmButtonColor: "#DD6B55",
	    confirmButtonText: "Delete",
	    closeOnConfirm: true
	}, function() {
		app.ajaxPost("/datasource/removedatasource", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			ds.backToFrontPage();
			swal({ title: "Data successfully deleted", type: "success" });
		});
	});
}
ds.editDataSource = function (_id) {
	ds.dataSourceMode('edit');
	ds.resetValidation(".form-datasource");

	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);
	qr.clearQuery();

	$('a[data-target="#ds-tab-1"]').tab('show');

	app.ajaxPost("/datasource/selectdatasource", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.mode("editDataSource");
		ko.mapping.fromJS(res.data, ds.confDataSource);
		ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
		qr.setQuery(res.data.QueryInfo);

		setTimeout(function () {
			$("select.data-connection").data("kendoComboBox").trigger("change");
		}, 200);
	});
}
ds.getParamForSavingDataSource = function () {
	var param = ko.mapping.toJS(ds.confDataSource);
	param.MetaData = JSON.stringify(param.MetaData);
	param.QueryInfo = JSON.stringify(qr.getQuery());
	return param;
};
ds.saveNewDataSource = function(){
	if (!app.isFormValid(".form-datasource")) {
		return;
	}

	if (!qr.validateQuery()) {
		return;
	}

	var _id = ds.confDataSource._id();
	ds.saveDataSource(function (res) {
		ko.mapping.fromJS(res.data.data, ds.confDataSource);

		if (_id == "") {
			var queryInfo = ko.mapping.toJS(ds.confDataSource).QueryInfo;
			if (queryInfo.hasOwnProperty("from")) {
				ds.fetchDataSourceMetaData(queryInfo.from);
			}
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
	ds.dataSourceMode('');
	ds.resetValidation(".form-datasource");

	qr.clearQuery();
	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);
};
ds.forceFetchDataSourceMetaData = function () {
	ds.saveDataSource(function (res) {
		var queries = qr.getQuery();
		if (!queries.hasOwnProperty("from")) {
        	sweetAlert("Oops...", 'Cannot fetch meta data without using "from" command on Query Builder', "error");
			return;
		}

		ds.fetchDataSourceMetaData(queries.from);
	});
};
ds.saveDataSource = function (c) {
	var param = ds.getParamForSavingDataSource();
	app.ajaxPost("/datasource/savedatasource", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ko.mapping.fromJS(res.data, ds.confDataSource);
		if (typeof c !== "undefined") c(res);
	});
};
ds.testQuery = function () {
	if (!app.isFormValid(".form-datasource")) {
		return;
	}

	if (ds.confDataSource._id() == '') {
		swal({ title: "Warning", text: "Please save the datasource first", type: "warning" });
		return;
	}

	$("#grid-ds-result").replaceWith("<div id='grid-ds-result'></div>");

	ds.saveDataSource(function (res) {
		ds.idThereAnyDataSourceResult(false);

		var param = ko.mapping.toJS(ds.confDataSource);
		param.MetaData = JSON.stringify(param.MetaData);
		param.QueryInfo = JSON.stringify(param.QueryInfo);
		app.ajaxPost("/datasource/rundatasourcequery", param, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			$('a[data-target="#ds-tab-3"]').tab('show');
			ds.idThereAnyDataSourceResult(true);

			var columns = [{
				title: "&nbsp;",
				width: 20,
				locked: true
			}];

			var metadata = (res.data.metadata == undefined || res.data.metadata == null) ? [] : res.data.metadata;
			if (metadata.length > 0) {
				columns = columns.concat(metadata.map(function (e) {
					var columnConfig = { field: e._id, title: e.Label, width: 150 };

					if (e.Lookup._id != "") {
						columnConfig.template = function (f) {
							return "<a title='show lookup data for " + f._id + "' onclick='ds.showLookupData(\"" + e._id + "\", \"" + f._id + "\")'>" + f._id + "</a>";
						}
					}

					return columnConfig;
				}));
			} else if (res.data.data.length > 0) {
				var sampleData = res.data.data[0];
				for (var key in sampleData) {
					if (sampleData.hasOwnProperty(key)) {
						columns.push({ field: key, title: key, width: 150 });
					}
				}
			}

			if (columns.length == 1) {
				columns[0].locked = false;
			}

			var gridConfig = {
				columns: columns,
				dataSource: {
					data: res.data.data,
					pageSize: 15
				},
				sortable: true,
				filterfable: false,
				pageable: true
			};

			$("#grid-ds-result").kendoGrid(gridConfig);

			// ======= this line of code make lookup data overrided everytime trying to edit datasourcce
			var queryInfo = ko.mapping.toJS(ds.confDataSource).QueryInfo;
			if (queryInfo.hasOwnProperty("from") && ds.confDataSource.MetaData().length == 0) {
				ds.fetchDataSourceMetaData(queryInfo.from);
			}
		}, function (a, b, c) {
        	sweetAlert("Oops...", a.statusText, "error");
			console.log(a);
		}, {
			timeout: 10000
		});
	});
};
ds.showMetadataLookup = function (_id, o) {
	var $grid = $(o).closest(".k-grid").data("kendoGrid");
	var uid = $(o).closest("[data-uid]").attr("data-uid");
	var row = JSON.parse(kendo.stringify($grid.dataSource.getByUid(uid)));

	$("#modal-lookup").modal("show");
	ds.lookupFields([]);

	ko.mapping.fromJS(row.Lookup, ds.confLookup);
	ds.confLookup.IDFieldOrigin(row._id);
	ds.confLookup.DisplayFieldOrigin(row.Label);

	if (ds.confLookup.DataSourceID() != '') {
		// trigger datasource, and fill the value for edit
		ds.changeLookupDataSourceCallback = function () {
			setTimeout(function () {
				$('[name="lookup-idfield"]').data("kendoDropDownList").value(ds.confLookup.IDField());
				$('[name="lookup-displayfield"]').data("kendoDropDownList").value(ds.confLookup.DisplayField());
				$('[name="lookup-fields"]').data("kendoMultiSelect").value(ds.confLookup.LookupFields());
			}, 200);
		};
		setTimeout(function () {
			$('[name="lookup-datasource"]').data("kendoDropDownList").trigger("change");
		}, 200);
	}
};
ds.fetchAllCollections = function () {
	ds.collectionNames([]);

	var param = { connectionID: ds.confDataSource.ConnectionID() };
	app.ajaxPost("/datasource/getdatasourcecollections", param, function (res) {
		ds.collectionNames(res.data);
	}, function (a) {
    	sweetAlert("Oops...", a.statusText, "error");
	}, {
		timeout: 10000
	});
};
ds.changeDataSourceConnection = function () {
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);

	var param = { _id: this.value() };
	app.ajaxPost("/datasource/selectconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ko.mapping.fromJS(res.data, ds.confDataSourceConnectionInfo);
		ds.fetchAllCollections();
	});
};
ds.changeLookupDataSourceCallback = function () {};
ds.changeLookupDataSource = function () {
	ds.lookupFields([]);

	var dataSourceId = this.value();
	app.ajaxPost("/datasource/selectdatasource", { _id: dataSourceId }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.lookupFields(Lazy(res.data.MetaData).sort(function (e) {
			return e.Label;
		}).toArray());
		ds.changeLookupDataSourceCallback();
		ds.changeLookupDataSourceCallback = function () {};
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

	var lookupID = "l" + moment(new Date()).format("YYYMMDDHHmmssSSS");
	rowLookup._id(lookupID);

	ds.saveDataSource(function (res) {
		$("#modal-lookup").modal("hide");
	});
};
ds.showLookupData = function (lookupID, lookupData) {
	ds.lokupModalLabel("");
	$(".modal-lookup-data").modal("show");
	$("#grid-lookup-data").replaceWith("<div id='grid-lookup-data'></div>");

	var param = {
		_id: ds.confDataSource._id(),
		lookupID: lookupID,
		lookupData: lookupData
	};
	app.ajaxPost("/datasource/fetchdatasourcelookupdata", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		var columns = [{
			title: "&nbsp;",
			width: 20,
			locked: true
		}].concat(res.data.columns.map(function (e) {
			return { field: e, title: e, width: 150 };
		}));

		if (columns.length == 1) {
			columns[0].locked = false;
		}

		var gridConfig = {
			columns: columns,
			dataSource: {
				data: res.data.data,
				pageSize: 10
			},
			sortable: true,
			pageable: true,
			filterfable: false
		};

		$("#grid-lookup-data").kendoGrid(gridConfig);
	});
};

$(function () {
	ds.populateGridConnections();
	ds.populateGridDataSource();
});
