app.section('application');

viewModel.application = {}; var apl = viewModel.application;
apl.templateConfigScrapper = {
	_id: "",
	AppsName: "",
	Enable: ko.observable(false),
	AppPath: ""
};
apl.configScrapper = ko.mapping.fromJS(apl.templateConfigScrapper);
apl.scrapperMode = ko.observable('');
apl.scrapperData = ko.observableArray([]);
apl.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Name", width: 130},
	{ field: "Enable", title: "Enable", width: 50},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='apl.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Application' onclick='apl.editScrapper(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Application' onclick='apl.removeScrapper(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" }
	
]);

apl.getApplications = function() {
	apl.scrapperData([]);
	app.ajaxPost("/application/getapps", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		apl.scrapperData(res.data);
	});
};

apl.editScrapper = function(_id) {
	ko.mapping.fromJS(apl.templateConfigScrapper, apl.configScrapper);
	app.ajaxPost("/application/selectapps", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode('editor');
		apl.scrapperMode('edit');
		ko.mapping.fromJS(res.data, apl.configScrapper);
	});
};

apl.createNewScrapper = function () {
	//alert("masuk create");
	app.mode("editor");
	apl.scrapperMode('');
	ko.mapping.fromJS(apl.templateConfigScrapper, apl.configScrapper);
	//apl.addMap();
};

apl.saveScrapper = function() {
	if (!app.isFormValid(".form-application")) {
		return;
	}

	var data = ko.mapping.toJS(apl.configScrapper);
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

apl.removeScrapper = function(_id) {
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
    $("#treeview-left").kendoTreeView({
		animation: {
			collapse: false
		},
		template: "<span class='#= item.iconclass #'></span>&nbsp;&nbsp;<span>#= item.text #</span>",
		dataSource: [{ 
			text: "assets", 
			iconclass: "glyphicon glyphicon-folder-open",
			items: [{ 
				iconclass: "glyphicon glyphicon-folder-open",
				text: "core" ,
				items: [{
					iconclass: "glyphicon glyphicon-file",
					text: "page-application.js" ,
				}]
			}] 
		}, {
			text: "controller", 
			expanded: true,
			iconclass: "glyphicon glyphicon-folder-open",
			items: [{ 
				iconclass: "glyphicon glyphicon-file",
				text: "application.go",
			}] 
		}]
    });
};

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
}

$(function () {
	apl.getApplications();
	apl.getUploadFile();
	apl.getTab()
	apl.codemirror();
});

apl.treeView();