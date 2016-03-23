app.section('widgetgrid');

viewModel.widgetgrid = {}; var wg = viewModel.widgetgrid;

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
	headerAttributes: "",
	footerTemplate: "",
}
wg.templateHeaderAttr = {
	class: "",
	style: "",
}

wg.widgetGridData = ko.observableArray([]);
wg.configWidget = ko.mapping.fromJS(wg.templateWidgetGrid);
wg.configWidgetColoumn = ko.mapping.fromJS(wg.templateColumn);
wg.recordsField = ko.observableArray([]);
wg.recordDataSource = ko.observableArray([]);
wg.modeAdvanceColumn = ko.observable(false);

wg.widgetGridColumns =  ko.observableArray([
	{headerTemplate: "<center><input type='checkbox' class='wgCheckAll' onclick=\" wg.checkDelData(this, 'wgAll', 'wg') \"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='wgCheck' idcheck='"+ d._id +"' onclick=\" wg.checkDelData(this, 'wg')\"/>"
		].join(" ");
	}},
	{ field: "_id", title: "ID" },
	{ field: "Title", title: "Widget Name" },
	{ title: "", width: 70, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start'><span class='glyphicon glyphicon-eye-open'></span></button>",
		].join(" ");
	} },
]);
wg.selectWidget = function (e) {
	app.wrapGridSelect(".grid-widget", ".btn", function (d) {
		// apl.editApplication(d._id);
		// apl.tempCheckIdServer.push(d._id);
	});
};
wg.checkDelData = function(){

};
wg.createNewWidget = function () {
	app.mode("add");

};
wg.backToFront = function(){
	app.mode("");
};
wg.OnRemove = function(){

};
wg.saveWidget = function(){

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