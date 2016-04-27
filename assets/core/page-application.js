app.section('application');

viewModel.application = {}; var apl = viewModel.application;
apl.templateConfigApplication = {
	_id: "",
	AppsName: "",
	Enable: ko.observable(false),
	Type: "web",
	Port: "8080",
	AppPath: "",
	DeployedTo: [],
	Command: [],
	Variable: [],
	Language:"",
};

apl.appTypes = ko.observableArray([
	{ value: "web", title: "Web" },
	{ value: "cli", title: "CLI" },
	{ value: "daemon", title: "Daemon/Service" },
]);

apl.templateFile = {
	ID: "",
	Path: "",
	Filename: "",
	Type: "folder",
	Content: "",
};
apl.templateFilter = {
	search: "",
	type: "",
};
apl.templateConfigCommand = {
	key: "",
	value: ""
};
apl.templateConfigVariable = {
	key: "",
	value: ""
};

apl.appLanguageData = ko.observable('');
apl.config = ko.mapping.fromJS(apl.templateFile);
apl.appIDToDeploy = ko.observable('');
apl.selectable = ko.observableArray([]);
apl.tempCheckIdServer = ko.observableArray([]);
apl.showErrorDeploy = ko.observable(false);
apl.filterValue = ko.observable('');
apl.filterAplType = ko.observable('');
apl.dataDropDown = ko.observableArray(['folder', 'file']);
apl.configApplication = ko.mapping.fromJS(apl.templateConfigApplication);
apl.filter = ko.mapping.fromJS(apl.templateFilter);
apl.applicationMode = ko.observable('');
apl.applicationData = ko.observableArray([]);
apl.appTreeMode = ko.observable('');
apl.renameFileMode = ko.observable(false);
apl.boolEx = ko.observable(false);
apl.miniloader = ko.observable(false);
apl.appTreeSelected = ko.observable('');
apl.appRecordsDir = ko.observableArray([]);
apl.extension = ko.observableArray(['','.jpeg','.jpg','.png','.doc','.docx','.exe','.rar','.zip','.eot','.svg','.pdf','.PDF']);
apl.configFile = ko.mapping.fromJS(apl.templateFile);
apl.searchfield = ko.observable('');
apl.search2field = ko.observable('');
apl.applicationColumns = ko.observableArray([
	{headerTemplate: "<center><input type='checkbox' class='aplCheckAll' onclick=\" apl.checkDelData(this, 'aplAll', 'all') \"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		if (d.IsInternalApp) {
			return "";
		}

		return "<input type='checkbox' class='aplCheck' idcheck='"+ d._id +"' onclick=\" apl.checkDelData(this, 'apl')\"/>";
	}},
	{ field: "_id", title: "ID" },
	{ field: "AppsName", title: "Name" },
	{ title: "Type", template: function (d) {
		if (d.Type == "web") {
			return d.Type + " (port: " + d.Port + ")";
		}

		return d.Type;
	} },
	{ title: "Internal App", width: 90, template: function (d) {
		return (d.IsInternalApp ? "<center>YES</center>" : "<center>NO</center>");
	} },
	{ title: "", width: 70, attributes:{class:"align-center"}, template: function(d){
		return[
			"<div class='btn-group btn-sm'><button class='btn btn-sm btn-default btn-primary tooltipster' title='Deploy info' onclick='apl.showModalDeploy(\"" + d._id + "\")()' ><span class='fa fa-plane'></span></button></div>",
		].join(" ");
	}},
]);
apl.ServerColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='selectall' id='selectall' onclick=\"apl.selectServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		var disabled = false;
		var baseData = Lazy(apl.applicationData()).find({ _id: apl.appIDToDeploy() });
		if (baseData != undefined) {
			if (baseData.DeployedTo == null) {
				baseData.DeployedTo = [];
			}

			disabled = (baseData.DeployedTo.indexOf(d._id) > -1);
		}

		// if (!disabled) {
			return "<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"apl.selectServer(this, 'server')\" />";
		// }

		return "";
	} },
	{ field: "_id", title: "ID" },
	{ field: "serviceSSH.host", title: "Host" },
	{ field: "os", title: "OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	{ width: 100, headerTemplate: "<center>App Status</center>",  attributes: { class: "align-center" }, template: function (d) {
		return apl.isDeployed(d, function (app) {
			var target = [d.serviceSSH.host.split(":")[0], app.Port].join(":");
			return "<a href='http://" + target + "' target='_blank' class='link-deploy'>DEPLOYED</a>";
		}, function (app) {
			return "UNDEPLOYED";
		});

		return "UNDEPLOYED";
	} },
	{ headerTemplate: "<center>Run App</center>", width: 80, attributes: { "class": "align-center" }, template: function (d) {
		var isDeployed = apl.isDeployed(d, function (app) {
			return true;
		}, function (app) {
			return false;
		});

		var attr = (isDeployed ? "" : "disabled style='pointer-events: none; opacity: 0.7;'");
		return "<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Deploy info' onclick='apl.showModalDeploy(\"" + d._id + "\")()' " + attr + "><span class='fa fa-play'></span></button>";
	} }
]);

