viewModel.dbquery = {}; var dbq = viewModel.dbquery;

dbq.dataCommand = ko.observableArray([
	{ id: 0, key: "select", type: "field, field", value: ""},
	{ id: 0, key: "from", type: "table", value: ""},
	{ id: 0, key: "order", type: "string", value: ""},
]);
dbq.dataQueryOfOrder = ko.observableArray([
	{ value: "asc", title: "Ascending" },
	{ value: "desc", title: "Descending" },
]);
dbq.dataQueryOfWhere = [
	{ key: "And", title: "And", type: "Array Query" },
	{ key: "Or", title: "Or", type: "Array Query" },
	{ key: "Eq", title: "Equal", type: "field,value" },
	{ key: "Ne", title: "Not Equal", type: "field,value" },
	{ key: "Lt", title: "Lower Than", type: "field,value" },
	{ key: "Lte", title: "Lower Than / Equal", type: "field,value" },
	{ key: "Gt", title: "Greater Than", type: "field,value" },
	{ key: "Gte", title: "Greater Than / Equal", type: "field,value" },
	{ key: "In", title: "In", type: "field, array string" },
	{ key: "Nin", title: "Not In", type: "field, array string" },
	{ key: "Contains", title: "Contains", type: "field, array string" },
];

dbq.templateQueryOfInsert = { 
	field: "", 
	value: ""
};
dbq.templateQueryOfOrder = { 
	field: "", 
	direction: ""
};
dbq.templateQueryOfWhere = {
	id: "",
	key: "",
	parm: "",
	field: "",
	value: "",
	subquery: [],
	parentsum: 0,
};
dbq.templateQueryOfCommand = {
	command: "",
	param: ""
};

dbq.queryBuilderMode = ko.observable('');
dbq.parentSumWhere = ko.observable(1);
dbq.valueCommands = ko.observableArray([]);
dbq.queryOfSelect = ko.observableArray([]);
dbq.queryOfInsert = ko.observableArray([]);
dbq.queryOfFrom = ko.observable("");
dbq.queryOfOrder = ko.observableArray([]);
dbq.queryOfTake = ko.observable(0);
dbq.queryOfWhere = ko.observableArray([]);
dbq.queryOfCommand = ko.mapping.fromJS(dbq.templateQueryOfCommand);

