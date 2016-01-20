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

		$textarea.highlightTextarea("highlight")
	};
}

$(function () {
	var groupdbox = _.groupBy(tempDataCommand, function(value){
        return value.key;
    }), arrdbox = new Array();
    $.each(groupdbox, function( key, value ) {
		arrdbox.push(key);
	});
	$('#textquery').highlightTextarea({
			words: {
			color: '#ADF0FF',
			caseSensitive: false,
			words: arrdbox
		},
	});
});