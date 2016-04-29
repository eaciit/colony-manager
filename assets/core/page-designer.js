app.section("pagedesigner");
viewModel.PageDesignerEditor = {}; var pde = viewModel.PageDesignerEditor;

pde.baseWidgets = ko.observableArray([]);
pde.dsMappingConfig = {
    field: []
};
pde.templateWidgetPageDataSource = {
    namespace: "",
    dataSource: "",
};
pde.isDataSourceChanged = ko.observable(false);
pde.check = ko.observable(false);
pde.dataSourceArray = ko.observableArray([]);
pde.dsMapping = ko.mapping.fromJS(pde.dsMappingConfig);
pde.configWidgetPage = ko.mapping.fromJS(viewModel.templateModels.WidgetPage);
pde.configWidgetPageDataSources = ko.observableArray([]);
pde.widgetCounter = ko.observable(1);
pde.templateWidgetItem =  [
    '<div class="grid-stack-item">',
        '<div class="grid-stack-item-content">',
            '<div class="panel panel-default">',
                '<div class="widget-info">',
                    '<img src="/res/img/icon_grid.png" />',
                    '<div class="widget-info-id"></div>',
                    '<div class="widget-info-widgetid"></div>',
                '</div>',
                '<div class="nav">',
                    '<button class="btn btn-primary btn-xs tooltipster" onclick="pde.settingWidget(this);" title="Setting"><span class="glyphicon glyphicon-cog"></span></button>',
                    '&nbsp;',
                    '<button class="btn btn-danger btn-xs tooltipster" title="Remove" onclick="pde.deleteWidget(this)"><span class="glyphicon glyphicon-trash"></span></button>',
                '</div>',
            '</div>',
        '</div>',
    '</div>'
].join("");
pde.widgetPositions = ko.observableArray([
    {value: "Relative", text: "Relative"},
    {value: "fixed", text: "Fixed"}
]);
pde.allDataSources = ko.observableArray([]);
pde.preparePage = function (callback) {
    app.ajaxPost("/pagedesigner/selectpage", { _id: viewModel.pageID }, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        ko.mapping.fromJS(res.data.pageDetail, p.configPage);
        callback();
    });
};

pde.deleteWidget = function (o) {
    var $item = $(o).closest(".grid-stack-item");

    swal({
        title: "Are you sure?",
        text: "You will delete this widget",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: true,
        closeOnCancel: true
    }, function (isConfirm) {
        if (isConfirm) {
            var config = ko.mapping.toJS(p.configPage);
            var widget = Lazy(config.widgets).find({ _id: $item.data("id") });
            if (typeof widget === "undefined") {
                return;
            }

            config.widgets.splice(config.widgets.indexOf(widget), 1);
            ko.mapping.fromJS(config, p.configPage);

            var grid = $("#page-designer-grid-stack").data("gridstack");
            grid.removeWidget($item[0]);
        }
    });

    return false;
};

pde.settingWidget = function(o) {
    var $item = $(o).closest(".grid-stack-item");
    var id = $item.data("id");
    var widgetID = $item.data("widgetid");

    var config = ko.mapping.toJS(p.configPage);
    var widget = Lazy(config.widgets).find({ _id: id });

    if (typeof widget === "undefined") {
        return;
    }

    ko.mapping.fromJS(widget, pde.configWidgetPage);

    pde.configWidgetPageDataSources([]);
    app.ajaxPost("/widget/getconfigwidgetjson", { _id: widgetID }, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        res.data.dataSources.forEach(function (d) {
            var each = $.extend(true, {}, pde.templateWidgetPageDataSource);
            each.namespace = ko.observable(d);
            each.dataSource = ko.observable("");

            if (widget.dataSources.hasOwnProperty(d)) {
                each.dataSource(widget.dataSources[d]);
            }

            pde.configWidgetPageDataSources.push(each);
        });

        if (!pde.isDataSourcesInvalid()) {
            pde.isDataSourceChanged(false);
        }
    }, function () {
        if (!pde.isDataSourcesInvalid()) {
            pde.isDataSourceChanged(false);
        }
    });

    $(".modal-widgetsetting").modal("show");
    $('a[data-target="#DataSource"]').tab('show');
    pde.check(true);
};

