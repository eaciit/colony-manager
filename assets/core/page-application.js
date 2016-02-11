app.section('application');

viewModel.application = {}; var apl = viewModel.application;
apl.templateConfigApplication = {
	_id: "",
	AppsName: "",
	Enable: ko.observable(false),
	AppPath: ""
};
apl.configApplication = ko.mapping.fromJS(apl.templateConfigApplication);
apl.applicationMode = ko.observable('');
apl.applicationData = ko.observableArray([]);
apl.appTreeMode = ko.observable('');
apl.appRecordsDir = ko.observableArray([]);
apl.applicationColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Name", width: 130},
	{ field: "Enable", title: "Enable", width: 50},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='apl.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Application' onclick='apl.editApplication(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Application' onclick='apl.removeApplication(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },
	{ title: "Status", width: 80, attributes: { class:'Application-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" }
	
]);

apl.getApplications = function() {
	apl.applicationData([]);
	app.ajaxPost("/application/getapps", {}, function (res) {
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

		app.mode('editor');
		apl.ApplicationMode('edit');
		ko.mapping.fromJS(res.data, apl.configApplication);
	});
};

apl.createNewApplication = function () {
	//alert("masuk create");
	app.mode("editor");
	apl.applicationMode('');
	ko.mapping.fromJS(apl.templateConfigApplication, apl.configApplication);
	//apl.addMap();
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
	formData.append("AppsName", data.AppsName);
	console.log("======= data"+JSON.stringify(data));
	var request = new XMLHttpRequest();
	request.open("POST", "/application/saveapps");
	request.send(formData);

	swal({title: "Application successfully created", type: "success",closeOnConfirm: true
	});
	apl.backToFront()
};

apl.removeApplication = function(_id) {
	swal({
		title: "Are you sure?",
		text: 'Application with id "' + _id + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: false
	},
	function() {
		setTimeout(function () {
			app.ajaxPost("/application/deleteapps", { _id: _id }, function () {
				if (!app.isFine) {
					return;
				}

				apl.backToFront()
				swal({title: "Application successfully deleted", type: "success"});
			});
		},1000);
	});
};

apl.getUploadFile = function() {
	$('#files').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

apl.backToFront = function () {
	app.mode('');
	apl.getApplications();
};

apl.getTab = function(){
	$('#myTab a').click(function (e) {
	    if($(this).parent('li').hasClass('active')){
	        $( $(this).attr('href') ).hide();
	    }
	    else {
	        e.preventDefault();
	        $(this).tab('show');
	    }
	});
}

apl.treeView = function () {
	apl.appRecordsDir([{ 
		text: "assets",
		type: "folder", 
		iconclass: "glyphicon glyphicon-folder-open",
		content: "",
		expanded: true,
		items: [{ 
			text: "core" ,
			type: "folder", 
			expanded: true,
			iconclass: "glyphicon glyphicon-folder-open",
			content: "",
			items: [{
				text: "page-application.html",
				type: "file", 
				content: '<html> \n'+
					'<div class="col-xs-6 col-sm-2" id="sidebar"> \n'+
						'<div class="row"> \n'+
							'<ul class="nav"> \n'+
								'<li><a href="#" data-bind="css: { \'active\': (app.section() == \'application\') }, click: app.changeActiveSection(\'application\')">Application<span class="fa-pull-right"><i class="fa fa-server"></i></span></a></li> \n'+
								'<li><a href="#" data-bind="css: { \'active\': (app.section() == \'servers\') }, click: app.changeActiveSection(\'servers\')">Servers<span class="fa-pull-right"><i class="fa fa-database"></i></span></a></li> \n'+
							'</ul> \n'+
						'</div> \n'+
					'</div> \n'+
					'</html> \n',
				iconclass: "glyphicon glyphicon-file",
			}]
		}] 
	}, {
		text: "controller", 
		type: "folder", 
		expanded: true,
		iconclass: "glyphicon glyphicon-folder-open",
		items: [{ 
			text: "application.go",
			type: "file", 
			content: 'package controller \n'+
				'import (\n'+
					'"archive/zip"\n'+
					'"encoding/json"\n'+
					'"fmt"\n'+
					'// "github.com/eaciit/cast"\n'+
					'"github.com/eaciit/colony-core/v0"\n'+
					'"github.com/eaciit/colony-manager/helper"\n'+
					'"github.com/eaciit/dbox"\n'+
					'_ "github.com/eaciit/dbox/dbc/jsons"\n'+
					'"github.com/eaciit/knot/knot.v1"\n'+
					'// "github.com/eaciit/toolkit"\n'+
					'"io"\n'+
					'"io/ioutil"\n'+
					'"os"\n'+
					'"path/filepath"\n'+
					'"strconv"\n'+
					'"strings"\n'+
				')',
			iconclass: "glyphicon glyphicon-file",
		}] 
	}]);
    $("#treeview-left").kendoTreeView({
		animation: {
			collapse: false
		},
		template: "<span class='#= item.iconclass #'></span>&nbsp;&nbsp;<span>#= item.text #</span>",
		select: apl.selectDirApp,
		dataSource: apl.appRecordsDir(),
    });
};
apl.selectDirApp = function(e){
	var data = $('#treeview-left').data('kendoTreeView').dataItem(e.node);
	if (data.type === 'file'){
		var editor = $('#scriptarea').data('CodeMirrorInstance');
		editor.setValue(data.content);
		editor.focus();
	}
	apl.appTreeMode(data.type);
}
apl.searchTreeView = function(){
	var search = $('#searchDirectori').val();
	var searchResult = ko.utils.arrayFilter(apl.appRecordsDir(), function (item) {
        return item.text.toLowerCase().indexOf(search.toLowerCase()) >= 0;
    });
    $("#treeview-left").data("kendoTreeView").setDataSource(searchResult);
}

apl.codemirror = function(){
    var editor = CodeMirror.fromTextArea(document.getElementById("scriptarea"), {
        mode: "text/html",
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
    });
    editor.setValue('<html></html>');
    $('.CodeMirror-gutter-wrapper').css({'left':'-30px'});
    $('.CodeMirror-sizer').css({'margin-left': '30px', 'margin-bottom': '-15px', 'border-right-width': '15px', 'min-height': '863px', 'padding-right': '15px', 'padding-bottom': '0px'});
    // editor.focus();
    $('#scriptarea').data('CodeMirrorInstance', editor);
}

$(function () {
	apl.getApplications();
	apl.getUploadFile();
	apl.getTab()
	apl.codemirror();
});

apl.treeView();