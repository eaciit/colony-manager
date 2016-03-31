app.section('connection-list');

viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray([
	{ value: "csv", text: "CSV" },
	{ value: "csvs", text: "CSVS" },
	{ value: "json", text: "JSON" },
	{ value: "jsons", text: "JSONS" },
	{ value: "mongo", text: "MongoDb" },
	{ value: "mysql", text: "MySQL" },
	{ value: "hive", text: "Hive" },
	{ value: "oracle", text: "Oracle*" },
	{ value: "sqlserver", text: "SQL Servrer*" },
	{ value: "postresql", text: "PostreSQL*" },
]);
ds.templateConfigSetting = {
	id: "",
	deletable: true,
	key: "",
	value: ""
};
ds.templateConfig = {
	_id: "",
	Driver: "",
	Host: "",
	Database: "",
	UserName: "",
	Password: "",
	Settings: [],

	FileLocation: "",
};
ds.templateDataSource = {
	_id: "",
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
ds.delimiterOptions = ko.observableArray([
	{ value: "csv", text: "CSV" },
	{ value: "tsv", text: "TSV" },
]);
ds.constSettings = {
	csv: ["useheader", "newfile", "delimiter", "comment", "fieldsperrecord", "lazyquotes", "trailingcomma", "trimleadingspace"],
	csvs: ["useheader", "newfile", "delimiter", "comment", "fieldsperrecord", "lazyquotes", "trailingcomma", "trimleadingspace", "pooling"],
	hive: ["path", "delimiter"],
	json: ["newfile"],
	jsons: ["newfile", "pooling"],
	mongo: ["poollimit", "timeout"],
	xlsx: ["useheader", "rowstart", "newfile"]
};
ds.config = ko.mapping.fromJS(ds.templateConfig);
ds.showSearchConnection = ko.observable(false);
ds.showSearchDataSource = ko.observable(false);
ds.showDataSource = ko.observable(true);
ds.showConnection = ko.observable(true);
ds.connectionListMode = ko.observable('');
ds.breadcrumb = ko.observable('');
ds.dataSourceMode = ko.observable('');
ds.valConnectionFilter = ko.observable('');
ds.confDataSource = ko.mapping.fromJS(ds.templateDataSource);
ds.confDataSourceConnectionInfo = ko.mapping.fromJS(ds.templateConfig);
ds.confLookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray([]);
ds.lookupFields = ko.observableArray([]);
ds.dataSourcesData = ko.observableArray([]);
ds.collectionNames = ko.observableArray([]);
ds.lookupSubModalLabel = ko.observable("");
ds.tempCheckIdConnection = ko.observableArray([]);
ds.tempCheckIdDataSource = ko.observableArray([]);
ds.subData = ko.observableArray([]);
ds.computedDrivers = ko.computed(
	function() {
		var temp = [];
		var search = ko.utils.arrayFilter(ds.templateDrivers(),function (item) {
           if (item.text.indexOf('*') < 0){
				temp.push(item);
			}
       	}); 
        return temp;
    }, ds
);
ds.dataSourceDataForLookup = ko.computed(function () {
	return Lazy(ds.dataSourcesData()).where(function (e) {
		return e._id != ds.confDataSource._id();
	}).toArray();
}, ds);
ds.idThereAnyDataSourceResult = ko.observable(false);
ds.connectionListColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='connectioncheckall' onclick=\"ds.checkDeleteData(this, 'connectionall', 'all')\"/></center>", attributes: { style: "text-align: center;" }, width: 40, template: function (d) {
		return [
			"<input type='checkbox' class='connectioncheck' idcheck='"+d._id+"' onclick=\"ds.checkDeleteData(this, 'connection')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Connection ID" },
	{ field: "Driver", title: "Driver" },
	{ field: "Host", title: "Host" },
	{ field: "Database", title: "Database" },
	// { field: "UserName", title: "User Name" },
	// { field: "settings", title: "Settings" },
	{ title: "", width: 130, attributes: { style: "text-align: center;"}, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Test Connection' onclick='ds.testConnectionFromGrid(\"" + d._id + "\")'><span class='fa fa-info-circle'></span></button>",
		].join(" ");
	} },
]);
ds.filterDriver = ko.observable('');
ds.searchfield = ko.observable('');
ds.search2field = ko.observable('');
ds.dataSourceColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='datasourcecheckall' onclick=\"ds.checkDeleteData(this, 'datasourceall', 'all')\"/></center>", attributes: { style: "text-align: center;" }, width: 40, template: function (d) {
		return [
			"<input type='checkbox' class='datasourcecheck' idcheck='"+d._id+"' onclick=\"ds.checkDeleteData(this, 'datasource')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Data Source ID" },
	{ field: "ConnectionID", title: "Connection" },
	{ field: "QueryInfo", title: "Query", template: function (d) {
		var q = JSON.parse(kendo.stringify(d.QueryInfo));
		var r = [];

		for (var k in q) {
			if (q.hasOwnProperty(k)) {
				r.push([k, q[k]].join(" : "));
			}
		}

		return r.join(", ");
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
	{ title: "", template: function (d) {
		return "<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Show Meta Data Lookup of \"" + d._id + "\"' onclick='ds.showMetadataLookup(\"" + d._id + "\", this)'><span class='fa fa-eye'></span></button>";
	}, width: 60, attributes: { style: "text-align: center;" } },
]);
ds.labelForHost = ko.computed(function () {
	if (["csv", "json", "csvs", "jsons"].indexOf(ds.config.Driver()) > -1) {
		return "File URL";
	}

	return "Host";
}, ds);
ds.gridMetaDataSchema = {
	pageSize: 10,
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
ds.gridMetaDataBound = function (e, f) {
	var $grid = $("#grid-metadata");
	$grid.data("kendoGrid").dataSource.data().forEach(function (e) {
		if (e.Lookup._id == "") {
			return;
		}

	    $grid.find("[data-uid='" + e.uid + "']")
	    	.addClass("has-lookup")
	    	.attr("title", "this data has lookup");
	});

	app.gridBoundTooltipster('#grid-metadata')();
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
			qr.clearQuery();
			return;
		}
		if (!app.isFine(res)) {
			qr.clearQuery();
			return;
		}

		ds.confDataSource.MetaData(res.data);
		ds.saveDataSource();
	}, function (a) {
        sweetAlert("Oops...", a.statusText, "error");
		qr.clearQuery();
	}, {
		timeout: 10000
	});
};
ds.changeDriver = function (a, b) {
	ds.config.Settings([]);
	var driver = (b == undefined) ? this.value() : b;

	if (ds.constSettings.hasOwnProperty(driver)) {
		ds.constSettings[driver].forEach(function (d) {
			var setting = $.extend(true, {}, ds.templateConfigSetting);
			setting.id = "s" + moment.now();
			setting.deletable = false;
			setting.key = d;

			if (b != undefined) {
				for (var p in a) {
					if (a.hasOwnProperty(p) && p == d) {
						setting.value = String(a[p]);
					}
				}
			}

			ds.config.Settings.push(ko.mapping.fromJS(setting));
		});
	}

	if (b != undefined) {
		for (var p in a) {
			if (a.hasOwnProperty(p)) {
				isConst = Lazy(ds.config.Settings()).find(function (d) {
					return d["key"]() == p;
				}) != undefined;

				if (!isConst) {
					var setting = $.extend(true, {}, ds.templateConfigSetting);
					setting.id = "s" + moment.now();
					setting.deletable = true;
					setting.key = p;
					setting.value = a[p];

					ds.config.Settings.push(ko.mapping.fromJS(setting));
				}
			}
		}
	}
};
ds.openConnectionForm = function () {
	app.mode('edit');
	ds.connectionListMode('');
	ds.breadcrumb('Create New');
	app.resetValidation("#form-add-connection");
	ko.mapping.fromJS(ds.templateConfig, ds.config);
	ds.addSettings();
	ds.showConnection(false);
};
ds.addSettings = function () {
	var setting = $.extend(true, {}, ds.templateConfigSetting);
	setting.id = "s" + moment.now();
	ds.config.Settings.push(ko.mapping.fromJS(setting));
};
ds.removeSetting = function (each) {
	return function () {
		console.log(each);
		ds.config.Settings.remove(each);
	};
};
ds.backToFrontPage = function () {
	app.mode('');
	ds.breadcrumb('All');
	ds.populateGridConnections();
	ds.populateGridDataSource();
	ds.tempCheckIdDataSource([]);
	ds.tempCheckIdConnection([]);
};
ds.populateGridConnections = function () {
	var param = ko.mapping.toJS(ds.config);
	app.ajaxPost("/datasource/getconnections", {param, search: ds.searchfield, driver: ds.filterDriver}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data=[];
		}
		ds.connectionListData(res.data);
	});
};

