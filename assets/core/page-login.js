app.section('login');

viewModel.login = {}; var lg = viewModel.login;

lg.templateConfigLogin = {
	username: "",
	password: "",
};

lg.templateForgotLogin ={
	email: "",
	url: ""
};

lg.templateConfirmReset ={
	new_pass: "",
	confirm_pass: ""
}

lg.configLogin = ko.mapping.fromJS(lg.templateConfigLogin);
lg.forgetLogin = ko.mapping.fromJS(lg.templateForgotLogin);
lg.confirmReset = ko.mapping.fromJS(lg.templateConfirmReset);
lg.rePassword = ko.observable('');

lg.varMenu = [{"id":"dasboard", "title":"Dashboard", "childrens":[], "link":"/web/index"},
			{"id":"datasource", "title":"Data Source", "childrens":[], "link":"/web/datasource"},
			{"id":"datamanager", "title":"Data Manager", "childrens":[
				{"id":"databrowser", "title":"Data Browser", "childrens":[], "link":"/web/databrowser"},
				{"id":"datagrabber", "title":"Data Serializer", "childrens":[], "link":"/web/datagrabber"},
				{"id":"webgrabber", "title":"Web Grabber", "childrens":[], "link":"/web/webgrabber"},
				{"id":"filebrowser", "title":"File Browser", "childrens":[], "link":"/web/filebrowser"}
				], "link":""},
			{"id":"widget", "title":"Widget", "childrens":[
				{"id":"widget", "title":"Widget List", "childrens":[], "link":"/web/widget"},
				{"id":"widgetsetting", "title":"Widget Setting", "childrens":[], "link":"/web/widgetsetting"}
				], "link":""},
			{"id":"application", "title":"Application", "childrens":[], "link":"/web/application"},
			{"id":"process", "title":"Process", "childrens":[], "link":"/web/process"},
			{"id":"administration", "title":"Administration", "childrens":[], "link":"/web/administration"},
			{"id":"login", "title":"Login", "childrens":[], "link":"/web/login"}];

lg.getLogin = function(){
	var param = ko.mapping.toJS(lg.configLogin);
	app.ajaxPost("/login/processlogin", param, function(res){
		if(!app.isFine(res)){
			return;
		}

	});
}

lg.getForgetLogin = function(){
	var url = lg.forgetLogin.url(location.origin);
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