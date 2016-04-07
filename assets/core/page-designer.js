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
pg.allDataSources = ko.observableArray([]);
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
	app.ajaxPost("/page/savedesigner", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		pg.backToConfig();
	});
}
pg.getConfigurationPage = function(_id, mode, widgetId) {
	var param = {_id: _id}
	
	app.ajaxPost("/page/editpagedesigner", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		
		setTimeout(function () {
			ko.mapping.fromJS(res.data, pg.configPageDesigner)
		},100);
		
		if (mode == "settingwidget") {
			var datavalue = [];
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
								property.field.push(mapping);
								ko.mapping.fromJS(property, pg.dsMapping);
							}
						});
					});
				}
			});	
		}
		
		// if (mode == "configuration") {
		// 	setTimeout(function () {
		// 		pg.configPageDesigner.dataSourceId(res.data.dataSources)
		// 	},100);
		// }
		// pg.backToConfig();
	});
}
pg.configPage = function() {
	app.mode("configpage");
	pg.getDataSource();
	pg.getConfigurationPage(pg.pageID, "configuration", "");
};
pg.widgetSetting = function(_id, mode) {
	app.mode("datasourceMapping");
	pg.previewMode("");
	if (mode != "back") {
		pg.getConfigurationPage(pg.pageID, "settingwidget", _id);
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
	var validator = $("#dsWidget").kendoValidator().data('kendoValidator');
	if (!validator.validate()) {
		return;
	}
	
	var prop = ko.mapping.toJS(pg.widgetSettings)
	var param = {
		widgetId: prop.widgetId,
		datasource: ko.mapping.toJS(pg.dsMapping.field)
	};
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
		var contentDoc = $("#formSetting")[0].contentWindow.document;
		contentDoc.open();
		contentDoc.write(html);
		contentDoc.close();
		// console.log(res.data)
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