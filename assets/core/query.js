viewModel.query = {}; var qr = viewModel.query;

qr.dataCommand = ko.observableArray([
	{ id: 0, key: "select", type: "field, field", value: ""},
	{ id: 0, key: "insert", type: "", value: ""},
	{ id: 0, key: "update", type: "", value: ""},
	{ id: 0, key: "delete", type: "", value: ""},
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
	// { key: "And", title: "And", type: "Array Query" },
	// { key: "Or", title: "Or", type: "Array Query" },
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
qr.templateWhereOfOrder = {
	key: "",
	parm: "",
	field: "",
	value: "",
	subquery: [],
};

qr.queryBuilderMode = ko.observable('');
qr.valueCommands = ko.observableArray([]);
qr.queryOfSelect = ko.observableArray([]);
qr.queryOfInsert = ko.observableArray([]);
qr.queryOfFrom = ko.observable("");
qr.queryOfOrder = ko.mapping.fromJS(qr.templateQueryOfOrder);
qr.queryOfTake = ko.observable(0);
qr.queryOfWhere = ko.observableArray([]);

qr.addQueryOfInsert = function () {
	var o = $.extend(true, {}, qr.templateQueryOfInsert);
	qr.queryOfInsert.push(o);
};
qr.removeQueryOfInsert = function (index) {
	return function () {
		var o = qr.queryOfInsert()[index];
		qr.queryOfInsert.remove(o);
	};
};
qr.addFilter = function (filter) {
	return function () {
		qr.queryBuilderMode(filter.key);

		if (["select", "insert", "update", "delete"].indexOf(filter.key) > -1) {
			var keywords = Lazy($('#textquery').tokenInput("get")).where(function (e) {
				return (["select", "insert", "update", "delete"].indexOf(e.key) > -1);
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
			qr.queryOfInsert.push(row);
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
			$(".modal-query").modal("show");
		}

		if (filter.key == "order") {
			ko.mapping.fromJS(qr.templateQueryOfOrder, qr.queryOfOrder);
			$(".modal-query").modal("show");
		}

		if (filter.key == "take" || filter.key == "skip") {
			qr.queryOfTake(0);
			$(".modal-query").modal("show");
		}

		if (filter.key == "where") {
			qr.queryOfWhere([]);
			qr.addQueryOfWhere();
			$(".modal-query-where").modal("show");
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
		var data = {};
		Lazy(qr.queryOfInsert()).where(function (e) {
			return $.trim(e.field) != "" && $.trim(e.value) != "";
		}).each(function (e) {
			data[e.field] = e.value;
		});
		o.value = JSON.stringify(data).replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');

		if (!data.hasOwnProperty("_id")) {
			toastr["error"]("", 'There must be field called "_id"');
			return;
		}
	}

	if (qr.queryBuilderMode() == "from") {
		o.value = qr.queryOfFrom();
		ds.fetchDataSourceMetaData(o.value);
	}

	if (qr.queryBuilderMode() == "order") {
		if ($.trim(qr.queryOfOrder.field()) == '') {
			toastr["error"]("", 'Order field cannot be empty');
			return
		}

		if ($.trim(qr.queryOfOrder.direction()) == '') {
			toastr["error"]("", 'Order direction cannot be empty');
			return
		}

		o.value = [qr.queryOfOrder.field(), qr.queryOfOrder.direction()].join(",");
	}

	if (qr.queryBuilderMode() == "take" || qr.queryBuilderMode() == "skip") {
		o.value = parseInt(qr.queryOfTake(), 10);
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
	var isKeywordExists = Lazy($('#textquery').tokenInput("get")).where(function (e) {
		return (["select", "insert", "update", "delete"].indexOf(e.key) > -1);
	}).toArray().length > 0;
	if (!isKeywordExists) {
		toastr["error"]("", "ERROR: " + 'Query must contains "select" / "insert" / "update" / "delete" !');
		return false;
	}

	var isFromExists = Lazy($('#textquery').tokenInput("get")).where({ key: "from" }).toArray().length > 0;
	if (!isFromExists) {
		toastr["error"]("", "ERROR: " + 'Query must contains "from" !');
		return false;
	}

	return true;
};
qr.clearQuery = function () { 
	$('#textquery').tokenInput("remove", { });
};
qr.addQueryOfWhere = function () {
	var o = $.extend(true, {}, qr.templateWhereOfOrder);
	var m = ko.mapping.fromJS(o);
	qr.queryOfWhere.push(m);
};
qr.removeQueryOfWhere = function (index) {
	return function () {
		var o = qr.queryOfWhere()[index];
		qr.queryOfWhere.remove(o);
	};
};
qr.saveQueryOfWhere = function () {
	var o = { 
		id: 'q' + moment(new Date()).format("YYYMMDDHHmmssSSS"),
		key: "where",
		value: Lazy(ko.mapping.toJS(qr.queryOfWhere())).where(function (e) {
			return e.field != "" && e.key != "";
		}).toArray()
	};

	$('#textquery').tokenInput("remove", { key: "where" });
	$('#textquery').tokenInput("add", o);
	$(".modal-query-where").modal("hide");
};
qr.changeQueryOfWhere = function(e){
	// var dataItem = this.dataItem(e.item), indexlist = $(this.element).closest(".list-where").index();
	// qr.valueWhere()[indexlist].parm(dataItem.parm);
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
			// console.log("=====", item);
			 // Object {id: "q1620160125200018702", key: "select", value: "_id,name,age", label: "_id,name,age"}
			// qr.queryAdd(item);
			// qr.chooseQuery("");
			// qr.selectQuery("");
		},
		onDelete: function (item) {
			var target = Lazy(qr.valueCommands()).find({ key: item.key });
			if (target != undefined) {
				qr.valueCommands.remove(target);
			}
		},
		// resultsFormatter: function(item){
		// 	return "<li>"+item.key +"(" + item.type +")</li>";
		// },
		tokenFormatter: function (item) {
			var text = item.value;
			if (item.key == "where") {
				text = item.value.map(function (e) {
				    var o = {};
				    var v = {};
				    v[e.field] = e.value;
				    o[e.key] = v;

				    return JSON.stringify(o);
				});
			}

			return "<li>" + item.key + "(" + text + ")</li>";
		}
	});
};

$(function () {
	qr.createTextQuery();
});