viewModel.index = {}; var yo = viewModel.index;
yo.template = {
	config: {
		_id: "",
		driver: "",
		host: "",
		username: "",
		password: "",
		settings: {}
	},
	drivers: [
		{ value: "Weblink", title: "Weblink" },
		{ value: "MongoDb", title: "MongoDb" },
		{ value: "SQLServer", title: "SQLServer" },
		{ value: "MySQL", title: "MySQL" },
		{ value: "Oracle", title: "Oracle" },
		{ value: "ERP", title: "ERP" }
	]
};
yo.config = ko.mapping.fromJS(yo.template.config);




// - Connection List
//     - Driver (Weblink, MongoDb, SQLServer, MySQL, Oracle, ERP) 
//     - Host
//     - UserName
//     - Password
//     - Settings - map[string]interface{}
