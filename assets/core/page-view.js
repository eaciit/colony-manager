app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;

pv.widgets = ko.observableArray([]);
pv.templateWidgetItem = [
	'<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
            '<div class="panel panel-default">',
                '<div class="panel-heading wg-panel">',
                    '<div class="pull-left">',
                        '<h5></h5>',
                    '</div>',
                    '<div class="pull-right">',
                        '<div class="nav">',
                            '<button class="btn btn-primary btn-xs tooltipster" onclick="pde.settingWidget(this);" title="Setting"><span class="glyphicon glyphicon-cog"></span></button>',
                            '&nbsp;',
                            '<button class="btn btn-danger btn-xs tooltipster" title="Remove" onclick="pde.deleteWidget(this)"><span class="glyphicon glyphicon-trash"></span></button>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="clearfix"></div>',
            '</div>',
        '</div>',
    '</div>'
].join("");

pv.getUrlView = function(){
	var title = $('#url').text()
	app.ajaxPost("/page/pageview", {title: title}, function(res){
		if(!app.isFine(res)){
			return;
		}
		var result = JSON.stringify(res.data);
		var dt = res.data.widgets;

		pv.createElement(dt);
		$('.grid-stack').gridstack();
	});
	
}

pv.createElement = function(data){
	$parent = $('#page-view-gridstack');
	$.each(data, function(i, items){
		$itemStack = $('<div class="grid-stack-item" style="background-color:black; color: white;" data-gs-x="'+items.x+'" data-gs-y="'+items.y+'" data-gs-width="'+items.width+'" data-gs-height="'+items.height+'"></div>');
		$itemConten = $('<div class="grid-stack-item-content">'+items.title+'</div>');
        $itemStack.appendTo($parent);
        $itemConten.appendTo($itemStack);
	});

}


$(function(){
	pv.getUrlView();
})