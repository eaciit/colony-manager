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
	{ field: "type", title: "Type", width: 80},
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

srv.getServers = function() {
	srv.ServerData([]);
	app.ajaxPost("/server/getservers", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		srv.ServerData(res.data);
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

$(function () {
	srv.getServers();
});

srv.treeView = function () {
	var inlineDefault = new kendo.data.HierarchicalDataSource({
        data: [
            { text: "Furniture", items: [
                { text: "Tables & Chairs" },
                { text: "Sofas" },
                { text: "Occasional Furniture" }
            ] },
            { text: "Decor", items: [
                { text: "Bed Linen" },
                { text: "Curtains & Blinds" },
                { text: "Carpets" }
            ] }
        ]
    });

    $("#treeview-left").kendoTreeView({
        dataSource: inlineDefault
    });

    var inline = new kendo.data.HierarchicalDataSource({
        data: [
            { categoryName: "Storage", subCategories: [
                { subCategoryName: "Wall Shelving" },
                { subCategoryName: "Floor Shelving" },
                { subCategoryName: "Kids Storage" }
            ] },
            { categoryName: "Lights", subCategories: [
                { subCategoryName: "Ceiling" },
                { subCategoryName: "Table" },
                { subCategoryName: "Floor" }
            ] }
        ],
        schema: {
            model: {
                children: "subCategories"
            }
        }
    });

    $("#treeview-right").kendoTreeView({
        dataSource: inline,
        dataTextField: [ "categoryName", "subCategoryName" ]
    });
};