apl.changeActiveSection = function (section) {
	if (section == "servers") {
		setTimeout(srv.ping, 200);
	}
	return app.changeActiveSection(section);
}

apl.isDeployed = function (d, yes, no) {
	var app = Lazy(apl.applicationData()).find({ _id: apl.appIDToDeploy() });
	if (app == undefined) {
		return "";
	}

	var deployedTo = app.DeployedTo;

	if (deployedTo == null) {
		deployedTo = [];
	}

	if (deployedTo.indexOf(d._id) != -1) {
		return yes(app);
	}

	return no(app);
};

apl.commandDataColumns = ko.observableArray([
	{field: "AppID", title: "Application ID"},
	{field: "ServerID", title: "Server ID"},
	{field: "CmdName", title: "Command Key"},
	{field: "CmdValue", title: "Command"},
	{ title: "", width: 70, attributes: { class: 'align-center' }, template: function (d) {
		return '<button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Execute" onclick="apl.doRunCommand(\'' + d.CmdName + '\')"><span class="fa fa-play"></span></button>';
	} },
]);
apl.commandData = ko.observableArray([]);
apl.commandServerID = ko.observable('');
apl.showRunCommand = function (serverID) {
	//app.mode('runcommand');
	$(".modal-run-cmd").modal("show");
	apl.commandServerID(serverID);
	apl.commandData([]);
	var appMap = ko.mapping.toJS(apl.configApplication);

	$(".modal-run-cmd").find(".modal-title span.app").html(appMap._id);
	$(".modal-run-cmd").find(".modal-title span.server").html(serverID);

	appMap.Command.forEach(function (cmd, i) {
		if (cmd.key == "" || cmd.value == "") {
			return;
		}

		var apid = 0;
		for (i in apl.applicationData()){
			var appid = apl.applicationData()[i]._id;
		}


		apl.commandData.push({
			AppID: appid,
			ServerID: serverID,
			CmdName: cmd.key,
			CmdValue: cmd.value
		});
	});

	// $(".modal-run-cmd").modal("show");
};
apl.doRunCommand = function (cmdKey) {
	var param = {
		AppID: apl.configApplication._id(),
		ServerID: apl.commandServerID(),
		CmdName: cmdKey
	};

	app.ajaxPost("/application/runcommand", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		var text = "<pre style='text-align: left; height: 200px;'>" + res.data + "</pre>";

		swal({
			title: "Command result",
			text: text,
			showConfirmButton: true,
			closeOnConfirm: false,
			confirmButtonText: "OK",
			html: true,
			allowOutsideClick: true
		});
	});
};

