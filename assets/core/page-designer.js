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
pde.widgetCounter = ko.observable(1);

pde.preparePage = function () {
    app.ajaxPost("/pagedesigner/selectpage", { _id: viewModel.pageID }, function (res) {
        if (!app.isFine(res)) {
            return;
        }

        console.log(res);
    })
}

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
        // resizable: { autoHide: true, handles: 'se' }
    });
};

pde.prepareSidebarDraggable = function () {
    $('#sidebar .grid-stack-item:not(.ui-draggable)').draggable({
        revert: 'invalid',
        scroll: false,
        appendTo: 'body',
        helper: "clone",
    });
};

pde.prepareWidget = function () {
    var $sidebar = $("#sidebar");
    $sidebar.empty();
    pde.baseWidgets();

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
    });
};

pde.addThisWidget = function (o) {
    var els = [
        '<div class="grid-stack-item">',
            '<div class="grid-stack-item-content">',
                '<div class ="content-widget">',
                    '<div class="btn-action">',
                        '<a href="#" onclick="pde.settingWidget(this);" title="Setting" class="tooltipster"><span class="glyphicon glyphicon-cog"></span></a>',
                         '&nbsp;',
                         '<a href="#" onclick="pde.deleteWidget(this)" title="Remove" class="tooltipster"><span class="glyphicon glyphicon-trash"></span></a>',
                    '</div>',
                    '<h5></h5>',
                '</div>',
            '</div>',
        '</div>'
    ].join("");

    var $item = $(els);
    $item.data("id", moment().format("YYYYMMDDHHmmssSSS"));
    $item.data("pageid", viewModel.pageID);
    $item.data("widgetid", $(o).data("id"));
    $item.find("h5").text("Widget " + pde.widgetCounter());

    var $gridStack = $("#page-designer-grid-stack").data("gridstack");
    $gridStack.addWidget($item, 0, 0, 2, 2);

    pde.widgetCounter(pde.widgetCounter() + 1);
    app.prepareTooltipster($item.find(".tooltipster"));
};

pde.adjustIframe = function () {
    $("#formSetting").height($("#formSetting")[0].contentWindow.document.body.scrollHeight);
};
pde.showConfigPage = function () {
    console.log("asdfasdf");
};

$(function () {
    pde.preparePage();
    pde.prepareWidget();
    pde.prepareGridStack();
});