app.section('databrowserdesign');

viewModel.databrowserdesign = {}; var db = viewModel.databrowserdesign;

db.templateConfigMetaData = {
    Field : "",
    Label : "",
    DataType : "",
    Format : "",
    Align : "",
    ShowIndex : 0,
    HiddenField: false,
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
    TableNames : "",
    QueryType : "",
    QueryText : "",
    MetaData : [],
}

db.alignList = ko.observableArray([
    { Align: "Left", name: "Left" },
    { Align: "Center", name: "Center" },
    { Align: "Right", name: "Right" }
]);
db.queryType = ko.observableArray([
	{ value: "SQL", text: "SQL" },
	{ value: "Dbox", text: "Dbox" }
]);
db.dataType = ko.observableArray([
	{ DataType: "bson.ObjectId", text: "bson.ObjectId" },
	{ DataType: "string", text: "string" },
	{ DataType: "int", text: "int" },
	{ DataType: "float32", text: "float32" },
	{ DataType: "float64", text: "float64" },
	{ DataType: "date", text: "date" }
]);
db.connectionID = ko.observable('');
db.isChecked = ko.observable('')
db.collectionListData = ko.observableArray([]);
db.databrowserData = ko.observableArray([]);
// db.configMetaData = ko.mapping.fromJS(db.templateConfigMetaData);
db.configDataBrowser = ko.mapping.fromJS(db.templateConfig);
db.databrowserColumns = ko.observableArray([
	{ field: "Field", title: "Field", editable: false },
	{ field: "Label", title: "label"},
	{ field: "DataType", title: "Data Type", template: "#= db.dataTypeOption(DataType) #",
		editor: function(container, options) {
            var input = $('<input id="datatypeId" name="datatype" data-bind="value:' + options.field + '">');
            input.appendTo(container);
            input.kendoDropDownList({
                dataTextField: "text",
                dataValueField: "DataType",
                dataSource: db.dataType() // bind it to the models array
            }).appendTo(container);
        }},
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
	{ title: "Position", width: 110,template: "<a class='btn btn-sm btn-default k-grid-Up' onclick='db.moveUp(this)'><span class='glyphicon glyphicon-menu-up'></span></a> <a class='btn btn-sm btn-default k-grid-Down' onclick='db.moveDown(this)'><span class='glyphicon glyphicon-menu-down'></span></a><span style='margin-left: 5px;'>#= ShowIndex #</span>"},
	{ title: "Hidden Field", template: "<center><input type='checkbox' #=HiddenField ? \"checked='checked'\" : ''# class='hiddenfield' data-field='HiddenField' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallhiddenfield' onclick=\"db.checkAll(this, 'HiddenField')\" /> Hidden Field</center>"},
	{ title: "Sortable", template: "<center><input type='checkbox' #= Sortable ? \"checked='checked'\" : '' # class='sortable' data-field='Sortable' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallsortable' onclick=\"db.checkAll(this, 'Sortable')\" /> Sortable</center>"},
	{ title: "Simple Filter", template: "<center><input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallsimplefilter' onclick=\"db.checkAll(this, 'SimpleFilter')\" /> Simple Filter</center>"},
	{ title: "Advance Filter", template: "<center><input type='checkbox' #= AdvanceFilter ? \"checked='checked'\" : '' # class='advancefilter' data-field='AdvanceFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectalladvancefilter' onclick=\"db.checkAll(this, 'AdvanceFilter')\" /> Advance Filter</center>"},
	{ field: "Aggregate", title: "Aggregate"},
]);


db.alignOption = function (opt) {
	for (var i = 0; i < db.alignList().length; i++) {
        if (db.alignList()[i].Align == opt) {
            return db.alignList()[i].name;
        }
    }
}

