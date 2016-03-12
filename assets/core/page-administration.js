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
adm.config = ko.mapping.fromJS(adm.templateAccess);
adm.access = ko.observable('');
adm.getAccess = function(c) {

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
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

