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
srv.filterValue = ko.observable('');
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.showServer = ko.observable(true);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ title: "", width:10, template: function (d) {
		return [
			"<input type='checkbox' id='servercheck' class='servercheck' data-bind='checked: ' />"
		].join(" ");
	} },
	// { field: "_id", title: "ID", width: 80, template:function (d) { return ["<a onclick='srv.editServer(\"" + d._id + "\")'>" + d._id + "</a>"]} },
	{ field: "_id", title: "ID", width: 80 },
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
	var grid = $(".grid-server").data("kendoGrid");
	$(grid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
	});
	$(grid.tbody).on("mouseleave", "tr", function (e) {
	    $(this).removeClass("k-state-hover");
	});
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
	srv.showServer(false);
};

srv.saveServer = function(){
	if (!app.isFormValid(".form-server")) {
		return;
	}

	// if (!qr.validateQuery()) {
	// 	return;
	// }
	var data = ko.mapping.toJS(srv.configServer);
	app.ajaxPost("/server/saveservers", data, function (res) {
		if (!app.isFine(res)) {
			return;
		}
	});
	swal({title: "Server successfully created", type: "success",closeOnConfirm: true
	});
	srv.backToFront()
};

srv.selectGridServer = function(e){
	var grid = $(".grid-server").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	srv.editServer(selectedItem._id);
	srv.showServer(true);
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

srv.removeServer = function(_id) {
	_id = "lagi"
	if ($('#servercheck').is(':checked') == true) {
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
			text: 'Application(s) with id "' + _id + '" will be deleted',
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
	};	
};

srv.getUploadFile = function() {
	$('#fileserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

function ServerFilter(event){
	app.ajaxPost("/server/serversfilter", {inputText : srv.filterValue()}, function(res){
		if(!app.isFine(res)){
			return;
		}

		if (!res.data) {
			res.data = [];
		}

		srv.ServerData(res.data);
	});
}

srv.backToFront = function () {
	app.mode('');
	srv.getServers();
};

$(function () {
    srv.getServers();
});