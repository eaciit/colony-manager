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
		/*var grid = $(".grid-LangEnv").data("kendoGrid");
		$(grid.tbody).on("mouseenter", "tr", function (e) {
	    $(this).addClass("k-state-hover");
		});
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});*/

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
		lang.tableLangEnvi(lang.dataLanguage(res.data));

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

lang.tableLangEnvi = function (data){
	$('.table-langEnvi').replaceWith('<table class="table table-bordered table-langEnvi"></table>');
	var $table = $('.table-langEnvi');
	var index = 1; 

	var header = [
		'<thead>',
			'<tr>',
				'<th>Server ID</th>',
				'<th>Server OS</th>',
				'<th>Host</th>',
			'</tr>',
		'</thead>'
	];

	for (var i in lang.dataLanguage()){
		header.splice((5+i), 0, "<th><center>"+lang.dataLanguage()[i].language+"</center></th>");
	}
	header.join('');
	$table.append(header);

	lang.langEnvData().forEach(function (item){
	var contentTable = [	
		'<tr>',
			'<td>'+item._id+'</td>',
			'<td>'+item.os+'</td>',
			'<td>'+item.host+'</td>',
		'</tr>'
		];
	for (var j in lang.dataLanguage()){
		contentTable.splice((4+j), 0,"<td><center><button class='btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered' title='Setup' onclick=''><span class='fa fa-cog'></span></button></center></td>");
	}
	contentTable.join('');
	$table.append(contentTable); 
	});
}

$(function () {
	lang.getLangEnv();
	lang.getLanguage();
	lang.tableLangEnvi();
});
