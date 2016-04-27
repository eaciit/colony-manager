viewModel.servers = {}; var srv = viewModel.servers;
srv.templateOS = ko.observableArray([
	{ value: "windows", text: "Windows" },
	{ value: "linux", text: "Linux/Darwin" }
]);
srv.templateConfigServer = $.extend(true, viewModel.templateModels.Server, {
	os: "linux",
	serviceSSH: {
		type: "Credentials"
	},
	serverServices: [],
	cmdextract: "unzip %1 -d %2",
	cmdmkdir: "mkdir"
});
srv.optionTypeSSH = ko.observableArray([
	{ value: "Credentials", text: "Credentials" },
	{ value: "File", text: "File" }
]);
srv.templateFilter = {
	search: "",
	serverOS: "",
};
srv.serverServiceBase = ko.observableArray([]);
srv.serverService = ko.computed(function () {
	var serverServices = [];
	try {
		serverServices = srv.configServer.serverServices();
		serverServices = ([null, undefined].indexOf(serverServices) > -1) ? [] : serverServices;
	} catch (err) {
		serverServices = [];
	}

	return srv.serverServiceBase().map(function (e) {
		serverServices.forEach(function (d) {
			if (e._id == d._id) {
				e.isInstalled = d.isInstalled;
			}
		});

		return e;
	});
}, srv);
srv.serverServiceColumns = [
	{ field: "name", title: "Service Name", template: function (d) {
		return d.name + "<button class='btn btn-sm' style='visibility: hidden;'>&nbsp;</btn>";
	} },
	{ title: "Is Installed?", width: 100, attributes: { class: "status ssh-status yes-no" }, template: function (d) {
		return "<span></span>";
	} },
];
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
srv.computedOS = ko.computed(function() {
	return srv.templateOS().map(function (a) {
		if (a.text == "windows") {
			a.text = "Windows *";
		}
		return a;
	})
}, srv);
srv.isNew = ko.observable(false);
srv.dataWizard = ko.observableArray([]);
srv.validator = ko.observable('');
srv.txtWizard = ko.observable('');
srv.showModal = ko.observable('modal1');
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.filter = ko.mapping.fromJS(srv.templateFilter);
srv.showServer = ko.observable(true);
srv.miniloader = ko.observable(false);
srv.breadcrumb = ko.observable('');
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.tempCheckIdServer = ko.observableArray([]);
srv.tempCheckIdWizard = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' id='selectall' onclick=\"srv.checkDeleteServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"srv.checkDeleteServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "ID" },
	{ field: "os", title: "Server OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	// { field: "host", title: "Host" },
	{ title: "", width: 80, attributes:{class:"align-center"}, template: function(d){
		return[
			"<div class='btn-group btn-sm'><button class='btn btn-sm btn-default btn-primary tooltipster' title='Test Connection' onclick='srv.doTestConnection(\"" + d._id + "\")'><span class='fa fa-info-circle'></span></button></div>",
		].join(" ");
	}},
	{ width: 100, attributes: { class:'status ssh-status on-off' }, template: "<span></span>", headerTemplate: "<center>SSH Status</center>" },
	{ width: 100, attributes: { class:'status hdfs-status on-off' }, template: "<span></span>", headerTemplate: "<center>HDFS Status</center>" }
]);

srv.appserverColumns = ko.observableArray([
	{ field: "_id", title: "ID" },
	{ field: "AppsName", title: "Name" },
	{ field: "Type", title: "Type" },
	{ field: "Port", title: "Running Port" },
	{ width: 70, headerTemplate: "<center>Status</center>",  attributes: { class: "align-center" }, template: function (d) {
		var yo = 0;
		for (i in apl.applicationData()){
			var deployedTo = apl.applicationData()[i].DeployedTo;
			if (typeof deployedTo === "undefined" || deployedTo == null) {
				deployedTo = [];
			}

			if (deployedTo.length > 0){
				var app = ko.utils.arrayFilter(deployedTo, function (yoi) {
					return yoi == srv.configServer._id();
				});
				if (app.length > 0)
					yo = 1;
			} else {
				yo = 0;
			}
		}
		if (yo == 1)
			return "<input type='checkbox' class='statuscheck-srv srv-green' disabled /> ";
		else
			return "<input type='checkbox' class='statuscheck-srv srv-red' disabled />";
	} }
]);

srv.showRunCommand = function (appID) {
	apl.commandData([]);
	var serverMap = ko.mapping.toJS(srv.configServer);
	var appMap = Lazy(apl.applicationData()).find({ _id: appID });

	$(".modal-run-cmd").find(".modal-title span.app").html(appID);
	$(".modal-run-cmd").find(".modal-title span.server").html(serverMap._id);

	appMap.Command.forEach(function (cmd) {
		if (cmd.key == "" || cmd.value == "") {
			return;
		}

		apl.commandData.push({
			CmdName: cmd.key,
			CmdValue: cmd.value
		});
	});

	$(".modal-run-cmd").modal("show");
};