pde.prepareGridStack = function () {
    $("#page-designer-grid-stack").gridstack({
        float: true,
        // acceptWidgets: '.grid-stack-item',
        onDragDrop: function (event, ui) {
            pde.addThisWidget(ui.draggable);
        }
    });
};
pde.prepareSidebarDraggable = function () {
    $('#sidebar .grid-stack-item:not(.ui-draggable)').draggable({
        // revert: 'invalid',
        scroll: false,
        appendTo: $(".grid-stack"),
        helper: "clone"
    });
};
pde.prepareWidget = function (callback) {
    var $sidebar = $("#sidebar");
    $sidebar.find(":not(h1)").remove();
    pde.baseWidgets([]);

    app.ajaxPost("/widget/getwidget", { search: "" }, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        pde.baseWidgets(res.data);
        res.data.forEach(function (d) {
            var els = [
                '<div class="list-left grid-stack-item" onclick="pde.addThisWidget(this);">',
                    '<a href="#"></a>',
                '</div>'
            ].join("");

            var $each = $(els).appendTo($sidebar);
            $each.data("id", d._id);
            $each.find("a").html(d.title);
        });

        // pde.prepareSidebarDraggable();
        callback();
    });
};
pde.randomString =  function(){
    var length = 10
    var result = '';
    var chars  = "abcdefghijklmnopqrstuvwxyz123456789"
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

pde.addThisWidget = function (o) {
    var id = "wp-" + pde.randomString();
    var widgetID = $(o).data("id");
    var title = widgetID
    var widgetTitle = (function () {
        var widgetRow = Lazy(pde.baseWidgets()).find({ _id: widgetID });
        return (widgetRow == undefined) ? widgetID : widgetRow.title;
    }());

    var $item = $(pde.templateWidgetItem);
    $item.attr("data-id", id);
    $item.data("id", id);
    $item.data("widgetid", widgetID);
    $item.find(".widget-info-id").text(id);
    $item.find(".widget-info-widgetid").text(widgetTitle);

    var node = $(o).data('_gridstack_node');
    var nan = function (x, y) { return (typeof node === "undefined") ? y : (isNaN(node[x]) ? y : node[x]); };

    var $gridStack = $("#page-designer-grid-stack").data("gridstack");
    $gridStack.addWidget($item, nan("x", 0), nan("y", 0), nan("width", 2), nan("height", 2));

    pde.widgetCounter(pde.widgetCounter() + 1);
    app.prepareTooltipster($item.find(".tooltipster"));

    var widget = {
        _id: id,
        widgetId: widgetID,
        title: title,
        position: pde.widgetPositions()[0].value,
        x: nan("x", 0),
        y: nan("y", 0),
        height: nan("height", 2),
        width: nan("width", 2),
        dataSources: {},
        config: {}
    };

    var config = ko.mapping.toJS(p.configPage);
    config.widgets = (config.widgets == null) ? [] : config.widgets;
    config.widgets.push(widget);

    ko.mapping.fromJS(config, p.configPage);
};
pde.adjustIframe = function () {
    $("#formSetting").height($("#formSetting")[0].contentWindow.document.body.scrollHeight);
};
pde.showConfigPage = function () {
    $(".modal-config").modal("show");
};
pde.prepareDataSources = function (callback) {
    app.ajaxPost("/datasource/getdatasources", { search: "" }, function (res) {
        if (!app.isFine(res)) {
            location.href = "/web/pages";
            return;
        }

        pde.allDataSources(res.data);
        callback();
    });
};
pde.savePage = function () {
    if (!app.isFormValid(".form-widget-designer")) {
        return;
    }
    var param = ko.mapping.toJS(p.configPage);
    param.styleSheet = $("#dragandrophandler").data('CodeMirrorInstance').getValue();
    app.ajaxPost("/pagedesigner/savepage", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        $(".modal-config").modal("hide");
    });
    ko.mapping.fromJS(param,p.configPage)
};
pde.preview = function () {
    location.href = "/page/" + p.configPage._id();
};
pde.setWidgetPosition = function () {
    var config = ko.mapping.toJS(p.configPage);
    config.widgets = config.widgets.map(function (d) {
        var $el = $(".grid-stack-item[data-id='" + d._id + "']");

        ["x", "y", "width", "height"].forEach(function (p) {
            d[p] = parseInt($el.attr("data-gs-" + p), 10);
        });

        return d;
    });
    ko.mapping.fromJS(config,p.configPage);
};