apl.srvapplicationColumns = ko.observableArray([
	{ field: "_id", title: "ID" },
	{ field: "os", title: "OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	{ field: "host", title: "Host" },
	{ title: "", width: 70, attributes: { class: 'align-center' }, template: function (d) {
		return '<button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Run Command" onclick="apl.showRunCommand(\'' + d._id + '\')"><span class="fa fa-plane"></span></button>';
	} },
	{ field: "status", width: 70, headerTemplate: "<center>Status</center>",  attributes: { class: "align-center" }, template: function (d) {
		var app = Lazy(apl.applicationData()).find({ _id: apl.appIDToDeploy() });
		if (app == undefined) {
			return "";
		}

		var deployedTo = app.DeployedTo;

		if (deployedTo == null) {
			deployedTo = [];
		}

		if (deployedTo.indexOf(d._id) != -1) {
			var target = [d.serviceSSH.host.split(":")[0], app.Port].join(":");
			return "<input type='checkbox' class='statuscheck-apl apl-green' disabled /> ";
		}

		return "<input type='checkbox' class='statuscheck-apl apl-red' disabled />";
	} }
]);

apl.gridStatusColor = function () {
	$grids = $('.grid-srvapplication');
	var $grg = $grids.find("tr td .apl-green");
	var $grr = $grids.find("tr td .apl-red");

	if ($grg) {
		$grg.parent().css("background-color", "#5cb85c");
		$grg.prop("checked", true);
	}
	if ($grr) {
		$grr.parent().css("background-color", "#d9534f");
		$grr.prop("checked", false);
	}
}

apl.gridStatusCheck = function () {
	$grid = $('.grid-srvapplication');
	var $gr = $grid.find("tr td .statuscheck-apl");
	$gr.change(function(){
		if ($(this).prop('checked') === true){
			$(this).parent().css("background-color", "#5cb85c");
		} else {
			$(this).parent().css("background-color", "#d9534f");
		}
	})
}

// apl.gridServerDeployDataBound = function () {
// 	$(".grid-server-deploy .k-grid-content tr").each(function (i, e) {
// 		var $td = $(e).find("td:eq(4)");
// 		if ($td.text() == "DEPLOYED") {
// 			$td.css("background-color", "#5cb85c");
// 			$td.css("color", "white");
// 		} else {
// 			$td.css("background-color", "#d9534f");
// 			$td.css("color", "white");
// 		}
// 	});
// };

apl.addCommand = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, apl.templateConfigCommand));
	apl.configApplication.Command.push(item);
};

apl.addVariable = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, apl.templateConfigVariable));
	apl.configApplication.Variable.push(item);
};
apl.removeCommand = function (each) {
	return function () {
		console.log(each);
		apl.configApplication.Command.remove(each);
	};
};

