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
    Lookup: false,
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
    MetaData : []
}

db.templateDboxData = {
     _id : "",
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
	{ DataType: "bool", text: "bool" },
	{ DataType: "float32", text: "float32" },
	{ DataType: "float64", text: "float64" },
	{ DataType: "date", text: "date" }
]);
db.aggrData = ko.observableArray([
	"COUNT",
	"SUM",
	"AVG",
	"MAX",
	"MIN",
	// "MEAN",
	// "MEDIAN"
]);
db.connectionID = ko.observable('');
db.isChecked = ko.observable('');
db.collectionListData = ko.observableArray([]);
db.databrowserData = ko.observableArray([]);
db.tempGetDataNrowserDesign = ko.observableArray([]);
db.configDataBrowser = ko.mapping.fromJS(db.templateConfig);
db.configDboxData = ko.mapping.fromJS(db.templateDboxData);
db.databrowserColumns = ko.observableArray([
	{ width: 150, locked: true, field: "Field", title: "Field", editable: false },
	{ width: 150, locked: true, field: "Label", title: "label"},
	{ width: 100, field: "DataType", title: "Data Type", template: "#= db.dataTypeOption(DataType) #",
		editor: function(container, options) {
            var input = $('<input id="datatypeId" name="datatype" data-bind="value:' + options.field + '">');
            input.appendTo(container);
            input.kendoDropDownList({
                dataTextField: "text",
                dataValueField: "DataType",
                dataSource: db.dataType() // bind it to the models array
            }).appendTo(container);
        }},
	{ width: 100, field: "Format", title: "Format"},
	{ width: 100, title: "Align", field: "Align", template: "#= db.alignOption(Align) #",
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
	{ width: 120, title: "Position", template: "<a class='btn btn-xs btn-default k-grid-Up' onclick='db.moveUp(this)'><span class='glyphicon glyphicon-menu-up'></span></a> <a class='btn btn-xs btn-default k-grid-Down' onclick='db.moveDown(this)'><span class='glyphicon glyphicon-menu-down'></span></a><span style='margin-left: 5px;'>#= ShowIndex #</span>"},
	{ width: 100, title: "Hidden Field", template: "<center><input type='checkbox' #=HiddenField ? \"checked='checked'\" : ''# class='hiddenfield' data-field='HiddenField' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallhiddenfield' onclick=\"db.checkAll(this, 'HiddenField')\" />&nbsp;&nbsp;Hidden Field</center>"},
	{ width: 100, title: "Lookup", template: "<center><input type='checkbox' #=Lookup ? \"checked='checked'\" : ''# class='lookup' data-field='Lookup' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectalllookup' onclick=\"db.checkAll(this, 'Lookup')\" />&nbsp;&nbsp;Lookup</center>"},
	{ width: 100, title: "Sortable", template: "<center><input type='checkbox' #= Sortable ? \"checked='checked'\" : '' # class='sortable' data-field='Sortable' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallsortable' onclick=\"db.checkAll(this, 'Sortable')\" />&nbsp;&nbsp;Sortable</center>"},
	{ width: 100, title: "Simple Filter", template: "<center><input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectallsimplefilter' onclick=\"db.checkAll(this, 'SimpleFilter')\" />&nbsp;&nbsp;Simple Filter</center>"},
	{ width: 100, title: "Advance Filter", template: "<center><input type='checkbox' #= AdvanceFilter ? \"checked='checked'\" : '' # class='advancefilter' data-field='AdvanceFilter' onchange='db.changeCheckboxOnGrid(this)' /></center>", headerTemplate: "<center><input type='checkbox' id='selectalladvancefilter' onclick=\"db.checkAll(this, 'AdvanceFilter')\" />&nbsp;&nbsp;Advance Filter</center>"},
	{ width: 100, field: "Aggregate", title: "Aggregate",
		editor: function(container, options) {
			var input = $('<input id="aggr" name="aggr" data-field="Aggregate" data-bind="value:' + options.field + '"">');
			input.appendTo(container);
			input.kendoAutoComplete({
				dataSource: db.aggrData(),
				filter: "startswith",
				separator: ","
			});
		}},
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
    	property.Lookup = val.Lookup
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
	var field = $(o).attr("data-field");
	var uid = $(o).closest("tr").attr("data-uid");
	var value = $(o).is(":checked");

	var rowData = $grid.dataSource.getByUid(uid);
	rowData.set(field, value);

	var data = $grid.dataSource.data();
	var plainData = JSON.parse(kendo.stringify(data));
	db.databrowserData(plainData);
	db.headerCheckedAll();

	return true;
}

db.back = function(section){
	if (section == "back") {
		db.backToFront();
		// swal({
		// 	title: "Do you want to exit?",
		// 	text: "",
		// 	type: "warning",
		// 	showCancelButton: true,
		// 	confirmButtonColor: "#DD6B55",
		// 	confirmButtonText: "Exit & Save",
		// 	cancelButtonText: "Exit",
		// 	closeOnConfirm: true,
		// 	closeOnCancel: true
		// },
		// 	function(isConfirm){
		// 		if (isConfirm) {
		// 			db.saveAndBack('goback');
		// 		}else{
		// 			db.backToFront();
		// 		}
		// 	}
		// );			
	} else {
		br.ViewBrowserName(param._id)
	}
}

db.saveAndBack = function(section) {

	if (!app.isFormValid(".form-databrowserdesign")) {
		return;
	}

	db.checkBuilderNotEmpty();

	var param = ko.mapping.toJS(db.configDataBrowser);
	if (/\s/g.test(param._id)) {
		swal({ title: "error", text: "Whitespace not allowed on ID field name", type: "error" });
		return;
	}

	var grids = $(".grid-databrowser-design").data("kendoGrid")
	
	// var data = grids.dataSource.data();
	
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
     	
	
	var ds = grids.dataSource.data();
	param.MetaData = JSON.parse(kendo.stringify(ds));
	for (var data in param.MetaData){
		if (param.MetaData[data].Aggregate != "") {
			var splitString = param.MetaData[data].Aggregate.split(",");
			var obj = {};
			for (var s in splitString) {
				if (splitString[s] != "") {
					obj[splitString[s]] = ""
				}
			}
			
			param.MetaData[data].Aggregate = JSON.stringify(obj)
		}
	}
    
	app.ajaxPost("/databrowser/savebrowser", param, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		if (section == "goback") {
			db.backToFront();
		} else if (section == "nothing") {
			// nothing
		} else {
			br.ViewBrowserName(param._id)
		}
	});
}

db.isSaved = ko.observable(false);
db.designDataBrowser = function(_id) {
	db.isSaved(false);
	ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	ko.mapping.fromJS(db.templateDboxData, db.configDboxData);
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
		for(var i in res.data.MetaData) {
			if (res.data.MetaData[i].Aggregate != "") {
				var aggrToString = [];
				var jsnstring = JSON.parse(res.data.MetaData[i].Aggregate)
				// console.log(res.data.MetaData[i].Field,res.data.MetaData[i].Aggregate)
				// console.log(res.data.MetaData[i].Field,jsnstring)
				$.each(jsnstring, function(key, val) {
					aggrToString.push(key.toUpperCase())
				});
				res.data.MetaData[i].Aggregate = aggrToString+","
			}
		}
		db.databrowserData(res.data.MetaData);
		dbq.clearQuery()
		db.setDataSource();
		
		if (typeof _id === "function") {
			_id();
		}
		ko.mapping.fromJS(res.data, db.configDataBrowser);
		db.populateTable(res.data.ConnectionID, false);		

		if (res.data.QueryText != '' && res.data.QueryType == 'Dbox') {
			var querytext = JSON.parse(res.data.QueryText)
			dbq.setQuery(querytext);
			if (querytext.hasOwnProperty("from") && db.configDboxData.MetaData().length == 0) {
				db.fetchDataSourceMetaData(querytext.from);
			}
		}
		
		db.isChecked($("#isFreetext").prop("checked"))
		db.showHideFreeQuery();
		db.headerCheckedAll();
        db.connAggregate(res.data.ConnectionID);
        
        var obj = new Object();
        obj.dataBrowserID = _id
        obj.connectionID = res.data.ConnectionID
        db.tempGetDataNrowserDesign([]);
        db.tempGetDataNrowserDesign.push(obj);
		// var ddl = $("#table").data("kendoDropDownList");
		// var cetak = ddl.text(res.data.TableNames);
		// console.log("cetak", cetak)
		// console.log("res.data.TableNames", res.data.TableNames)

	});
}

