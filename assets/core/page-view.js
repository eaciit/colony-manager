app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;

pv.indexWidget = ko.observable("");
pv.templateWidgetItem =  [
    '<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
         '<h5></h5>',
         '<iframe class="itemsFrame" scrolling="no"  frameborder="0"></iframe>',
        '</div>',
    '</div>'
].join("");

pv.prepareGridStack = function () {
    $("#page-designer-grid-stack").gridstack({
    	disableDrag: true,
        disableResize: true,
    });
};

pv.mapWidgets = function(){
	var $gridStack = $("#page-designer-grid-stack").data("gridstack");
	$div = $('#frame');
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
	        $item.find("iframe").attr("id", d.widgetId);
	        app.ajaxPost("/page/loadwidgetindex", {ID: d._id, PageID: viewModel.pageID, WidgetID: d.widgetId}, function(res){
	        	if(!app.isFine(res)){
					return;
				}
				var widgetBaseURL = baseURL + "res-widget/" +d.widgetId+"/" ;
		        var page = res.data.IndexFile;
		        page = page.replace(/src\=\"/g, 'src="' + widgetBaseURL);
		        page = page.replace(/href\=\"/g, 'href="' + widgetBaseURL);

		        // $("#"+d.widgetId).off("load").on("load", function(){
		        //     window.frames[0].frameElement.contentWindow;
		        // });

				var container =  $("#"+d.widgetId)[0].contentWindow.document;
		        container.open();
       	 		container.write(page);
        		container.close();

	        });
	    });

	});
}

$(function(){
	pv.prepareGridStack();
	pv.mapWidgets();
});
