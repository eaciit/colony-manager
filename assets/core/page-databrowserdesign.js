app.section('databrowserdesign');

viewModel.databrowserdesign = {}; var db = viewModel.databrowserdesign;

db.templateConfigMetaData = {
    Field : "",
    Label : "",
    Format : "",
    Align : "",
    ShowIndex : 0,
    Sortable : false,
    SimpleFilter : false,
    AdvanceFilter : false,
    Aggregate : ""
}

db.templateConfig = {
    _id : "",
    BrowserName : "",
    Description : "",
    ConnectionID : "",
    TableName : "",
    QueryType : "",
    QueryText : "",
    MetaData : [],
}

db.alignList = ko.observableArray([
    { alignId: 1, name: "Left" },
    { alignId: 2, name: "Center" },
    { alignId: 3, name: "Right" }
]);
db.queryType = ko.observableArray([
	{ value: "SQL", text: "SQL" },
	{ value: "Dbox", text: "Dbox" }
]);
db.connectionID = ko.observable('');
db.collectionListData = ko.observableArray([]);
db.databrowserData = ko.observableArray([]);
db.configDataBrowser = ko.mapping.fromJS(db.templateConfig);
db.databrowserColumns = ko.observableArray([
	{ field: "Field", title: "Field", editable: false },
	{ field: "label", title: "label"},
	{ field: "format", title: "Format"},
	{ title: "Align", field: "align", template: "#= db.alignOption(align) #",
		editor: function(container, options) {
            var input = $('<input id="alignId" name="alignId" data-bind="value:' + options.field + '">');
            input.appendTo(container);
            input.kendoDropDownList({
                dataTextField: "name",
                dataValueField: "alignId",
                //cascadeFrom: "brandId", // cascade from the brands dropdownlist
                dataSource: db.alignList() // bind it to the models array
            }).appendTo(container);
        }
    },
	{ field: "showindex", title: "Show Index"},
	{ title: "Sortable", template: "<input type='checkbox' #= sortable ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Simple Filter", template: "<input type='checkbox' #= simplefilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Advance Filter", template: "<input type='checkbox' #= advfilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ field: "aggregate", title: "Aggregate"},
]);


db.alignOption = function (opt) {
	for (var i = 0; i < db.alignList().length; i++) {
        if (db.alignList()[i].alignId == opt) {
            return db.alignList()[i].name;
        }
    }
}

db.addProperties = function () {
    var property = $.extend(true, {}, ds.templateConfigSetting);    
    db.config.Struct.push(property);
};

db.getDesign = function(_id) {
	ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	app.ajaxPost("/databrowser/getdesignview", { _id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}

		br.pageVisible("editor");
		app.mode('editor')
		// console.log("data mapping",res.data)
		// console.log("data design>",ko.mapping.fromJS(res.data, db.configDataBrowser))
		ko.mapping.fromJS(res.data, db.configDataBrowser)
		// br.dataBrowser(res.data);
	});
}

db.populateTable = function () {
	var param = { connectionID: this.value() };
	app.ajaxPost("/datasource/getdatasourcecollections", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		if (res.data.length==0){
			res.data="";
			db.collectionListData([{value:"", text: ""}]);
		} else {
			var datavalue = [];
			if (res.data.length > 0) {
				$.each(res.data, function(key, val) {
					data = {};
					data.value = val;
					data.text = val;
					datavalue.push(data);
				});
			}

			db.collectionListData(datavalue);
		}
		
		
	});
};

// db.templateDataSource = {
// 	_id: "",
// 	ConnectionID: "",
// 	QueryInfo : {},
// 	MetaData: [],
// };
// db.confDataSource = ko.mapping.fromJS(db.templateDataSource);
db.testQuery = function() {
	if (!app.isFormValid(".form-databrowserdesign")) {
		return;
	}

	if (db.configDataBrowser._id() == '' || db.configDataBrowser.Description() == '') {
		swal({ title: "Warning", text: "Please save the datasource first", type: "warning" });
		return;
	}

	var param = ko.mapping.toJS(db.configDataBrowser); //{};
	var isChecked = $("#isFreetext").prop("checked")
	if (!isChecked) { //if false by default query with dbox
		param.QueryType = "nonQueryText";
		param.QueryText = JSON.stringify({"from": $("#table").data("kendoDropDownList").value()});
		param.TableName = $("#table").data("kendoDropDownList").value();
		// console.log(param)
		app.ajaxPost("/databrowser/testquery", param, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			console.log(res)
		});
	}
};

db.backToFront = function() {
	app.mode('');
	br.pageVisible("");
	$("#isFreetext").prop("checked", false);
	$("#freeQuery").hide();
	$("#fromTable").show();
};

$(function () {
	$("#freeQuery").hide();
	$("#querytype").hide();
	$("#isFreetext").change(function() {
		if (this.checked){
			$("#freeQuery").show();
			$("#querytype").show();
			$("#fromTable").hide();	
		}else{
			$("#freeQuery").hide();
			$("#querytype").hide();
			$("#fromTable").show();
		}
	});
});

//create function klik view for databrowser grid
db.ViewBrowserName = function(id){
    alert("masuk "+id);
}

db.DesignDataBrowser = function(id){
    br.pageVisible("editor");
}