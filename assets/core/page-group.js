app.section('group');

viewModel.group = {}; var grp = viewModel.group;
grp.templateGroup = {
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
grp.config = ko.mapping.fromJS(grp.templateGroup);
grp.Groupmode = ko.observable('');
grp.getGroup = function(c) {

};

grp.createNewGroup = function () {
	app.mode("editor");
};


grp.backToFront = function () {
	app.mode('');
	grp.getGroup();
	app.section('group');
};

grp.OnRemove = function (_id) {
};
$(function () {
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

