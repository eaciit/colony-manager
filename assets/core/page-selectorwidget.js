app.section('selectorwidget');

viewModel.SelectorWidget = {}; var sw = viewModel.SelectorWidget;

sw.templateConfig = {
    _id : "",
    Title : "",
    MasterDataSource : "",
    Fields : []
}
sw.templateConfigField = {
	_id: "",
	deletable: true,
	key: "",
	value: ""
};
sw.showSelectorWidget = ko.observable(true);
sw.selectorData = ko.observableArray([]);
sw.scrapperMode = ko.observable("");
sw.dataSources = ko.observableArray([]);
sw.configSelectorWidget = ko.mapping.fromJS(sw.templateConfig);
sw.selectorWidgetColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	// { width: 100, title: "Simple Filter", template: "<center><input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallselector' onclick=\"sw.checkAllSelector(this, 'selector')\" /></center>"},
	{ field: "Name", title: "ID" }
]);

sw.dataTemp = ko.observableArray([
	{"Name": "abc"},
	{"Name": "def"}
]);

sw.getSelectorWidget = function() {
	sw.selectorData(sw.dataTemp());
	/*app.ajaxPost("/databrowser/getbrowser", {search: br.searchfield()}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		sw.selectorData(res.data);
	});*/
}

sw.selectSelectorWidget = function() {
	app.wrapGridSelect(".grid-selectorwidget", ".btn", function (d) {
		sw.editSelectorWidget(d._id);
		sw.showSelectorWidget(true);
	});
}

sw.editSelectorWidget = function(_id) {
	alert("maknyos")
}

sw.selectAllSelector = function(){
	$("#selectall").change(function () {
		$("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});
}

sw.createNewSelector = function() {
	app.mode("editor");
	sw.scrapperMode("");
	app.ajaxPost("/datasource/getdatasources", {search: ""}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		sw.dataSources(res.data);
	});
	// ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	// dbq.clearQuery()
	// $("#grid-databrowser-design").data('kendoGrid').dataSource.data([]);
	// db.showHideFreeQuery();
}

sw.addFields = function () {
	var setting = $.extend(true, {}, sw.templateConfigField);
	setting._id = "s" + moment.now();
	sw.configSelectorWidget.Fields.push(ko.mapping.fromJS(setting));
};

sw.removeField = function (each) {
	return function () {
		console.log(each);
		sw.configSelectorWidget.Fields.remove(each);
	};
};

sw.saveSelector = function() {
	// app.mode("");
}

sw.backToFront = function() {
	app.mode("");
}

$(function (){
	sw.getSelectorWidget();
	sw.selectAllSelector();
});