apl.removeVariable = function (each) {
	return function () {
		console.log(each);
		apl.configApplication.Variable.remove(each);
	};
};
apl.refreshGridModalDeploy = function () {
	$(".grid-server-deploy").replaceWith("<div class='grid-server-deploy'></div>");
	$(".grid-server-deploy").kendoGrid({
		dataSource: {
			pageSize: 15,
			data: Lazy(srv.ServerData()).filter(function (d) {
				if ([null, undefined].indexOf(d.serviceSSH) > -1) {
					return false;
				}

				if (d.serviceSSH.host != "" && d.serviceSSH.user != "") {
					return true;
				}

				return false;
			}).toArray()
		},
		columns: apl.ServerColumns(),
		filterfable: false,
		pageable: true,
		// dataBound: apl.gridServerDeployDataBound
	});
};
apl.showModalDeploy = function (_id) {
	return function () {
		srv.getServers(function (res) {
			$(".modal-deploy").modal("show");
			apl.appIDToDeploy(_id);
			apl.refreshGridModalDeploy();
			$(".grid-server-deploy .k-grid-content tr input[type=checkbox]:checked").each(function (i, e) {
				$(e).prop("checked", false);
			});

			$(".grid-server-deploy .k-grid-content tr").each(function (i, e) {
				$(e).find("td:eq(4)").html();
				$(e).find("td:eq(0) input:checkbox").hide();
			});

			res.data.forEach(function (each) {
				if ([null, undefined].indexOf(each.serviceSSH) > -1) {
					return false;
				}

				if (!(each.serviceSSH.host != "" && each.serviceSSH.user != "")) {
					return false;
				}

				var payload = { appID: _id, serverID: each._id };
				app.ajaxPost("/application/isappdeployed", payload, function (resStatus) {
					var $grid = $(".grid-server-deploy");
					var dataSource = $grid.data("kendoGrid").dataSource;
					var row = Lazy(dataSource.data()).find({ _id: each._id });
					apl.miniloader(false);
					if (row != undefined) {
						var $row = $(".grid-server-deploy .k-grid-content tr[data-uid='" + row.uid + "']");
						var $checkbox = $row.find("td:eq(0) input:checkbox");
						var $tdStatus = $row.find("td:eq(4)");

						if (resStatus.data) {
							$checkbox.hide();
							$tdStatus.css("background-color", "#5cb85c");
							$tdStatus.css("color", "white");

							var appData = Lazy(apl.applicationData()).find({ _id: _id });
							var target = [each.serviceSSH.host.split(":")[0], appData.Port].join(":");
							var el = "<a href='http://" + target + "' target='_blank' class='link-deploy'>DEPLOYED</a>";
							$tdStatus.empty().append($(el));
						} else {
							$checkbox.show();
							$tdStatus.css("background-color", "#d9534f");
							$tdStatus.css("color", "white");
							$tdStatus.html("UNDEPLOYED");
						}
					}
				},{"withLoader":false});
			});
		});
	};
};
apl.deploy = function () {
	var $sel = $(".grid-server-deploy");
	var $allData = $sel.find(".k-grid-content tr input[type=checkbox]:checked");

	if ($allData.size() == 0) {
		swal({title: "No server selected", type: "error"});
		return;
	}

	$allData.each(function (i, e) {
		var $tr = $(e).closest("tr");
		var uid = $tr.attr("data-uid");

		var rowData = $sel.data("kendoGrid").dataSource.getByUid(uid);
		var param = { _id: apl.appIDToDeploy(), Server: rowData._id };

		app.ajaxPost("/application/deploy", param, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			apl.getApplications(function () {
				apl.appIDToDeploy(param._id);
				apl.refreshGridModalDeploy();

				setTimeout(function () {
					$(".modal-deploy").modal("hide");
				}, 1000);
			});
		});
	})
};

apl.selectApps = function (e) {
	app.showfilter(false);
	app.wrapGridSelect(".grid-application", ".btn", function (d) {
		if (d.IsInternalApp) {
			swal({ title: "Internal app is read only", type: "info", closeOnConfirm: true });
			return;
		}

		apl.editApplication(d._id);
		apl.tempCheckIdServer.push(d._id);
	});
};

apl.getApplications = function(c) {
	apl.applicationData([]);
	apl.appIDToDeploy('');

	var ongrid = $(".grid-application").data("kendoGrid");
	$(ongrid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
	});
	$(ongrid.tbody).on("mouseleave", "tr", function (e) {
	    $(this).removeClass("k-state-hover");
	});
	app.ajaxPost("/application/getapps", apl.filter, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data = [];;
		}

		apl.applicationData(res.data);
		if (typeof c === "function") {
			c();
		}
	});
};

apl.editApplication = function(_id) {
	apl.appIDToDeploy(_id);
	apl.refreshGridModalDeploy();
	app.miniloader(true);
	ko.mapping.fromJS(apl.templateConfigApplication, apl.configApplication);
	app.ajaxPost("/application/selectapps", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		apl.treeView(_id);
		app.mode('editor');
		$('a[href="#Form"]').tab('show');
		apl.applicationMode('edit');
		ko.mapping.fromJS(res.data, apl.configApplication);
	});
};

apl.createNewApplication = function () {
	app.showfilter(false);
	var editor = $('#scriptarea').data('CodeMirrorInstance');
	var treeviewLeft = $("#treeview-left").data("kendoTreeView");
	var uploadFile = $("#files");
	var fileName = $("#nama");
	$("#txt-path").html("");
	uploadFile.val("");
	fileName.html("");
	treeviewLeft.setDataSource([]);
	editor.setValue("");
	editor.focus();
	app.mode("editor");
	$("#searchDirectori").val("");
	$('a[href="#Form"]').tab('show');
	apl.appRecordsDir([])
	apl.applicationMode('');
	apl.configApplication._id("");
	apl.configApplication.AppsName("");
	ko.mapping.fromJS(apl.templateConfigApplication, apl.configApplication);
	apl.addVariable();
	apl.addCommand();
	apl.getDataLanguage();
};

