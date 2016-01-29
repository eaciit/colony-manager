app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.isContentFetched = ko.observable(false);
dg.templateConfigScrapper = {
	_id: "",
	CallType: "get",
	IntervalType: "",
	SourceType: "http",
	GrabInterval: 0,
	TimeoutInterval: 0,
	URL: "",
	// Parameter: ko.observable({}),
};

dg.templateScrapperPayload = {
	key: "",
	value: ""
};
dg.scrapperPayloads = ko.observableArray([]);
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 110 },
	{ field: "DataSourceOrigin", title: "Data Source Origin" },
	{ field: "DataSourceDestination", title: "Data Source Destination" },
	{ title: "", width: 100, attributes: { style: "text-align: center;" }, template: function (d) {
		return "<button class='btn btn-sm btn-primary' onclick='dg.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button> <button class='btn btn-sm btn-danger' onclick='dg.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
	} },
]);

dg.sampleDataSource = ko.observableArray([
	{ _id: "DS01", DataSourceName: "Data Source 1", MetaData: ["ID", "Name", "Age", "Title"] },
  	{ _id: "DS02", DataSourceName: "Data Source 2", MetaData: ["_id", "Title", "Cover"] },
  	{ _id: "DS03", DataSourceName: "Data Source 3", MetaData: ["ID", "Full Name", "Age"] }
]);

dg.getScrapperData = function (){
	dg.scrapperData(dg.sampleScrapperData);
	
};

dg.sampleScrapperData = ko.observableArray([
  { _id: "WG02", DataSourceOrigin: "DS01", DataSourceDestination: "DS02", Map: [
    { fieldOrigin: "ID", fieldDestination: "_id" },
  ] },
  { _id: "WG03", DataSourceOrigin: "DS03", DataSourceDestination: "DS02", Map: [] },
]);

dg.editScrapper = function (_id) {

};
dg.removeScrapper = function (_id) {

};

dg.createNewScrapper = function () {
	app.mode("editor");
	dg.scrapperMode('');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);
	dg.isContentFetched(false);
	dg.scrapperPayloads([]);
	dg.addScrapperPayload();
};
dg.backToFront = function () {
	app.mode("");
};
dg.writeContent = function (html) {
	var contentDoc = $("#content-preview")[0].contentWindow.document;
	contentDoc.open();
	contentDoc.write(html);
	contentDoc.close();
}
dg.getURL = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
	// dg.encodePayload();
	var param = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/fetchcontent", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.isContentFetched(true);
		dg.writeContent(res.data);
	});
};
dg.saveNewScrapper = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
};
dg.addScrapperPayload = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, dg.templateScrapperPayload));
	dg.scrapperPayloads.push(item);
};
dg.removeScrapperPayload = function (index) {
	return function () {
		var item = dg.scrapperPayloads()[index];
		dg.scrapperPayloads.remove(item);
	};
};
dg.encodePayload = function () {
	dg.configScrapper.Parameter({});

	var p = {};
	dg.scrapperPayloads().forEach(function (e) {
		p[e.key()] = app.couldBeNumber(e.value());
	});
	dg.configScrapper.Parameter(p);
};
dg.decodePayload = function () {
	wg.scrapperPayloads([]);

	var param = dg.configScrapper.Parameter();
	for (var key in param) {
		if (param.hasOwnProperty(key)) {
			dg.scrapperPayloads.push({ key: key, value: param[key] });
		}
	}
};

$(function () {
	dg.getScrapperData();
});