app.section('access');

viewModel.access = {}; var adm = viewModel.access;
adm.templateAccess = {
	_id: "",
	Title: "",
	Group1: "",
	Group2: "",
	Group3: "",
	Enable: false,
	Type: "web",
	SpecialAccecss1:"",
	SpecialAccecss2:"",
	SpecialAccecss3:"",
	SpecialAccecss4:"",
};
adm.templateFilter ={
	Title: "",  
};
adm.AccessColumns = ko.observableArray([
	{ template: "<input type='checkbox' class='ckcGrid' />", width: 50  },
	{ field: "_id", title: "ID" },
	{ field: "title", title: "Title" },
	{ field: "group1", title: "Group 1" },
	{ field: "group2", title: "Group 2"},
	{ field: "group3", title: "Group 3" },
	{ field: "enable", title: "Enable" },
	{ field: "specialaccess1", title: "Special Access 1" },
	{ field: "specialaccess2", title: "Special Access 2"},
	{ field: "specialaccess3", title: "Special Access 3" },
	{ field: "specialaccess4", title: "Special Access 4"}
]);
adm.filter = ko.mapping.fromJS(adm.templateFilter);
adm.isNew=ko.observable(false);
adm.editAccess=ko.observable("");
adm.showAccess=ko.observable(false);
adm.AccessData=ko.observableArray([]);
adm.selectGridAccess = function (e) {
	adm.isNew(false);
	app.wrapGridSelect(".grid-access", ".btn", function (d) {
		adm.editAccess(d._id);
		adm.showAccess(true);
		app.mode("editor"); 
	});
};

adm.getAccess = function(c) {
	adm.AccessData([]);
	var param = ko.mapping.toJS(adm.filter);
	app.ajaxPost("/administration/getaccess", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
		}
		adm.AccessData(res.data);
		var grid = $(".grid-access").data("kendoGrid"); 
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (typeof c == "function") {
			c(res);
		}
	});
};

adm.config = ko.mapping.fromJS(adm.templateAccess);
adm.access = ko.observable(''); 
adm.saveaccess = function () {
	payload = ko.mapping.fromJS(adm.templateAccess);
	console.log(payload)
	app.ajaxPost("/administration/saveaccess", payload, function(res) {
		console.log(res)
	if (!app.isFine(res)) {
		return;
	}
	swal({title: "Access successfully created", type: "success",closeOnConfirm: true});
	adm.backToFront();
	});
};
adm.createNewAccess = function () {
	app.mode("editor");
};

adm.OnRemove = function (_id) {
};

adm.backToFront = function () {
	app.mode('');
	adm.getAccess();
};

$(function () {
	app.section("access");
	adm.getAccess();
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

