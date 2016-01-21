var tempDataCommand = [
	{id:0,key:"select", type:"string", value: ""},
	{id:0,key:"from", type:"string", value:""},
	{id:0,key:"take", type:"number", value:""},
	{id:0,key:"skip", type:"number", value:""},
	{id:0,key:"where", type:"string", value:""},
	{id:0,key:"order", type:"string", value:""},
	{id:0,key:"update", type:"", value:""},
	{id:0,key:"delete", type:"", value:""},
	{id:0,key:"save", type:"", value:""},
	{id:0,key:"insert", type:"", value:""}
];
viewModel.query = {}; var qr = viewModel.query;
qr.command = ko.observable('');
qr.valueCommand = ko.observableArray([]);
qr.seqCommand = ko.observable(1);

qr.datacommands = ko.mapping.fromJS(tempDataCommand);

qr.changeActiveCommand = function(data){
	return function (self, e) {
		$(e.currentTarget).parent().siblings().removeClass("active"), $textarea = $("#textquery");
		qr.command(data.id());
		if (data.type() != ""){
			modal({
				type: 'prompt',
				title: 'Query',
				text: 'Type your query:',
				callback: function(result) {
					if (result){
						var dataselect = ko.mapping.toJS(data);
						dataselect.value = result;
						dataselect.id = qr.seqCommand();
						$('#textquery').tokenInput("add", dataselect);
					}
				}
			});
		} else {
			var dataselect = ko.mapping.toJS(data);
			dataselect.id = qr.seqCommand();
			$('#textquery').tokenInput("add", dataselect);
		}
	};
}
qr.queryAdd = function(item){
	var dataquery = {
		id: item.id,
		key: item.key,
		value: item.value,
	}
	qr.valueCommand.push(dataquery);
	qr.seqCommand(qr.seqCommand()+1);
}
qr.queryDelete = function(item){
	qr.valueCommand.remove( function (res) { return res.id === item.id; } )
}

function createTextQuery(){
	$("#textquery").tokenInput(tempDataCommand, { 
		zindex: 700,
		noResultsText: "Add New Query",
		allowFreeTagging: true,
		placeholder: 'Input Type Here!!',
		tokenValue: 'id',
		propertyToSearch: 'key',
		theme: "facebook",
		onAdd: function (item) {
			qr.queryAdd(item);
		},
		onDelete: function(item){
			qr.queryDelete(item);
		},
		resultsFormatter: function(item){
			return "<li>"+item.key +"(" + item.parm +")</li>";
		},
		tokenFormatter: function(item){
			return "<li>"+item.key +"(" + item.value +")</li>";
		}
	});
	$(".area-command").find('ul.token-input-list-facebook').css('width', '100%');
}

$(function () {
	createTextQuery();
});