apl.saveApplication = function() {
	if (!app.isFormValid(".form-application")) {
		return;
	}

	var data = ko.mapping.toJS(apl.configApplication);
	var formData = new FormData();
	formData.append("Enable", data.Enable);
	formData.append("AppsName", data.AppsName);
	formData.append("userfile", $('input[type=file]')[0].files[0]);
	formData.append("_id", data._id);
	formData.append("Type", data.Type);
	formData.append("Port", data.Port);
	formData.append("Command",JSON.stringify(data.Command));
	formData.append("Variable", JSON.stringify(data.Variable));

	app.ajaxPost("/application/saveapps", formData, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		swal({title: "Application successfully created", type: "success",closeOnConfirm: true});
		apl.backToFront();
	});
};

apl.getUploadFile = function() {
	$('#files').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });

	$("#selectall").change(function () {
	    $("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});
};

apl.backToFront = function () {
	app.mode('');
	apl.getApplications();
	apl.tempCheckIdServer([]);
};

apl.treeView = function (id) {
	app.ajaxPost("/application/readdirectory", {ID:id}, function(res) {
        if (!res.success) {
            return;
        }

		$("#treeview-left").replaceWith("<div id='treeview-left'></div>");
		apl.appRecordsDir(res.data);
		var treeview = $("#treeview-left").kendoTreeView({
			animation: false,
			template: "<span class='#= item.iconclass #'></span>&nbsp;&nbsp;<span>#= item.text #</span>",
			select: apl.selectDirApp,
			dataSource: apl.appRecordsDir(),
	    }).data("kendoTreeView");
	});

}
apl.selectDirApp = function(e){
	var data = $('#treeview-left').data('kendoTreeView').dataItem(e.node);
	var editor = $('#scriptarea').data('CodeMirrorInstance');
	var arrayEx = data.text.split('.');
	var extension = apl.extension();
	for (var i in extension){
		if ("."+arrayEx[1] != extension[i]){
			apl.boolEx(true);
		}else{
			apl.boolEx(false);
			editor.setValue("");
			editor.focus();
			$("#txt-path").html("");
			apl.appTreeMode("");
			apl.appTreeSelected("");
			break;
		}
	}

	if (apl.boolEx() == true){
		app.ajaxPost("/application/readcontent", {ID: apl.configApplication._id(), Path:data.path}, function(res) {
			if (!app.isFine(res)) {
				return;
			}
			editor.setValue(res.data);
			editor.focus();
		});
	    $("#txt-path").html(data.path);
		apl.appTreeMode(data.type);
		apl.appTreeSelected(data.text);
	}
}
apl.newFileDir = function(){
	if (!app.isFormValid(".form-newfile")) {
		return;
	}
	apl.configFile.ID(apl.configApplication._id());
	apl.configFile.Path($("#txt-path").html());
	apl.configFile.Content("");
	apl.configFile.Type($("#TypeFile").kendoDropDownList().val());
	var confNew = ko.mapping.toJS(apl.configFile);
	app.ajaxPost("/application/createnewfile", confNew, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		swal({title: "File successfully save", type: "success"});
		apl.treeView(apl.configApplication._id());
		ko.mapping.fromJS(apl.templateFile, apl.configFile);
		$('.modal-new-file').modal('hide');
		apl.appTreeMode("");
		apl.appTreeSelected("");
	});
}
apl.modalNewFileDir = function (){
	$('.modal-new-file').modal('show');
	apl.renameFileMode(false);
	apl.configFile.Filename("");
	$("#TypeFile").kendoDropDownList({
	  enable: true
	});
}
apl.removeFileDir = function(){
	apl.Filename = apl.appTreeSelected();
	apl.configFile.ID(apl.configApplication._id());
	apl.configFile.Path($("#txt-path").html());
	var confNew = ko.mapping.toJS(apl.configFile);
	swal({
		title: "Are you sure?",
		text: 'File / folder with name "' + apl.Filename + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/application/deletefileselected", confNew, function(res) {
					if (!app.isFine) {
						return;
					}

				 apl.treeView(apl.configApplication._id());
				 ko.mapping.fromJS(apl.templateFile, apl.configFile);
				 apl.appTreeMode("");
				 apl.appTreeSelected("");
				 swal({title: "File / Folder successfully deleted", type: "success"});
				});
		},1000);
	});
}
apl.updateFileDir = function(){
	apl.configFile.ID(apl.configApplication._id());
	apl.configFile.Path($("#txt-path").html());
	apl.configFile.Type("file");
	apl.configFile.Content($('#scriptarea').data('CodeMirrorInstance').getValue());
	var confNew = ko.mapping.toJS(apl.configFile);
	app.ajaxPost("/application/createnewfile", confNew, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		apl.treeView(apl.configApplication._id());
		ko.mapping.fromJS(apl.templateFile, apl.configFile);
		apl.appTreeMode("");
		apl.appTreeSelected("");
		swal({title: "File / Folder successfully updated", type: "success"});
	});
}
apl.searchTreeView = function(){
	var search = $('#searchDirectori').val();
	var treeview = $("#treeview-left").data("kendoTreeView");
	var searchResult = ko.utils.arrayFilter(apl.appRecordsDir(), function (item) {
        return item.text.toLowerCase().indexOf(search.toLowerCase()) >= 0;
    });
    var temirectory = [];
    if (searchResult.length != 0 ){
		$("#treeview-left").data("kendoTreeView").setDataSource(searchResult);
    }else{
    	var dataTreeJson = apl.appRecordsDir();
    	dataTreeJson.forEach(function(each){
    		if (each.items != null ){
    			temirectory.push(each.items)
    		}
    	});
    	apl.searchTreeViewSub(temirectory, search)
    }
}

