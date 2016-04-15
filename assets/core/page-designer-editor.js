var widgets = [
        {x: 0, y: 0, width: 2, height: 2},
        {x: 2, y: 0, width: 4, height: 2},
        {x: 6, y: 0, width: 2, height: 4},
        {x: 1, y: 2, width: 4, height: 2}
    ];

var widgetFunc = function (widgets) {
    var self = this;

    this.widgets = ko.observableArray(widgets);

    this.addNewWidget = function () {
        this.widgets.push({
            x: 0,
            y: 0,
            width: 4,
            height: 4,
            auto_position: true
        });

        return false;
    };

    this.deleteWidget = function (item) {
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
                     self.widgets.remove(item);
                } 
              });
       
        return false;
    };
};
pg.widgetgrid = new widgetFunc(widgets);

ko.components.register('widget-grid', {
    viewModel: {
        createViewModel: function (controller, componentInfo) {
            var ViewModel = function (controller, componentInfo) {
                var grid = null;
                this.widgets = controller.widgetgrid.widgets;

                this.afterAddWidget = function (items) {
                    if (grid == null) {
                        grid = $(componentInfo.element).find('.grid-stack').gridstack({
                            auto: false,
                            acceptWidgets: '.grid-stack-item',
                        }).data('gridstack');
                    }

                    var item = _.find(items, function (i) { return i.nodeType == 1 });
                    grid.addWidget(item);
                    ko.utils.domNodeDisposal.addDisposeCallback(item, function () {
                        grid.removeWidget(item);
                    });
                };
            };
            return new ViewModel(controller, componentInfo);
        }
    },
    template:
        [
            '<div class="grid-stack" data-bind="foreach: {data: widgets, afterRender: afterAddWidget}">',
            '   <div class="grid-stack-item" data-bind="attr: {\'data-gs-x\': $data.x, \'data-gs-y\': $data.y, \'data-gs-width\': $data.width, \'data-gs-height\': $data.height, \'data-gs-auto-position\': $data.auto_position}">',
            '       <div class="grid-stack-item-content">',
            '            <div class="panel panel-default">',
            '                <div class="panel-heading wg-panel clearfix">',
            '                  <div class="pull-right">',
            '                    <a href="#" class="btn btn-default btn-xs tooltipster" data-bind="click: function(e) {pg.widgetSetting(\'wp1459947140191\', \'modal\')}" title="Setting"><span class="glyphicon glyphicon-cog"></span></a>',
            '                    <a href="#" class="btn btn-danger btn-xs tooltipster" title="Remove" data-bind="click: pg.widgetgrid.deleteWidget"><span class="glyphicon glyphicon-trash"></span></a>',
            '                  </div>',
            '               </div>',
            '            </div>',
            '       </div>',
            '   </div>',
            '</div> '
        ].join('')
});

$(function () {
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