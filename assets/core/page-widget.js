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
	{ template: function(d) {
		id = 'd._id', onclick =''
	}},
	{ field: "title", title: "Title" },
	{ field:"action"}
]);

wl.setGridwl = function (){
	$('.grid-widget').kendoGrid({
		dataSource:{ pageSize :15, data : wl.widgetListdata()}, 
		selectable : 'row',
		columns : wl.WidgetColumns(),
		pageable : true,
		dataBound: app.gridBoundTooltipster('.grid-widget'),
		rowTemplate : kendo.template($("#rowTemplate").html()),
	}).addClass("grid-soft grid-list grid-unselectable");
	$('.grid-widget').find("thead").remove();
	$('.grid-widget').find('.k-grid-header').remove();
	$('.grid-widget').find('tr:eq(0) td').css("border-top","none");	
}

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
		wl.setGridwl();
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

	// $(".modal-widget-preview").modal("hide");
	
	$(".modal-widget-config").modal({
		backdrop: 'static',
		keyboard: true
	});
};

wl.previewWidget = function(_id) {
	var param = Lazy(wl.widgetListdata()).find({_id:_id});
	app.ajaxPost("/widget/previewexample", {_id: _id, dataSource: param.dataSourceId, mode: "preview"}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}

		$(".modal-widget-preview").modal("show");
		var widgetBaseURL = baseURL + "res-widget" + res.data.widgetBasePath;
		var html = res.data.container;
		html = html.replace(/src\=\"/g, 'src="' + widgetBaseURL);
		html = html.replace(/href\=\"/g, 'href="' + widgetBaseURL);

		var iWindow = $("#preview")[0].contentWindow;

		$("#preview").off("load").on("load", function(){
			var setting = wl.confertJsontoSetting($('#settingform').ecForm("getData"));
			console.log(iWindow.Render);
			console.log(res.data.dataSource);
			console.log(setting);
			iWindow.Render(res.data.dataSource, setting, {});
		});

		var contentDoc = iWindow.document;
		contentDoc.open();
		contentDoc.write(html);
		contentDoc.close();
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
	$(".modal-widget-config").modal("hide");
	$(".modal-widget-preview").modal("hide");
	wl.previewMode("");
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
		$(".modal-widget-config").modal("hide");
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
	app.registerSearchKeyup($('.searchbr'), wl.getWidgetList);
});