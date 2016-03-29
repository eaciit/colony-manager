app.section('chartwidget');

viewModel.ChartWidget = {}; var cw = viewModel.ChartWidget;

cw.templateConfig = {
	_id: "",
	chartName: "",
	fileName: ""
}
cw.templateConfigArea = {
    _id: "",
	outsiders: {},
	title: "",
	dataSourceID: "",
	chartArea: {},
	dataSource: {},
	legend: {},
	seriesDefaultType: "",
	series: {},
	valueAxis: {},
	categoryAxis: [],
	tooltip: {}
}
cw.templateCategoryAxis = {
	field: ""
};

cw.searchfield = ko.observable("");
cw.scrapperMode = ko.observable("");
cw.chartData = ko.observableArray([]);
cw.configChartWidget = ko.mapping.fromJS(cw.templateConfig);
cw.configChartWidgetArea = ko.mapping.fromJS(cw.templateConfigArea);
cw.chartWidgetColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	// { width: 100, title: "Simple Filter", template: "<center><input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallselector' onclick=\"sw.checkAllSelector(this, 'selector')\" /></center>"},
	{ field: "chartName", title: "Title" },
	{title: "", width: 120, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Open Preview' onclick='cw.PreviewChart(\"" + d._id + "\")'><span class='fa fa-eye'></span></button>"
		].join(" ");
	}}
]);

cw.getChartWidget = function() {
	app.ajaxPost("/widgetchart/getchartdata", {search: cw.searchfield()}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		cw.chartData(res.data);
	});
}

cw.selectChartWidget = function() {
	// alert("hayoo");
	app.wrapGridSelect(".grid-chartwidget", ".btn", function (d) {
		cw.editChartWidget(d._id);
		// cw.showSelectorWidget(true);
	});
}

cw.editChartWidget = function(_id) {
	var param = {_id: _id}
	app.ajaxPost("/widgetchart/getdetailchart", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		console.log(res.data)
	});
}

cw.createNewChart = function() {
	app.mode("editor");
	cw.scrapperMode("");
	// sw.getDataSource(true);
}

cw.saveChart = function() {
	/*var validator = $(".form-selector-widget").kendoValidator().data('kendoValidator');
	if (!validator.validate()) {
		return;
	}

	var param = ko.mapping.toJS(cw.configSelectorWidget);
	app.ajaxPost("/widgetselector/saveselector", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		cw.backToFront();
	});*/
}

cw.selectAllSelector = function(){
	/*$("#selectall").change(function () {
		$("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});*/
}

var vals = [];
cw.deleteChartWidget = function(){
	/*if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
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
				 $("#selectall").prop('checked', false).trigger("change");
				 sw.getSelectorWidget();
				});
			},1000);
		});
	}*/
}

cw.backToFront = function() {
	app.mode("");
	cw.getChartWidget();
	// ko.mapping.fromJS(sw.templateConfig, sw.configSelectorWidget);
	// $('#tabed').tabs({disabled: []}).find('a[href="#general"]').trigger('click');
}

$(function (){
	cw.getChartWidget();
});