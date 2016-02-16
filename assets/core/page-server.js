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
	host: "",
	sshtype: "",
	sshfile: "",
	sshuser: "",
	sshpass:  "",
	cmdextract: "",
	cmdnewfile: "",
	cmdcopy: "",
	cmddir: ""
};
srv.templatetype = ko.observableArray([
	{ value: "Local", text: "Local" },
	{ value: "Remote", text: "Remote" }
]);
srv.templatetypeSSH = ko.observableArray([
	{ value: "Credentials", text: "Credentials" },
	{ value: "File", text: "File" }
]);
selectedSSH = ko.observable();
srv.showFile = ko.observable(true);
srv.showUserPass = ko.observable(true);
srv.filterValue = ko.observable('');
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.showServer = ko.observable(true);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.tempCheckIdServer = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ headerTemplate: "<input type='checkbox' class='servercheckall' onclick=\"srv.checkDeleteServer(this, 'serverall', 'all')\"/>", width:8, template: function (d) {
		return [
			"<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"srv.checkDeleteServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "ID", width: 80 },
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
		var grid = $(".grid-server").data("kendoGrid");
		$(grid.tbody).on("mouseenter", "tr", function (e) {
		    $(this).addClass("k-state-hover");
		});
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});
	});
};

srv.createNewServer = function () {
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	srv.showServer(false);
    srv.showFileUserPass();
};

srv.saveServer = function(){
	if (!app.isFormValid(".form-server")) {
		return;
	}

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
		
		app.mode('editor');
		srv.ServerMode('edit');
		ko.mapping.fromJS(res.data, srv.configServer);
	});
}

srv.checkDeleteServer = function(elem, e){
	if (e === 'serverall'){
		if ($(elem).prop('checked') === true){
			$('.servercheck').each(function(index) {
				$(this).prop("checked", true);
				srv.tempCheckIdServer.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.servercheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				srv.tempCheckIdServer.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			srv.tempCheckIdServer.push($(elem).attr('idcheck'));
		} else {
			srv.tempCheckIdServer.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}

var vals = [];
srv.removeServer = function(){
	if (srv.tempCheckIdServer().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any server to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	} else {
		// vals = $('input:checkbox[name="select[]"]').filter(':checked').map(function () {
		// return this.value;
		// }).get();
		swal({
			title: "Are you sure?",
			text: 'Server with id "' + srv.tempCheckIdServer().toString() + '" will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: false
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/server/deleteservers", srv.tempCheckIdServer(), function () {
					if (!app.isFine) {
						return;
					}

					srv.backToFront();
					swal({title: "Server successfully deleted", type: "success"});
				});
			},1000);

		});
	} 
	
}

srv.getUploadFile = function() {
	$('#uploadserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#upload-name').val(filename);
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
	$("#selectall").attr("checked",false)
};

srv.getServerFile = function() {
	$('#fileserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

srv.showFileUserPass = function (){	
	if ($("#type-ssh").val() === 'Credentials') {
		srv.showFile(false);
		srv.showUserPass(true);
	}else{
		srv.showFile(true);
		srv.showUserPass(false);
	};
}

$(function () {
    srv.getServers();
});