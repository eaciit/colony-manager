app.section('pagedesigner');

viewModel.PageDesigner = {}; var pg = viewModel.PageDesigner;

pg.wdigetDesignerConfig = {
	_id: "",
	title: "",
	url: "",
	widget: [],
	dataSources: []
};
pg.widgetSettingsConfig = {
	_id: "",
	widgetId: "",
	height: 0,
	width: 0,
	position: "",
	title: "",
	dataSources: [],
	configDefault: []
}
pg.mappings = {
	dsWidget: "",
	dsColony: ""
}
pg.dsMappingConfig = {
	field: []
}
pg.widgetAvailableConfig = {
	_id: "",
	title: ""
};
pg.allWidget = {
	widgets: []
}
pg.widgetPosition = ko.observableArray([
	{value: "fixed", text: "Fixed"},
	{value: "absolute", text: "Absolute"}
]);
pg.allDataSources = ko.observableArray([]);
pg.availableWidget = ko.mapping.fromJS(pg.allWidget);
pg.configPageDesigner = ko.mapping.fromJS(pg.wdigetDesignerConfig);
pg.dsMapping = ko.mapping.fromJS(pg.dsMappingConfig);
pg.dsWidgetFromPage = ko.observableArray([]);
pg.widgetSettings = ko.mapping.fromJS(pg.widgetSettingsConfig);
pg.previewMode = ko.observable("");
pg.getDataSource = function() {
	app.ajaxPost("/page/getdatasource", {}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		$.each(res.data, function(key,val) {
			pg.allDataSources.push(val._id)	
		});
	});
}
pg.saveConfig = function() {
	if (!app.isFormValid(".form-widgetDesigner")) {
		return;
	}

	var param = {_id: pg.pageID, dataSourceId: ko.mapping.toJS(pg.configPageDesigner)["dataSources"]}
	app.ajaxPost("/page/saveconfigpage", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		pg.backToConfig();
	});
}
pg.getAvailableWidget = function() {
	app.ajaxPost("/widget/getwidget", {search: ""}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		
		$.each(res.data, function(key, val) {
			var property = $.extend(true, {}, ko.mapping.toJS(pg.availableWidget));
			var mapping = pg.widgetAvailableConfig;
			mapping._id = val._id;
			mapping.title = val.title;
			property.widgets.push(mapping);
			ko.mapping.fromJS(property, pg.availableWidget);
		});
	});
};
pg.getConfigurationPage = function(_id, mode, widgetId, widgetPageId) {
	var param
	if (mode == "new widget") {
		param = {_id: _id, widgetId: widgetId, widgetPageId: widgetPageId, mode: mode}
	} else {
		param = {_id: _id, widgetId: "", widgetPageId: "", mode: ""}
	}
	// console.log(param)
	app.ajaxPost("/page/editpagedesigner", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		
		setTimeout(function () {
			ko.mapping.fromJS(res.data, pg.configPageDesigner)
		},100);
		
		if (mode == "settingwidget") {
			var datavalue = [];
			if (res.data.dataSources != null) {
				$.each(res.data.dataSources, function(key, val) {
					data = {};
					data.value = val;
					data.text = val;
					datavalue.push(data)
				});
				pg.dsWidgetFromPage(datavalue)

				$.each(res.data.widget, function(keys, values) {
					if (widgetId == values._id) {
						ko.mapping.fromJS(values, pg.widgetSettings);
						$.each(values.dataSources, function(key, value) {
							$.each(value, function(k, v) {
								if (k != "fields") {
									var property = $.extend(true, {}, ko.mapping.toJS(pg.dsMapping));
									var mapping = pg.mappings;
									mapping.dsWidget = k;
									mapping.dsColony = v;
									property.field.push(mapping);
									ko.mapping.fromJS(property, pg.dsMapping);
								}
							});
						});
					}
				});
			} else {
				swal({
				title: "Oops...",
				text: 'Datasource is empty, please add datasource first on configuration button.',
				type: "error",
				closeOnConfirm: true
				},
				function() {
					pg.closeWidgetSetting();
				});
			}
		}
	});
}
pg.configPage = function() {
	app.mode("configpage");
	pg.getDataSource();
	pg.getConfigurationPage(pg.pageID, "configuration", "", "");
};
pg.widgetSetting = function(_id, mode) {
	app.mode("datasourceMapping");
	pg.previewMode("");
	if (mode != "back") {
		pg.getConfigurationPage(pg.pageID, "settingwidget", _id, "");
	}
	// pg.getDataSource();
	if (mode == "modal") {
		$(".modal-widgetsetting").modal({
			backdrop: 'static',
			keyboard: true
		});
	}
}
pg.fieldMapping = function() {
	if (!app.isFormValid("#dsWidget")) {
		return;
	}
	$( "#formSetting" ).empty();
	var prop = ko.mapping.toJS(pg.widgetSettings)
	var param = {
		pageId: pg.pageID,
		widgetId: prop.widgetId,
		datasource: ko.mapping.toJS(pg.dsMapping.field)
	};

	$.each(ko.mapping.toJS(pg.dsMapping.field), function(key, val) {
		$.each(val, function(a,b) {
			$.each(prop.dataSources[key], function(x,y) {
				if (b == x){
					prop.dataSources[key][x] = val.dsColony
					// console.log(prop, prop.dataSources)
				}
			});
		});
	});

	app.ajaxPost("/page/getallfields", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode("fieldMapping");
		pg.previewMode("fieldMapping");

		var urlprev = "src=\"";
		var html = res.data.container.replace(new RegExp(urlprev, 'g'), urlprev+"http://"+res.data.url);
		urlprev = "href=\"";
		html = html.replace(new RegExp(urlprev, 'g'), urlprev+"http://"+res.data.url);
		$("#formSetting").off("load").on("load", function(){
			window.frames[0].frameElement.contentWindow.DsFields(res.data.fieldDs, res.data.pageId, prop);
		});
		var contentDoc = $("#formSetting")[0].contentWindow.document;
		contentDoc.open('text/html', 'replace');
		contentDoc.write(html);
		contentDoc.close();
	});
}
pg.closeWidgetSetting = function() {
	$(".modal-widgetsetting").modal("hide");
	pg.backToConfig();
}
pg.backToConfig = function() {
	app.mode("");
	pg.allDataSources([]);
	ko.mapping.fromJS(pg.dsMappingConfig, pg.dsMapping)
	ko.mapping.fromJS(pg.wdigetDesignerConfig, pg.configPageDesigner)
}

//temp button
pg.widgetPage = function(pageId, widgetPageId, widgetId, mode) {
	pg.getConfigurationPage(pageId, mode, widgetId, widgetPageId)
};

pg.adjustIframe = function() {
	document.getElementById("formSetting").style.height = document.getElementById("formSetting").contentWindow.document.body.scrollHeight + "px";
};

pg.AdjustIframeHeight = function(i) { document.getElementById("formSetting").style.height = parseInt(i) + "px"; }

window.closeModal = function(){
	pg.closeWidgetSetting();
}

$(function (){
	pg.getConfigurationPage(pg.pageID, "", "", "");
	pg.getAvailableWidget();
});