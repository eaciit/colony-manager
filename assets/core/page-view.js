app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;

pv.indexWidget = ko.observable("");

pv.templateConfigParam = {
    namespace: "",
    value: "",
    filter: "",
    fields: "",
};

pv.configParam = ko.mapping.toJS(pv.templateConfigParam);

pv.templateWidgetItem =  [
    '<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
            '<h5 class="title"></h5>',
            '<iframe width="100%" height="99%" marginheight="0" frameborder="0" scrolling="no" style="overflow: hidden;"></iframe>',
        '</div>',
    '</div>'
].join("");

pv.prepareGridStack = function () {
    $("#page-designer-grid-stack").gridstack({
        disableDrag: true,
        disableResize: true,
    });
};

pv.doRefresh = function(){
  ko.mapping.fromJS(pv.templateConfigParam);
  var data  = {};
   pv.mapWidgets(data);
};

pv.mapWidgets = function(data){

    app.miniloader(true);
    var $gridStack = $("#page-designer-grid-stack").data("gridstack");
    $gridStack.removeAll();
    $div = $('#frame');
    app.ajaxPost("/pagedesigner/pageview", {title: viewModel.pageID}, function(res){
        if(!app.isFine(res)){
            return;
        }
        var widgets = res.data.widgets;

        $(".title-widget").text(res.data.title);
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

                    
                    var confDatasource = res.data.WidgetPageData.dataSources;
                    var param2 = [];

                    $.each(confDatasource, function(namespace, value) {
                        pv.configParam.namespace = namespace;
                        pv.configParam.value = value;
                    });

                    if(data !== null){
                        if(pv.configParam.value == data.dataSources){
                            pv.configParam.filter = data.filter;
                            pv.configParam.fields = data.fields;
                        }
                    }else{
                        if ([undefined, null].indexOf(res.data.WidgetPageData.config.fields) == -1) {
                            var confFields = res.data.WidgetPageData.config.fields;
                            var fields = "";
                            $.each(confFields, function(i, result){
                                fields += result + ", ";
                            });
                            fields = fields.substr(0, fields.length-2);
                            pv.configParam.fields = fields;
                        }
                    }
                    
                    param2.push(pv.configParam);

                    app.ajaxPost("/page/loadwidgetpagedata", param2, function (res2) {
                        if (res2.data == null) {
                            res2.data = {};
                        }
                        ko.mapping.fromJS(pv.templateConfigParam);
                        res2.data.dataSources = d.dataSources;
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
        app.miniloader(false);
    });
}

$(function(){
    pv.prepareGridStack();
    pv.doRefresh();
});
