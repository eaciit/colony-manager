app.section('main');

viewModel.layout = {}; var ly = viewModel.layout;
ly.account  = ko.observable(false);
ly.session  = ko.observable('');
ly.username = ko.observable('');

ly.varMenu = [{"id":"dasboard", "title":"Dashboard", "childrens":[], "link":"/web/index"},
			{"id":"datasource", "title":"Data Source", "childrens":[], "link":"/web/datasource"},
			{"id":"datamanager", "title":"Data Manager", "childrens":[
				{"id":"databrowser", "title":"Data Browser", "childrens":[], "link":"/web/databrowser"},
				{"id":"datagrabber", "title":"Data Serializer", "childrens":[], "link":"/web/datagrabber"},
				{"id":"webgrabber", "title":"Web Grabber", "childrens":[], "link":"/web/webgrabber"},
				{"id":"filebrowser", "title":"File Browser", "childrens":[], "link":"/web/filebrowser"}
				], "link":""},
			{"id":"widget", "title":"Widget", "childrens":[
				{"id":"widget", "title":"Widget List", "childrens":[], "link":"/web/widget"},
				{"id":"widgetsetting", "title":"Widget Page", "childrens":[], "link":"/web/widgetpage"}
				], "link":""},
			{"id":"application", "title":"Application", "childrens":[], "link":"/web/application"},
			{"id":"process", "title":"Process", "childrens":[], "link":"/web/process"},
			{"id":"workflow", "title":"Workflow", "childrens":[
				{"id":"dataflow", "title":"Data Flow", "childrens":[], "link":"/web/dataflow"},
				{"id":"businessflow", "title":"Business Flow", "childrens":[], "link":"/web/businessflow"}
				], "link":""},
			{"id":"administration", "title":"Administration", "childrens":[], "link":"/web/administration"},
			{"id":"login", "title":"Login", "childrens":[], "link":"/web/login"}];

ly.element = function(data){
	//console.log(data.length);
	$parent = $('#nav-ul');
	$navbar = $('<ul class="nav navbar-nav"></ul>');
	$navbar.appendTo($parent);
	if(data == null ){
		$liparent = $("<li class='dropdown' id='liparent'><a>You don't have any access</a></li>");
		$liparent.appendTo($navbar);
	}else{
		$.each(data, function(i, items){
			if(items.childrens.length != 0){
				$liparent = $('<li class="dropdown" id="liparent"><a href="#" class="dropdown-toggle" data-toggle="dropdown">'+items.title+' <span class="caret"></span></a></li>');
				$liparent.appendTo($navbar);
				$ulchild = $('<ul class="dropdown-menu"></ul>');
				$ulchild.appendTo($liparent);
				$.each(items.childrens, function(e, childs){
					$lichild =  $('<li><a href="'+childs.link+'">'+childs.title+'</a></li>');
					$lichild.appendTo($ulchild);
				});
			}else{
				$liparent = $('<li id="liparent"><a href="'+items.link+'">'+items.title+'</a></li>');
				$liparent.appendTo($navbar);
			}

		});
	}

}

ly.getLogout = function(){
	app.ajaxPost("/login/logout", {logout: true}, function(res){
		if(!app.isFine(res)){
			return;
		}
		ly.account(false);	
		window.location = "/web/login"
	});
}

ly.logout = function(){
	swal({
		title:"Are you sure go to logout",
		type: "warning",
		showCancelButton: true,
		confirmButtonClass: "btn-success",
		confirmButtonText: "Yes",
	},
	function(isconfirm){
		if(isconfirm){
			app.ajaxPost("/login/logout", {logout: true}, function(res){
				if(!app.isFine(res)){
					return;
				}
				ly.account(false);	
			});
			setTimeout(function(){
				window.location = "/web/login";
			}, 200);
			
		}
	});
}

ly.getLoadMenu = function () { 
	var isFine = function (res) {
		if (!res.success || res.message.toLowerCase().indexOf("found") > -1 
						 || res.message.toLowerCase().indexOf("expired") > -1 
						 || res.message.toLowerCase().indexOf("failed") > -1) {
			if (document.URL.indexOf("/web/login") == -1) {
				swal({
					title: "Oops...",
					type: "warning",
					text: res.message,
				}, function () {
					app.isFine(res);
					setTimeout(function () { window.location = "/web/login"; }, 200);
				});
			}

			return false;
		}

		return true;
	};
	
	app.ajaxPost("/login/getaccessmenu", {}, function (res) {
		if (!isFine(res)) {
			ly.element(null);
			ly.account(false);
			return;
		}

		app.ajaxPost("/login/getusername", {}, function (res2) {
			if (!isFine(res2)) {
				ly.element(null);
				ly.account(false);
				return;
			}

			ly.username(" Hi' " + res2.data.username);
			ly.element(res.data);
			ly.account(true);
		}, function () {
			ly.element(null);
			ly.account(false);
		});
	}, function () {
		ly.element(null);
		ly.account(false);
	});	
}


$(function (){
	ly.getLoadMenu();

});