app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;

wg.scrapperMode = ko.observable('');
wg.modeSetting = ko.observable(0);
wg.modeSelector = ko.observable("");
wg.tempIndexColumn = ko.observable(0);
wg.scrapperData = ko.observableArray([]);
wg.isContentFetched = ko.observable(false);
wg.templateConfigScrapper = {
	nameid: "",
	calltype: "GET",
	intervaltype: "",
	sourcetype: "http",
	grabinterval: 0,
	timeoutinterval: 0,
	url: "http://www.shfe.com.cn/en/products/Gold/",
	logconf: {
		filename: "",
		filepattern: "",
		logpath: ""
	},
	grabconf: {},
	datasettings: []
};
wg.templateDataSetting = {
	rowselector: "",
	columnsettings: [],
	rowdeletecond: {},
	rowincludecond: {},
	connectioninfo: {
		host: "",
		database: "",
		username: "",
		password: "",
		settings: "",
		collection: ""
	},
	desttype: "",
	name: ""
};
wg.templateColumnSetting = {
	alias: "",
	index: "",
	selector: "",
	valuetype: ""
}
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
wg.templateintervaltype = [{key:"s",value:"seconds"},{key:"m",value:"minutes"},{key:"h",value:"hours"}];
wg.templateFilterCond = ["Add", "OR", "NAND", "NOR"];
wg.templateDestinationType = ["Mongo", "CSV"];
wg.templateColumnType = [{key:"string",value:"string"},{key:"float",value:"float"},{key:"integer",value:"integer"}, {key:"date",value:"date"}];
wg.templateScrapperPayload = {
	key: "",
	value: ""
};
wg.scrapperPayloads = ko.observableArray([]);
wg.selectorRowSetting = ko.observableArray([]);
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.configSelector = ko.mapping.fromJS(wg.templateConfigSelector);
wg.scrapperColumns = ko.observableArray([
	{ field: "nameid", title: "ID", width: 110 },
	{ field: "calltype", title: "Request Type" },
	{ field: "intervaltype", title: "Interval Unit" },
	{ field: "sourcetype", title: "Source Type" },
	{ field: "grabinterval", title: "Interval Duration" },
	{ field: "timeoutinterval", title: "Timeout Duration" },
	{ title: "", width: 130, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-success' onclick='wg.startStopScrapper(\"" + d.nameid + "\")' title='Start Grabber'><span class='fa fa-play'></span></button> <button class='btn btn-sm btn-primary' onclick='wg.editScrapper(\"" + d.nameid + "\")' title='Edit Grabber'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='wg.removeScrapper(\"" + d.nameid + "\")' title='Delete Grabber'><span class='glyphicon glyphicon-remove'></span></button>"
	} },
]);
wg.dataSourceTypes = ko.observableArray([
	{ value: "http", title: "HTTP / Web" },
	{ value: "dbox", title: "Data File" },
]);
wg.dataRequestTypes = ko.observableArray([
	{ value: "GET", title: "GET" },
	{ value: "POST", title: "POST" },
]);

wg.editScrapper = function (nameid) {

};
wg.removeScrapper = function (nameid) {

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
	var baseURL = wg.configScrapper.url().replace(/^((\w+:)?\/\/[^\/]+\/?).*$/,'$1');
	html = html.replace(new RegExp("=\"/", 'g'), "=\"" + baseURL);
	
	var contentDoc = $("#content-preview")[0].contentWindow.document;
	contentDoc.open();
	contentDoc.write(html);
	contentDoc.close();
	return contentDoc;
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
		var doc = wg.writeContent(res.data);
		wg.modeSetting(1);

		var startofbody = res.data.indexOf("<body");
		var endofbody = res.data.indexOf("</body");
		var bodyyo = res.data.substr(startofbody,endofbody-startofbody);
		startofbody = bodyyo.indexOf(">");
		bodyyo = bodyyo.substr(startofbody+1);
		URLSource = $.parseHTML(bodyyo);
		// console.log(URLSource);
		// var editor = CodeMirror($("inspectElement"), {
		//   mode: "text/html",
		//   // styleActiveLine: true,
		//   // lineNumbers: true,
		//   // lineWrapping: true,
		//   readOnly : true,
		//   value: URLSource
		// });
	// console.log(bodyyo);
		$("#inspectElement").replaceWith("<div id='inspectElement'></div>");
		// $("#inspectElement").html(URLSource);
		var editor = CodeMirror(document.getElementById("inspectElement"), {
	        mode: "text/html",
	        lineNumbers: true,
			lineWrapping: true,
	        readOnly : true,
	        value: bodyyo
	      });
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
wg.startStopScrapper = function (nameid) {
	app.ajaxPost("/webgrabber/startstopscrapper", { nameid: nameid }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		console.log(res);
	});
};
wg.nextSetting = function(){
	wg.modeSetting(wg.modeSetting()+1);
	if (wg.selectorRowSetting().length == 0)
		wg.addSelectorSetting();
};
wg.backSetting = function(){
	wg.modeSetting(wg.modeSetting()-1);
};
wg.addSelectorSetting = function(){
	wg.selectorRowSetting.push(ko.mapping.fromJS(wg.templateConfigSelector));
}
wg.removeSelectorSetting = function(each){
	// console.log(ko.mapping.toJS(each));
	var item = wg.selectorRowSetting()[each];
	wg.selectorRowSetting.remove(item);
}
wg.showSelectorSetting = function(index,nameSelector){
	if (wg.selectorRowSetting()[index].SelectorSetting.ColumnSetting().length == 0)
		wg.selectorRowSetting()[index].SelectorSetting.ColumnSetting.push(ko.mapping.fromJS({Alias: "", Type: "", Selector: ""}));

	ko.mapping.fromJS(wg.selectorRowSetting()[index],wg.configSelector);
	wg.tempIndexColumn(index);
	wg.modeSelector("edit");
}
wg.backSettingSelector = function(){
	wg.modeSelector("");
}
wg.saveSettingSelector = function(){
	ko.mapping.fromJS(wg.configSelector,wg.selectorRowSetting()[wg.tempIndexColumn()]);
	wg.modeSelector("");
}
wg.addColumnSetting = function(){
	wg.configSelector.SelectorSetting.ColumnSetting.push(ko.mapping.fromJS({Alias: "", Type: "", Selector: ""}));
}
wg.removeColumnSetting = function(each){
	var item = wg.configSelector.SelectorSetting.ColumnSetting()[each];
	wg.configSelector.SelectorSetting.ColumnSetting.remove(item);
}
wg.GetRowSelector = function(index){
	ko.mapping.fromJS(wg.selectorRowSetting()[index],wg.configSelector);
	wg.tempIndexColumn(index);
	wg.modeSelector("editElement");
}

$(function () {
	wg.getScrapperData();
});