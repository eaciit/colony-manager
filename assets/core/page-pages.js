app.section('pages');

viewModel.Pages = {}; var p = viewModel.Pages;
p.pageData = ko.observableArray([]);
p.searchField = ko.observable('');
p.templateConfigPage = viewModel.templateModels.PageDetail;
p.configPage = ko.mapping.fromJS(p.templateConfigPage);
p.dataSources = ko.observableArray([]);

p.pageColumns = ko.observableArray([
	{title: "<center><input type='checkbox' onchange='p.selectAll(this);'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='select-row' value=" + d._id + ">"
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
p.selectPage = function () {
	var dataItem = this.dataItem(this.select());
	app.ajaxPost("/pagedesigner/selectpage", { _id: dataItem._id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		p.addPage();
		ko.mapping.fromJS(res.data.pageDetail, p.configPage);
	});
}
p.removePage = function () {
	var rows = $(".grid-page .select-row:checked").get().map(function (d) {
		var uid = $(d).closest("tr").attr("data-uid");
		var id = $(".grid-page").data("kendoGrid").dataSource.getByUid(uid)._id;
		return id;
	});

	if (rows.length == 0) {
		swal({ title: "Opsss", text: "Select row to remove", type: "warning" });
		return;
	}

	swal({
		title: "Are you sure?",
		text: 'Data grabber with id '+dg.tempCheckIdDataGrabber().toString()+' will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
	}, function() {
		app.ajaxPost("/pagedesigner/removepage", { ids: rows }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			p.getPages();
		});
	});
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

		swal({ title: "Page saved", type: "success" });
		p.backToFront();
		p.getPages();
	});
};
p.selectAll = function (o) {
	$(".grid-page .select-row").each(function (i, d) {
		$(d).prop("checked", o.checked);
	});
};

$(function () {
	if (document.URL.indexOf("/pages") > -1) {
		p.getPages();
		p.getDataSources();
	}
});