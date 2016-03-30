app.section('login');

viewModel.login = {}; var lg = viewModel.login;

lg.templateConfigLogin = {
	username: "",
	password: ""
};

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.dataLogin = ko.observableArray([]);

lg.getLogin = function(){
	console.log(lg.configLogin);
	var param = ko.mapping.toJS(lg.configLogin);
	app.ajaxPost("/login/processlogin", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});
}

$(function (){
	
});