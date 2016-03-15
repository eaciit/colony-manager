app.section('group');

viewModel.group = {}; var grp = viewModel.group;
grp.templateGroup = {
	_id: "",
	Title: "", 
	Enable: false,
	Grants: "", 
	Owner:"", 
};  
grp.templateFilter ={
	Title: "", 
	Owner:"",
};
grp.GroupsColumns = ko.observableArray([
	{ template: "<input type='checkbox' class='ckcGrid' />", width: 50  },
	{ field: "_id", title: "ID" },
	{ field: "title", title: "Title" },
	{ field: "enable", title: "Enable" },
	{ field: "owner", title: "Owner"}
]);
grp.filter = ko.mapping.fromJS(grp.templateFilter);
grp.isNew=ko.observable(false);
grp.editGroup=ko.observable("");
grp.showGroup=ko.observable(false);
grp.GroupsData=ko.observableArray([]);
grp.selectGridGroups = function (e) {
	grp.isNew(false);
	app.wrapGridSelect(".grid-groups", ".btn", function (d) {
		grp.editGroup(d._id);
		grp.showGroup(true);
		app.mode("editor");
	});
};

grp.getGroups = function(c) {
	grp.GroupsData([]);
	var param = ko.mapping.toJS(grp.filter);
	app.ajaxPost("/group/getgroup", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
		}
		grp.GroupsData(res.data);
		var grid = $(".grid-groups").data("kendoGrid"); 
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (typeof c == "function") {
			c(res);
		}
	});
};

grp.config = ko.mapping.fromJS(grp.templateGroup);
grp.Groupmode = ko.observable('');
 
grp.savegroup = function () {
	payload = ko.mapping.fromJS(grp.templateGroup);
	console.log(payload)
	app.ajaxPost("/group/savegroup", payload, function(res) {
		console.log(res)
	if (!app.isFine(res)) {
		return;
	}
	swal({title: "Group successfully created", type: "success",closeOnConfirm: true});
	grp.backToFront();
	});
};
grp.createNewGroup = function () {
	app.mode("editor");
};


grp.backToFront = function () {
	app.mode('');
	grp.getGroups();
	app.section('group');
};

grp.OnRemove = function (_id) {
};
$(function () {
	grp.getGroups();
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

