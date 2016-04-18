viewModel.PageDesignerEditor = {}; var pde = viewModel.PageDesignerEditor;

pde.widgets = ko.observableArray([
    {x: 0, y: 0, width: 2, height: 2},
    // {x: 2, y: 0, width: 4, height: 2},
    // {x: 6, y: 0, width: 2, height: 4},
    // {x: 1, y: 2, width: 4, height: 2}
]);
pde.addNewWidget = function () {
    pde.widgets.push({
        x: 0,
        y: 0,
        width: 4,
        height: 4,
        auto_position: true
    });

    return false;
};

pde.deleteWidget = function (item) {
     swal({
            title: "Are you sure?",
            text: "You will delete this widget",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            closeOnConfirm: true,
            closeOnCancel: true
          },
          function(isConfirm){
            if (isConfirm) {
                pde.widgets.remove(item);
            } 
          });
   
    return false;
};

pde.afterAddWidget = function (items) {
    var grid = $("#page-designer-grid-stack").data("gridstack");
    if (typeof grid === "undefined") {
        return;
    }

    var item = _.find(items, function (i) { return i.nodeType == 1 });
    grid.addWidget(item);
    ko.utils.domNodeDisposal.addDisposeCallback(item, function () {
        grid.removeWidget(item);
    });
};

// ko.components.register('widget-grid', {
//     viewModel: {
//         createViewModel: function (controller, componentInfo) {
//             var ViewModel = function (controller, componentInfo) {
//                 var grid = null;
//                 console.log(controller);
//                 console.log(this);
//                 // this.widgets = controller.widgetgrid.widgets;

//                 pde.afterAddWidget = function (items) {
//                     console.log("---", grid);
//                     if (grid == null) {
//                         console.log("===", componentInfo.element);
//                         grid = $(componentInfo.element).find('.grid-stack').gridstack({
//                             auto: false,
//                             acceptWidgets: '.grid-stack-item',
//                         }).data('gridstack');
//                     }

//                     var item = _.find(items, function (i) { return i.nodeType == 1 });
//                     grid.addWidget(item);
//                     ko.utils.domNodeDisposal.addDisposeCallback(item, function () {
//                         grid.removeWidget(item);
//                     });
//                 };
//             };
//             return new ViewModel(controller, componentInfo);
//         }
//     },
//     template:
//         [
//             '<div class="grid-stack" id="page-designer-grid-stack" data-bind="foreach: { data: pde.widgets, afterRender: pde.afterAddWidget }">',
//             '   <div class="grid-stack-item" data-bind="attr: {\'data-gs-x\': $data.x, \'data-gs-y\': $data.y, \'data-gs-width\': $data.width, \'data-gs-height\': $data.height, \'data-gs-auto-position\': $data.auto_position}">',
//             '       <div class="grid-stack-item-content">',
//             '            <div class="panel panel-default">',
//             '                <div class="panel-heading wg-panel clearfix">',
//             '                  <div class="pull-right">',
//             '                    <a href="#" class="btn btn-default btn-xs tooltipster" data-bind="click: function(e) {pde.widgetSetting(\'wp1459947140191\', \'modal\')}" title="Setting"><span class="glyphicon glyphicon-cog"></span></a>',
//             '                    <a href="#" class="btn btn-danger btn-xs tooltipster" title="Remove" data-bind="click: pde.deleteWidget"><span class="glyphicon glyphicon-trash"></span></a>',
//             '                  </div>',
//             '               </div>',
//             '            </div>',
//             '       </div>',
//             '   </div>',
//             '</div> '
//         ].join('')
// });

$(function () {
    $("#page-designer-grid-stack").gridstack({
        auto: false,
        acceptWidgets: '.grid-stack-item',
    })
	// var options = {
 //        width: 12,
 //        float: false,
 //        removable: false,
 //        acceptWidgets: '.grid-stack-item',
 //        placeholderText: 'Add Widget In Here !',
 //        appendTo: 'body'
 //    };
    // $('#panel-designer').gridstack(options);
	$('#sidebar .grid-stack-item').draggable({
        helper: "clone",
	    handle: '.grid-stack-item-content',
	    scroll: true,
	    appendTo: 'body',
        revert: true,
        start: function( event, ui ) {
              $(this).addClass('placeholder-dash');
        },
        stop: function( event, ui ) {
              $(this).removeClass('placeholder-dash');
              $(this).addClass('list-left'); 
        }
	});
	// $('#panel-designer').droppable({
	// 	drop: function (event, ui) {
	// 		$('#panel-designer').data("gridstack").addWidget($('<div class="grid-stack-item-content"> Example Widget </div>'), 0, 0);
	// 	}
	// });
});