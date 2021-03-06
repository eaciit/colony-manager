app.section('pages');

viewModel.Pages = {}; var p = viewModel.Pages;
p.pageData = ko.observableArray([]);
p.searchField = ko.observable('');
p.templateConfigPage = viewModel.templateModels.PageDetail;
p.configPage = ko.mapping.fromJS(p.templateConfigPage);
p.dataSources = ko.observableArray([]);
p.scrapEdit = ko.observable("");
p.pageColumns = ko.observableArray([
	{title: "<center><input type='checkbox' class='select-all' onchange='p.selectAll(this);'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='select-row' value=" + d._id + " name='select[]'> "
		].join(" ");
	}},
	{ field: "title", title: "Title" },
	{ field: "url", title: "Url" },
	{ title: "", width: 130, attributes:{class:"align-center"}, template: function(d){
		return[
			"<div class='btn-group btn-sm'><button class='btn btn-sm btn-default btn-primary tooltipster' title='Go To Designer' onclick='location.href=\"/web/pagedesigner?id=" + d._id.replace(/\|/g, "-") + "\"'><span class='fa fa-gear'></span></button>",
			"<button class='btn btn-sm btn-default btn-primary tooltipster' title='Go To Preview' onclick='location.href=\"/page/" + d._id.replace(/\|/g, "-") + "\"'><span class='fa fa-eye'></span></button></div>",
		].join(" ");
	}}
]);

p.getPages = function (mode) {
	if (mode == "refresh" && undefined ){
		p.pageData([]);
	}

	app.ajaxPost("/pagedesigner/getpages", { search: p.searchField() }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (!res.data){
			res.data = [];
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
	app.wrapGridSelect(".grid-page", ".btn", function (d) {
		p.scrapEdit("test");
		app.ajaxPost("/pagedesigner/selectpage", { _id: dataItem._id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		p.addPage();
		ko.mapping.fromJS(res.data.pageDetail, p.configPage);
		});
	});
}

p.removePage = function () {
	var vals = [];
	if ($('input:checkbox[name="select[]"]').is(':checked') == false){
		swal({
			title:"Opsss",
			text:"You havent choose any page to delete",
			type:"warning",
			confirmButtonText:"OK",
			closeOnConfirm:true,
			confirmButtonColor: "#DD6B55"
		});
		}else {
			vals = $('input:checkbox[name="select[]"]').filter(':checked').map(function(){
				return this.value;
			}).get();
			swal({
			title: "Are you sure?",
			text: 'Page(s) with id "' + vals + '" will be deleted',
			type: "warning",
			showCancelButton: true,
			closeOnConfirm: true,
			confirmButtonText: "Delete",
			confirmButtonColor: "#DD6B55"
			},
			function(){
				setTimeout(function() {
					app.ajaxPost("/pagedesigner/removepage", { ids: vals }, function (res) {
						if (!app.isFine(res)) {
							return;
						}
						swal({title: "Page successfully deleted", type: "success"});
						p.backToFront();
					});
				}, 1000);
			})
		}
};

p.backToFront = function () {
	$('.select-all').prop('checked',false).trigger("change");
	app.mode("");
	p.getPages();
	p.scrapEdit("");
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
	app.registerSearchKeyup($('.search'), p.getPages);
});