ds.isFormAddConnectionValid = function () {
	if (!app.isFormValid("#form-add-connection")) {
		if (["json", "csv", "jsons", "csvs", "hive"].indexOf(ds.config.Driver()) > -1) {
			var err = $("#form-add-connection").data("kendoValidator").errors();
			if (err.length == 1 && (err.indexOf("Database is required") > -1)) {
				// no problem
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	return true;
}
ds.saveNewConnection = function () {
	var extension = (ds.config.Host()).split('.').pop();
	if ((extension == "json") || (extension == "csv")){
		if (extension !=  ds.config.Driver()){
			sweetAlert("Oops...", ("Your Host file is on ." + extension + " and your Driver is " + ds.config.Driver()), "error");
			return;
		}
	}
	
	if (!ds.isFormAddConnectionValid()) {
		return;
	}

	var param = ko.mapping.toJS(ds.config);
	param.Settings = JSON.stringify(Lazy(param.Settings).filter(function (e) { 
		return e.key != "" && e.value != "" 
	}).toArray());
	app.ajaxPost("/datasource/saveconnection", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.backToFrontPage();
		ds.connectionListMode("edit");
	});
};
ds.testConnectionFromGrid = function (_id) {
	var param = $.extend(true, {}, Lazy(ds.connectionListData()).find({ _id: _id }));
	param.Settings = JSON.stringify(Lazy(param.Settings).filter(function (e) { 
		return e.key != "" && e.value != "" 
	}).toArray());

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
ds.testConnection = function () {
	if (!ds.isFormAddConnectionValid()) {
		return;
	}

	var param = ko.mapping.toJS(ds.config);
	param.Settings = JSON.stringify(Lazy(param.Settings).filter(function (e) { 
		return e.key != "" && e.value != "" 
	}).toArray());

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

ds.selectGridConnection = function (e) {
	app.wrapGridSelect(".grid-connection", ".btn", function (d) {
		ds.editConnection(d._id);
		ds.showConnection(true);
		ds.tempCheckIdConnection.push(d._id);
	});
};

ds.editConnection = function (_id) {
	app.miniloader(true);
	ds.showSearchConnection(false);
	ko.mapping.fromJS(ds.templateConfig, ds.config);

	app.ajaxPost("/datasource/selectconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("edit");
		ds.connectionListMode('edit');
		ds.breadcrumb('Edit');		
		app.resetValidation("#form-add-connection");
		ko.mapping.fromJS(res.data, ds.config);
		ds.config.Settings(function (s) {
			var settings = [];
			for (var key in s) {
				if (s.hasOwnProperty(key)) {
					var setting = $.extend(true, { }, ds.templateConfigSetting);
					setting.id = "s" + moment.now();
					setting.key = key;
					setting.value = s[key];
					settings.push(setting);
				}
			}
			return settings;
		}(res.data.Settings));
		ds.changeDriver(res.data.Settings, res.data.Driver);
		ds.addSettings();
		ds.showConnection(true);		
	});
};
ds.removeConnection = function (_id) {
	if (ds.tempCheckIdConnection().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any connection to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
		    title: "Are you sure?",
		    // text: 'Data connection with id "' + _id + '" will be deleted',
		    text: 'Data connection(s) '+ds.tempCheckIdConnection().toString()+' will be deleted',
		    type: "warning",
		    showCancelButton: true,
		    confirmButtonColor: "#DD6B55",
		    confirmButtonText: "Delete",
		    closeOnConfirm: true
		}, function() {
		    setTimeout(function () {
		    	app.ajaxPost("/datasource/removemultipleconnection", { _id: ds.tempCheckIdConnection() }, function (res) {
					if (!app.isFine(res)) {
						return;
					}
					ds.backToFrontPage();
					swal({ title: "Data connection(s) successfully deleted", type: "success" });
				});
		    }, 1000);
		});
	}
};
ds.removeDataSource = function (_id) {
	if (ds.tempCheckIdDataSource().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any datasource to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
		    title: "Are you sure?",
		    // text: 'Data source with id "' + _id + '" will be deleted',
		    text: 'Data source(s) '+ds.tempCheckIdDataSource().toString()+' will be deleted',
		    type: "warning",
		    showCancelButton: true,
		    confirmButtonColor: "#DD6B55",
		    confirmButtonText: "Delete",
		    closeOnConfirm: true
		}, function() {
			setTimeout(function () {
				app.ajaxPost("/datasource/removemultipledatasource", { _id: ds.tempCheckIdDataSource() }, function (res) {
					if (!app.isFine(res)) {
						return;
					}
					ds.backToFrontPage();
					swal({ title: "Data source(s) successfully deleted", type: "success" });
				});
			}, 1000);
		});
	} 
};

