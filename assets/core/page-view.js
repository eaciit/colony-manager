app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;
pv.templateWidgetItem =  [
    '<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
         '<h5></h5>',
        '</div>',
    '</div>'
].join("");

pv.prepareGridStack = function () {
    $("#page-designer-grid-stack").gridstack();
};

pv.mapWidgets = function(){
	var $gridStack = $("#page-designer-grid-stack").data("gridstack");
	app.ajaxPost("/pagedesigner/pageview", {title: viewModel.pageID}, function(res){
		if(!app.isFine(res)){
			return;
		}
		var widgets = res.data.widgets;
		(widgets == null ? [] : widgets).forEach(function (d){
	        var $item = $(pv.templateWidgetItem);
	        $item.attr("data-id", d._id);
	        $item.data("id", d._id);
	        $item.data("widgetid", d.widgetId);
	        $item.find("h5").text(d.title);
	        $gridStack.addWidget($item, d.x, d.y, d.width, d.height);
	    });
	});
}

$(function(){
	pv.prepareGridStack();
	pv.mapWidgets();
});
