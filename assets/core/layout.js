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
	console.log(data.length);
	$parent = $('#nav-ul');
	$navbar = $('<ul class="nav navbar-nav"></ul>');
	$navbar.appendTo($parent);
	if(data.length == 0){
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
	//alert('masuk');
	app.ajaxPost("/login/logout", {logout: true}, function(res){
		if(!app.isFine(res)){
			return;
		}
		ly.account(false);
		window.location = "/web/login"
	});
}

ly.getLoadMenu = function(){ 
	app.ajaxPost("/login/getsession",{}, function(res){
		if(!app.isFine(res)){
			return;
		}
		
		ly.session(res.data.sessionid);
		if(ly.session() !== '' ){
			app.ajaxPost("/login/getusername", {}, function(res){
				if(!app.isFine(res)){
					return;
				}

				ly.username(" Hi' "+res.data.username);

			});
		}
	});
	app.ajaxPost("/login/getaccessmenu", {}, function(res){
		if(!app.isFine(res)){
			return;
		}

		ly.element(res.data);

	}, function () {
		ly.element([]);
	});
}


$(function (){
	ly.getLoadMenu();
});