ds.selectGridDataSource = function (e) {
	app.wrapGridSelect(".grid-datasource", ".btn", function (d) {
		ds.editDataSource(d._id);
		ds.showDataSource(true);
		ds.tempCheckIdDataSource.push(d._id);
	});
};

ds.editDataSource = function (_id) {
	app.miniloader(true);
	ds.showSearchDataSource(false);
	ds.dataSourceMode('edit');
	ds.breadcrumb('Edit');		
	app.resetValidation(".form-datasource");

	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);
	ds.showDataSource(true);
	qr.clearQuery();

	$('a[data-target="#ds-tab-1"]').tab('show');

	app.ajaxPost("/datasource/selectdatasource", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("editDataSource");
		ko.mapping.fromJS(res.data, ds.confDataSource);
		ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
		qr.setQuery(res.data.QueryInfo);

		setTimeout(function () {
			$("select.data-connection").data("kendoComboBox").trigger("change");
		}, 200);
	});
};
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
	app.ajaxPost("/datasource/getdatasources", {search: ds.search2field}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data=[];
		}
		ds.dataSourcesData(res.data);
	});
	// filterDataSource();
};

ds.openDataSourceForm = function(){
	app.mode('editDataSource');
	ds.breadcrumb('Create New');
	ds.dataSourceMode('');
	app.resetValidation(".form-datasource");

	qr.clearQuery();
	ko.mapping.fromJS(ds.templateDataSource, ds.confDataSource);
	ko.mapping.fromJS(ds.templateConfig, ds.confDataSourceConnectionInfo);
	ko.mapping.fromJS(ds.templateLookup, ds.confLookup);
	ds.idThereAnyDataSourceResult(false);
	ds.showDataSource(false);
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
	if (!app.isFormValid(".form-datasource")) {
		return;
	}

	var param = ds.getParamForSavingDataSource();
	app.ajaxPost("/datasource/savedatasource", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ko.mapping.fromJS(res.data, ds.confDataSource);
		if (typeof c !== "undefined") c(res);
		ds.dataSourceMode("edit");
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
					if (res.data.data.length > 0) {
						return Lazy(res.data.data).find(function (a) {
							for (var k in a) {
								if (a.hasOwnProperty(k) && e.hasOwnProperty(k)) {
									return true;
								}
							}

							return false;
						}) != undefined;
					}
					var columnConfig = { field: e._id, title: e.Label, width: 150 };

					if (e.Lookup._id != "") {
						columnConfig.template = function (f) {
							return "<a title='show lookup data for " + f._id + "' onclick='ds.showLookupData(\"" + e._id + "\", \"" + f._id + "\")'>" + f._id + "</a>";
						}
					} else if ((e.Type === "object") || (e.Type === "array-objects") || (e.Type.indexOf("array") > -1)) {
						columnConfig.template = function (f) {
							if (f[e._id] === undefined){
								return "";
							}else{
								return "<a title='show lookup data for " + f._id + "' onclick='ds.showSubData(\"" + e._id + "\", \"" + f._id + "\")'>" + "Show details" + "</a>";
							}
						}
					}

					return columnConfig;
				}));

				columns = Lazy(columns).filter(function (e) {

				}).toArray();
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
					pageSize: 10
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
		if (!app.isFine(res)) {
			return;
		}

		ds.collectionNames(res.data);
	}, function (a) {
		ds.backToFrontPage();
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
	ds.lookupSubModalLabel("Lookup Data");
	$(".modal-sub-lookup-data").modal("show");
	$("#grid-sub-lookup-data").replaceWith("<div id='grid-sub-lookup-data'></div>");

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

		$("#grid-sub-lookup-data").kendoGrid(gridConfig);
	});
};

