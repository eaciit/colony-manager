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
	{ field: "dataSourceId", title: "Data Source", template: "#= dataSourceId.join(', ') #", 
		editor: function(container, options) {
			$("<select multiple='multiple' data-bind='value: dataSourceId' />")
            .appendTo(container)
            .kendoMultiSelect({
            	autoClose: false,
                dataSource: wl.widgetDataSource(),
                select: wl.selectCount
            });
		}
	},
	{title: "", width: 300, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Open Preview' onclick=''><span class='fa fa-eye'></span></button>",
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

wl.addWidget = function() {
	app.mode("editor");
	wl.scrapperMode("");
	wl.getDataSource();
};

wl.saveWidget = function() {

};

wl.backToFront = function() {
	app.mode("");
	wl.scrapperMode("");
	wl.getWidgetList();
};

$(function (){
	wl.getWidgetList();
});