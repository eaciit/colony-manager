viewModel.servers = {}; var srv = viewModel.servers;
srv.templateOS = ko.observableArray([
	{ value: "windows", text: "Windows" },
	{ value: "linux", text: "Linux/Darwin" }
]);
srv.templateConfigServer = {
	_id: "",
	os: "linux",
	appPath: "",
	dataPath: "",
	host: "",
	serverType: "node",
	sshtype: "Credentials",
	sshfile: "",
	sshuser: "",
	sshpass:  "",	
	cmdextract:"",
	cmdnewfile :"",
	cmdcopy:"",
	cmdmkdir:"",
};
srv.templatetypeServer = ko.observableArray([
	{ value: "node", text: "Node Server" },
	{ value: "hadoop", text: "Hadoop Server" }
]);
srv.templatetypeSSH = ko.observableArray([
	{ value: "Credentials", text: "Credentials" },
	{ value: "File", text: "File" }
]);
srv.WizardColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' id='selectall' onclick=\"srv.checkWizardServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='wizardcheck' idcheck='"+d._id+"' onclick=\"srv.checkWizardServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "host", title: "Host", width: 200, template: function (d) {
		var comps = d.host.split(":");
		if (comps.length > 1) {
			if (comps[1] == "80") {
				return comps[0];
			}
		} 

		return d.host;
	} },
	{ field: "status", title: "Status" }
]);
srv.isNew = ko.observable(false);
srv.dataWizard = ko.observableArray([]);
srv.validator = ko.observable('');
srv.txtWizard = ko.observable('');
srv.showModal = ko.observable('modal1');
srv.filterValue = ko.observable('');
srv.filterSrvSSHType = ko.observable('');
srv.filterSrvOS = ko.observable('');
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.showServer = ko.observable(true);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.tempCheckIdServer = ko.observableArray([]);
srv.tempCheckIdWizard = ko.observableArray([]);
srv.searchfield = ko.observable('');
srv.ServerColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' id='selectall' onclick=\"srv.checkDeleteServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"srv.checkDeleteServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "ID" },
	{ field: "serverType", title: "Type", template: "#: serverType # server" },
	{ field: "host", title: "Host" },
	{ field: "os", title: "OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	{ field: "sshtype", title: "SSH Type"},
	{ title: "", width: 80, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' onclick='srv.doTestConnection(\"" + d._id + "\")' title='Test Connection'><span class='fa fa-info-circle'></span></button>"
		].join(" ");
	} },
	// { field: "appPath", title: "App Path" },
	// { field: "dataPath", title: "Data Path" },
	// { field: "enable", title: "Enable" },
]);

srv.getServers = function(c) {
	srv.ServerData([]);
	app.ajaxPost("/server/getservers", {search: srv.searchfield}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
		}
		srv.ServerData(res.data);
		var grid = $(".grid-server").data("kendoGrid");
		// $(grid.tbody).on("mouseenter", "tr", function (e) {
		//     $(this).addClass("k-state-hover");
		// });
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (c != undefined) {
			c(res);
		}
	});
};

srv.createNewServer = function () {
	srv.isMultiServer(false);
	srv.isNew(true);
	$("#privatekey").replaceWith($("#privatekey").clone());
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	srv.showServer(false);
};
srv.doSaveServer = function (c) {
	if (!app.isFormValid(".form-server")) {
		var errors = $(".form-server").data("kendoValidator").errors();
		if (srv.isMultiServer()) {
			errors = Lazy(errors).filter(function (d) {
				return ["ID is required", "host is required"].indexOf(d) == -1;
			}).toArray();
		}

		errors = Lazy(errors).filter(function (d) {
			return ["user is required", "password is required"].indexOf(d) == -1;
		}).toArray();

		if (errors.length > 0) {
			return;
		}
	}

	var data = ko.mapping.toJS(srv.configServer);

	if (srv.configServer.sshtype() == "File") {
		var file = $("#privatekey")[0].files[0];
		var payload = ko.mapping.toJS(srv.configServer);
		var data = new FormData();
		for (var key in payload) {
			if (payload.hasOwnProperty(key)) {
				data.append(key, payload[key])
			}
		}
		data.append("privatekey", file);
	}

	if (srv.isMultiServer()) {
		var failedHosts = [];
		var ajaxes = [];

		srv.ipToRegister().forEach(function (d) {
			var eachData = $.extend(true, data, { });
			eachData.host = d;
			eachData._id = ["server", d, moment(new Date()).format("x")].join("-");

			var ajax = app.ajaxPost("/server/saveservers", eachData, function (res) {
				if (!res.success) {
					return;
				}

				failedHosts.push(d);
			}, function (a) {
				failedHosts.push(d);
			}, {
				timeout: 5000
			});

			ajaxes.push(ajax);
		});

		var callback = function () {
			srv.isNew(true);

			if (failedHosts.length > 0) {
				swal({
					title: ["All servers registered! except", failedHosts.join(", ")].join(" "), 
					type: "success",
					closeOnConfirm: true
				});
				srv.backToFront();
				return;
			}

			swal({
				title: "All servers registered!", 
				type: "success",
				closeOnConfirm: true
			});
			srv.backToFront();
		};

		$.when.apply(undefined, ajaxes).then(callback, callback);
	} else {
		app.ajaxPost("/server/saveservers", data, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			srv.isNew(true);
			if (typeof c != "undefined") {
				c();
			}
		});
	}
}
srv.isServerTypeNode = ko.computed(function () {
	return srv.configServer.serverType() == "node";
}, srv);
srv.changeServerOS = function () {
	if (this.value() == "node") {
		srv.configServer.os("linux");
	}
};
srv.saveServer = function(){
	srv.doSaveServer(function () {
		srv.getServers();
		apl.getApplications();
		swal({title: "Server successfully created", type: "success", closeOnConfirm: true});
	});
};

