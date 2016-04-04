app.section('widget');

viewModel.Widget = {}; var wl = viewModel.Widget;
wl.widgetListConfig = {
	_id: "",
	title: "",
	dataSourceId: [],
	description:  "",
	config: [],
	url: "",
};
wl.widgetListdata = ko.observableArray([]);
wl.widgetDataSource = ko.observableArray([]);
wl.configWidgetList = ko.mapping.fromJS(wl.widgetListConfig);
wl.searchfield = ko.observable("");
wl.scrapperMode = ko.observable("");
wl.previewMode = ko.observable("");
wl.WidgetColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{ field: "title", title: "Title" },
	{ field: "description", title: "Description" },
	/*{ field: "dataSourceId", title: "Data Source", template: "#= dataSourceId.join(', ') #", 
		editor: function(container, options) {
			$("<select multiple='multiple' data-bind='value: dataSourceId' />")
            .appendTo(container)
            .kendoMultiSelect({
            	autoClose: false,
                dataSource: wl.widgetDataSource(),
                select: wl.selectCount
            });
		}
	},*/
	{title: "", width: 300, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Open Preview' onclick='wl.openWidget(\"" + d._id + "\",\"grid\")'><span class='fa fa-eye'></span></button>",
			// "<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Setting' onclick=''><span class='fa fa-pencil'></span></button>",
		].join(" ");
	}}
]);

wl.selectCount = function(e) {
	console.log(this.dataSource.view(), e.item.index())
	var dataItem = this.dataSource.view()[e.item.index()];
    console.log("event :: select (" + dataItem.text + " : " + dataItem.value + ")" );
}

wl.getWidgetList = function(mode) {
	if (mode == "refresh") {
		wl.widgetDataSource([]);
	}
	app.ajaxPost("/widget/getwidget", {search: wl.searchfield()}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		wl.widgetListdata(res.data);
		wl.getDataSource();
	});
}

wl.getDataSource = function() {
	app.ajaxPost("/widget/getdatasource", {}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		$.each(res.data, function(key,val) {
			wl.widgetDataSource.push(val._id)	
		});
	});
}

wl.openWidget = function(_id, mode) {
	wl.previewMode("");
	var getId //= (mode == "grid") ? _id : _id();

	if (mode == "grid") {
		getId = _id;
		wl.editWidget(getId, "preview");
	}else{
		getId = _id();
	}

	$(".modal-widget-preview").modal("hide");
	
	$(".modal-widget-datasource").modal({
		backdrop: 'static',
		keyboard: true
	});
};

wl.previewWidget = function(_id, dataSourceId) {
	// $(".modal-widget-datasource").modal("hide");
	app.ajaxPost("/widget/previewexample", {_id: _id, dataSource: dataSourceId(), mode: "preview"}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		// console.log(res.data.container)

		wl.previewMode("preview");
		var urlprev = "src=\"";
		var html = res.data.container.replace(new RegExp(urlprev, 'g'), urlprev+"http://"+wl.configWidgetList.url());
		urlprev = "href=\"";
		html = html.replace(new RegExp(urlprev, 'g'), urlprev+"http://"+wl.configWidgetList.url());
		// console.log(html);

		var contentDoc = $("#preview")[0].contentWindow.document;
		contentDoc.open();
		contentDoc.write(html);
		contentDoc.close();
		$("#preview").load(function(){
			var setting = wl.confertJsontoSetting($('#settingform').ecForm("getData"));
			document.getElementById("preview").contentWindow.Render(res.data.dataSource, setting, {});
		});
		// $("#preview").html(res.data); 
		// $(".modal-widget-preview").modal({
		// 	backdrop: 'static',
		// 	keyboard: true
		// });
	});
};

wl.confertJsontoSetting = function(data){
	var settingobj = {};
	for (var i in data){
		settingobj[data[i].name] = data[i].value;
	}
	return settingobj;
}

wl.closeModal = function() {
	// $(".modal-widget-preview").modal("hide");
	$(".modal-widget-datasource").modal("hide");
	wl.previewMode("");
	// wl.configWidgetList.dataSourceId([]);
	wl.backToFront();
};

wl.saveAndCloseModal = function(_id, datasource) {
	app.ajaxPost("/widget/previewexample", {_id: _id, dataSource: datasource(), config: $('#settingform').ecForm("getData"), mode: "save"}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		$(".modal-widget-preview").modal("hide");
		$(".modal-widget-datasource").modal("hide");
		wl.configWidgetList.dataSourceId([]);
	});
}

wl.addWidget = function() {
	app.mode("editor");
	wl.scrapperMode("");
	wl.getFile();
};

wl.saveWidget = function() {
	if (!app.isFormValid(".form-widget")) {
		return;
	}

	var data = ko.mapping.toJS(wl.configWidgetList);
	var formData = new FormData();
	formData.append("_id", data._id);
	formData.append("title", data.title);
	formData.append("description", data.description);
	formData.append("dataSourceId",data.dataSourceId.join(","));
	formData.append("mode", wl.scrapperMode());
	
	var file = $('#files').val();
	if (file == "" && wl.scrapperMode() == "") {
		sweetAlert("Oops...", 'Please choose file', "error");
		return;
	} else {
		formData.append("userfile", $('input[type=file]#files')[0].files[0]);	
	}

	app.ajaxPost("/widget/savewidget", formData, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		// console.log(res.data)
		wl.backToFront();
	});
};

wl.selectWidget = function() {
	app.wrapGridSelect(".grid-widget", ".btn", function (d) {
		wl.editWidget(d._id, "editor");
	});
}

wl.editWidget = function(_id, mode) {
	wl.getFile();
	ko.mapping.fromJS(wl.widgetListConfig, wl.configWidgetList);
	app.ajaxPost("/widget/editwidget", {_id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		var current = {};
		var newData = [];
		$.each(res.data.dataSourceId, function(key, val) {
			newData.push(val)
		});
		current._id = res.data._id;
		current.title = res.data.title;
		current.description = res.data.description;
		current.config = res.data.config;
		current.dataSourceId = newData;
		current.url = res.data.url;
		
		ko.mapping.fromJS(current, wl.configWidgetList);
		if (mode == "editor") {
			app.mode("editor");
			wl.scrapperMode("editor");
		}

		$('#settingform').ecForm({
			title: "",
			widthPerColumn: 12,
			metadata: res.data.config
		});
	});
};

wl.getFile = function() {
	$('#files').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $("#filename").text(filename);
	 });
};

wl.selectAllWidget = function(){
	$("#selectall").change(function () {
		$("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});
}

var vals = [];
wl.removeWidget = function() {
	if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
		swal({
		title: "",
		text: 'You havent choose any widget to delete',
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
		text: 'Widget(s) with id "' + vals + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/widget/removewidget",{_id: vals}, function () {
					if (!app.isFine) {
						return;
					}

				 swal({title: "Selector successfully deleted", type: "success"});
				 $("#selectall").prop('checked', false).trigger("change");
				 wl.backToFront();
				});
			},1000);
		});
	}
}

wl.backToFront = function() {
	app.mode("");
	wl.scrapperMode("");
	wl.getWidgetList("");
	wl.widgetDataSource([]);
	$("#filename").text("");
	ko.mapping.fromJS(wl.widgetListConfig, wl.configWidgetList);
};

$(function (){
	wl.getWidgetList("");
	wl.selectAllWidget();
});