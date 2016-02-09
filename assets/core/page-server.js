viewModel.servers = {}; var srv = viewModel.servers;
srv.templateConfigScrapper = {
	_id: "",
	AppsName: "",
	Enable: false,
	AppPath: ""
};
srv.configScrapper = ko.mapping.fromJS(srv.templateConfigScrapper);
srv.scrapperMode = ko.observable('');
srv.scrapperData = ko.observableArray([]);
srv.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "srvName", title: "Server Name", width: 130},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='srv.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Server' onclick='srv.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },	
]);

srv.getApplications = function() {
	srv.scrapperData([]);
	app.ajaxPost("/servers/getsrvs", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		srv.scrapperData(res.data);
	});
};

srv.createNewScrapper = function () {
	app.mode("editor");
	srv.scrapperMode('');
	ko.mapping.fromJS(srv.templateConfigScrapper, srv.configScrapper);
};

srv.backToFront = function () {
	app.mode('');
	srv.getApplications();
};