db.dataTypeOption = function (opt) {
	for (var i = 0; i < db.dataType().length; i++) {
		// console.log(db.dataType()[i].DataType)
        if (db.dataType()[i].DataType == opt) {
            return db.dataType()[i].text;
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
    db.swap(grid.dataSource._data[newIndex],grid.dataSource._data[index],'ShowIndex');
    grid.dataSource.remove(record);
    grid.dataSource.insert(newIndex, record);
    db.databrowserData(grid.dataSource.data());
    db.setDataSource();
    
    db.addProperties();
}

db.addProperties = function () {
	grid = $(".grid-databrowser-design").data("kendoGrid");
	db.configDataBrowser.MetaData([]);
    $.each(grid.dataSource.data(), function(key, val) {
    	var property = $.extend(true, {}, db.templateConfigMetaData);
    	property.Field = val.Field
    	property.Label = val.Label
    	property.Format = val.Format
    	property.Align = val.Align
    	property.HiddenField = val.HiddenField
    	property.ShowIndex = val.ShowIndex
    	property.Sortable = val.Sortable
    	property.SimpleFilter = val.SimpleFilter
    	property.AdvanceFilter  = val.AdvanceFilter
    	property.Aggregate = val.Aggregate
    	db.configDataBrowser.MetaData.push(property);
    });
};

db.changeCheckboxOnGrid = function (o) {
	var $grid = $(".grid-databrowser-design").data("kendoGrid");
	var value = $(o).is(":checked");
	var $tr = $(o).closest("tr");
	var uid = $tr.attr("data-uid");
	var field = $(o).attr("data-field");

	var data = $grid.dataSource.data();
	var rowData = $grid.dataSource.getByUid(uid);
	var rowDataIndex = data.indexOf(rowData);

	rowData[field] = value;
	data[rowDataIndex] = rowData;

	var plainData = JSON.parse(kendo.stringify(data));
	db.databrowserData(plainData);
	db.setDataSource();
	db.headerCheckedAll();

	return true;
}


db.saveAndBack = function(section) {

	if (!app.isFormValid(".form-databrowserdesign")) {
		return;
	}

	db.checkBuilderNotEmpty();

	var param = ko.mapping.toJS(db.configDataBrowser);

	if (!db.isChecked()) {
		param.QueryText = ""
		param.QueryType = ""
		if ($("#table option:selected").text() == 'Select one') {
			return;
		}
	} else if (db.isChecked()) {
		param.TableNames = ""
		var querytype = $("#querytype option:selected").text()
		if (querytype == 'Select Query Type') {
			return;
		} else if (querytype == 'SQL' && $("#querytext").val() == '') {
			return;
		} else if (querytype == 'Dbox' && $("#textquery").val() == '') {
			return;
		}
	}
     	
	var grids = $(".grid-databrowser-design").data("kendoGrid")
	var ds = grids.dataSource.data();
	param.MetaData = JSON.parse(kendo.stringify(ds));

	app.ajaxPost("/databrowser/savebrowser", param, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		if (section == "goback") {
			db.backToFront();	
		} else {
			br.ViewBrowserName(param._id)
		}
	});
}

db.designDataBrowser = function(_id) {
	ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	db.databrowserData([]);
	app.ajaxPost("/databrowser/getdesignview", { _id: _id}, function(res){
		if(!app.isFine(res)){
			return;
		}

		if (!res.data) {
			res.data = [];
		}

		
		br.pageVisible("editor");
		app.mode('editor')
		db.databrowserData(res.data.MetaData);
		


		// db.connectionID(res.data.ConnectionID);
		dbq.clearQuery()
		if (res.data.QueryText != '' && res.data.QueryType == 'Dbox') {
			dbq.setQuery(JSON.parse(res.data.QueryText));
		}
		db.setDataSource();
		db.populateTable(res.data.ConnectionID);
		if (typeof _id === "function") {
			_id();
		}
		ko.mapping.fromJS(res.data, db.configDataBrowser);
		
		db.isChecked($("#isFreetext").prop("checked"))
		db.showHideFreeQuery();
		db.headerCheckedAll();
	});
}

db.populateTable = function (_id) {
	var param = { connectionID: _id };
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
	if (db.configDataBrowser._id() == '') {
		swal({ title: "Warning", text: "Please add ID first", type: "warning" });
		return;
	}

	if (!app.isFormValid(".form-databrowserdesign")) {
		return;
	}
	
	var param = ko.mapping.toJS(db.configDataBrowser);
	db.checkBuilderNotEmpty();
	if (!db.isChecked()) { //if false by default query with dbox
		if ($("#table option:selected").text() != 'Select one') {
			param.QueryType = "nonQueryText";
			param.TableNames = $("#table").data("kendoDropDownList").value();
		}else{
			return;
		}
	}else {
		if ($("#querytext").val() != '' && $("#querytype option:selected").text() == 'SQL') {
			param.QueryType = db.configDataBrowser.QueryType();
			param.QueryText = db.configDataBrowser.QueryText();
			console.log(param)
		} else if ($("#textquery").val() != '' && $("#querytype option:selected").text() == 'Dbox') {
			param.QueryType = $("#querytype option:selected").text();
			param.QueryText = JSON.stringify(dbq.getQuery());
			db.configDataBrowser.QueryType(param.QueryType);
			db.configDataBrowser.QueryText(param.QueryText);
		}
	}
	// console.log(param)
	app.ajaxPost("/databrowser/testquery", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		
		ko.mapping.fromJS(res.data, db.configDataBrowser)
		db.configDataBrowser.MetaData([]);
		db.databrowserData(res.data.MetaData);
		db.setDataSource();
	});
};


db.fetchDataSourceMetaData = function (from) {
	var param = {
		connectionID: db.configDataBrowser.ConnectionID(),
		from: from
	};

	db.configDataBrowser.MetaData([]);
	app.ajaxPost("/datasource/fetchdatasourcemetadata", param, function (res) {
		if (!res.success && res.message == "[eaciit.dbox.dbc.mongo.Cursor.Fetch] Not found") {
			db.configDataBrowser.MetaData([]);
			dbq.clearQuery();
			return;
		}
		if (!app.isFine(res)) {
			dbq.clearQuery();
			return;
		}

		db.configDataBrowser.MetaData(res.data);
		// db.saveDataSource();
	}, function (a) {
        sweetAlert("Oops...", a.statusText, "error");
		dbq.clearQuery();
	}, {
		timeout: 10000
	});
};