srv.gridStatusColor = function () {
	$grids = $('.grid-aplserver');
	var $grg = $grids.find("tr td .srv-green");
	var $grr = $grids.find("tr td .srv-red");

	if ($grg) {
		$grg.parent().css("background-color", "#5cb85c");
		$grg.prop("checked", true);
	}
	if ($grr) {
		$grr.parent().css("background-color", "#d9534f");
		$grr.prop("checked", false);
	}
}

srv.gridStatusCheck = function () {
	$('.statuscheck-srv').parent().css("background-color", "#d9534f");
	$grid = $('.grid-aplserver');
	var $gr = $grid.find("tr td .statuscheck-srv");
	$gr.change(function(){
		if ($(this).prop('checked') === true){
			$(this).parent().css("background-color", "#5cb85c");
		} else {
			$(this).parent().css("background-color", "#d9534f");
		}
	})
};

srv.getServers = function(c) {
	srv.ServerData([]);
	var param = ko.mapping.toJS(srv.filter);
	app.ajaxPost("/server/getservers", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data = [];;
		}
		srv.ServerData(res.data);
		var grid = $(".grid-server").data("kendoGrid");
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (typeof c == "function") {
			c(res);
		};

		setTimeout(srv.ping, 200);
	});
};

srv.createNewServer = function () {
	srv.isMultiServer(false);
	srv.isNew(true);
	$("#privatekey").replaceWith($("#privatekey").clone());
	srv.breadcrumb('Create New');
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	srv.showServer(false);
    srv.addHostAlias();
};
srv.validateHost = function () {
	srv.configServer._id(srv.configServer._id().split("//").reverse()[0]);
	srv.configServer.serviceSSH.host(srv.configServer.serviceSSH.host().split("//").reverse()[0]);

	if ($.trim(srv.configServer.serviceHDFS.host()) != "") {
		if (srv.configServer.serviceHDFS.host().indexOf("http") == -1) {
			sweetAlert("Oops...", "Protocol on host must be defined (Example: http://127.0.0.1:50070)", "error");
			return false;
		}
	}

	return true;
};
srv.doSaveServer = function (c) {
	if (!app.isFormValid(".form-server")) {
		var errors = $(".form-server").data("kendoValidator").errors();
		var excludeErrors = [];

		// if (srv.configServer.serverType() == "node") {
		// 	if (srv.isMultiServer()) {
		// 		excludeErrors = excludeErrors.concat(["ID is required", "host is required"]);
		// 	}
		// } else {
		// 	excludeErrors = excludeErrors.concat(["apppath is required", "datapath is required", "extract is required", "make-directory is required"]);
		// }

		if (srv.configServer.serviceSSH.type() == "File") {
			excludeErrors = excludeErrors.concat(["user is required", "password is required"]);
		}  else {
			excludeErrors = excludeErrors.concat(["file is required"]);
		}

		errors = Lazy(errors).filter(function (d) {
			return excludeErrors.indexOf(d) == -1;
		}).toArray();

		if (errors.length > 0) {
			return;
		}
	}

	app.miniloader(true);

	if (!srv.validateHost()) {
		return;
	}

	var data = ko.mapping.toJS(srv.configServer);

	if (srv.configServer.serviceSSH.type() == "File") {
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
			console.log(d)
			console.log(eachData.host)
			eachData._id = ["server", d, moment(new Date()).format("x")].join("-");
			var ajax = app.ajaxPost("/server/saveservers", eachData, function (res) {
				if (!res.success) {
					failedHosts.push(d);
					return;
				}
			}, function (a) {
				failedHosts.push(d);
			},{
				timeout : 120000
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
			srv.ping();
		};

		$.when.apply(undefined, ajaxes).then(callback, callback);
	} else {
		app.ajaxPost("/server/saveservers", data, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			srv.isNew(true);
			if (typeof c == "function") {
				c();
			}
			srv.ping();
		});
	}

	$(document).ajaxStop(function() {
		 app.miniloader(false);
	});
};
srv.saveServer = function(){
	srv.doSaveServer(function () {
		srv.isNew(false);
		srv.getServers();
		apl.getApplications();
		swal({title: "Server successfully created", type: "success", closeOnConfirm: true});
		srv.backToFront();
	});
};

srv.selectGridServer = function (e) {
	srv.isNew(false);
	app.wrapGridSelect(".grid-server", ".btn", function (d) {
		if (d.serverType == "node") {
			$('ul#myTab a[href="#Applications-server"]').parent().show();
		} else {
			$('ul#myTab a[href="#Applications-server"]').parent().hide();
		}

		srv.editServer(d._id);
		srv.showServer(true);
		$('#myTab a[href="#Form-server"]').tab('show');
	});
};

