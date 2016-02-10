viewModel.servers = {}; var srv = viewModel.servers;
srv.templateConfigServer = {
	_id: "",
	AppsName: "",
	Enable: false,
	AppPath: ""
};
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ field: "_id", title: "ID", width: 80 },
	{ field: "AppsName", title: "Type", width: 80},
	{ field: "os", title: "OS", width: 80},
	{ field: "folder", title: "Folder", width: 80},
	{ field: "enable", title: "Enable", width: 80},
	{ title: "", width: 80, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='srv.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' title='Edit Server' onclick='srv.editServer(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' title='Delete Server' onclick='srv.removeServer(\"" + d._id + "\")'><span class='glyphicon glyphicon-remove'></span></button>"
		].join(" ");
	} },	
]);

srv.getApplications = function() {
	srv.ServerData([
		{_id:"x097",AppsName:"Server 20338",os:"MAC",folder:"folder",enable:"TRUE"},
		{_id:"x098",AppsName:"Server 20339",os:"WINDOWS",folder:"folder",enable:"FALSE"},
		{_id:"x099",AppsName:"Server 20340",os:"LINUX",folder:"folder",enable:"TRUE"},
	]);
	// app.ajaxPost("/servers/getsrvs", {}, function (res) {
	// 	if (!app.isFine(res)) {
	// 		return;
	// 	}

	// 	srv.ServerData(res.data);
	// });
};

srv.treeView = function () {
	var inlineDefault = new kendo.data.HierarchicalDataSource({
        data: [
            { text: "Furniture", items: [
                { text: "Tables & Chairs" },
                { text: "Sofas" },
                { text: "Occasional Furniture" }
            ] },
            { text: "Decor", items: [
                { text: "Bed Linen", items:[
                	{text: "Single"},
                	{text: "Double"},
                ] },
                { text: "Curtains & Blinds" },
                { text: "Carpets" }
            ] }
        ]
    });

    $("#treeview-left").kendoTreeView({
        dataSource: inlineDefault
    });
};

srv.createNewServer = function () {
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
};

srv.backToFront = function () {
	app.mode('');
	srv.getApplications();
};

srv.codemirror = function(){
    var editor = CodeMirror.fromTextArea(document.getElementById("scriptarea"), {
        mode: "text/html",
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
    });
    editor.setValue('<html></html>');
    $('.CodeMirror-gutter-wrapper').css({'left':'-30px'});
    $('.CodeMirror-sizer').css({'margin-left': '30px', 'margin-bottom': '-15px', 'border-right-width': '15px', 'min-height': '863px', 'padding-right': '15px', 'padding-bottom': '0px'});
}

$(document).ready(function() {  
    srv.codemirror();
    srv.getApplications();
    srv.treeView();
});