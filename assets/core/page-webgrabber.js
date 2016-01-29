app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;

wg.scrapperMode = ko.observable('');
wg.modeSetting = ko.observable(0);
wg.modeSelector = ko.observable("");
wg.scrapperData = ko.observableArray([]);
wg.isContentFetched = ko.observable(false);
wg.templateConfigScrapper = {
	_id: "",
	CallType: "get",
	IntervalType: "",
	SourceType: "http",
	GrabInterval: 0,
	TimeoutInterval: 0,
	Parameter: ko.observable([]),
	URL: "http://www.shfe.com.cn/en/products/Gold/",
	Parameter: ko.observable([]),
};
wg.templateConfigSelector = {
	SelectorName: "",
	RowSelector: "",
	SelectorSetting: {
		ColumnSetting: [],
		FilterCond: "",
		DestinationType: "Mongo",
		Host: "",
		Database: "",
		Collection: "",
		FileName: "",
		UseHeader: true,
		Delimiter: ","
	}
}
wg.templateStepSetting = ko.observableArray(["Set Up", "Data Setting", "Preview"]);
wg.templateIntervalType = [{key:"s",value:"seconds"},{key:"m",value:"minutes"},{key:"h",value:"hours"}];
wg.templateFilterCond = ["Add", "OR", "NAND", "NOR"];
wg.templateDestinationType = ["Mongo", "CSV"];
wg.templateColumnType = [{key:"string",value:"string"},{key:"float",value:"float"},{key:"integer",value:"integer"}, {key:"date",value:"date"}];
wg.templateScrapperPayload = {
	key: "",
	value: ""
};
wg.scrapperPayloads = ko.observableArray([]);
wg.selectorRowSetting = ko.observableArray([]);
// wg.columnSettingSelector = ko.observableArray([]);
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.configSelector = ko.mapping.fromJS(wg.templateConfigSelector);
wg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 110 },
	{ field: "CallType", title: "Request Type" },
	{ field: "IntervalType", title: "Interval Unit" },
	{ field: "SourceType", title: "Source Type" },
	{ field: "GrabInterval", title: "Interval Duration" },
	{ field: "TimeoutInterval", title: "Timeout Duration" },
	{ title: "", width: 130, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-success' onclick='wg.startStopScrapper(\"" + d._id + "\")' title='Start Grabber'><span class='fa fa-play'></span></button> <button class='btn btn-sm btn-primary' onclick='wg.editScrapper(\"" + d._id + "\")' title='Edit Grabber'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='wg.removeScrapper(\"" + d._id + "\")' title='Delete Grabber'><span class='glyphicon glyphicon-remove'></span></button>"
	} },
]);
wg.dataSourceTypes = ko.observableArray([
	{ value: "http", title: "HTTP / Web" },
	{ value: "dbox", title: "Data File" },
]);
wg.dataRequestTypes = ko.observableArray([
	{ value: "get", title: "GET" },
	{ value: "post", title: "POST" },
]);

wg.editScrapper = function (_id) {

};
wg.removeScrapper = function (_id) {

};
wg.getScrapperData = function () {
	wg.scrapperData([]);
	app.ajaxPost("/webgrabber/getscrapperdata", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.scrapperData(res.data);
	});
};
wg.createNewScrapper = function () {
	app.mode("editor");
	wg.scrapperMode('');
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
	wg.isContentFetched(false);
	wg.scrapperPayloads([]);
	wg.addScrapperPayload();
};
wg.backToFront = function () {
	app.mode("");
};
wg.writeContent = function (html) {
	var contentDoc = $("#content-preview")[0].contentWindow.document;
	contentDoc.open();
	contentDoc.write(html);
	contentDoc.close();
}
wg.getURL = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
	// wg.encodePayload();
	var param = ko.mapping.toJS(wg.configScrapper);
	app.ajaxPost("/webgrabber/fetchcontent", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.isContentFetched(true);
		wg.writeContent(res.data);
		wg.modeSetting(1);
	});
};
wg.saveNewScrapper = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
};
wg.addScrapperPayload = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, wg.templateScrapperPayload));
	wg.scrapperPayloads.push(item);
};
wg.removeScrapperPayload = function (index) {
	return function () {
		var item = wg.scrapperPayloads()[index];
		wg.scrapperPayloads.remove(item);
	};
};
wg.encodePayload = function () {
	wg.configScrapper.Parameter({});

	var p = {};
	wg.scrapperPayloads().forEach(function (e) {
		p[e.key()] = app.couldBeNumber(e.value());
	});
	wg.configScrapper.Parameter(p);
};
wg.decodePayload = function () {
	wg.scrapperPayloads([]);

	var param = wg.configScrapper.Parameter();
	for (var key in param) {
		if (param.hasOwnProperty(key)) {
			wg.scrapperPayloads.push({ key: key, value: param[key] });
		}
	}
};
wg.startStopScrapper = function (_id) {
	app.ajaxPost("/webgrabber/startstopscrapper", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		console.log(res);
	});
};
wg.nextSetting = function(){
	wg.modeSetting(wg.modeSetting()+1);
};
wg.backSetting = function(){
	wg.modeSetting(wg.modeSetting()-1);
};
wg.addSelectorSetting = function(){
	wg.selectorRowSetting.push(wg.configSelector);
}
wg.removeSelectorSetting = function(){

}
wg.showSelectorSetting = function(index,nameSelector){
	wg.modeSelector("edit");
}
wg.backSettingSelector = function(){
	wg.modeSelector("");
}
wg.saveSettingSelector = function(){
	wg.modeSelector("");
}
wg.addColumnSetting = function(){
	wg.configSelector.SelectorSetting.ColumnSetting.push({Alias: "", Type: "", Selector: ""});
}

$(function () {
	wg.getScrapperData();
});