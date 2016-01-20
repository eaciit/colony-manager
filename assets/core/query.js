var tempDataCommand = [{key:"select", value:"field"},{key:"from", value:"table"}];
viewModel.query = {}; var qr = viewModel.query;
qr.command = ko.observable('');

qr.datacommands = ko.mapping.fromJS(tempDataCommand);

qr.changeActiveCommand = function(data){
	return function (self, e) {
		$(e.currentTarget).parent().siblings().removeClass("active"), $textarea = $("#textquery");
		qr.command(data.key());
		var regExp = /\(([^)]+)\)/, matches = regExp.exec($textarea.val());
		if (matches != undefined)
			$textarea.val($textarea.val() + "." + data.key() + "(" + data.value() + ")");
		else
			$textarea.val(data.key() + "(" + data.value() + ")");
	};
}