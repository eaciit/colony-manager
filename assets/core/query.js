viewModel.query = {}; var qr = viewModel.query;

qr.dataCommand = ko.observableArray([
	{ id: 0, key: "select", type: "field, field", value: ""},
	{ id: 0, key: "insert", type: "", value: ""},
	{ id: 0, key: "update", type: "", value: ""},
	{ id: 0, key: "delete", type: "", value: ""},
	{ id: 0, key: "command", type: "field, field", value: ""},
	// { id: 0, key: "save", type: "", value: ""},
	{ id: 0, key: "from", type: "table", value: ""},
	{ id: 0, key: "where", type: "string", value: ""},
	{ id: 0, key: "order", type: "string", value: ""},
	{ id: 0, key: "take", type: "number", value: ""},
	{ id: 0, key: "skip", type: "number", value: ""},
]);
qr.dataQueryOfOrder = ko.observableArray([
	{ value: "asc", title: "Ascending" },
	{ value: "desc", title: "Descending" },
]);
qr.dataQueryOfWhere = [
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

qr.templateQueryOfInsert = { 
	field: "", 
	value: ""
};
qr.templateQueryOfOrder = { 
	field: "", 
	direction: ""
};
qr.templateQueryOfWhere = {
	id: "",
	key: "",
	parm: "",
	field: "",
	value: "",
	subquery: [],
	parentsum: 0,
};
qr.templateQueryOfCommand = {
	command: "",
	param: ""
};

qr.queryBuilderMode = ko.observable('');
qr.parentSumWhere = ko.observable(1);
qr.valueCommands = ko.observableArray([]);
qr.queryOfSelect = ko.observableArray([]);
qr.queryOfInsert = ko.observableArray([]);
qr.queryOfFrom = ko.observable("");
qr.queryOfOrder = ko.observableArray([]);
qr.queryOfTake = ko.observable(0);
qr.queryOfWhere = ko.observableArray([]);
qr.queryOfCommand = ko.mapping.fromJS(qr.templateQueryOfCommand);

qr.addQueryOfInsert = function () {
	var o = $.extend(true, {}, qr.templateQueryOfInsert);
	qr.queryOfInsert.push(ko.mapping.fromJS(o));
};
qr.removeQueryOfInsert = function (index) {
	return function () {
		var o = qr.queryOfInsert()[index];
		qr.queryOfInsert.remove(o);
	};
};
qr.addQueryOfOrder = function () {
	var o = $.extend(true, {}, qr.templateQueryOfOrder);
	qr.queryOfOrder.push(ko.mapping.fromJS(o));
};
qr.removeQueryOfOrder = function (index) {
	return function () {
		var o = qr.queryOfOrder()[index];
		qr.queryOfOrder.remove(o);
	};
};
qr.addFilter = function (filter) {
	return function () {
		qr.queryBuilderMode(filter.key);

		if (["select", "insert", "update", "delete", "command"].indexOf(filter.key) > -1) {
			var keywords = Lazy($('#textquery').tokenInput("get")).where(function (e) {
				return (["select", "insert", "update", "delete", "command"].indexOf(e.key) > -1);
			}).toArray();

			if (keywords.length > 0) {
				if (keywords[0].key != filter.key) {
					toastr["error"]("", "ERROR: " + 'Cannot use both "' + keywords[0].key + '" and "' + filter.key + '" together');
					return;
				}
			}
		}

		if (["select", "order", "where"].indexOf(filter.key) > -1) {
			var keywords = Lazy($('#textquery').tokenInput("get")).where({ key: "from" }).toArray();

			if (keywords.length == 0) {
				toastr["error"]("", "ERROR: " + 'Cannot use "select" / "order" / "where" without using "from" first');
				return;
			}
		}

		if (filter.key == "select") {
			qr.queryOfSelect([]);
			$(".modal-query").modal("show");
		}

		if (filter.key == "insert" || filter.key == "update") {
			qr.queryOfInsert([]);
			var row = $.extend(true, { }, qr.templateQueryOfInsert);
			row.field = "_id";
			qr.queryOfInsert.push(ko.mapping.fromJS(row));
			ds.resetValidation(".query-of-insert");
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
			qr.queryOfFrom('');
			ds.resetValidation(".query-of-from");
			$(".modal-query").modal("show");
		}

		if (filter.key == "order") {
			qr.queryOfOrder([]);
			qr.addQueryOfOrder();
			$(".modal-query").modal("show");
		}

		if (filter.key == "take" || filter.key == "skip") {
			qr.queryOfTake(0);
			$(".modal-query").modal("show");
		}

		if (filter.key == "where") {
			qr.queryOfWhere([]);
			qr.addQueryOfWhere();
			ds.resetValidation(".query-of-where");
			$(".modal-query-where").modal("show");
		}

		if (filter.key == "command") {
			ko.mapping.fromJS(qr.templateQueryOfCommand, qr.queryOfCommand);
			ds.resetValidation(".query-of-command");
			$(".modal-query").modal("show");
		}
	};
};
qr.querySave = function () {
	var o = { 
		id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
		key: qr.queryBuilderMode(),
		value: ""
	};

	if (qr.queryBuilderMode() == "select") {
		o.value = qr.queryOfSelect().length > 0 ? qr.queryOfSelect().join(",") : "*";
	}

	if (qr.queryBuilderMode() == "insert" || qr.queryBuilderMode() == "update" ) {
		if (!app.isFormValid(".query-of-insert")) {
			return;
		}
		
		var data = {};
		Lazy(ko.mapping.toJS(qr.queryOfInsert())).each(function (e) {
			data[e.field] = qr.couldBeNumber(e.value);
		});
		o.value = JSON.stringify(data).replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');

		if (!data.hasOwnProperty("_id")) {
			toastr["error"]("", 'There must be field called "_id"');
			return;
		}
	}

	if (qr.queryBuilderMode() == "from") {
		if (!app.isFormValid(".query-of-from")) {
			return;
		}

		o.value = qr.queryOfFrom();
		ds.fetchDataSourceMetaData(o.value);
	}

	if (qr.queryBuilderMode() == "order") {
		if (!app.isFormValid(".query-of-order")) {
			return;
		}

		var all = {};
		ko.mapping.toJS(qr.queryOfOrder()).forEach(function (e) {
			all[e.field] = e.direction;
		});

		o.value = JSON.stringify(all);
	}

	if (qr.queryBuilderMode() == "take" || qr.queryBuilderMode() == "skip") {
		o.value = parseInt(qr.queryOfTake(), 10);
	}

	if (qr.queryBuilderMode() == "command" ) {
		if (!app.isFormValid(".query-of-command")) {
			return;
		}
		
		var data = {};
		data[qr.queryOfCommand.command()] = qr.queryOfCommand.param();
		o.value = JSON.stringify(data).replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
	}

	$('#textquery').tokenInput("remove", { key: qr.queryBuilderMode() });
	$('#textquery').tokenInput("add", o);
	$(".modal-query").modal("hide");
};
qr.getQuery = function () {
	var o = {};
	ko.mapping.toJS($('#textquery').tokenInput("get")).forEach(function (e) {
		o[e.key] = e.value;
	});
	return o;
};
qr.setQuery = function (queries) {
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
qr.validateQuery = function () {
	var queries = $('#textquery').tokenInput("get");
	if (queries.length == 0) {
		return true;
	}

	var isKeywordExists = Lazy(queries).where(function (e) {
		return (["select", "insert", "update", "delete", "command"].indexOf(e.key) > -1);
	}).toArray().length > 0;
	if (!isKeywordExists) {
		toastr["error"]("", "ERROR: " + 'Query must contains "select" / "insert" / "update" / "delete" / "command" !');
		return false;
	}

	var isFromExists = Lazy($('#textquery').tokenInput("get")).where(function (e) {
		return ["from", "command"].indexOf(e.key) > -1
	}).toArray().length > 0;
	if (!isFromExists) {
		toastr["error"]("", "ERROR: " + 'Query must contains "from" / "command" !');
		return false;
	}

	return true;
};
qr.clearQuery = function () { 
	$('#textquery').tokenInput("remove", { });
};
qr.addQueryOfWhere = function () {
	var o = $.extend(true, {}, qr.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	qr.queryOfWhere.push(m);
};
qr.removeQueryOfWhere = function (id, index) {
	return function () {
		// var o = qr.queryOfWhere()[index];
		// qr.queryOfWhere.remove(o);
		var a = qr.queryOfWhere.remove( function (item) { return item.id() == id; } );
		if (a.length == 0){
			for (var key in qr.queryOfWhere()){
				qr.removeSubQueryOfWhere(qr.queryOfWhere()[key], id);
			}
		}
	};
};
qr.removeSubQueryOfWhere = function(obj,id){
	for (var key in obj.subquery()){
		if (id == obj.subquery()[key].id()){
			obj.subquery.remove( function (item) { return item.id() == id; } );
		} else {
			qr.removeSubQueryOfWhere(obj.subquery()[key], id);
		}
	}
};
qr.saveQueryOfWhere = function () {
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
	
	var queryOfWhere = ko.mapping.toJS(qr.queryOfWhere());

	var o = { 
		id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
		key: "where",
		value: JSON.stringify(parseWhereOneByOne(queryOfWhere))
	};

	$('#textquery').tokenInput("remove", { key: "where" });
	$('#textquery').tokenInput("add", o);
	$(".modal-query-where").modal("hide");
};
qr.changeQueryOfWhere = function(datakey, idparent, chooseadd){
	var o = $.extend(true, {}, qr.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	for(var key in qr.queryOfWhere()){
		if (idparent == qr.queryOfWhere()[key].id()){
			if (datakey == "And" || datakey == "Or"){
				if (chooseadd != 'select'){
					m.parentsum(1);
					qr.queryOfWhere()[key].subquery.push(m);
				} else if (chooseadd == 'select' && qr.queryOfWhere()[key].subquery().length == 0){
					m.parentsum(1);
					qr.queryOfWhere()[key].subquery.push(m);
				}
				qr.queryOfWhere()[key].field('a');
				qr.queryOfWhere()[key].value('a');
			} else {
				qr.queryOfWhere()[key].field('');
				qr.queryOfWhere()[key].value('');
				if (qr.queryOfWhere()[key].subquery().length > 0)
					qr.queryOfWhere()[key].subquery([]);
			}
			break;
		} else if (idparent != qr.queryOfWhere()[key].id() && qr.queryOfWhere()[key].subquery().length > 0) {
			qr.parentSumWhere(1);
			qr.AddSubQuery(idparent, qr.queryOfWhere()[key], 1, chooseadd, datakey);
		}
	}
};
qr.AddSubQuery = function(idparent,obj, parentsum, chooseadd, datakey){
	var o = $.extend(true, {}, qr.templateQueryOfWhere);
	var m = ko.mapping.fromJS(o);
	m.id('wh' + moment(new Date()).format("YYYMMDDHHmmssSSS"));
	qr.parentSumWhere(qr.parentSumWhere() + 1);
	for(var key in obj.subquery()){
		if (idparent == obj.subquery()[key].id()){
			if (datakey == "And" || datakey == "Or"){
				if (chooseadd != 'select'){
					m.parentsum(qr.parentSumWhere());
					obj.subquery()[key].subquery.push(m);
				} else if (chooseadd == 'select' && obj.subquery()[key].subquery().length == 0){
					m.parentsum(qr.parentSumWhere());
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
			qr.AddSubQuery(idparent, obj.subquery()[key], parentsum, chooseadd, datakey);
		}
	}
}
qr.couldBeNumber = function (value) {
	if (!isNaN(value)) {
		if (String(value).indexOf(".") > -1) {
			return parseFloat(value);
		} else {
			return parseInt(value, 10);
		}
	}

	return value;
};
qr.createTextQuery = function () {
	$("#textquery").tokenInput(qr.dataCommand(), { 
		zindex: 700,
		noResultsText: "Add New Query",
		allowFreeTagging: true,
		placeholder: 'Input Type Here!!',
		tokenValue: 'id',
		propertyToSearch: 'key',
		theme: "facebook",
		onAdd: function (item) {
			qr.valueCommands.push(item);
		},
		onDelete: function (item) {
			var target = Lazy(qr.valueCommands()).find({ key: item.key });
			if (target != undefined) {
				qr.valueCommands.remove(target);
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
	qr.createTextQuery();
});