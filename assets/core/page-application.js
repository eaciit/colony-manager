app.section('application');

viewModel.application = {}; var apl = viewModel.application;
apl.templateConfigApplication = {
	_id: "",
	AppsName: "",
	Enable: ko.observable(false),
	Type: "web",
	AppPath: "",
	DeployedTo: [],
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
}
apl.appIDToDeploy = ko.observable('');
apl.selectable = ko.observableArray([]);
apl.tempCheckIdServer = ko.observableArray([]);
apl.showErrorDeploy = ko.observable(false);
apl.filterValue = ko.observable('');
apl.dataDropDown = ko.observableArray(['folder', 'file']);
apl.configApplication = ko.mapping.fromJS(apl.templateConfigApplication);
apl.applicationMode = ko.observable('');
apl.applicationData = ko.observableArray([]);
apl.appTreeMode = ko.observable('');
apl.renameFileMode = ko.observable(false);
apl.boolEx = ko.observable(false);
apl.appTreeSelected = ko.observable('');
apl.appRecordsDir = ko.observableArray([]);
apl.extension = ko.observableArray(['','.jpeg','.jpg','.png','.doc','.docx','.exe','.rar','.zip','.eot','.svg','.pdf','.PDF']);
apl.configFile = ko.mapping.fromJS(apl.templateFile);
apl.searchfield = ko.observable('');
apl.search2field = ko.observable('');
apl.applicationColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Name" },
	{ field: "Type", title: "Type" },
	// { field: "Enable", title: "Enable", width: 50},
	{ title: "", width: 70, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster excludethis' title='Deploy to servers' onclick='apl.showModalDeploy(\"" + d._id + "\")()'><span class='fa fa-plane'></span></button>",
		].join(" ");
	} },
]);
apl.ServerColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='selectall' id='selectall' onclick=\"apl.selectServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"apl.selectServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "ID" },
	{ field: "host", title: "Host" },
	{ field: "os", title: "OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	{ field: "status", width: 100, headerTemplate: "<center>status</center>",  attributes: { class: "align-center" }, template: function (d) {
		var baseData = Lazy(apl.applicationData()).find({ _id: apl.appIDToDeploy() });
		if (baseData == undefined) {
			return "";
		}

		var deployedTo = baseData.DeployedTo;

		if (deployedTo == null) {
			deployedTo = [];
		}

		if (deployedTo.indexOf(d._id) != -1) {
			return "DEPLOYED";
		}

		return "UNDEPLOYED";
	} }
]);
apl.gridServerDeployDataBound = function () {
	$(".grid-server-deploy .k-grid-content tr").each(function (i, e) {
		var $td = $(e).find("td:eq(4)");
		if ($td.html() == "DEPLOYED") {
			$td.css("background-color", "#5cb85c");
			$td.css("color", "white");
		} else {
			$td.css("background-color", "#d9534f");
			$td.css("color", "white");
		}
	});
};
apl.showModalDeploy = function (_id) {
	return function () {
		apl.appIDToDeploy(_id);
		$(".grid-server-deploy .k-grid-content tr input[type=checkbox]:checked").each(function (i, e) {
			$(e).prop("checked", false);
		});
		$(".modal-deploy").modal("show");
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

			console.log(res);
		});
	})
};
apl.browse = function (_id) {
	return function (e) {
		
	};
};

apl.selectApps = function(e){
	var tab = $(".grid-application").data("kendoGrid");
	var data = tab.dataItem(tab.select());
	var target = $( event.target );
	if ($(target).parents(".excludethis").length ) {
	  	return false;
	}else{
		apl.editApplication(data._id);
	}
};

apl.getApplications = function() {
	apl.applicationData([]);
	apl.appIDToDeploy('');

	var ongrid = $(".grid-application").data("kendoGrid");
	$(ongrid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
	});
	$(ongrid.tbody).on("mouseleave", "tr", function (e) {
	    $(this).removeClass("k-state-hover");
	});
	app.ajaxPost("/application/getapps", {search: apl.searchfield}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		apl.applicationData(res.data);
	});
};

apl.editApplication = function(_id) {
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
	formData.append("id", data._id);
	formData.append("Type", data.Type);
	
	var request = new XMLHttpRequest();
	request.open("POST", "/application/saveapps");
	request.onload = function(){
		swal({title: "Application successfully created", type: "success",closeOnConfirm: true});
		apl.backToFront();
	}
	request.send(formData);
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
};

// apl.getDirectory = function(){
// 	app.ajaxPost("/application/readdirectory", {}, function(res) {
// 		if (!app.isFine(res)) {
// 			return;
// 		}
// 	});
// }

apl.treeView = function (id) {
	app.ajaxPost("/application/readdirectory", {ID:id}, function(res) {
		if (!app.isFine(res)) {
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

var vals = [];
apl.OnRemove = function(){
	if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
		swal({
		title: "",
		text: 'You havent choose any application to delete',
		type: "warning",
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "OK",
		closeOnConfirm: true
		});
	} else {
		vals = $('input:checkbox[name="select[]"]').filter(':checked').map(function () {
			return this.value;
		}).get();

		swal({
		title: "Are you sure?",
		text: 'Application with id "' + vals + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/application/deleteapps", vals, function () {
					if (!app.isFine) {
						return;
					}

				 apl.backToFront();
				 swal({title: "Application successfully deleted", type: "success"});
				});
			},1000);

		});
 	} 
 
}

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

$(function () {
	apl.getApplications();
	apl.getUploadFile();
	apl.codemirror();
	apl.treeView("") ;
	app.prepareTooltipster($(".tooltipster"));

});