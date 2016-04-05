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
	tokenid: "",
	newpassword: ""
	
}

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.forgetLogin = ko.mapping.fromJS(lg.templateForgotLogin);
lg.confirmReset = ko.mapping.fromJS(lg.templateConfirmReset);
lg.dataMenu =ko.observableArray([]);
lg.ErrorMessage = ko.observable('');
lg.getConfirReset = ko.mapping.fromJS(lg.templateUrlParam);

lg.getLogin = function(){
	if (!app.isFormValid("#login-form")) {
		return;
	}
	
	var param = ko.mapping.toJS(lg.configLogin);
	app.ajaxPost("/login/processlogin", param, function(res){
		if(!app.isFine(res)){
			return;
		}

		lg.ErrorMessage(res.message);
		
		if(res.message == "Login Success"){
			window.location = "/web/index";
			
		}

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

	if(lg.confirmReset.confirm_pass() != lg.confirmReset.new_pass()){
		lg.ErrorMessage('Your confirm new password not match');
	}else{
		lg.getConfirReset.userid(lg.getUrlParam('1'));
		lg.getConfirReset.tokenid(lg.getUrlParam('2'));
		lg.getConfirReset.newpassword(lg.confirmReset.confirm_pass())
		var param = ko.mapping.toJS(lg.getConfirReset);
		app.ajaxPost("/login/savepassword", param, function(res){
			if(!app.isFine(res)){
				return;
			}

			window.location = "/web/login";

		});
	}
	
}


$(function (){
	
});