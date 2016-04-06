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
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Page Designer' onclick='location.href=\"/web/widgetdesigner?id=" + d._id.replace(/\|/g, "-") + "\"'><span class='fa fa-eye'></span></button>",
		].join(" ");
	}}
]);

wp.selectPage = function(){
	app.wrapGridSelect(".grid-page", ".btn", function (d) {
		wp.editPage(d._id, "editor");
	});
};
wp.editPage = function(_id){
	ko.mapping.fromJS(wp.pageListConfig, wp.configPageList);
	app.ajaxPost("/page/editpage", {_id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		app.mode("editor");
		wp.scrapperMode("editor");
		ko.mapping.fromJS(res.data, wp.configPageList);
	});
};
wp.removePage = function(){
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
				app.ajaxPost("/page/removepage",{_id: vals}, function () {
					if (!app.isFine) {
						return;
					}

				 swal({title: "Selector successfully deleted", type: "success"});
				 $("#selectall").prop('checked', false).trigger("change");
				 wp.backToFront();
				});
			},1000);
		});
	}
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
	app.ajaxPost("/page/savepage", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wp.backToFront();
	});
};
wp.addPage = function(){
	app.mode("editor");
	wp.scrapperMode("");
};
wp.getPageList = function(){
	app.ajaxPost("/page/getpage", {search: wp.searchfield()}, function(res){
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