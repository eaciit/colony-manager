app.section('languageEnviroment');

viewModel.languageEnviroment = {}; var lang = viewModel.languageEnviroment;

lang.templateFilter = {
	search: "",
	os: "",
};

lang.templateSetupLangEnv = {
	ServerId:"",
	Lang:""
}
lang.coba = ko.observable("Idap");
lang.filter = ko.mapping.fromJS(lang.templateFilter);
lang.SetupLangEnv = ko.mapping.fromJS(lang.templateSetupLangEnv); 
lang.dataLanguage = ko.observableArray([]);
lang.langEnvData = ko.observable([]);
lang.breadcrumb = ko.observable('');
lang.serverlanguage = ko.observableArray([]);

lang.getserverlanguage = function (c){
	var param = ko.mapping.toJS(lang.filter);
	var data;
	app.ajaxPost("/langenvironment/getserverlanguage",{}, function (res){
		if (!app.isFine(res)){
			return
		}
		if (res.data == null){
			res.data = [];
		}
		lang.dataLanguage(res.data)
		if (param.search != '' || param.os != ''){
			if (param.search != ''){
				data = JSON.stringify(Lazy(lang.dataLanguage()).where({_id:param._id}).toArray())
				lang.setGrid(data)
			}
			if (param.os != ''){
				data = JSON.stringify(Lazy(lang.dataLanguage()).where({os:param.os}).toArray())
				lang.setGrid(data)
			}	
		}else {
			lang.setGrid(lang.dataLanguage())	
		}
	});	
}

lang.setupLangEnviroment = function (param){
	console.log(param);
	$('.btn-language').prop('disabled', true);
	app.ajaxPost("/langenvironment/setupfromsh", param, function (res) {
		$('.btn-language').prop('disabled', false);
	});
}

function getAttr(serverid,language){
	var param = ko.mapping.toJS(lang.SetupLangEnv);
	param.ServerId = serverid; 
	param.Lang = language;
	lang.setupLangEnviroment(JSON.stringify(param));
} 

lang.setGrid = function(data){
	console.log(data);
	if (data == undefined ){
		return
	}
	var columnGrid = [
		{field : "_id", title : "Server ID"},
		{field : 'os', title : 'Server OS'},
		{field : "host", title : "Host"},
	];

	var dataGrid = [];
	data.forEach(function(d, i){
		var each = {
			_id:d.ServerID,
			os:d.ServerOS,
			host:d.ServerHost
		}
		d.Languages.forEach(function(e){
			each[e.language] = e.language;
			if (i == 0){
				columnGrid.push({
					width:"100px",
					title:"<center>"+e.Lang+"</center>",
					template: function (f){
					return "<center><button class=\"btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered btn-language\" title=\"Setup\" id = \""+f._id+"\" onClick=\"getAttr('"+f._id+"','"+e.Lang+"')\" language =\""+e.Lang+"\" serverId = \""+f._id+"\" IsInstalled =\""+e.IsInstalled+"\" ><span class=\"fa fa-cog\"></span></button></center>";
					}
				});
			}
		});
		dataGrid.push(each)
	});

	$('.grid-langEnvi').kendoGrid({
		dataSource: {data:dataGrid, pageSize:15},
		columns:columnGrid,
		pageable: true,
		filterfable: false,
	});

	data.forEach (function(d, i){
		d.Languages.forEach(function (e,h){
			var cekSetup = $('.grid-langEnvi tbody tr:eq("'+i+'") td:gt(2) button').attr("isinstalled");
			console.log("baris ke",i);
			if (cekSetup != "false"){
				$('.grid-langEnvi tbody tr:eq("'+i+'") td:gt(2) button').prop('disabled', true);
			}
		})
	})
}

$(function () {
	lang.getserverlanguage();
	app.showfilter(false);
});
