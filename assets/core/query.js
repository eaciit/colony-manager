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
qr.dataWhereOfOrder = ko.observableArray([
	{ value: "asc", title: "Ascending" },
	{ value: "desc", title: "Descending" },
]);
qr.templateQueryOfInsert = { field: "", value: "" };
qr.templateQueryOfOrder = { field: "", direction: "" };
qr.queryBuilderMode = ko.observable('');
qr.valueCommands = ko.observableArray([]);
qr.queryOfSelect = ko.observableArray([]);
qr.queryOfInsert = ko.observableArray([]);
qr.queryOfFrom = ko.observable("");
qr.queryOfOrder = ko.mapping.fromJS(qr.templateQueryOfOrder);
qr.queryOfTake = ko.observable(0);

/*** TEMP !!!!! */
qr.valueCommand = ko.observableArray([]);
qr.command = ko.observable('');
qr.paramQuery = ko.observable('');
qr.chooseQuery = ko.observable('');
qr.selectQuery = ko.observable('');
qr.valueWhere = ko.observableArray([]);
qr.seqCommand = ko.observable(1);
qr.activeQuery = ko.observable();
qr.queryCancel = function () { };
qr.querySave = function () { };
qr.addQueryWhere = function () { };
qr.tempWhereQuery = [
	{key:"And", type:"Array Query", parm: "arrayQuery"},
	{key:"Or", type:"Array Query", parm: "arrayQuery"},
	{key:"Eq", type:"field,value", parm: "string"},
	{key:"Ne", type:"field,value", parm: "string"},
	{key:"Lt", type:"field,value", parm: "string"},
	{key:"Gt", type:"field,value", parm: "string"},
	{key:"Lte", type:"field,value", parm: "string"},
	{key:"Gte", type:"field,value", parm: "string"},
	{key:"In", type:"field, array string", parm: "arrayString"},
	{key:"Nin", type:"field, array string", parm: "arrayString"},
	{key:"Contains", type:"field, array string", parm: "arrayString"}
];
/*** temp */



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
			return "<li>" + item.key + "(" + item.value + ")</li>";
		}
	});
};

$(function () {
	qr.createTextQuery();
});