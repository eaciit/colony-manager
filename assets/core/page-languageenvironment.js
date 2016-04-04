app.section('languageEnviroment');

viewModel.languageEnviroment = {}; var lang = viewModel.languageEnviroment;

lang.filterLangEnvTemplate = {
	search: "",
	serverOS: "",
	serverType: "node",
	sshType: "",
}

lang.langEnvColumns = ko.observableArray([ 
	{field : "_id", title : "Server ID"},
	{field : "os", title : "Server OS"},
	{field : "host", title : "Host"},
]);

lang.dataLanguage = ko.observableArray([]);
lang.filterLangEnv = ko.mapping.fromJS(lang.filterLangEnvTemplate);
lang.langEnvData = ko.observable([]);
lang.breadcrumb = ko.observable('');

lang.getLangEnv = function (c){
	lang.langEnvData([]);
	var param = ko.mapping.toJS(lang.filterLangEnv);
	app.ajaxPost("/server/getservers",param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data = [];
		}
		lang.langEnvData(res.data);
		var grid = $(".grid-LangEnv").data("kendoGrid");
		$(grid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
		});
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (typeof c == "function") {
			c(res);
		}
	});
}

lang.getLanguage = function(c){
	app.ajaxPost("/langenvironment/getlanguage",{}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data = [];
		}
		lang.dataLanguage(res.data);

		if (typeof c == "function") {
			c(res);
		}
	});
}

lang.datastatic = ko.observableArray([  
	{field : "_id", title : "Server ID"},
	{field : 'os', title : 'Server OS'},
	{field : "host", title : "Host"},
	]);

lang.datadinamis = ko.observableArray([
	{field: "go", headerTemplate:"<center>Go</center> ", width:"100px", attributes : {style: "text-align:center"}, template: function (d){
		return '<button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Setup" onclick=""><span class="fa fa-cog"></span></button>';
	}},
	{field: "java", headerTemplate:"<center>Java</center>", width:"100px", attributes : {style: "text-align:center"}, template: function (d){
		return '<button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Setup" onclick=""><span class="fa fa-cog"></span></button>';
	}},
	{field: "scala", headerTemplate:"<center>Scala</center>",width:"100px", attributes : {style: "text-align:center"}, template: function (d){
		return '<button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Setup" onclick=""><span class="fa fa-cog"></span></button>';
	}}
	]);

$(function () {
	lang.getLangEnv();
	lang.getLanguage();
});
