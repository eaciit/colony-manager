app.section('login');

viewModel.login = {}; var lg = viewModel.login;

lg.templateConfigLogin = {
	username: "",
	password: "",
	url: ""
};

lg.templateForgotLogin ={
	email: ""
};

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.forgetLogin = ko.mapping.fromJS(lg.templateForgotLogin);
lg.confirmAccessLogin = ko.mapping.fromJS(lg.templateConfirmation);
lg.rePassword = ko.observable('');

lg.getLogin = function(){
	var url = lg.configLogin.url(location.origin);
	console.log(url);
	console.log(lg.configLogin);
	var param = ko.mapping.toJS(lg.configLogin);
	app.ajaxPost("/login/processlogin", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});
}

lg.getForgetLogin = function(){
	var param = ko.mapping.toJS(lg.forgetLogin);
	console.log(param);
	$('#modalConfirm').modal({
		show: 'true',
		backdrop: 'static',
		keyboard: 'false'
	});
	app.ajaxPost("/login/resetpassword", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});


}

lg.getConfirmLogin = function(){
	var param = ko.mapping.toJS(lg.confirmAccessLogin);
	console.log(param);
}

$(function (){
	
});