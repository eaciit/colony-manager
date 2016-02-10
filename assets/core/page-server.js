viewModel.servers = {}; var srv = viewModel.servers;
srv.templateConfigServer = {
	_id: "",
	AppsName: "",
	Enable: false,
	AppPath: ""
};
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Server Name", width: 130},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='srv.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Server' onclick='srv.removeServer(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },	
]);

srv.getApplications = function() {
	srv.ServerData([
		{_id:"x097",AppsName:"Server 20338"},
		{_id:"x098",AppsName:"Server 20339"},
		{_id:"x099",AppsName:"Server 20340"}
	]);
	// app.ajaxPost("/servers/getsrvs", {}, function (res) {
	// 	if (!app.isFine(res)) {
	// 		return;
	// 	}

	// 	srv.ServerData(res.data);
	// });
};

srv.createNewServer = function () {
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
};

srv.backToFront = function () {
	app.mode('');
	srv.getApplications();
};

srv.getApplications();