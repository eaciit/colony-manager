$(function () {
	var options = {
        width: 12,
        float: false,
        removable: false,
        // acceptWidgets: '.grid-stack-item',
        acceptWidgets: '.grid-stack-item',
        // placeholderText: 'Add Widget In Here !',
        // appendTo: 'body'
    };
    $('#panel-designer').gridstack(options);
	$('#sidebar .grid-stack-item').draggable({
	    handle: '.grid-stack-item-content',
	    scroll: false,
	    // appendTo: 'body',
	  //   stop: function(event, ui) {

			// $('#panel-designer').data("gridstack").addWidget($('<div class="grid-stack-item-content"> Example Widget </div>'), 0, 0);
	  //   }
	    // drop: function(event){
			// $('#panel-designer').data("gridstack").addWidget($('<div><div class="grid-stack-item-content" /><div/>'),node.x, node.y, 4, 4);
		// }
	});
	// $('#panel-designer').droppable({
	// 	drop: function (event, ui) {
	// 		$('#panel-designer').data("gridstack").addWidget($('<div class="grid-stack-item-content"> Example Widget </div>'), 0, 0);
	// 	}
	// });
});