dbq.addQueryOfInsert = function () {
	var o = $.extend(true, {}, dbq.templateQueryOfInsert);
	dbq.queryOfInsert.push(ko.mapping.fromJS(o));
};
dbq.removeQueryOfInsert = function (index) {
	return function () {
		var o = dbq.queryOfInsert()[index];
		dbq.queryOfInsert.remove(o);
	};
};
dbq.addQueryOfOrder = function () {
	var o = $.extend(true, {}, dbq.templateQueryOfOrder);
	dbq.queryOfOrder.push(ko.mapping.fromJS(o));
};
dbq.removeQueryOfOrder = function (index) {
	return function () {
		var o = dbq.queryOfOrder()[index];
		dbq.queryOfOrder.remove(o);
	};
};
dbq.addFilter = function (filter) {
	return function () {
		if (!app.isFormValid(".form-datasource")) {
			sweetAlert("Oops...", 'Fill the datasource informations first', "error");
			return;
		}

		dbq.queryBuilderMode(filter.key);

		if (["select", "insert", "update", "delete", "command"].indexOf(filter.key) > -1) {
			var keywords = Lazy($('#textquery').tokenInput("get")).where(function (e) {
				return (["select", "insert", "update", "delete", "command"].indexOf(e.key) > -1);
			}).toArray();

			if (keywords.length > 0) {
				if (keywords[0].key != filter.key) {
					sweetAlert("Oops...", 'Cannot use both "' + keywords[0].key + '" and "' + filter.key + '" together', "error");
					return;
				}
			}
		}

		if (["select", "order", "where"].indexOf(filter.key) > -1) {
			var keywords = Lazy($('#textquery').tokenInput("get")).where({ key: "from" }).toArray();

			if (keywords.length == 0) {
				sweetAlert("Oops...", 'Cannot use "select" / "order" / "where" without using "from" first', "error");
				return;
			}
		}

		if (filter.key == "select") {
			dbq.queryOfSelect([]);
			$(".modal-query").modal("show");
		}

		if (filter.key == "insert" || filter.key == "update") {
			dbq.queryOfInsert([]);
			var row = $.extend(true, { }, dbq.templateQueryOfInsert);
			row.field = "_id";
			dbq.queryOfInsert.push(ko.mapping.fromJS(row));
			app.resetValidation(".query-of-insert");
			$(".modal-query").modal("show");
		}

		if (filter.key == "delete") {
			$('#textquery').tokenInput("remove", { key: filter.key });
			$('#textquery').tokenInput("add", { 
				id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
				key: filter.key,
				value: ""
			});
		}

		if (filter.key == "from") {
			dbq.queryOfFrom('');
			app.resetValidation(".query-of-from");
			$(".modal-query").modal("show");
		}

		if (filter.key == "order") {
			dbq.queryOfOrder([]);
			dbq.addQueryOfOrder();
			$(".modal-query").modal("show");
		}

		if (filter.key == "take" || filter.key == "skip") {
			dbq.queryOfTake(0);
			$(".modal-query").modal("show");
		}

		if (filter.key == "where") {
			dbq.queryOfWhere([]);
			dbq.addQueryOfWhere();
			app.resetValidation(".query-of-where");
			$(".modal-query-where").modal("show");
		}

		if (filter.key == "command") {
			ko.mapping.fromJS(dbq.templateQueryOfCommand, dbq.queryOfCommand);
			app.resetValidation(".query-of-command");
			$(".modal-query").modal("show");
		}
	};
};
dbq.querySave = function () {
	var o = { 
		id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
		key: dbq.queryBuilderMode(),
		value: ""
	};

	if (dbq.queryBuilderMode() == "select") {
		o.value = dbq.queryOfSelect().length > 0 ? dbq.queryOfSelect().join(",") : "*";
	}

	if (dbq.queryBuilderMode() == "insert" || dbq.queryBuilderMode() == "update" ) {
		if (!app.isFormValid(".query-of-insert")) {
			return;
		}
		
		var data = {};
		Lazy(ko.mapping.toJS(dbq.queryOfInsert())).each(function (e) {
			data[e.field] = app.couldBeNumber(e.value);
		});
		o.value = JSON.stringify(data).replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');

		if (!data.hasOwnProperty("_id")) {
			sweetAlert("Oops...", 'There must be field called "_id"', "error");
			return;
		}
	}

	if (dbq.queryBuilderMode() == "from") {
		if (!app.isFormValid(".query-of-from")) {
			return;
		}
		o.value = dbq.queryOfFrom();
		db.fetchDataSourceMetaData(o.value);
	}

	if (dbq.queryBuilderMode() == "order") {
		if (!app.isFormValid(".query-of-order")) {
			return;
		}

		var all = {};
		ko.mapping.toJS(dbq.queryOfOrder()).forEach(function (e) {
			all[e.field] = e.direction;
		});

		o.value = JSON.stringify(all);
	}

	if (dbq.queryBuilderMode() == "take" || dbq.queryBuilderMode() == "skip") {
		o.value = parseInt(dbq.queryOfTake(), 10);
	}

	if (dbq.queryBuilderMode() == "command" ) {
		if (!app.isFormValid(".query-of-command")) {
			return;
		}
		
		var data = {};
		data[dbq.queryOfCommand.command()] = dbq.queryOfCommand.param();
		o.value = JSON.stringify(data).replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
	}

	$('#textquery').tokenInput("remove", { key: dbq.queryBuilderMode() });
	$('#textquery').tokenInput("add", o);
	$(".modal-query").modal("hide");
};
dbq.getQuery = function () {
	var o = {};
	ko.mapping.toJS($('#textquery').tokenInput("get")).forEach(function (e) {
		o[e.key] = e.value;
	});
	return o;
};
dbq.setQuery = function (queries) {
	for (var key in queries) {
		if (queries.hasOwnProperty(key)) {
			var o = { 
				id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
				key: key,
				value: queries[key]
			};
			$('#textquery').tokenInput("add", o);
		}
	}
};
dbq.validateQuery = function () {
	var queries = $('#textquery').tokenInput("get");
	if (queries.length == 0) {
		return true;
	}

	var isKeywordExists = Lazy(queries).where(function (e) {
		return (["select", "insert", "update", "delete", "command"].indexOf(e.key) > -1);
	}).toArray().length > 0;
	if (!isKeywordExists) {
		sweetAlert("Oops...", 'Query must contains "select" / "insert" / "update" / "delete" / "command" !', "error");
		return false;
	}

	var isFromExists = Lazy($('#textquery').tokenInput("get")).where(function (e) {
		return ["from", "command"].indexOf(e.key) > -1
	}).toArray().length > 0;
	if (!isFromExists) {
		sweetAlert("Oops...", 'Query must contains "from" / "command" !', "error");
		return false;
	}

	return true;
};
dbq.clearQuery = function () { 
	$('#textquery').tokenInput("remove", { });
};
dbq.addQueryOfWhere = function () {
	var o = $.extend(true, {}, dbq.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	dbq.queryOfWhere.push(m);
};
dbq.removeQueryOfWhere = function (id, index) {
	return function () {
		// var o = dbq.queryOfWhere()[index];
		// dbq.queryOfWhere.remove(o);
		var a = dbq.queryOfWhere.remove( function (item) { return item.id() == id; } );
		if (a.length == 0){
			for (var key in dbq.queryOfWhere()){
				dbq.removeSubQueryOfWhere(dbq.queryOfWhere()[key], id);
			}
		}
	};
};
dbq.removeSubQueryOfWhere = function(obj,id){
	for (var key in obj.subquery()){
		if (id == obj.subquery()[key].id()){
			obj.subquery.remove( function (item) { return item.id() == id; } );
		} else {
			dbq.removeSubQueryOfWhere(obj.subquery()[key], id);
		}
	}
};
dbq.saveQueryOfWhere = function () {
	if (!app.isFormValid(".query-of-where")) {
		return;
	}

	var parseWhereOneByOne = function (items) {
		return items.map(function (e) {
			var v = { key: e.key, field: e.field, value: e.value };

			if (e.subquery.length > 0) {
				v.value = parseWhereOneByOne(e.subquery);
			}

			return v;
		});
	};
	
	var queryOfWhere = ko.mapping.toJS(dbq.queryOfWhere());

	var o = { 
		id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
		key: "where",
		value: JSON.stringify(parseWhereOneByOne(queryOfWhere))
	};

	$('#textquery').tokenInput("remove", { key: "where" });
	$('#textquery').tokenInput("add", o);
	$(".modal-query-where").modal("hide");
};
dbq.changeQueryOfWhere = function(datakey, idparent, chooseadd){
	var o = $.extend(true, {}, dbq.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	for(var key in dbq.queryOfWhere()){
		if (idparent == dbq.queryOfWhere()[key].id()){
			if (datakey == "And" || datakey == "Or"){
				if (chooseadd != 'select'){
					m.parentsum(1);
					dbq.queryOfWhere()[key].subquery.push(m);
				} else if (chooseadd == 'select' && dbq.queryOfWhere()[key].subquery().length == 0){
					m.parentsum(1);
					dbq.queryOfWhere()[key].subquery.push(m);
				}
				dbq.queryOfWhere()[key].field('a');
				dbq.queryOfWhere()[key].value('a');
			} else {
				dbq.queryOfWhere()[key].field('');
				dbq.queryOfWhere()[key].value('');
				if (dbq.queryOfWhere()[key].subquery().length > 0)
					dbq.queryOfWhere()[key].subquery([]);
			}
			break;
		} else if (idparent != dbq.queryOfWhere()[key].id() && dbq.queryOfWhere()[key].subquery().length > 0) {
			dbq.parentSumWhere(1);
			dbq.AddSubQuery(idparent, dbq.queryOfWhere()[key], 1, chooseadd, datakey);
		}
	}
};
dbq.AddSubQuery = function(idparent,obj, parentsum, chooseadd, datakey){
	var o = $.extend(true, {}, dbq.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	dbq.parentSumWhere(dbq.parentSumWhere() + 1);
	for(var key in obj.subquery()){
		if (idparent == obj.subquery()[key].id()){
			if (datakey == "And" || datakey == "Or"){
				if (chooseadd != 'select'){
					m.parentsum(dbq.parentSumWhere());
					obj.subquery()[key].subquery.push(m);
				} else if (chooseadd == 'select' && obj.subquery()[key].subquery().length == 0){
					m.parentsum(dbq.parentSumWhere());
					obj.subquery()[key].subquery.push(m);
				}
				obj.subquery()[key].field('a');
				obj.subquery()[key].value('a');
			} else {
				obj.subquery()[key].field('');
				obj.subquery()[key].value('');
				if (obj.subquery()[key].subquery().length > 0)
					obj.subquery()[key].subquery([]);
			}
			break;
		} else {
			dbq.AddSubQuery(idparent, obj.subquery()[key], parentsum, chooseadd, datakey);
		}
	}
}
dbq.createTextQuery = function () {
	$("#textquery").tokenInput(dbq.dataCommand(), { 
		zindex: 700,
		noResultsText: "Add New Query",
		allowFreeTagging: true,
		placeholder: 'Input Type Here!!',
		tokenValue: 'id',
		propertyToSearch: 'key',
		theme: "facebook",
		onAdd: function (item) {
			dbq.valueCommands.push(item);
		},
		onDelete: function (item) {
			var target = Lazy(dbq.valueCommands()).find({ key: item.key });
			if (target != undefined) {
				dbq.valueCommands.remove(target);
			}
		},
		tokenFormatter: function (item) {
			var text = item.value;
			if (item.key == "where") {
				var itemToQueryStyle = function (items) {
					return items.map(function (e) {
						var o = {};
						o[e.field] = e.value;

						var v = {};
						v[e.key] = o;

						if (e.value instanceof Array) {
							v[e.key] = itemToQueryStyle(e.value);
						}

						return v;
					});
				}

				text = JSON.stringify(itemToQueryStyle(JSON.parse(item.value)));
			}

			var key = item.key.replace(/\b[a-z](?=[a-z]{2})/g, function(letter) {
				return letter.toUpperCase();
			});
			
			return "<li>" + key + "(" + text + ")</li>";
		}
	});
};

$(function () {
	dbq.createTextQuery();
});