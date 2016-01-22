viewModel.query = {}; var qr = viewModel.query;
qr.tempDataCommand = [
	{id:0,key:"select", type:"field, field", value: ""},
	{id:0,key:"from", type:"table", value:""},
	{id:0,key:"take", type:"number", value:""},
	{id:0,key:"skip", type:"number", value:""},
	{id:0,key:"where", type:"string", value:""},
	{id:0,key:"order", type:"string", value:""},
	{id:0,key:"update", type:"", value:""},
	{id:0,key:"delete", type:"", value:""},
	{id:0,key:"save", type:"", value:""},
	{id:0,key:"insert", type:"", value:""}
];
qr.tempWhereQuery = [
	{key:"And", type:"Array Query"},
	{key:"Or", type:"Array Query"},
	{key:"Eq", type:"field,value"},
	{key:"Ne", type:"field,value"},
	{key:"Lt", type:"field,value"},
	{key:"Gt", type:"field,value"},
	{key:"Lte", type:"field,value"},
	{key:"Gte", type:"field,value"},
];
qr.templateWhere = {
	key: "",
	value: "",
	subquery: [],
}
qr.command = ko.observable('');
qr.paramQuery = ko.observable('');
qr.chooseQuery = ko.observable('');
qr.selectQuery = ko.observable('');
qr.valueCommand = ko.observableArray([]);
qr.valueWhere = ko.observableArray([]);
qr.seqCommand = ko.observable(1);
qr.activeQuery = ko.observable();

qr.datacommands = ko.mapping.fromJS(qr.tempDataCommand);
qr.datawhere = ko.mapping.fromJS(qr.tempWhereQuery);
qr.wherequery = ko.mapping.fromJS(qr.templateWhere);

qr.changeActiveCommand = function(data){
	return function (self, e) {
		if (qr.checkValidationQuery(data.key())){
			$(e.currentTarget).parent().siblings().removeClass("active"), $textarea = $("#textquery");
			qr.command(data.id());
			qr.paramQuery("");
			qr.selectQuery("List");
			if (data.type() != "" && data.key() != "where"){
				$(".modal-query").modal("show");
				qr.chooseQuery("Show");
				qr.activeQuery(ko.mapping.toJS(data));
			} else if (data.key() == "where"){
				$(".modal-query-where").modal("show");
				qr.chooseQuery("Show");
			} else {
				var dataselect = ko.mapping.toJS(data);
				dataselect.id = qr.seqCommand();
				qr.chooseQuery("Hide");
				$('#textquery').tokenInput("add", dataselect);
			}
		} else {
			toastr["error"]("", "ERROR: " + "Query already create !!");
		}
	};
}
qr.queryAdd = function(item){
	qr.paramQuery("");
	var dataquery = {
		id: item.id,
		key: item.key,
		value: item.value,
	}
	if (qr.checkValidationQuery(item.key) == true || qr.selectQuery() != ""){
		if (item.type != "" && item.key != "where" && qr.chooseQuery() == ""){
			$('#textquery').tokenInput("remove", {id: 0});
			$(".modal-query").modal("show");
			qr.chooseQuery("Show");
			qr.activeQuery(item);
		} else if (item.key == "where" && qr.chooseQuery() == ""){
			$(".modal-query-where").modal("show");
			qr.chooseQuery("Show");
		} else if (item.type == ""){
			dataquery.id = qr.seqCommand();
			qr.valueCommand.push(dataquery);
			qr.seqCommand(qr.seqCommand()+1);
		} else {
			qr.valueCommand.push(dataquery);
			qr.seqCommand(qr.seqCommand()+1);
		}
	} else {
		$('#textquery').tokenInput("remove", {id: 0});
		toastr["error"]("", "ERROR: " + "Query already create !!");
	}
}
qr.queryDelete = function(item){
	qr.valueCommand.remove( function (res) { return res.id === item.id; } )
}
qr.querySave = function(){
	var dataselect = qr.activeQuery();
	dataselect.value = qr.paramQuery();
	dataselect.id = qr.seqCommand();
	$('#textquery').tokenInput("add", dataselect);
	$(".modal-query").modal("hide");
}
qr.queryCancel = function(){
	$('#textquery').tokenInput("remove", {id: 0});
}
qr.enterSave = function(e){
	if (e.keyCode == 13) {
		qr.paramQuery($("input.query-text").val());
        qr.querySave();
    }
    return true;
}
qr.updateQuery = function(){
	var maxid = 0;
	for (var key in qr.valueCommand()){
		var dataselect = ko.mapping.toJS(qr.valueCommand()[key]);
		var searchElem = ko.utils.arrayFilter(qr.tempDataCommand,function (item) {
            return item.key === dataselect.key;
        });
		dataselect["type"] = searchElem[0].type;
		qr.chooseQuery("Hide");
		$('#textquery').tokenInput("add", dataselect);
		if (qr.valueCommand().id > maxid)
			maxid = qr.valueCommand().id
	}
	qr.seqCommand(maxid+1);
}
qr.checkValidationQuery = function(key){
	var dataQuery = $('#textquery').tokenInput("get");
	var searchElem = ko.utils.arrayFilter(dataQuery,function (item) {
        return item.key === key;
    });
    if (searchElem.length > 0)
    	return false;
    else
    	return true;
}

function createTextQuery(){
	$("#textquery").tokenInput(qr.tempDataCommand, { 
		zindex: 700,
		noResultsText: "Add New Query",
		allowFreeTagging: true,
		placeholder: 'Input Type Here!!',
		tokenValue: 'id',
		propertyToSearch: 'key',
		theme: "facebook",
		onAdd: function (item) {
			qr.queryAdd(item);
			qr.chooseQuery("");
			qr.selectQuery("");
		},
		onDelete: function(item){
			qr.queryDelete(item);
		},
		resultsFormatter: function(item){
			return "<li>"+item.key +"(" + item.type +")</li>";
		},
		tokenFormatter: function(item){
			return "<li>"+item.key +"(" + item.value +")</li>";
		}
	});
}

$(function () {
	createTextQuery();
});