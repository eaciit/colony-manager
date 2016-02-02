app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.sampleDataSource = ko.observableArray([
	{ _id: "DS01", DataSourceName: "Data Source 1", MetaData: ["ID", "Name", "Age", "Title"] },
  	{ _id: "DS02", DataSourceName: "Data Source 2", MetaData: ["_id", "Title", "Cover"] },
  	{ _id: "DS03", DataSourceName: "Data Source 3", MetaData: ["ID", "Full Name", "Age"] }
]);
dg.sampleScrapperData = ko.observableArray([
  { 
  	_id: "WG01", 
  	DataSourceOrigin: "DS01", 
  	DataSourceDestination: "DS02", 
  	Map: [
		{fieldOrigin: "PsSchedule", fieldDestination: "_id"},
		{fieldOrigin: "RigType", fieldDestination: "RigType"},
		{fieldOrigin: "VirtualPhase", fieldDestination: "EXType"},
	] 
}, { 
	_id: "WG02", 
	DataSourceOrigin: "DS03", 
	DataSourceDestination: "DS04", 
	Map: [
		{fieldOrigin: "PsSchedule", fieldDestination: "_id"},
		{fieldOrigin: "RigType", fieldDestination: "RigType"},
		{fieldOrigin: "VirtualPhase", fieldDestination: "EXType"},
	] 
},{ 
	_id: "WG03", 
	DataSourceOrigin: "DS02", 
	DataSourceDestination: "DS05", 
	Map: [
		{fieldOrigin: "PsSchedule", fieldDestination: "_id"},
		{fieldOrigin: "RigType", fieldDestination: "RigType"},
		{fieldOrigin: "VirtualPhase", fieldDestination: "EXType"},
	] 
},{ 
	_id: "WG04", 
	DataSourceOrigin: "DS01", 
	DataSourceDestination: "DS04", 
	Map: [
		{fieldOrigin: "PsSchedule", fieldDestination: "_id"},
		{fieldOrigin: "RigType", fieldDestination: "RigType"},
		{fieldOrigin: "VirtualPhase", fieldDestination: "EXType"},
	] 
},{ 
	_id: "WG05", 
	DataSourceOrigin: "DS03", 
	DataSourceDestination: "DS05", 
	Map: [
		{fieldOrigin: "PsSchedule", fieldDestination: "_id"},
		{fieldOrigin: "RigType", fieldDestination: "RigType"},
		{fieldOrigin: "VirtualPhase", fieldDestination: "EXType"},
	] 
},
]);

dg.templateConfigScrapper = {
	_id: "",
	DataSourceOrigin: "",
	DataSourceDestination: "",
	Map: []
};
dg.templateMap = {
	FieldOrigin: "",
	FieldDestination: ""
};
dg.newScrapperMode = ko.observable('');
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.dataSourcesData = ko.observableArray([]);
dg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 110 },
	{ field: "DataSourceOrigin", title: "Data Source Origin" },
	{ field: "DataSourceDestination", title: "Data Source Destination" },
	{ title: "", width: 100, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-primary' onclick='dg.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='dg.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
	} },
]);
dg.fieldOfDataSourceOrigin = ko.computed(function () {
	var ds = Lazy(dg.dataSourcesData()).find({ 
		_id: dg.configScrapper.DataSourceOrigin() 
	});

	if (ds == undefined) {
		return [];
	}

	return ds.MetaData;
}, dg);
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
	dg.scrapperData(dg.sampleScrapperData);
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
	dg.newScrapperMode('');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);
	dg.addMap();
};
dg.saveDataGrabber = function () {
	if (!app.isFormValid(".form-datagrabber")) {
		return;
	}

	var paramscrapper = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/savedatagrabber", paramscrapper, function (res) {
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
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);

	// app.ajaxPost(dg.sampleScrapperData, {_id: _id},
	// 	function(res) {
	// 		if(!app.isFine(res)) {
	// 			return;
	// 		}

	// 		app.mode("editor");
	// 		dg.scrapperMode('editor');
	// 		app.resetValidation("#form-add-scrapper");
	// 		ko.mapping.fromJS(res.data, dg.configScrapper);
	// 		dg.addSetting();
	// 	});
	// };	
	app.mode("editor");
	dg.scrapperMode('editor');
	app.resetValidation("#form-add-scrapper");

};
dg.addSetting = function () {
	var setting = $.extend(true, {}, ds.templateConfigScrapper);
	setting.id = "s" + moment.now();
	dg.configScrapper.Settings.push(setting);
}
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
		app.ajaxPost("",{ _id: _id },
			function(res) {
				if (!app.isFine(res)) {
					return;
				}
				dg.backToFrontPage();
				swal({ title: "Data successfully deleted", type: "success"});
			});
	});
};
dg.backToFrontPage = function () {
	app.mode('');
	dg.getScrapperData();
	dg.getDataSourceData();
};
$(function () {
	dg.getScrapperData();
	dg.getDataSourceData();
});
