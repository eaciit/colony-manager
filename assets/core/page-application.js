app.section('scrapper');

viewModel.application = {}; var apl = viewModel.application;

apl.templateConfigScrapper = {
	_id: "",
	Enable: false,
	AppPath: ""
};

apl.configScrapper = ko.mapping.fromJS(apl.templateConfigScrapper);
apl.scrapperMode = ko.observable('');
apl.scrapperData = ko.observableArray([]);
apl.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Application Name", width: 130},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='apl.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Application' onclick='apl.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Application' onclick='apl.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" }
	
]);

apl.getApplications = function() {
	apl.scrapperData([]);
	app.ajaxPost("/application/getapps", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		apl.scrapperData(res.data);
	});
};

apl.editScrapper = function(_id) {
	ko.mapping.fromJS(apl.templateConfigScrapper, apl.configScrapper);
	app.ajaxPost("/application/selectapps", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode('editor');
		apl.scrapperMode('editor');
		ko.mapping.fromJS(res.data, apl.configScrapper);
	});
};

apl.createNewScrapper = function () {
	//alert("masuk create");
	app.mode("editor");
	apl.scrapperMode('');
	ko.mapping.fromJS(apl.templateConfigScrapper, apl.configScrapper);
	//apl.addMap();
};

apl.saveScrapper = function(){
	var data = ko.mapping.toJS(apl.configScrapper);
	//console.log("======data"+JSON.stringfy(data));
	app.ajaxPost("/application/saveapps", data, function(res) {
		if (!app.isFine(res)) {
			return;
		}
	});
};

apl.backToFront = function () {
	app.mode("");
};




$(function () {
	apl.getApplications();
	$("#files").kendoUpload();
    $("#files").closest(".k-upload").find("span").text("Upload zip file here");
    $(".k-button.k-upload-button").addClass("btn btn-primary");
});