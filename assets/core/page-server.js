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
	{ title: "", width:10, template: function (d) {
		return [
			"<input type='checkbox' id='servercheck' class='servercheck' data-bind='checked: ' />"
			// "<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
		].join(" ");
	} },
	{ field: "_id", title: "ID", width: 80},
	{ field: "type", title: "Type", width: 80},
	{ field: "os", title: "OS", width: 80},
	{ field: "folder", title: "Folder", width: 80},
	{ field: "enable", title: "Enable", width: 80},
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

srv.editServer = function(_id) {
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	app.ajaxPost("/server/selectserver", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode('editor');
		server.serverMode('edit');
		ko.mapping.fromJS(res.data, srv.configServer);
	});
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

srv.saveServer = function(){
	if (!app.isFormValid(".form-server")) {
		return;
	}

	if (!qr.validateQuery()) {
		return;
	}

	var data = ko.mapping.toJS(srv.configServer);
	var formData = new FormData();
	
	formData.append("Enable", data.Enable); 
	formData.append("userfile", $('input[type=file]')[0].files[0]);
	formData.append("id", data._id);
	
	var request = new XMLHttpRequest();
	request.open("POST", "/Server/saveServer");
	request.send(formData);

	swal({title: "Server successfully created", type: "success",closeOnConfirm: true
	});
	srv.backToFront()};

srv.getUploadFile = function() {
	$('#fileserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

srv.backToFront = function () {
	app.mode('');
	srv.getServers();
};

$(function () {
    srv.getServers();
    srv.getUploadFile();
});