apl.searchTreeViewSub = function(dataJson, search){
	var JSON = [];
	if (dataJson.length != 0 ){
		for (var i in dataJson){
			JSON = JSON.concat(dataJson[i]);
		}
		var treeview = $("#treeview-left").data("kendoTreeView");
		var searchResult = ko.utils.arrayFilter(JSON, function (item) {
	        return item.text.toLowerCase().indexOf(search.toLowerCase()) >= 0;
	    });
		var temirectory = [];
		if (searchResult.length != 0 ){
			$("#treeview-left").data("kendoTreeView").setDataSource(searchResult);
	    }else{
	    	JSON.forEach(function(each){
	    		if (each.items != null ){
	    			temirectory.push(each.items)
	    		}
	    	});
	    	apl.searchTreeViewSub(temirectory, search)
	    }
	}else{
		$("#treeview-left").data("kendoTreeView").setDataSource([]);
	}

}
apl.codemirror = function(){
    var editor = CodeMirror.fromTextArea(document.getElementById("scriptarea"), {
        mode: "text/html",
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
    });
    editor.setValue('');
    $('.CodeMirror-gutter-wrapper').css({'left':'-40px'});
    $('.CodeMirror-sizer').css({'margin-left': '30px', 'margin-bottom': '-15px', 'border-right-width': '10px', 'min-height': '863px', 'padding-right': '10px', 'padding-bottom': '0px'});
    // editor.focus();
    $('#scriptarea').data('CodeMirrorInstance', editor);
}

apl.treeScroller = function(){
	$('#splitter').kendoSplitter({
		orientation: "horizontal",
		panes: [
			{ },
			{ }]
    });
	// var treeview = $("#treeview-left").data("kendoTreeView");
	// treeview.select(".k-item:eq(40)");
	// treeview.element.closest(".k-scrollable").scrollTo(treeview.select(), 400);
}

apl.OpenInNewTab = function (url) {
  var win = window.open(url, '_blank');
  win.focus();
}

function ApplicationFilter(event){
	app.ajaxPost("/application/appsfilter", {inputText : apl.filterValue()}, function(res){
		if(!app.isFine(res)){
			return;
		}

		if (!res.data) {
			res.data = [];
		}

		apl.applicationData(res.data);
	});
}

