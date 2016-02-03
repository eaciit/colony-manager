app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.templateConfigScrapper = {
	_id: "",
	DataSourceOrigin: "",
	DataSourceDestination: "",
	IgnoreFieldsDestination: [],
	Map: []
};
dg.templateMap = {
	FieldOrigin: "",
	FieldDestination: ""
};
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.dataSourcesData = ko.observableArray([]);
dg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "Data Grabber ID" },
	{ field: "DataSourceOrigin", title: "Data Source Origin" },
	{ field: "DataSourceDestination", title: "Data Source Destination" },
	{ title: "", width: 130, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-success' onclick='dg.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-primary' onclick='dg.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-danger' onclick='dg.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },
]);
dg.fieldOfDataSource = function (which) {
	return ko.computed(function () {
		var ds = Lazy(dg.dataSourcesData()).find({
			_id: dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]()
		});

		if (ds == undefined) {
			return [];
		}

		return ds.MetaData;
	}, dg);
};
dg.isDataSourceNotEmpty = function (which) {
	return ko.computed(function () {
		var dsID = dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]();

		return dsID != "";
	}, dg);
};
dg.fieldOfDataSourceDestination = ko.computed(function () {
	var ds = Lazy(dg.dataSourcesData()).find({
		_id: dg.configScrapper.DataSourceDestination()
	});

	if (ds == undefined) {
		return [];
	}

	return ds.MetaData;
}, dg);
dg.getScrapperData = function (){
	app.ajaxPost("/datagrabber/getdatagrabber", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.scrapperData(res.data);
	});
};
dg.addMap = function () {
	var o = ko.mapping.fromJS($.extend(true, {}, dg.templateMap));
	dg.configScrapper.Map.push(o);
};
dg.removeMap = function (index) {
	return function () {
		var item = dg.configScrapper.Map()[index];
		dg.configScrapper.Map.remove(item);
	};
}
dg.createNewScrapper = function () {
	app.mode("editor");
	dg.scrapperMode('');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);
	dg.addMap();
};
dg.saveDataGrabber = function () {
	if (!app.isFormValid(".form-datagrabber")) {
		return;
	}

	var param = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/savedatagrabber", param, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		dg.backToFront();
		dg.getScrapperData();
	});
};
dg.backToFront = function () {
	app.mode("");
};
dg.getDataSourceData = function () {
	app.ajaxPost("/datasource/getdatasources", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.dataSourcesData(res.data);
	});
};
dg.editScrapper = function (_id) {
	dg.scrapperMode('edit');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);

	app.ajaxPost("/datagrabber/selectdatagrabber", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode("editor");
		dg.scrapperMode('editor');
		app.resetValidation("#form-add-scrapper");
		ko.mapping.fromJS(res.data, dg.configScrapper);
		
	});
};
dg.removeScrapper = function (_id) {
	swal({
		title: "Are you sure?",
		text: 'Data grabber with id "' + _id + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
	}, function() {
		app.ajaxPost("/datagrabber/removedatagrabber", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			swal({ title: "Data successfully deleted", type: "success" });
			dg.backToFrontPage();
		});
	});
};
dg.backToFrontPage = function () {
	app.mode('');
	dg.getScrapperData();
	dg.getDataSourceData();
};
dg.runTransformation = function (_id) {
	return function () {
		app.ajaxPost("/datagrabber/transform", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			swal({ title: "Transformation success.\n" + res.data + " data saved", type: "success" });
		});
	}
};

$(function () {
	dg.getScrapperData();
	dg.getDataSourceData();
});
