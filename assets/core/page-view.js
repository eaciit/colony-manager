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
	app.ajaxPost("/pagedesigner/pageview", {title: title}, function(res){
		if(!app.isFine(res)){
			return;
		}
		var result = JSON.stringify(res.data);
		var dt = res.data.widgets;

		// $.each(dt, function(i, items){
		// 	pv.widgets.push({'x': items.x, 'y': items.y, 'width': items.width, 'height': items.height})
		// });
		pv.createElement(dt);
		$('.grid-stack').gridstack();
		//document.getElementById("show").innerHTML = result;
		 
	});
	
}

pv.createElement = function(data){
	$parent = $('#page-view-gridstack');
	$.each(data, function(i, items){
		// console.log(items.x);
		//<div class="grid-stack-item" style="background-color:blue;" data-gs-x="0" data-gs-y="0" data-gs-width="4" data-gs-height="2">
		$itemStack = $('<div class="grid-stack-item" style="background-color:black; color: white;" data-gs-x="'+items.x+'" data-gs-y="'+items.y+'" data-gs-width="'+items.width+'" data-gs-height="'+items.height+'"></div>');
		$itemConten = $('<div class="grid-stack-item-content">'+items.title+'</div>');
        $itemStack.appendTo($parent);
        $itemConten.appendTo($itemStack);
	});

}

// pv.previewDesain = function(){
// 	$('#	').gridstack();
// }


$(function(){
	pv.getUrlView();
	//pv.previewDesain();
})