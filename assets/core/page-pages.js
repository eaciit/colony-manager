app.section('pages');

viewModel.Pages = {}; var p = viewModel.Pages;
p.pageData = ko.observableArray([]);
p.searchField = ko.observable('');
p.templateConfigPage = {
	_id: "",
	title: "",
	url: "",
	parentMenu:  "",
	dataSources: [],
};
p.configPage = ko.mapping.fromJS(p.templateConfigPage);
p.dataSources = ko.observableArray([]);

p.pageColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{ field: "title", title: "Title" },
	{ field: "url", title: "Url" },
	{title: "", width: 300, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Page Designer' onclick='location.href=\"/web/pagedesigner?id=" + d._id.replace(/\|/g, "-") + "\"'><span class='fa fa-eye'></span></button>",
		].join(" ");
	}}
]);
p.getPages = function () {
	app.ajaxPost("/pagedesigner/getpages", { search: p.searchField() }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		p.pageData(res.data);
	});
};
p.getDataSources = function () {
	app.ajaxPost("/datasource/getdatasources", { search: "" }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		p.dataSources(res.data);
	});
};
p.addPage = function () {
	app.mode("editor");
	app.showfilter(false);
};
p.removePage = function () {

};
p.backToFront = function () {
	app.mode("");
	p.getPages();
};
p.savePage = function () {
	if (!app.isFormValid(".form-add-page")) {
		return;
	}

	var param = ko.mapping.toJS(p.configPage);
	app.ajaxPost("/pagedesigner/savepage", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		
	});
};

$(function () {
	p.getPages();
	p.getDataSources();
});