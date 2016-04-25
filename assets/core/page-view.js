app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;

pv.indexWidget = ko.observable("");
pv.templateWidgetItem =  [
    '<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
         '<h5 class="title label label-primary"></h5>',
         	'<iframe class="itemsFrame" width="100%" scrolling="no" frameborder="0"></iframe>',
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
		(widgets == null ? [] : widgets).forEach(function (d) {
	        var $item = $(pv.templateWidgetItem);
	        $item.attr("data-id", d._id);
	        $item.data("id", d._id);
	        $item.data("widget-id", d.widgetId);
	        $item.find("h5").text(d.title);
	        $gridStack.addWidget($item, d.x, d.y, d.width, d.height);

            var param = {
                _id: d._id,
                pageID: viewModel.pageID,
                widgetID: d.widgetId
            };

	        app.ajaxPost("/page/loadwidgetpagecontent", param, function (res) {
	        	if (!app.isFine(res)) {
					return;
				}

				var widgetBaseURL = baseURL + "res-widget/" +d.widgetId+"/" ;
		        var page = res.data.Content;
		        page = page.replace(/src\=\"/g, 'src="' + widgetBaseURL);
		        page = page.replace(/href\=\"/g, 'href="' + widgetBaseURL);

                var $iFrame = $("[data-id='" + d._id + "'] iframe");
                var iWindow = $iFrame[0].contentWindow;

		        $iFrame.off("load").on("load", function () {

                    iWindow.window.Render(
                        { dsChart: [] },
                        res.data.WidgetPageData.config,
                        res.data.WidgetData.config
                    );

                    $(this).height( $(this).contents().find("body").height());

                    app.ajaxPost("/page/loadwidgetpagedata", res.data.WidgetPageData.dataSources, function (res2) {
                        // if (!app.isFine(res)) {
                        //     return;
                        // }

                        if (res2.data == null) {
                            res2.data = {};
                        }

                        iWindow.window.Render(
                            res2.data,
                            res.data.WidgetPageData.config,
                            res.data.WidgetData.config
                        );
                    });
		        });

				var container =  iWindow.document;
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