apl.OnRemove = function (_id) {
	if (apl.tempCheckIdServer().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any Application to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
			title: "Are you sure?",
			text: 'Application with id '+apl.tempCheckIdServer().toString()+' will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: true
		}, function() {
			setTimeout(function () {
				app.ajaxPost("/application/deleteapps", apl.tempCheckIdServer(), function (res) {
					if (!app.isFine(res)) {
						return;
					}
					swal({ title: "Data successfully deleted", type: "success" });
					apl.backToFront();
				});
			}, 1000);
		});
	}
};

apl.modalRenameFile =  function(){
	$('.modal-new-file').modal('show');
	apl.renameFileMode(true);
	apl.configFile.ID(apl.configApplication._id());
	apl.configFile.Path($("#txt-path").html());
	apl.configFile.Type(apl.appTreeMode());
	apl.configFile.Filename(apl.appTreeSelected());
}

apl.renameFile = function(){
	apl.configFile.Path($("#txt-path").html());
	apl.configFile.Content("");
	var newFile = ko.mapping.toJS(apl.configFile);
	app.ajaxPost("/application/renamefileselected", newFile, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		$('.modal-new-file').modal('hide');
		apl.treeView(apl.configApplication._id());
		ko.mapping.fromJS(apl.templateFile, apl.configFile);
		apl.appTreeMode("");
		apl.appTreeSelected("");
		swal({title: "File / Folder successfully renamed", type: "success"});
	});
}

apl.backToEdit = function () {
	app.mode("editor");
}

apl.checkDelData = function (elem,e ){
	if ( e === 'apl') {
		if ($(elem).prop('checked') === true){
			apl.tempCheckIdServer.push($(elem).attr('idcheck'));
		} else {
			apl.tempCheckIdServer.remove(function (item) { return item === $(elem).attr('idcheck'); });
		}
	}
	if ( e === 'aplAll'){
		if ($(elem).prop('checked') === true){
			$('.aplCheck').each(function (index) {
				$(this).prop("checked", true);
				apl.tempCheckIdServer.push($(this).attr('idcheck'));
			})
		} else {
			var idtemp = '';
			$('.aplCheck').each(function (index){
				$(this).prop("checked", false );
				idtemp = $(this).attr('idcheck');
				apl.tempCheckIdServer.remove( function (item) { return item === idtemp; });
			});
		}
	}
}

apl.selectServer = function(elem, e){
	if (e === 'serverall'){
		if ($(elem).prop('checked') === true){
			$('.servercheck').each(function(index) {
				$(this).prop("checked", true);
				apl.tempCheckIdServer.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.servercheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				apl.tempCheckIdServer.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			apl.tempCheckIdServer.push($(elem).attr('idcheck'));
		} else {
			apl.tempCheckIdServer.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}

apl.selectLangEnv = function (elem, e){
	if (e === 'CheckAll'){
		if ($(elem).prop('checked') === true){
			$('.langEnvCheck').each(function(index){
				$(this).prop("checked", true);
			});
		}else {
		$('.langEnvCheck').each(function(index){
			$(this).prop("checked", false);
		});
		}
	}
}

apl.prepareTreeView = function () {
	$("#treeview-left").kendoTreeView({
		animation: false,
		template: "<span class='#= item.iconclass #'></span>&nbsp;&nbsp;<span>#= item.text #</span>",
		select: apl.selectDirApp,
		dataSource: new kendo.data.DataSource({ data: [] }),
    }).data("kendoTreeView");
}

apl.getDataLanguage = function (){
	app.ajaxPost("/application/getlanguagedata", "", function (res) { 
		if (!app.isFine(res)){
			return;
		}
		if (res.data == null){
			res.data = [];
		}
		apl.appLanguageData(res.data);
	});
}

$(function () {
	apl.getApplications();
	apl.getUploadFile();
	apl.codemirror();
	apl.prepareTreeView();
	app.showfilter(false);
	app.registerSearchKeyup($(".search"), apl.getApplications);
});
