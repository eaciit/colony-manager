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
db.connectionID = ko.observable('');
db.collectionListData = ko.observableArray([]);
db.databrowserData = ko.observableArray([]);
// db.configMetaData = ko.mapping.fromJS(db.templateConfigMetaData);
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
	{ title: "Sortable", template: "<input type='checkbox' #= Sortable ? \"checked='checked'\" : '' # class='sortable' data-field='Sortable' onchange='db.changeCheckboxOnGrid(this)' />"},
	{ title: "Simple Filter", template: "<input type='checkbox' #= SimpleFilter ? \"checked='checked'\" : '' # class='simplefilter' data-field='SimpleFilter' onchange='db.changeCheckboxOnGrid(this)' />"},
	{ title: "Advance Filter", template: "<input type='checkbox' #= AdvanceFilter ? \"checked='checked'\" : '' # class='advancefilter' data-field='AdvanceFilter' onchange='db.changeCheckboxOnGrid(this)' />"},
	{ field: "Aggregate", title: "Aggregate"},
]);


db.alignOption = function (opt) {
	grid = $(".grid-databrowser-design").data("kendoGrid");
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

	return true;
}

db.saveAndBack = function() {
	var param = ko.mapping.toJS(db.configDataBrowser);
	grid = $(".grid-databrowser-design").data("kendoGrid");

	var idsToSend = [];         	
	var grids = $(".grid-databrowser-design").data("kendoGrid")
	var ds = grids.dataSource.data();
	param.MetaData = JSON.parse(kendo.stringify(ds));

    console.log(param);

	app.ajaxPost("/databrowser/savebrowser", param, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		
		db.backToFront();
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
		db.setDataSource();
		if (typeof _id === "function") {
			_id();
		}
		ko.mapping.fromJS(res.data, db.configDataBrowser);
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
		param.TableNames = $("#table").data("kendoDropDownList").value();
		// console.log(param)
		app.ajaxPost("/databrowser/testquery", param, function (res) {
			if (!app.isFine(res)) {
				return;
			}
			
			console.log("res.data test query >>", res.data)

			ko.mapping.fromJS(res.data, db.configDataBrowser)
			db.configDataBrowser.MetaData([]);
			db.databrowserData(res.data.MetaData);
			db.setDataSource();
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
    				Format: { type: 'string' },
    				Align: { type: 'string' },
    				ShowIndex: { 
    					type: 'number', 
    					editable: false
					},
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

$(function () {
	db.prepareGrid();
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