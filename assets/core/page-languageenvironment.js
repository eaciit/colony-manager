app.section('languageEnviroment');

viewModel.languageEnviroment = {}; var lang = viewModel.languageEnviroment;

lang.templateFilter = {
	search: "",
	os: "",
};

lang.filter = ko.mapping.fromJS(lang.templateFilter);
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
				data = Lazy(lang.dataLanguage()).find({ _id:param.search })
				lang.setGrid(data)
			}
			if (param.os != ''){
				data = Lazy(lang.dataLanguage()).find({ _id:param.os })
				lang.setGrid(data)
			}	
		}else {
			lang.setGrid(lang.dataLanguage())	
		}
	});	
}

lang.setGrid = function(data){
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
			_id:d._id,
			os:d.os,
			host:d.host
		}
		d.Languages.forEach(function(e){
			each[e.language] = e.language;
			if (i == 0){
				columnGrid.push({
					width:"100px",
					title:"<center>"+e.language+"</center>",
					template: function (f){
					return '<center><button class="btn btn-sm btn-default btn-text-success btn-start tooltipster tooltipstered" title="Setup" onclick="" language ="'+e.language+'" ><span class="fa fa-cog"></span></button></center>'
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
}

$(function () {
	lang.getserverlanguage();
	app.showfilter(false);
});
