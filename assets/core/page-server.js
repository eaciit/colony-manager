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
	extract: "",
	newfile: "",
	copy: "",
	dir: ""
};
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ title: "", width:10, template: function (d) {
		return [
			"<input type='checkbox' id='servercheck' class='servercheck' data-bind='checked: ' />"
			// "<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
		].join(" ");
	} },
	{ field: "_id", title: "ID", width: 80, template:function (d) { return ["<a onclick='srv.editServer(\"" + d._id + "\")'>" + d._id + "</a>"]} },
	{ field: "type", title: "Type", width: 80},
	{ field: "os", title: "OS", width: 80},
	{ field: "folder", title: "Folder", width: 80},
	{ field: "enable", title: "Enable", width: 80},
	// { title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
	// 	return [
	// 		"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
	// 		"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Server' onclick='srv.removeServer(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
	// 	].join(" ");
	// } },	
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


srv.saveServer = function(){
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

srv.backToFront = function () {
	app.mode('');
	srv.getServers();
};

srv.removeServer = function(_id) {
	if ($('#servercheck').is(':checked') ===false) {
		swal({
			title: "",
			text: 'You havent choose any server to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
			title: "Are you sure?",
			// text: 'Application with id "' + _id + '" will be deleted',
			text: 'Application(s) with will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: false
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/server/deleteserver", { _id: _id }, function () {
					if (!app.isFine) {
						return;
					}

					srv.backToFront()
					swal({title: "Server successfully deleted", type: "success"});
				});
			},1000);
		});
	};	
};

srv.getUploadFile = function() {
	$('#fileserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

$(function () {
    srv.getServers();
});