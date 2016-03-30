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

lg.templateConfirmReset ={
	new_pass: "",
	confirm_pass: ""
}

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.forgetLogin = ko.mapping.fromJS(lg.templateForgotLogin);
lg.confirmReset = ko.mapping.fromJS(lg.templateConfirmReset);
lg.rePassword = ko.observable('');

lg.getLogin = function(){
	var url = lg.configLogin.url(location.origin);
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

lg.getConfirmReset = function(){
	var param = ko.mapping.toJS(lg.confirmReset);
	console.log(param);
	app.ajaxPost("/login/resetpassword", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});
}

$(function (){
	
});