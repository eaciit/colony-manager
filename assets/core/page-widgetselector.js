app.section('selectorwidget');

viewModel.SelectorWidget = {}; var sw = viewModel.SelectorWidget;

sw.templateConfig = {
    _id : "",
    title : "",
    masterDataSource : "",
    fields : []
}
sw.templateConfigField = {
	_id: "",
	dataSource: "",
	field: ""
};
sw.showSelectorWidget = ko.observable(true);
sw.selectorData = ko.observableArray([]);
sw.scrapperMode = ko.observable("");
sw.masterDataSources = ko.observableArray([]);
sw.dataSources = ko.observableArray([]);
sw.fieldMetaData = ko.observableArray([]);
sw.configSelectorWidget = ko.mapping.fromJS(sw.templateConfig);
sw.selectorWidgetColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	// { width: 100, title: "Simple Filter", template: "<center><input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallselector' onclick=\"sw.checkAllSelector(this, 'selector')\" /></center>"},
	{ field: "title", title: "Title" }
]);

sw.getSelectorWidget = function() {
	app.ajaxPost("/widgetselector/getselectorconfigs", {}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		sw.selectorData(res.data);
	});
}

sw.selectSelectorWidget = function() {
	app.wrapGridSelect(".grid-selectorwidget", ".btn", function (d) {
		sw.editSelectorWidget(d._id);
		sw.showSelectorWidget(true);
	});
}

sw.editSelectorWidget = function(_id) {
	ko.mapping.fromJS(sw.templateConfig, sw.configSelectorWidget);
	app.ajaxPost("/widgetselector/editwidgetselector", {_id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}

		sw.getDataSource(false);
		$.each(res.data.fields, function(key, val) {
			sw.getMetaData(val.dataSource, key)
		});
		app.mode("editor");
		sw.scrapperMode("editor");
		ko.mapping.fromJS(res.data, sw.configSelectorWidget);
		console.log(sw.configSelectorWidget)
		// sw.dataSources(res.data.masterDataSource);
		// sw.addFields();
	});
}

var vals = [];
sw.deleteSelectorWidget = function(){
	if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
		swal({
		title: "",
		text: 'You havent choose any selector to delete',
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
		text: 'Selector(s) with id "' + vals + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/widgetselector/RemoveSelector",{_id: vals}, function () {
					if (!app.isFine) {
						return;
					}

				 swal({title: "Selector successfully deleted", type: "success"});
				 sw.getSelectorWidget();
				});
			},1000);

		});
	}
}

sw.selectAllSelector = function(){
	$("#selectall").change(function () {
		$("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});
}

sw.createNewSelector = function() {
	app.mode("editor");
	sw.scrapperMode("");
	sw.getDataSource(true);
}

sw.getDataSource = function(createNew) {
	app.ajaxPost("/datasource/getdatasources", {search: ""}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		sw.dataSources(res.data);
		sw.masterDataSources(res.data)
		if (createNew){
			sw.addFields();
		}
	});
}

sw.addFields = function () {
	var setting = $.extend(true, {}, sw.templateConfigField);
	setting._id = "s" + moment.now();
	sw.configSelectorWidget.fields.push(ko.mapping.fromJS(setting));
};

sw.removeFieldSelector = function(each) {
	return function () {
		sw.configSelectorWidget.fields.remove(each);
	};
};

sw.saveSelector = function() {
	var validator = $(".form-selector-widget").kendoValidator().data('kendoValidator');
	if (!validator.validate()) {
		return;
	}

	var param = ko.mapping.toJS(sw.configSelectorWidget);
	app.ajaxPost("/widgetselector/saveselector", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		sw.backToFront();
	});
}

sw.getMetaData = function (each, index) {
	app.ajaxPost("/datasource/selectdatasource", { _id: each }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		var ds = new kendo.data.DataSource({ data: res.data.MetaData });
		$("select.field").eq(index).data("kendoDropDownList").setDataSource(ds);
		$("select.field").eq(index).data("kendoDropDownList").value(sw.configSelectorWidget.fields()[index].field());
	});
};

sw.fieldChecker = function() {

};

sw.backToFront = function() {
	app.mode("");
	sw.getSelectorWidget();
	ko.mapping.fromJS(sw.templateConfig, sw.configSelectorWidget);
	$('#tabed').tabs({disabled: []}).find('a[href="#general"]').trigger('click');
}

$(function (){
	sw.getSelectorWidget();
	sw.selectAllSelector();
});