db.populateTable = function (_id, isPopulated) {
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

			/*remapping data*/
			a = ko.mapping.toJS(db.configDataBrowser);
			ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
			ko.mapping.fromJS(a, db.configDataBrowser);
            if (isPopulated){
                db.connAggregate(_id);
                var grid = $(".grid-databrowser-design").data("kendoGrid");
                grid.dataSource.data([]);
                
                var dropdownlist = $("#table").data("kendoDropDownList");
                dropdownlist.select(0);
                db.isChecked(false);
                db.configDataBrowser.QueryType("");
                db.configDataBrowser.QueryText("");
                db.configDataBrowser.TableNames("");
                db.showHideFreeQuery();
                $("#textquery").tokenInput("clear");
                
                if (db.tempGetDataNrowserDesign().length > 0) {
                    if (db.tempGetDataNrowserDesign()[0].connectionID == _id && db.tempGetDataNrowserDesign()[0].dataBrowserID ==  db.configDataBrowser._id()){
                        db.designDataBrowser(db.tempGetDataNrowserDesign()[0].dataBrowserID)
                    }
                }
            }
		}
	});
};

db.connAggregate = function(_id) {
    var param = { ConnectionID: _id };
    app.ajaxPost("/databrowser/checkconnection", param, function (result) {
        var grid = $(".grid-databrowser-design").data("kendoGrid");
        if (result.data == "json" || result.data == "jsons" || result.data == "csv" || result.data == "csvs") {
            grid.hideColumn(11);
        }else{
            grid.showColumn(11);
        }
    });
}

