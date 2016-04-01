app.section('main');

viewModel.layout = {}; var ly = viewModel.layout;

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
				{"id":"widgetsetting", "title":"Widget Setting", "childrens":[], "link":"/web/widgetsetting"}
				], "link":""},
			{"id":"application", "title":"Application", "childrens":[], "link":"/web/application"},
			{"id":"process", "title":"Process", "childrens":[], "link":"/web/process"},
			{"id":"administration", "title":"Administration", "childrens":[], "link":"/web/administration"},
			{"id":"login", "title":"Login", "childrens":[], "link":"/web/login"}];

ly.element = function(){
	$parent = $('#nav-ul');
	$navbar = $('<ul class="nav navbar-nav"></ul>');
	$navbar.appendTo($parent);

	$.each(ly.varMenu, function(i, items){
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

$(function (){
	ly.element();
});