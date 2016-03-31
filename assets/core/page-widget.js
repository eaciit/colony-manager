app.section('widget');

viewModel.Widget = {}; var wl = viewModel.Widget;
wl.widgetListConfig = {
	_id: "",
	title: "",
	dataSourceId: [],
	description:  ""
};
wl.widgetListdata = ko.observableArray([]);
wl.widgetDataSource = ko.observableArray([]);
wl.configWidgetList = ko.mapping.fromJS(wl.widgetListConfig);
wl.searchfield = ko.observable("");
wl.scrapperMode = ko.observable("");
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
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Setting' onclick=''><span class='fa fa-pencil'></span></button>",
		].join(" ");
	}}
]);

wl.selectCount = function(e) {
	console.log(this.dataSource.view(), e.item.index())
	var dataItem = this.dataSource.view()[e.item.index()];
    console.log("event :: select (" + dataItem.text + " : " + dataItem.value + ")" );
}

wl.getWidgetList = function() {
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
	var getId = (mode == "grid") ? _id : _id();
	$(".modal-widget-preview").modal("hide");
	wl.editWidget(getId, "preview")
	$(".modal-widget-datasource").modal({
		backdrop: 'static',
		keyboard: true
	});
};

wl.previewWidget = function(_id) {
	// $(".modal-widget-datasource").modal("hide");
	app.ajaxPost("/widget/previewexample", {_id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		$("#preview").html(res.data); 
		$(".modal-widget-preview").modal({
			backdrop: 'static',
			keyboard: true
		});
	});
};

wl.closeModal = function() {
	$(".modal-widget-preview").modal("hide");
	$(".modal-widget-datasource").modal("hide");
	wl.configWidgetList.dataSourceId([]);
};

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
			console.log("error")
			return;
		}
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
		// console.log(_id,res.data)
		ko.mapping.fromJS(res.data, wl.configWidgetList);
		if (mode == "editor") {
			app.mode("editor");
			wl.scrapperMode("editor");
		}
	});
};

wl.getFile = function() {
	$('#files').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $("#filename").text(filename)
	 });
};

wl.backToFront = function() {
	app.mode("");
	wl.scrapperMode("");
	wl.getWidgetList();
	wl.widgetDataSource([]);
	ko.mapping.fromJS(wl.widgetListConfig, wl.configWidgetList);
};

$(function (){
	wl.getWidgetList();
});