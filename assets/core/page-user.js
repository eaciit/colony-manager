app.section('user');

viewModel.user = {}; var usr = viewModel.user;
usr.templateUser = {
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
usr.config = ko.mapping.fromJS(adm.templateUser);

usr.Usermode = ko.observable('');
usr.getUser = function(c) {

};

usr.createNewUser = function () {
	app.mode("editor");
};


usr.OnRemove = function (_id) {
};

usr.backToFront = function () {
	app.mode('');
	usr.getUser();
	app.section('user');
};


$(function () {
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

