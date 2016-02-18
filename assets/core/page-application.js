app.section('application');

viewModel.application = {}; var apl = viewModel.application;
apl.templateConfigApplication = {
	_id: "",
	AppsName: "",
	Enable: ko.observable(false),
	AppPath: ""
};
apl.selectable = ko.observableArray([]);
apl.filterValue = ko.observable('');
apl.configApplication = ko.mapping.fromJS(apl.templateConfigApplication);
apl.applicationMode = ko.observable('');
apl.applicationData = ko.observableArray([]);
apl.appTreeMode = ko.observable('');
apl.appRecordsDir = ko.observableArray([]);
apl.applicationColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 10, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Name", width: 130},
	{ field: "Enable", title: "Enable", width: 50},
	{ title: "", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' id='excludethis' title='Start Transformation Service' onclick='apl.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>"
		].join(" ");
	} },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{title: "", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<a href='#' onclick= 'apl.OpenInNewTab()'>Browse</a>"
		].join(" ");
	}}
]);

apl.selectApps = function(e){
	var tab = $(".grid-application").data("kendoGrid");
	var data = tab.dataItem(tab.select());
	var target = $( event.target );
	if ($(target).parents("#excludethis").length ) {
	  	return false;
	}else{
		apl.editApplication(data._id);
	}
};

apl.getApplications = function() {
	apl.applicationData([]);

	var ongrid = $(".grid-application").data("kendoGrid");
	$(ongrid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
	});
	$(ongrid.tbody).on("mouseleave", "tr", function (e) {
	    $(this).removeClass("k-state-hover");
	});
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
		apl.applicationMode('edit');
		ko.mapping.fromJS(res.data, apl.configApplication);
	});
};

apl.createNewApplication = function () {
	//alert("masuk create");
	app.mode("editor");
	apl.applicationMode('');
	$("#files").val('');
	$('#nama').text('');
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

var treeview;
var onres;
var data;
var parent;
apl.treeView = function () {
	app.ajaxPost("/application/readdirectory", {}, function(res) {
		if (!app.isFine(res)) {
			return;
		}

		onres = res.data;
		//console.log("=======hasilnya"+JSON.stringify(onres));
		apl.appRecordsDir(onres);
		treeview = $("#treeview-left").kendoTreeView({
			animation: false,
			template: "<span class='#= item.iconclass #'></span>&nbsp;&nbsp;<span>#= item.text #</span>",
			select: apl.selectDirApp,
			dataSource: apl.appRecordsDir(),
			loadOnDemand: false
	    }).data("kendoTreeView");
	    treeview.expand(".k-item");

	});
}
apl.selectDirApp = function(e){
	data = $('#treeview-left').data('kendoTreeView').dataItem(e.node);
	console.log("========>>"+data.text);
	$('#nm-file').text(data.text);
	parent = treeview.dataSource.view()[0];
	//var data = ondata.parent();
	//console.log(JSON.stringify(parent));
	if (data.type === 'file'){
		var editor = $('#scriptarea').data('CodeMirrorInstance');
		editor.setValue(data.content);
		editor.focus();
	}	
	apl.appTreeMode(data.type);
}

apl.pathSelectfile = function(){
	var a = "/"
	for(var i=0;i<data.length;i++){
		if(parent.text == data.text){

		}
	}
}

apl.trvRefresh = function(){
	apl.treeView();
	setTimeout(function(){
		apl.treeView();
	},1000);
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
		closeOnConfirm: false
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

$(function () {
	apl.getApplications();
	apl.getUploadFile();
	apl.getTab()
	apl.codemirror();
	apl.treeView();

});

apl.treeView();