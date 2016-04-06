app.section('pagedesigner');

viewModel.PageDesigner = {}; var pg = viewModel.PageDesigner;

pg.wdigetDesignerConfig = {
	dataSourceId: []
};
pg.allDataSources = ko.observableArray([]);
pg.configPageDesigner = ko.mapping.fromJS(pg.wdigetDesignerConfig);
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

	var param = {_id: pg.pageID, dataSourceId: ko.mapping.toJS(pg.configPageDesigner)["dataSourceId"]}
	app.ajaxPost("/page/savedesigner", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		pg.backToConfig();
	});
}
pg.getConfigurationPage = function(_id) {
	var param = {_id: _id}
	app.ajaxPost("/page/editpage", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		pg.configPageDesigner.dataSourceId(res.data.dataSources)
		// pg.backToConfig();
	});
}
pg.configPage = function() {
	app.mode("configpage");
	pg.getDataSource();
	pg.getConfigurationPage(pg.pageID);
};
pg.backToConfig = function() {
	app.mode("");
	pg.allDataSources([]);
}