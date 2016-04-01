app.section('login');

viewModel.login = {}; var lg = viewModel.login;

lg.templateConfigLogin = {
	username: "",
	password: "",
};

lg.templateForgotLogin ={
	email: "",
	baseurl: ""
};

lg.templateConfirmReset ={
	new_pass: "",
	confirm_pass: ""
}

lg.templateUrlParam = {
	userid: "",
	token: "",
	password: ""
	
}

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.forgetLogin = ko.mapping.fromJS(lg.templateForgotLogin);
lg.confirmReset = ko.mapping.fromJS(lg.templateConfirmReset);
lg.ErrorMessage = ko.observable('');
lg.getConfirReset = ko.mapping.fromJS(lg.templateUrlParam);
lg

lg.getLogin = function(){
	if (!app.isFormValid("#login-form")) {
	return;
	}
	var param = ko.mapping.toJS(lg.configLogin);
	app.ajaxPost("/login/processlogin", param, function(res){
		if(!app.isFine(res)){
			return;
		}

		console.log(res.message);
		lg.ErrorMessage(res.message);



	});
}

lg.showAccesReset = function(){
	$('#modalForgot').modal({show: 'true'});
	lg.forgetLogin.email('');
}

lg.getForgetLogin = function(){
	if (!app.isFormValid("#email-form")) {
		$('#modalForgot').modal({
	        backdrop: 'static',
	        keyboard: false
	    });
		return;
	}
	var url = lg.forgetLogin.baseurl(location.origin);
	var param = ko.mapping.toJS(lg.forgetLogin);
	
	app.ajaxPost("/login/resetpassword", param, function(res){
		if(!app.isFine(res)){
			return;
		}


	});

	$('#modalForgot').modal('hide');

}

lg.getUrlParam = function(param){
	var url = new RegExp('[\?&]' + param +'=([^&#]*)').exec(window.location.href);
	return url[1] || 0;
		
}

lg.getConfirmReset = function(){
	if (!app.isFormValid("#form-reset")) {
		return;
	}
	lg.getConfirReset.userid(lg.getUrlParam('1'));
	lg.getConfirReset.token(lg.getUrlParam('2'));
	lg.getConfirReset.password(lg.confirmReset.confirm_pass())
	var param = ko.mapping.toJS(lg.getConfirReset);
	//console.log(param);
	app.ajaxPost("/login/savepassword", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});
}


$(function (){
	
});