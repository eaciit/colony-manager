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

wg.widgetGridColumns =  ko.observableArray([
	/*{headerTemplate: "<center><input type='checkbox' class='wgCheckAll' onclick=\" wg.checkDelData(this, 'wgAll', 'wg') \"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='wgCheck' idcheck='"+ d._id +"' onclick=\" wg.checkDelData(this, 'wg')\"/>"
		].join(" ");
	}},*/
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
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
		// apl.editApplication(d._id);
		// apl.tempCheckIdServer.push(d._id);
	});
};
wg.checkDelData = function(){

};
wg.createNewWidget = function () {
	app.mode("add");
	wg.getDataSource();

};
wg.backToFront = function(){
	app.mode("");
	wg.getWidgetGrid();
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

var vals = [];
wg.deleteWidgetGrid = function(){
	if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
		swal({
		title: "",
		text: 'You havent choose any grid to delete',
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
		text: 'Grid(s) with id "' + vals + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/widgetgrid/removegrid",{_id: vals}, function () {
					if (!app.isFine) {
						return;
					}

				 swal({title: "Grid successfully deleted", type: "success"});
				 $("#selectall").prop('checked', false).trigger("change");
				 wg.getWidgetGrid();
				});
			},1000);
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

wg.saveWidget = function(){
	/*nyoba thok mas*/
	var param = ko.mapping.toJS(wg.configWidget);
	app.ajaxPost("/widgetgrid/savegrid", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
	});

};
wg.addColumnGrid = function(){
	var widget = $.extend(true, {}, ko.mapping.toJS(wg.configWidget));
	widget.columns.push(wg.templateColumn);
	ko.mapping.fromJS(widget, wg.configWidget);
};
wg.advanceSettingColumn = function(index){
	ko.mapping.fromJS(wg.configWidget.columns()[index], wg.configWidgetColoumn);
	wg.modeAdvanceColumn(true);
};
wg.backGeneralSetting = function(){
	wg.modeAdvanceColumn(false);
};
wg.removeAdvanceSettingColumn = function(index){

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
}

$(function (){
	wg.getWidgetGrid();
});