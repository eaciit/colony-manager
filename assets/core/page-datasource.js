app.section('connection-list');

viewModel.datasource = {}; var ds = viewModel.datasource;
ds.templateDrivers = ko.observableArray([
	{ value: "weblink", text: "Weblink" },
	{ value: "mongo", text: "MongoDb" },
	{ value: "mssql", text: "SQLServer" },
	{ value: "mysql", text: "MySQL" },
	{ value: "oracle", text: "Oracle" },
	{ value: "erp", text: "ERP" }
]);
ds.templateConfigSetting = {
	id: "",
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
	Settings: []
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

ds.config = ko.mapping.fromJS(ds.templateConfig);
ds.showDataSource = ko.observable(true);
ds.showConnection = ko.observable(true);
ds.connectionListMode = ko.observable('');
ds.dataSourceMode = ko.observable('');
ds.valDataSourceFilter = ko.observable('');
ds.valConnectionFilter = ko.observable('');
ds.confDataSource = ko.mapping.fromJS(ds.templateDataSource);
ds.confDataSourceConnectionInfo = ko.mapping.fromJS(ds.templateConfig);
ds.confLookup = ko.mapping.fromJS(ds.templateLookup);
ds.connectionListData = ko.observableArray([]);
ds.lookupFields = ko.observableArray([]);
ds.dataSourcesData = ko.observableArray([]);
ds.collectionNames = ko.observableArray([]);
ds.lokupModalLabel = ko.observable("");
ds.tempCheckIdConnection = ko.observableArray([]);
ds.tempCheckIdDataSource = ko.observableArray([]);
ds.dataSourceDataForLookup = ko.computed(function () {
	return Lazy(ds.dataSourcesData()).where(function (e) {
		return e._id != ds.confDataSource._id();
	}).toArray();
}, ds);
ds.idThereAnyDataSourceResult = ko.observable(false);
ds.connectionListColumns = ko.observableArray([
	{ headerTemplate: "<input type='checkbox' class='connectioncheckall' onclick=\"ds.checkDeleteData(this, 'connectionall', 'all')\"/>", width:25, template: function (d) {
		return [
			"<input type='checkbox' class='connectioncheck' idcheck='"+d._id+"' onclick=\"ds.checkDeleteData(this, 'connection')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Connection ID" },
	{ field: "Driver", title: "Driver" },
	{ field: "Host", title: "Host" },
	{ field: "Database", title: "Database" },
	{ field: "UserName", title: "User Name" },
	// { field: "settings", title: "Settings" },
	{ title: "", width: 130, attributes: { style: "text-align: center;", class:'excludethis' }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success tooltipster notthis' title='Test Connection' onclick='ds.testConnectionFromGrid(\"" + d._id + "\")'><span class='fa fa-play'></span></button>",
		].join(" ");
	} },
]);
ds.filterDriver = ko.observable('');
ds.dataSourceColumns = ko.observableArray([
	{ headerTemplate: "<input type='checkbox' class='datasourcecheckall' onclick=\"ds.checkDeleteData(this, 'datasourceall', 'all')\"/>", width:25, template: function (d) {
		return [
			"<input type='checkbox' class='datasourcecheck' idcheck='"+d._id+"' onclick=\"ds.checkDeleteData(this, 'datasource')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Data Source ID" },
	{ field: "ConnectionID", title: "Connection" },
	{ field: "QueryInfo", title: "Query", template: function (d) {
		return "test"
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
ds.openConnectionForm = function () {
	app.mode('edit');
	ds.connectionListMode('');
	app.resetValidation("#form-add-connection");
	ko.mapping.fromJS(ds.templateConfig, ds.config);
	ds.addSettings();
	ds.showConnection(false);
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
	app.mode('');
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
		if (ds.config.Driver() == "weblink") {
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
ds.testConnectionFromGrid = function (_id) {
	var param = $.extend(true, {}, Lazy(ds.connectionListData()).find({ _id: _id }));
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

ds.selectGridConnection = function(e){
	var grid = $(".grid-connection").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	var target = $( event.target );
	if ( $(target).is( ".excludethis" ) ) {
	    return false;
	  }else if ($(target).parents(".notthis").length ) {
	  	return false;
	  }else{
		ds.editConnection(selectedItem._id);
	  }
	ds.showConnection(true);
};

ds.editConnection = function (_id) {
	ko.mapping.fromJS(ds.templateConfig, ds.config);

	app.ajaxPost("/datasource/selectconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("edit");
		ds.connectionListMode('edit');
		app.resetValidation("#form-add-connection");
		ko.mapping.fromJS(res.data, ds.config);
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
				app.ajaxPost("/datasource/removemultipledataSource", { _id: ds.tempCheckIdDataSource() }, function (res) {
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

ds.selectGridDataSource = function(e){
	var grid = $(".grid-datasource").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	ds.editDataSource(selectedItem._id);
	ds.showDataSource(true);
};

ds.editDataSource = function (_id) {
	ds.dataSourceMode('edit');
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
	app.ajaxPost("/datasource/getdatasources", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		ds.dataSourcesData(res.data);
	});
};
ds.openDataSourceForm = function(){
	app.mode('editDataSource');
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
function filterDataSource(event) {
	var fdatasource = ds.valDataSourceFilter();
	app.ajaxPost("/datasource/finddatasource", {inputText : fdatasource}, function (res) 
	{
		if (!app.isFine(res)) {
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		ds.dataSourcesData(res.data);

	});
}
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

function filterConnection(event) {
	var fconnection = ds.valConnectionFilter();
	app.ajaxPost("/datasource/findconnection", {inputText : fconnection, inputDrop : ""}, function (res)
	{
	if (!app.isFine(res)) {
 		return;
	}
	 	ds.connectionListData(res.data);
	 });
console.log(ds.valConnectionFilter());
}

$(function () {
	ds.populateGridConnections();
	ds.populateGridDataSource();
});