pde.changeAttr = function (){
    ko.mapping.toJS(p.configPage.widgets).forEach(function(d){
        var $el = $(".grid-stack-item[data-id='" + d._id + "']");
            $el.attr("data-gs-x",d.x);
            $el.attr("data-gs-y",d.y);
            $el.attr("data-gs-width",d.width);
            $el.attr("data-gs-height",d.height);
    })
}

pde.save = function () {
    if (pde.check() == true ){
        pde.changeAttr();
        pde.check(false);    
    }
    pde.setWidgetPosition();
    app.ajaxPost("/pagedesigner/savepage", p.configPage, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        if ($(".modal-widgetsetting").is(":visible")) {
            $(".modal-widgetsetting").modal("hide");
        } else {
            swal({ title: "Saved", type: "success" });
        }
    });
    location.reload();
};

pde.mapWidgets = function () {
    var $gridStack = $("#page-designer-grid-stack").data("gridstack");
    var config = ko.mapping.toJS(p.configPage);

    (config.widgets == null ? [] : config.widgets).forEach(function (d) {
        var widget = (function () {
            var widgetRow = Lazy(pde.baseWidgets()).find({ _id: d.widgetId });
            return (widgetRow == undefined) ? d.widgetId : widgetRow.title;
        }());

        var $item = $(pde.templateWidgetItem);
        $item.attr("data-id", d._id);
        $item.data("id", d._id);
        $item.data("widgetid", d.widgetId);
        $item.find(".widget-info-id").text(d._id);
        $item.find(".widget-info-widgetid").text(widget);

        $gridStack.addWidget($item, d.x, d.y, d.width, d.height);
        pde.widgetCounter(pde.widgetCounter() + 1);
    });
};
pde.isDataSourcesInvalid = ko.computed(function () {
    return Lazy(pde.configWidgetPageDataSources()).filter(function (d) {
        return d.dataSource() != "";
    }).toArray().length != pde.configWidgetPageDataSources().length;
}, pde);
pde.changeDataSource = function (namespace) {
    return function () {
        pde.isDataSourceChanged(true);
    };
};
pde.saveWidgetConfig = function () {
    if (pde.isDataSourceChanged()) {
        sweetAlert("Oops...", "You just change the datasource! Please update config on widget setting tab also", "error");
        return;
    }

    var widgetDataSources = ko.mapping.toJS(pde.configWidgetPageDataSources);
    var config = ko.mapping.toJS(p.configPage);
    var configWidget = ko.mapping.toJS(pde.configWidgetPage);
    configWidget.dataSources = (function () {
        var res = {};
        widgetDataSources.forEach(function (d) {
            res[d.namespace] = d.dataSource;
        });
        return res;
    }());
    configWidget.config = (function () {
        try {
            var iWindow = $("#formSetting")[0].contentWindow;
            return iWindow.window.GetFormData();
        } catch (err) {
            return configWidget.config;
        }
    }());

    widgetDataSources.forEach(function (d) {
        if (d.dataSource == null || d.dataSource == "") {
            return;
        }

        configWidget.dataSources[d.namespace] = d.dataSource;
    });

    var configWidgetIndex = (function () {
        var configWidgetIdentical = Lazy(config.widgets).find({ _id: configWidget._id });
        return config.widgets.indexOf(configWidgetIdentical);
    }());

    config.widgets[configWidgetIndex] = configWidget;

    ko.mapping.fromJS(config, p.configPage);

    pde.save();
};
pde.openWidgetSetting = function() {
    pde.isDataSourceChanged(false);

    var configWidgetPage = ko.mapping.toJS(pde.configWidgetPage);
    var widgetDataSourcesMap = ko.mapping.toJS(pde.configWidgetPageDataSources);
    var dsMap = (function () {
        var res = {};

        widgetDataSourcesMap.forEach(function (d) {
            res[d.namespace] = d.dataSource;
        });

        return res;
    }());
    var param = {
        widgetId: configWidgetPage.widgetId,
        dataSource: dsMap
    };
    var hasConfigWidget = (function () {
        if ([null, undefined].indexOf(configWidgetPage.config) > -1) {
            return false;
        }

        var i = 0;
        for (var key in configWidgetPage.config) {
            if (configWidgetPage.config.hasOwnProperty(key)) {
                i++;
            }
        }

        if (i == 0) {
            return false;
        }

        return true;
    }());

    app.ajaxPost("/pagedesigner/getwidgetpageconfig", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        var dsMap = res.data.dataSourceFieldsMap;
        var widgetBaseURL = baseURL + "res-widget" + res.data.widgetBasePath;
        var html = res.data.container;
        html = html.replace(/src\=\"/g, 'src="' + widgetBaseURL);
        html = html.replace(/href\=\"/g, 'href="' + widgetBaseURL);

        for (var key in dsMap) {
            if (dsMap.hasOwnProperty(key)) {
                dsMap[key].fields = ([null, undefined].indexOf(dsMap[key].fields) > -1) ? [] : dsMap[key].fields;
            }
        }

        var iWindow = $("#formSetting")[0].contentWindow;

        $("#formSetting").off("load").on("load", function () {
            var widgetData = hasConfigWidget ? configWidgetPage.config : null;
            iWindow.window.SetFormData(dsMap, widgetData);

            var shouldHeight = iWindow.document.getElementById("page-container").scrollHeight;
            iWindow.document.getElementById("widgetSettingForm").style.height = parseInt(shouldHeight) + "px";
        });

        var contentDoc = iWindow.document;
        contentDoc.open();
        contentDoc.write(html);
        contentDoc.close();
    });
}
pde.prepareDragfile = function(){
    var selector = $("#dragandrophandler");
    selector.on('drop', function (e) 
    {
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;
        pde.uploadStyleFile("onDrag",files)
    });
}

pde.codemirror = function (){

    var editor = CodeMirror.fromTextArea(document.getElementById("dragandrophandler"), {
        mode: "text/html",
        styleActiveLine: true,
        lineWrapping: true,
        lineNumbers: true,
    });
    editor.setValue(ko.mapping.toJS(p.configPage.styleSheet));
    $('.CodeMirror-gutter-wrapper').css({'left':'-40px'});
    $('.CodeMirror-sizer').css({'margin-left': '30px', 'margin-bottom': '-15px', 'border-right-width': '10px', 'min-height': '863px', 'padding-right': '10px', 'padding-bottom': '0px'});
    var data = $('#dragandrophandler').data('CodeMirrorInstance', editor);
}

pde.uploadStyleFile = function(mode,files){
    var config = ko.mapping.toJS(p.configPage)
    var formData = new FormData();
    var file;

    if (mode == "onChange"){
        if ($('#file').val() == ""){
            return;
        }
        file = $('input[type=file]')[0].files[0];
        $('input[type=file]')[0].value = "";
    }else{
        file = files[0]   
    }
    formData.append("file", file)
    app.ajaxPost("/pagedesigner/readfilestyle", formData,  function (res) {
        if (!app.isFine(res)) {
            return;
        }     
        $("#dragandrophandler").data('CodeMirrorInstance').setValue(res.data)
        
    });
    
}

$(function () {
    pde.prepareDataSources(function () {
        pde.prepareWidget(function () {
            pde.preparePage(function () {
                pde.prepareGridStack();
                pde.mapWidgets();
                pde.codemirror();
            });
        });
    });
    
});


