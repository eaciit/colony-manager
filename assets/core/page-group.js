app.section('group');

viewModel.group = {}; var grp = viewModel.group;
grp.templateGroup = {
	_id: "",
	Title: "", 
	Enable: false,
	Owner:"", 
	Grants: ko.observableArray([]), 
};  
grp.templateFilter ={
	_id:"",
	Title: "", 
	Owner:"",
};
grp.AccessGrantGroup = {
	AccessID:"",
	AccessValue: [], 
};  
grp.Access = ko.mapping.fromJS(grp.AccessGrantGroup);
grp.ListAccess = ko.observableArray([]);
grp.GroupsColumns = ko.observableArray([
	{ template: "<input type='checkbox' name='checkboxgroup' class='ckcGrid' value='#: _id #' />", width: 50  },
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

// grp.addFromPrivilage = function () { 
//     var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant)); 
//     grp.config.Grants.push(new usr.templateAccessGrant()); 
// };

grp.savegroup = function () { 
	var data =ko.mapping.toJS(usr.config.Grants); 
	var AccessGrants= [];
	for (var i = 0; i < data.length; i++) {
		grp.Access.AccessID(data[i].AccessID)
		if (data[i].AccessCreate==true) {
			grp.Access.AccessValue.push("AccessCreate");
		};
		if (data[i].AccessRead==true) {
			grp.Access.AccessValue.push("AccessRead");
		};
		if (data[i].AccessUpdate==true) {
			grp.Access.AccessValue.push("AccessUpdate");
		};
		if (data[i].AccessDelete==true) {
			grp.Access.AccessValue.push("AccessDelete");
		};
		if (data[i].AccessSpecial1==true) {
			grp.Access.AccessValue.push("AccessSpecial1");
		};
		if (data[i].AccessSpecial2==true) {
			grp.Access.AccessValue.push("AccessSpecial2");
		};
		if (data[i].AccessSpecial3==true) {
			grp.Access.AccessValue.push("AccessSpecial3");
		};
		if (data[i].AccessSpecial4==true) {
			grp.Access.AccessValue.push("AccessSpecial4");
		}; 
		AccessGrants.push(ko.mapping.toJSON(grp.Access))
		grp.Access.AccessValue.removeAll()
	};
	console.log(AccessGrants);
	group = ko.mapping.fromJS(grp.config);
	app.ajaxPost("/group/savegroup", {group : group,grants :AccessGrants}, function(res) { 
	if (!app.isFine(res)) {
		return;
	}
	swal({title: "Group successfully created", type: "success",closeOnConfirm: true});
	grp.backToFront();
	});
};
grp.deletegroup = function () { 
	var checkboxes = document.getElementsByName('checkboxgroup');
	var selected = [];
	for (var i=0; i<checkboxes.length; i++) {
	    if (checkboxes[i].checked) {
	        selected.push(checkboxes[i].value);
	    }
	} 
	for (var i = 0; i < selected.length; i++) {
		payload = ko.mapping.fromJS(grp.filter._id(selected[i]));
		app.ajaxPost("/group/deletegroup", payload, function(res) { 
		if (!app.isFine(res)) {
			return;
		}	
		});
	};
	swal({title: "Group successfully deleted", type: "success",closeOnConfirm: true});
	grp.backToFront();
};
grp.createNewGroup = function () {
	usr.Access.removeAll();
    usr.config.Grants.removeAll();
	usr.getAccess();
	grp.config._id("");  
	grp.config.Title("");  
	grp.config.Enable("");  
	grp.config.Grants(""); 
	grp.config.Owner("");
	app.mode("editor");
};
grp.editGroup = function(c) {
	var payload = ko.mapping.toJS(grp.filter._id(c));
	app.ajaxPost("/group/findgroup", payload, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
		}
		grp.config._id(res.data._id);  
		grp.config.Title(res.data.Title);  
		grp.config.Enable(res.data.Enable);  
		grp.config.Grants(res.data.Grants); 
		grp.config.Owner(res.data.Owner);  
	});
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