ds.showSubData = function (subID, subData) {
	ds.lookupSubModalLabel("Sub Data");
	$(".modal-sub-lookup-data").modal("show");
	$("#grid-sub-lookup-data").replaceWith("<div id='grid-sub-lookup-data'></div>");

	var param = {
		_id: ds.confDataSource._id(),
		lookupID: subID,
		lookupData: subData
	};
	app.ajaxPost("/datasource/fetchdatasourcesubdata", param, function (res) {
		if ((!app.isFine(res)) || (res.data.data === null)){
			return;
		}

		if ($.isArray(res.data.data)){
			if(typeof(res.data.data) === "object"){
				ds.subData(res.data.data);

				if (ds.subData().length > 0) {
					if (!(ds.subData()[0] instanceof Object)) {
						var values = [];
						for (var ln = 0; ln < ds.subData().length; ln++) {
						    var item1 = {
						        "List" : ds.subData()[ln]
						    };
					    	values.push(item1);
						}
						ds.subData(values);
					}
				}
			}
		}else{
			var data = ds.toHierarchy(ds.toObject(res.data.data));
			var height = (data.length < 10) ? (data.length * 30) : 300;
			$("#grid-sub-lookup-data").height(height).kendoTreeView({
				height: (data.length * 30),
                dataSource: new kendo.data.HierarchicalDataSource({
    				data: data
    			})
            });

			return;
		}

		$("#grid-sub-lookup-data").kendoGrid({
			dataSource: ds.subData()
		});
	});
};