db.testQuery = function() {
	if (db.configDataBrowser._id() == '') {
		swal({ title: "Warning", text: "Please add ID first", type: "warning" });
		return;
	}

	if (!app.isFormValid(".form-databrowserdesign")) {
		return;
	}
	
	var param = ko.mapping.toJS(db.configDataBrowser);
	var istable = false
	db.checkBuilderNotEmpty();
	if (!db.isChecked()) { //if false by default query with dbox
		if ($("#table option:selected").text() != 'Select one') {
			param.QueryType = "nonQueryText";
			param.TableNames = $("#table").data("kendoDropDownList").value();
			istable = true
		}else{
			return;
		}
	}else {
		if ($("#querytext").val() != '' && $("#querytype option:selected").text() == 'SQL') {
			param.QueryType = db.configDataBrowser.QueryType();
			param.QueryText = db.configDataBrowser.QueryText();
		} else if ($("#textquery").val() != '' && $("#querytype option:selected").text() == 'Dbox') {
			param.QueryType = $("#querytype option:selected").text();
			param.QueryText = JSON.stringify(dbq.getQuery());
			db.configDataBrowser.QueryType(param.QueryType);
			db.configDataBrowser.QueryText(param.QueryText);
		}
	}
	
	app.ajaxPost("/databrowser/testquery", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		ko.mapping.fromJS(res.data, db.configDataBrowser)
		if (istable) {
			$("#isFreetext").prop("checked", false);
		}
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

	db.configDboxData.MetaData([]);
	app.ajaxPost("/datasource/fetchdatasourcemetadata", param, function (res) {
		if (!res.success && res.message == "[eaciit.dbox.dbc.mongo.Cursor.Fetch] Not found") {
			db.configDboxData.MetaData([]);
			dbq.clearQuery();
			return;
		}
		if (!app.isFine(res)) {
			dbq.clearQuery();
			return;
		}
		db.configDboxData.MetaData(res.data);
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
			mustFilled = "type the query text"
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

	if ($(".lookup:checked").length == $(".lookup").length) {
		$("#selectalllookup").prop("checked", true);
	} else {
		$("#selectalllookup").prop("checked", false);
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
	ko.mapping.fromJS(db.templateDboxData, db.configDboxData);
    db.tempGetDataNrowserDesign([]);
	$("#isFreetext").prop("checked", false);
	$("#selectallhiddenfield").prop("checked", false);
	$("#freeQuery").hide();
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
					Lookup: { type: 'boolean' },
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
		$("#querytype").hide();
	}

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