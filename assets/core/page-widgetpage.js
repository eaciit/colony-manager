app.section('widgetpage');

viewModel.WidgetPage = {}; var wp = viewModel.WidgetPage;
wp.pageListConfig = {
	_id: "",
	title: "",
	url: "",
	parentMenu:  "",
	dataSources: [],
};
wp.pageListdata = ko.observableArray([]);
wp.searchfield = ko.observable("");
wp.scrapperMode = ko.observable("");
wp.configPageList = ko.mapping.fromJS(wp.pageListConfig);

wp.PageColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{ field: "title", title: "Title" },
	{ field: "url", title: "Url" },
	{title: "", width: 300, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Page Designer'><span class='fa fa-eye'></span></button>",
		].join(" ");
	}}
]);

wp.selectPage = function(){

};
wp.removePage = function(){

};
wp.backToFront = function(){
	app.mode("");
	wp.scrapperMode("");
	wp.getPageList();
	ko.mapping.fromJS(wp.pageListConfig, wp.configPageList);
};
wp.savePage = function(){
	if (!app.isFormValid(".form-widget")) {
		return;
	}
	var param = ko.mapping.toJS(wp.configPageList);
	app.ajaxPost("#", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wg.backToFront();
	});
};
wp.addPage = function(){
	app.mode("editor");
	wp.scrapperMode("");
};
wp.getPageList = function(){
	app.ajaxPost("#", {search: wp.searchfield()}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		wp.pageListdata(res.data);
	});
};

$(function (){
	wp.getPageList();
});