ds.checkDeleteData = function(elem, e){
	if (e === 'connection'){
		if ($(elem).prop('checked') === true){
			ds.tempCheckIdConnection.push($(elem).attr('idcheck'));
		} else {
			ds.tempCheckIdConnection.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	} if (e === 'connectionall'){
		if ($(elem).prop('checked') === true){
			$('.connectioncheck').each(function(index) {
				$(this).prop("checked", true);
				ds.tempCheckIdConnection.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.connectioncheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				ds.tempCheckIdConnection.remove( function (item) { return item === idtemp; } );
			});
		}
	} else if (e === 'datasourceall'){
		if ($(elem).prop('checked') === true){
			$('.datasourcecheck').each(function(index) {
				$(this).prop("checked", true);
				ds.tempCheckIdDataSource.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.datasourcecheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				ds.tempCheckIdDataSource.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			ds.tempCheckIdDataSource.push($(elem).attr('idcheck'));
		} else {
			ds.tempCheckIdDataSource.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}
ds.toObject = function (o) {
	var r = {};

	for (var k in o) {
		if (o.hasOwnProperty(k)) {
			var v = o[k];

			if (v instanceof Array) {
				r[k] = {};

				v.forEach(function (d, j) {
					if (d instanceof Object) {
						r[k] = ds.toObject(v);
					} else {
						r[k][j] = d
					}
				});
			} else if (v instanceof Object) {
				r[k] = ds.toObject(v);
			} else {
				r[k] = v;
			}
		}
	}

	return r;
};
ds.toHierarchy = function (d) {
	var result = [];
	for (var k in d) {
		if (d.hasOwnProperty(k)) {
			var v = d[k];
			var j = { text: k, items: [] };
			result.push(j);

			if (v instanceof Object) {
				j.items = ds.toHierarchy(v);
			} else {
				j.text += ": " + v;
			}
		}
	}
	return result;
};

$(function () {
	ds.populateGridConnections();
	ds.populateGridDataSource();
	ds.showSearchConnection(false);
	ds.showSearchDataSource(false);
	ds.breadcrumb('All');
	app.registerSearchKeyup($(".search"), ds.populateGridConnections);
	app.registerSearchKeyup($(".searchds"), ds.populateGridDataSource);
});
