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
qr.valueCommand = ko.observableArray([]);
qr.valueWhere = ko.observableArray([]);
qr.seqCommand = ko.observable(1);
qr.activeQuery = ko.observable();

qr.datacommands = ko.mapping.fromJS(qr.tempDataCommand);
qr.datawhere = ko.mapping.fromJS(qr.tempWhereQuery);
qr.wherequery = ko.mapping.fromJS(qr.templateWhere);

qr.changeActiveCommand = function(data){
	return function (self, e) {
		$(e.currentTarget).parent().siblings().removeClass("active"), $textarea = $("#textquery");
		qr.command(data.id());
		qr.paramQuery("");
		if (data.type() != "" && data.key() != "where"){
			$(".modal-query").modal("show");
			qr.chooseQuery("Show");
			qr.activeQuery(ko.mapping.toJS(data));
			// modal({
			// 	type: 'prompt',
			// 	title: 'Query',
			// 	text: 'Type your query:',
			// 	callback: function(result) {
			// 		if (result){
			// 			var dataselect = ko.mapping.toJS(data);
			// 			dataselect.value = result;
			// 			dataselect.id = qr.seqCommand();
			// 			$('#textquery').tokenInput("add", dataselect);
			// 		}
			// 	}
			// });
		} else if (data.key() == "where"){
			$(".modal-query-where").modal("show");
			qr.chooseQuery("Show");
		} else {
			var dataselect = ko.mapping.toJS(data);
			dataselect.id = qr.seqCommand();
			qr.chooseQuery("Hide");
			$('#textquery').tokenInput("add", dataselect);
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
}
qr.queryDelete = function(item){
	qr.valueCommand.remove( function (res) { return res.id === item.id; } )
}
qr.queryPressEnterSave = function(){
	if(event.keyCode==13){
		  $(".btn.btn-primary.save").trigger("click");
		}
	
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