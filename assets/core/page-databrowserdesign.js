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

var dummyobj1 = new Object()
dummyobj1.Field = "id"
dummyobj1.Label = "ID"
dummyobj1.Format = ""
dummyobj1.Align = 1
dummyobj1.ShowIndex = 1
dummyobj1.Sortable = true
dummyobj1.SimpleFilter = true
dummyobj1.AdvanceFilter = true
dummyobj1.Aggregate =  ""

db.alignList = ko.observableArray([
    { Align: "Left", name: "Left" },
    { Align: "Center", name: "Center" },
    { Align: "Right", name: "Right" }
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
	{ field: "Label", title: "label"},
	{ field: "Format", title: "Format"},
	{ title: "Align", field: "Align", template: "#= db.alignOption(Align) #",
		editor: function(container, options) {
            var input = $('<input id="alignId" name="alignId" data-bind="value:' + options.field + '">');
            input.appendTo(container);
            input.kendoDropDownList({
                dataTextField: "name",
                dataValueField: "Align",
                dataSource: db.alignList() // bind it to the models array
            }).appendTo(container);
        }
    },
	// { field: "ShowIndex", title: "Position"},
	// { field: "ShowIndex", title: "Position", command: [ { text: "Up", click: db.moveUp }, { text: "Down", click: db.moveDown } ]},
	{ title: "Position", template: "<a class='btn btn-sm btn-default k-grid-Up' onclick='db.moveUp(this)'>Up</a> <a class='btn btn-sm btn-default k-grid-Down' onclick='db.moveDown(this)'>Down</a><span style='margin-left: 20px;''>#= ShowIndex #</span>"},
	{ title: "Sortable", template: "<input type='checkbox' #= Sortable ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Simple Filter", template: "<input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ title: "Advance Filter", template: "<input type='checkbox' #= AdvanceFilter ? \"checked='checked'\" : '' # class='chkbx' />"},
	{ field: "Aggregate", title: "Aggregate"},
]);


db.alignOption = function (opt) {
	for (var i = 0; i < db.alignList().length; i++) {
		// console.log(db.alignList()[i].Align)
        if (db.alignList()[i].Align == opt) {
            return db.alignList()[i].name;
        }
    }
}

db.moveUp = function(e) {
	// console.log(this)
	var dataItem, grid;
	grid = $(".grid-databrowser-design").data("kendoGrid");
	if(e.currentTarget === undefined){
		grid = $(e).closest(".k-grid").data('kendoGrid');
		dataItem = grid.dataItem($(e).closest("tr"));
	}
	else{
		e.preventDefault()
		dataItem = grid.dataItem($(e.currentTarget).closest("tr"));
	}
 	
    db.moveRow(grid, dataItem, -1);
}

db.moveDown = function(e) {
	var dataItem, grid;
	grid = $(".grid-databrowser-design").data("kendoGrid");
	if(e.currentTarget === undefined){
		grid = $(e).closest(".k-grid").data('kendoGrid');
		dataItem = grid.dataItem($(e).closest("tr"));
	}
	else{
		e.preventDefault()
		dataItem = grid.dataItem($(e.currentTarget).closest("tr"));
	}
 	
    db.moveRow(grid, dataItem, 1);
}

db.swap = function(a,b,propertyName) {
	var temp=a[propertyName];
	a[propertyName]=b[propertyName];
	b[propertyName]=temp;
}

db.moveRow = function(grid, dataItem,direction) {
    var record = dataItem;
    if (!record) {
        return;
    }
    var newIndex = index = grid.dataSource.indexOf(record);
    direction < 0?newIndex--:newIndex++;
    if (newIndex < 0 || newIndex >= grid.dataSource.total()) {
        return;
    }
    db.swap(grid.dataSource._data[newIndex],grid.dataSource._data[index],'position');
    grid.dataSource.remove(record);
    grid.dataSource.insert(newIndex, record);
    db.databrowserData(grid.dataSource.data())
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
		ko.mapping.fromJS(res.data, db.configDataBrowser)
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
			db.databrowserData(res.data.MetaData);
			$("#grid-databrowser-design").kendoGrid(res.data.MetaData);
			
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