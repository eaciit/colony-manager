app.section('widgetgrid');

viewModel.widgetgrid = {}; var wg = viewModel.widgetgrid;

/*buat nampilin data di bagian grid*/
wg.templateMapGrid = {
	_id: "",
	gridName: "",
	fileName: "",
}

wg.templateWidgetGrid = {
	_id: "",
	title: "",
	dataSourceID: "",
	aggregate: [],
	outsider: {
		visiblePDF: false,
		visibleExcel: false,
	},
	pageSize: 10,
	groupable: false,
	sortable: false,
	filterable: false,
	pageable: {
		refresh: false,
		pageSize: false,
		buttonCount: 0,
	},
	columns: [],
	columnMenu: false,
	toolbar: [],
	pdf: {
		fileName: "",
		allPages: true,
	},
	excel: {
		fileName: "",
		allPages: true,
	},
}
wg.aggregateColumn = {
	field: "",
	aggregate: "",
}
wg.templateColumn = {
	template: "",
	field: "",
	title: "",
	format: "",
	width: "",
	menu: false,
	headerTemplate: "",
	headerAttributes: {
		class: "",
		style: "",
	},
	footerTemplate: "",
}
wg.templateHeaderAttr = {
	class: "",
	style: "",
}

wg.widgetGridData = ko.observableArray([]);
wg.scrapperMode = ko.observable("");
wg.configWidget = ko.mapping.fromJS(wg.templateWidgetGrid);
wg.configWidgetColoumn = ko.mapping.fromJS(wg.templateColumn);
wg.recordsField = ko.observableArray([]);
wg.recordDataSource = ko.observableArray([]);
wg.modeAdvanceColumn = ko.observable(false);
wg.tempCheckIdWg = ko.observableArray([]);
wg.tempIndexColumn = ko.observable(0);
wg.dataAggregate = ko.observableArray(["COUNT","SUM","AVG","MAX","MIN"]);

wg.widgetGridColumns =  ko.observableArray([
	{headerTemplate: "<center><input type='checkbox' class='wgcheckall' onclick=\" wg.checkDelData(this, 'wgcheckall', 'wg') \"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='wgcheck' idcheck='"+ d._id +"' onclick=\" wg.checkDelData(this, 'wgcheck')\"/>"
		].join(" ");
	}},
	{ field: "_id", title: "ID" },
	{ field: "gridName", title: "Widget Name" },
	{ title: "", width: 70, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start'><span class='glyphicon glyphicon-eye-open'></span></button>",
		].join(" ");
	} },
]);
wg.selectWidget = function (e) {
	app.wrapGridSelect(".grid-widget", ".btn", function (d) {
		wg.editWidgetGrid(d._id)
	});
};
wg.checkDelData = function(elem, e){
	if (e === 'wgcheckall'){
		if ($(elem).prop('checked') === true){
			$('.wgcheck').each(function(index) {
				$(this).prop("checked", true);
				wg.tempCheckIdWg.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.wgcheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				wg.tempCheckIdWg.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			wg.tempCheckIdWg.push($(elem).attr('idcheck'));
		} else {
			wg.tempCheckIdWg.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
};
wg.createNewWidget = function () {
	app.mode("add");
	wg.getDataSource();

};
wg.backToFront = function(){
	ko.mapping.fromJS(wg.templateWidgetGrid, wg.configWidget);
	app.mode("");
	wg.getWidgetGrid();
	wg.tempCheckIdWg([]);
};
wg.OnRemove = function(){

};

wg.getDataSource = function() {
	app.ajaxPost("/widgetgrid/getquerydatasource", {}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		wg.recordDataSource(res.data);
	});
}

wg.deleteWidgetGrid = function(){
	if (wg.tempCheckIdWg().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any grid to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
			title: "Are you sure?",
			text: 'Data grabber with id '+wg.tempCheckIdWg().toString()+' will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: true
		}, function() {
			setTimeout(function () {
				app.ajaxPost("/widgetgrid/removegrid", { _id: wg.tempCheckIdWg() }, function (res) {
					if (!app.isFine(res)) {
						return;
					}

					swal({ title: "Data successfully deleted", type: "success" });
					wg.backToFront();
				});
			}, 1000);
		});
	}
};

wg.editWidgetGrid = function(_id){
	ko.mapping.fromJS(wg.templateWidgetGrid, wg.configWidget);
	app.ajaxPost("/widgetgrid/getdetailgrid", {_id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		app.mode("editor");
		wg.scrapperMode("editor");
		ko.mapping.fromJS(res.data, wg.configWidget);
	});

};

wg.getWidgetGrid = function(){
	app.ajaxPost("/widgetgrid/getgriddata", {search: ""}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		wg.widgetGridData(res.data);
	});

};
wg.selectDataSource = function(e){
	var dataItem = this.dataItem(e.item);
	var metadata = ko.utils.arrayFilter(wg.recordDataSource(), function (each) {
        return each._id == dataItem._id;
	});
	if (metadata.length > 0)
		wg.recordsField(metadata[0].MetaData);
}
wg.selectFieldColumn = function(e,data){
	wg.configWidget.columns()[e].title(data._id);
};
wg.saveWidget = function(){
	if (!app.isFormValid(".form-widget")) {
		return;
	}
	var param = ko.mapping.toJS(wg.configWidget);
	app.ajaxPost("/widgetgrid/savegrid", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wg.backToFront();
	});

};
wg.addColumnGrid = function(){
	var widget = $.extend(true, {}, ko.mapping.toJS(wg.configWidget));
	widget.columns.push(wg.templateColumn);
	ko.mapping.fromJS(widget, wg.configWidget);
};
wg.advanceSettingColumn = function(index){
	wg.tempIndexColumn(index);
	ko.mapping.fromJS(wg.configWidget.columns()[index], wg.configWidgetColoumn);
	wg.modeAdvanceColumn(true);
};
wg.backGeneralSetting = function(){
	// ko.mapping.fromJS(wg.configWidget.columns()[index], wg.configWidgetColoumn);
	wg.tempIndexColumn(0);
	wg.modeAdvanceColumn(false);
};
wg.saveAdvanceSetting = function(){
	var widget = $.extend(true, {}, ko.mapping.toJS(wg.configWidget));
	widget.columns[wg.tempIndexColumn()] = ko.mapping.toJS(wg.configWidgetColoumn);
	ko.mapping.fromJS(widget, wg.configWidget);
	wg.modeAdvanceColumn(false);
}
wg.removeAdvanceSettingColumn = function(index){
	if (wg.configWidget.columns().length > index) {
		var item = wg.configWidget.columns()[index];
		wg.configWidget.columns.remove(item);
	}
};
wg.visiblePDF = function(){
	var conf = wg.configWidget;
	if (conf.outsider.visiblePDF()){
		conf.toolbar.push("pdf");
	} else {
		conf.toolbar.remove( function (item) { return item === 'excel'; } )
	}
	return true;
};
wg.visibleExcel = function(){
	var conf = wg.configWidget;
	if (conf.outsider.visibleExcel()){
		conf.toolbar.push("excel");
	} else {
		conf.toolbar.remove( function (item) { return item === 'excel'; } )
	}
	return true;
};
wg.previewWidget = function(){
	$('#modal-preview').modal('show');
}

$(function (){
	wg.getWidgetGrid();
});