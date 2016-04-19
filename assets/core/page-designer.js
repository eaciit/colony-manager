app.section("pagedesigner");
viewModel.PageDesignerEditor = {}; var pde = viewModel.PageDesignerEditor;

pde.baseWidgets = ko.observableArray([]);
pde.templatePage = {
    _id: "",
};
pde.dsMappingConfig = {
    field: []
};
pde.dsMapping = ko.mapping.fromJS(pde.dsMappingConfig);
pde.configWidgetPage = ko.mapping.fromJS(viewModel.templateModels.WidgetPage);
pde.widgetCounter = ko.observable(1);
pde.templateWidgetItem =  [
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
            var grid = $("#page-designer-grid-stack").data("gridstack");
            grid.removeWidget($item[0]);
        } 
    });

    return false;
};

pde.settingWidget = function(o) {
    var $item = $(o).closest(".grid-stack-item");

    var param = {
        pageID: viewModel.pageID,
        widgetPageID: $item.data("id"),
        widgetID: $item.data("widgetid"),
    };

    app.ajaxPost("/pagedesigner/getwidgetsetting", param, function (res) {
        res.data.dataSources.forEach(function (d) {
            console.log(d);
        });
        console.log(res);
    });

    $(".modal-widgetsetting").modal({
        backdrop: 'static',
        keyboard: true
    });
}

// pde.afterAddWidget = function (items) {
//     var grid = $("#page-designer-grid-stack").data("gridstack");
//     if (typeof grid === "undefined") {
//         return;
//     }

//     var item = _.find(items, function (i) { return i.nodeType == 1 });
//     grid.addWidget(item);
//     ko.utils.domNodeDisposal.addDisposeCallback(item, function () {
//         grid.removeWidget(item);
//     });
// };

pde.prepareGridStack = function () {
    $("#page-designer-grid-stack").gridstack({
        float: true,
        // acceptWidgets: '.grid-stack-item',
        onDragDrop: function (event, ui) {
            pde.addThisWidget(ui.draggable);
        },
        // resizable: { autoHide: true, handles: 'se' }
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
    $sidebar.empty();
    pde.baseWidgets([]);

    app.ajaxPost("/widget/getwidget", { search: "" }, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        pde.baseWidgets(res.data);
        res.data.forEach(function (d) {
            var els = [
                '<div class="list-left grid-stack-item" onclick="pde.addThisWidget(this);">',
                    '<a href="#" class="not-active"></a>',
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

pde.addThisWidget = function (o) {
    var id = moment().format("YYYYMMDDHHmmssSSS");
    var widgetID = $(o).data("id");
    var title = "Widget " + pde.widgetCounter();

    var $item = $(pde.templateWidgetItem);
    $item.attr("data-id", id);
    $item.data("id", id);
    $item.data("widgetid", widgetID);
    $item.find("h5").text(title);

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
    ko.mapping.fromJS(widget, pde.configWidgetPage);
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
    app.ajaxPost("/pagedesigner/savepage", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        $(".modal-config").modal("hide");
    });
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

    ko.mapping.fromJS(config, p.configPage);
};
pde.save = function () {
    pde.setWidgetPosition();
    app.ajaxPost("/pagedesigner/savepage", p.configPage, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        swal({ title: "Saved", type: "success" });
    });
};
pde.mapWidgets = function () {
    var $gridStack = $("#page-designer-grid-stack").data("gridstack");
    var config = ko.mapping.toJS(p.configPage);

    (config.widgets == null ? [] : config.widgets).forEach(function (d) {
        var $item = $(pde.templateWidgetItem);
        $item.attr("data-id", d._id);
        $item.data("id", d._id);
        $item.data("widgetid", d.widgetId);
        $item.find("h5").text(d.title);

        $gridStack.addWidget($item, d.x, d.y, d.width, d.height);
    });
};
$(function () {
    pde.prepareDataSources(function () {
        pde.prepareWidget(function () {
            pde.preparePage(function () {
                pde.prepareGridStack();
                pde.mapWidgets();
            });
        });
    });
});