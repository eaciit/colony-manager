viewModel.servers = {}; var srv = viewModel.servers;
srv.templateOS = ko.observableArray([
	{ value: "windows", text: "Windows" },
	{ value: "linux", text: "Linux" }
]);
srv.templateConfigServer = {
	_id: "",
	type: "",
	folder: "",
	os: "",
	enable: false,
	sshtype: "",
	sshfile: "",
	sshuser: "",
	sshpass:  "",
	cmdextract: "",
	cmdnewfile: "",
	cmdcopy: "",
	cmddir: ""
};
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80, template:function (d) { return ["<a onclick='srv.editServer(\"" + d._id + "\")'>" + d._id + "</a>"]} },
	{ field: "type", title: "Type", width: 80},
	{ field: "os", title: "OS", width: 80},
	{ field: "folder", title: "Folder", width: 80},
	{ field: "enable", title: "Enable", width: 80},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Server' onclick='srv.removeServer(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },	
]);

srv.getServers = function() {
	srv.ServerData([]);
	app.ajaxPost("/server/getservers", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		srv.ServerData(res.data);
	});
};

srv.createNewServer = function () {
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
};

// ds.getParamForSavingServer = function () {
// 	var param = ko.mapping.toJS(ds.confDataSource);
// 	param.MetaData = JSON.stringify(param.MetaData);
// 	param.QueryInfo = JSON.stringify(qr.getQuery());
// 	return param;
// };

// srv.saveServer = function (c) {
// 	if (!app.isFormValid(".form-server")) {
// 		return;
// 	}

// 	var param = srv.getParamForSavingServer();
// 	app.ajaxPost("/server/saveserver", param, function (res) {
// 		if (!app.isFine(res)) {
// 			return;
// 		}

// 		ko.mapping.fromJS(res.data, srv.confDataSource);
// 		if (typeof c !== "undefined") c(res);
// 	});
// };

srv.saveNewServer = function(){
	if (!app.isFormValid(".form-server")) {
		return;
	}

	// if (!qr.validateQuery()) {
	// 	return;
	// }
	app.ajaxPost("/server/saveservers", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
	});
	swal({title: "Server successfully created", type: "success",closeOnConfirm: true
	});
	srv.backToFront()

	// var _id = srv.confServer._id();
	// srv.saveServer(function (res) {
	// 	ko.mapping.fromJS(res.data.data, srv.confServer);

	// 	if (_id == "") {
	// 		var queryInfo = ko.mapping.toJS(srv.confServer).QueryInfo;
	// 		if (queryInfo.hasOwnProperty("from")) {
	// 			ds.fetchServerMetaData(queryInfo.from);
	// 		}
	// 	}
	// });
};

srv.editServer = function (_id) {
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	app.ajaxPost("/server/selectservers", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		console.log(res)
		app.mode('editor');
		srv.ServerMode('edit');
		ko.mapping.fromJS(res.data, srv.configServer);
	});
}

srv.removeServer = function (_id) {
	swal({
		title: "Are you sure?",
		text: 'Server with id "' + _id + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: false
	},
	function() {
		setTimeout(function () {
			app.ajaxPost("/server/deleteservers", { _id: _id }, function () {
				if (!app.isFine) {
					return;
				}

				srv.backToFront()
				swal({title: "Server successfully deleted", type: "success"});
			});
		},1000);
	});
}

srv.backToFront = function () {
	app.mode('');
	srv.getServers();
};


$(function () {
    srv.getServers();
});