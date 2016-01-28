app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;

wg.scrapperMode = ko.observable('');
wg.scrapperData = ko.observableArray([]);
wg.isContentFetched = ko.observable(false);
wg.templateConfigScrapper = {
	_id: "",
	CallType: "get",
	IntervalType: "",
	SourceType: "http",
	IntervalDuration: 0,
	TimeoutDuration: 0,
	URL: "",
	Parameter: {},
};
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 110 },
	{ field: "CallType", title: "Request Type" },
	{ field: "IntervalType", title: "Interval Unit" },
	{ field: "SourceType", title: "Source Type" },
	{ field: "IntervalDuration", title: "Interval Duration" },
	{ field: "TimeoutDuration", title: "Timeout Duration" },
	{ title: "", width: 100, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-primary' onclick='wg.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='wg.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
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
	
	var param = ko.mapping.toJS(wg.configScrapper);
	app.ajaxPost("/webgrabber/fetchcontent", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.isContentFetched(true);
		wg.writeContent(res.data);
	});
};
wg.saveNewScrapper = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
};

$(function () {
	wg.getScrapperData();
});