srv.selectGridServer = function (e) {
	srv.isNew(false);
	app.wrapGridSelect(".grid-server", ".btn", function (d) {
		srv.editServer(d._id);
		srv.showServer(true);
	});
};

srv.editServer = function (_id) {
	srv.isMultiServer(false);
	$("#privatekey").replaceWith($("#privatekey").clone());

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
srv.doTestConnection = function (_id) {
	if (_id != undefined) {
		if (srv.isNew()) {
			sweetAlert("Oops...", "Please save the server first", "error");
			return;
		}
	}

	_id = (_id == undefined) ? srv.configServer._id() : _id;
	app.ajaxPost("/server/testconnection", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		
		swal({title: "Connected", type: "success"});
	});
};
srv.testConnection = function () {
	srv.doTestConnection(srv.configServer._id());
};

srv.checkWizardServer = function (elem, e) {
	if (e === 'serverall'){
		if ($(elem).prop('checked') === true){
			$('.wizardcheck').each(function(index) {
				$(this).prop("checked", true);
				srv.tempCheckIdWizard.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.wizardcheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				srv.tempCheckIdWizard.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			srv.tempCheckIdWizard.push($(elem).attr('idcheck'));
		} else {
			srv.tempCheckIdWizard.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
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
	srv.isMultiServer(false);
	srv.isNew(false);
	app.mode('');
	srv.getServers();
	$("#selectall").attr("checked",false)
};
srv.popupWizard = function () {
	$(".modal-wizard").modal("show");
	srv.showModal('modal1');
	srv.txtWizard('');
	srv.dataWizard([]);
}

srv.validate = function () {
	if (!app.isFormValid("#form-wizard")) {
		return;
	}
}

srv.dataBoundWizard = function () {
	var $sel = $(".grid-data-wizard");
	var $grid = $sel.data("kendoGrid");
	var ds = $grid.dataSource;

	ds.data().forEach(function (e) {
		var $row = $sel.find("tr[data-uid='" + e.uid + "']");
		$row.removeClass("ok not-ok");

		if (e.status == "OK") {
			$row.addClass("ok");
		} else {
			$row.addClass("not-ok");
		}
	});
};
srv.navModalWizard = function (status) {
	if(status == 'modal2' && srv.txtWizard() !== '' ){
		if (!app.isFormValid("#form-wizard")) {
			return;
		}	

		srv.dataWizard([]);
		srv.txtWizard().replace( /\n/g, " " ).split( " " ).forEach(function (e) {
			var ip = (e.indexOf(":") == -1) ? (e + ":80") : e;
			var pattern = srv.txtWizard().replace(/\]|\[/g, "").split('.')[3];
			var firstPattern = pattern.split('-')[0];
			var secondPattern = pattern.split('-')[1];
			
			app.ajaxPost("/server/checkping", { ip: ip }, function (res) {
				app.isLoading(true);
				var o = { 
					host: ip, 
					status: res.data 
				};

				if (!res.success) {
					o.status = res.message;
				}

				srv.dataWizard.push(o);
			}, function () { 
				var o = { 
					host: ip, 
					status: "request timeout"
				};

				srv.dataWizard.push(o);
			}, {
				timeout: 5000
			});
		});
		
		$(document).ajaxStop(function() {
		  app.isLoading(false);
		});

		srv.showModal(status);
	}else if(status == 'modal1'){
		srv.showModal(status);
		srv.dataWizard([]);		
	}
};

srv.isMultiServer = ko.observable(false);
srv.ipToRegister = ko.observableArray([]);
srv.ipToRegisterAsString = ko.computed(function () {
	return srv.ipToRegister().join("\n");
});

srv.finishButton = function () {
	srv.ipToRegister([]);

	var $grid = $(".grid-wizard").data("kendoGrid");
	$(".wizardcheck:checked").each(function (i, e) {
		var uid = $(e).closest("tr").attr("data-uid");
		var rowData = $grid.dataSource.getByUid(uid);

		srv.ipToRegister.push(rowData.host);
	});

	if (srv.ipToRegister().length == 0) {
		sweetAlert("Oops...", "Please check at least one IP address", "error");
		return;
	}

	$(".modal-wizard").modal("hide");
	srv.createNewServer();
	srv.isMultiServer(true);
};

$(function () {
    srv.getServers();
	app.registerSearchKeyup($(".searchsrv"), srv.getServers);
});