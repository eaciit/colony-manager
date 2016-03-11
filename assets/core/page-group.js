app.section('access');

viewModel.administration = {}; var adm = viewModel.administration;
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
adm.access = ko.mapping.fromJS(adm.templateAccess);

$(function () {
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