db.checkBuilderNotEmpty = function() {
	db.isChecked($("#isFreetext").prop("checked"))
	if (!db.isChecked()) { //if false by default query with dbox
		if ($("#table option:selected").text() == 'Select one') {
			swal({ title: "Warning", text: "Please choose table name", type: "warning" });
			return;
		}
	}else {
		var sqltext = $("#querytext").val()
		var dboxtext = $("#textquery").val()
		var querytype = $("#querytype option:selected").text()
		var mustFilled = ""
		if (querytype == 'Select Query Type') {
			mustFilled = "choose the query type";
		} else if ((sqltext == "" && querytype == 'SQL') || (dboxtext == "" && querytype == 'Dbox') ) {
			var mustFilled = "type the query text"
		}
		if (mustFilled != "") {
			swal({ title: "Warning", text: "Please "+mustFilled+"", type: "warning" });
			return;
		}
	}
}

db.checkAll = function(ele, field) {
    var state = $(ele).is(':checked');    
    var grid = $('.grid-databrowser-design').data('kendoGrid');
    $.each(grid.dataSource.view(), function () {
        if (this[field] != state) 
            this.dirty=true;
        this[field] = state;
    });
    grid.refresh();
}

db.headerCheckedAll = function() {
	if ($(".hiddenfield:checked").length == $(".hiddenfield").length) {
		$("#selectallhiddenfield").prop("checked", true);
	} else {
		$("#selectallhiddenfield").prop("checked", false);
	}

	if ($(".sortable:checked").length == $(".sortable").length) {
		$("#selectallsortable").prop("checked", true);
	} else {
		$("#selectallsortable").prop("checked", false);
	}

	if ($(".simplefilter:checked").length == $(".simplefilter").length) {
		$("#selectallsimplefilter").prop("checked", true);
	} else {
		$("#selectallsimplefilter").prop("checked", false);
	}

	if ($(".advancefilter:checked").length == $(".advancefilter").length) {
		$("#selectalladvancefilter").prop("checked", true);
	} else {
		$("#selectalladvancefilter").prop("checked", false);
	}
}

db.backToFront = function() {
	app.mode('');
	br.pageVisible("");
	ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	$("#isFreetext").prop("checked", false);
	$("#selectallhiddenfield").prop("checked", false);
	$("#freeQuery").hide();
	$("#builderButton").hide();
	$("#fromTable").show();
	br.getDataBrowser();
};

db.setDataSource = function () {
	var ds = new kendo.data.DataSource({
		pageSize: 15, 
		batch: true,
		schema: { 
			model: { 
	    		id: 'Field', 
    			fields: { 
    				Field: { editable: false }, 
    				Label: { type: 'string' },
    				DataType: { type: 'string' },
    				Format: { type: 'string' },
    				Align: { type: 'string' },
    				ShowIndex: { 
    					type: 'number', 
    					editable: false
					},
					HiddenField: { type: 'boolean' }, 
					Sortable: { type: 'boolean' }, 
					SimpleFilter: { type: 'boolean' }, 
					AdvanceFilter: { type: 'boolean' }, 
					Aggregate: { type: 'string' }
				} 
			} 
		},
		data: db.databrowserData()
	});

	$(".grid-databrowser-design").data("kendoGrid").setDataSource(ds);
};
db.prepareGrid = function () {
	$(".grid-databrowser-design").kendoGrid({ 
		selectable: 'multiple, row', 
		columns: db.databrowserColumns(), 
		editable: true, 
		filterfable: false, 
		pageable: true, 
		dataBound: app.gridBoundTooltipster('.grid-databrowser-design')
	});
	db.setDataSource();
}

db.showHideFreeQuery = function() {
	if (db.configDataBrowser.QueryType() == "") {
		$("#isFreetext").attr("checked", false)
		$("#freeQuery").hide();
		$("#builderButton").hide();
		$("#querytype").hide();
	}

	$("#isFreetext").change(function() {
		if (this.checked){
			$("#freeQuery").show();
			$("#builderButton").show();
			$("#querytype").show();
			$("#fromTable").hide();	
		}else{
			$("#freeQuery").hide();
			$("#builderButton").hide();
			$("#querytype").hide();
			$("#fromTable").show();
		}
	});

	if (db.isChecked()) {
		$("#freeQuery").show();
		$("#querytype").show();
		$("#fromTable").hide();
	} else {
		$("#freeQuery").hide();
		$("#querytype").hide();
		$("#fromTable").show();
	}
};

$(function () {
	db.prepareGrid();	
});