srv.editServer = function (_id) {
	srv.gridStatusCheck();
	app.miniloader(true);
	app.showfilter(false);
	srv.breadcrumb('Edit');
	srv.isMultiServer(false);

	$("#privatekey").replaceWith($("#privatekey").clone());

	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	app.ajaxPost("/server/selectservers", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode('editor');
		srv.ServerMode('edit');
        if (res.data.hostAlias == null) {
            res.data.hostAlias = [];
        }
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

	var payload = { };
	if (_id !== undefined) {
		payload = Lazy(srv.ServerData()).find({ _id: _id });
	} else {
		payload = ko.mapping.toJS(srv.configServer);
	}

	app.ajaxPost("/server/pingserver", payload, function(res) {
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

srv.backToFront = function () {
	srv.isMultiServer(false);
	srv.isNew(false);
	srv.breadcrumb('All');
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
		var allIP = [];
		srv.txtWizard().replace( /\n/g, " " ).split( " " ).forEach(function (e) {
			if (e.indexOf('[') == -1) {
				var ip1 = (e.indexOf(":") == -1) ? (e + ":80") : e;
				allIP.push({ ip: ip1, label: e });
			}else{
				var patterns = e.match(/\[(.*?)\]/g);
				if (patterns.length > 0) {
					pattern = patterns[0];
				}
				var firstPattern = pattern.replace(/\[/g, "").split('-')[0];
				var secondPattern = pattern.replace(/\]/g, "").split('-')[1];
				for (i = firstPattern; i <= secondPattern; i++) {
					patternIP = e.replace( pattern, i )
					var ip2 = (patternIP.indexOf(":") == -1) ? (patternIP + ":80") : patternIP;
					allIP.push({ ip: ip2, label: patternIP });
				}
			}
		});

		allIP.forEach(function (ip) {
			srv.miniloader(true);
			app.ajaxPost("/server/checkping", { ip: ip.ip }, function (res) {
				app.miniloader(true);
				var o = { host: ip.label, status: res.data };

				if (!res.success) {
					o.status = res.message;
				}

				srv.dataWizard.push(o);
			},{"withLoader":false}, function () {
				var o = { host: ip.label, status: "request timeout" };
				srv.dataWizard.push(o);
			}, {
				timeout: 5000
			});
		});

		$(document).ajaxStop(function() {
		  app.miniloader(false);
		  srv.miniloader(false);
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

srv.templateHostAlias = {
    ip: "",
    hostName: ""
};
srv.addHostAlias = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, srv.templateHostAlias));
	srv.configServer.serviceHDFS.hostAlias.push(item);
};
srv.removeHostAlias = function (each) {
	return function () {
		srv.configServer.serviceHDFS.hostAlias.remove(each);
	};
};

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

srv.ping = function () {
	var doPing = function (s) {
		if (app.miniloader()) {
			return;
		}

		var $grid = $(".grid-server").data("kendoGrid");
		var row = Lazy($grid.dataSource.data()).find({ _id: s._id });

		var ajax = app.ajaxPost("/server/pingserver", { _id: s._id }, function (res) {
			if (row != undefined) {
				var $tr = $(".grid-server").find("tr[data-uid='" + row.uid + "']");

				if (res.success) {
					for (var key in res.data) {
						if (res.data.hasOwnProperty(key)) {
							var $td = $tr.find("td." + key + "-status");

							if (res.data[key].isUP) {
								$td.addClass("started");
							} else {
								$td.removeClass("started");
							}
						}
					}
				} else {
					$tr.find(".started").removeClass("started");
				}
			}
		}, function () {
			if (row != undefined) {
				var $tr = $(".grid-server").find("tr[data-uid='" + row.uid + "']");
				$tr.find(".started").removeClass("started");
			}
		}, {
			timeout: 8000,
			withLoader: false
		});

		return ajax;
	};

	var ajaxes = [];

	srv.ServerData().forEach(function (s) {
		var ajax = doPing(s);
		ajaxes.push(ajax);
	});

	$.when.apply(undefined, ajaxes).always(function () {
		setTimeout(srv.ping, 100 * 1000);
	});
};
srv.getServerServiceBase = function () {
	app.ajaxPost("/server/getserverservices", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		srv.serverServiceBase(res.data);
	});
};

$(function () {
	srv.getServerServiceBase();
    srv.getServers(function () {
		setTimeout(function () {
			srv.ping();
		}, 1000);
    });
	srv.breadcrumb('All');
	app.showfilter(false);
	app.registerSearchKeyup($(".searchsrv"), function () {
		srv.getServers();
		srv.getServerServiceBase();
	});
});
