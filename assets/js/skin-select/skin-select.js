$(document).ready(function() { 
	// toggle skin select	
	$("#menu-left #toggle-left").click(function() { 
		if($(this).hasClass('active')) {
			$(this).removeClass('active');
			$('#menu-left').animate({ left:0 }, 100);	
			$('.wrap-fluid').css({"width":"auto","margin-left":"250px"});
			$('#menu-left li').css({"text-align":"left"});
			$('#menu-left li span, ul.topnav h4, .side-dash, .noft-blue, .noft-purple-number, .noft-blue-number, .title-menu-left').css({"display":"inline-block", "float":"none"});
			$('.ul.topnav li a:hover').css({" background-color":"green!important"});
			$('.ul.topnav h4').css({"display":"none"});
			$('.tooltip-tip2').addClass('tooltipster-disable');
			$('.tooltip-tip').addClass('tooltipster-disable');
			$('.list-group').css({"visibility":"visible"});
			$('#menu-left .list-group').css('margin-top','0px');
		} else {
			$(this).addClass('active');
			$('#menu-left').animate({ left:-200 }, 100);
			$('.wrap-fluid').css({"width":"auto", "margin-left":"50px"});
			$('#menu-left li').css({"text-align":"right"});
			$('#menu-left li span, ul.topnav h4, .side-dash, .noft-blue, .noft-purple-number, .noft-blue-number, .title-menu-left').css({"display":"none"});
			$('.tooltip-tip2').removeClass('tooltipster-disable');
			$('.tooltip-tip').removeClass('tooltipster-disable');
			$('.list-group').css({"visibility":"visible"});
			$('#menu-left .list-group').css('margin-top','45px');
		}
		if ($('.grid-container > .grid-item').length > 0)
			viewModel.designer.packery.layout();
		return false;
	});
	
	// show skin select for a second
	setTimeout(function(){ $("#menu-left #toggle-left").addClass('active').trigger('click'); },10);

	$("#imenu-right").click(function() { 
		if($(this).hasClass('active')) {
			$(this).removeClass('active');
			$('#menu-right').animate({ right:-250 }, 100);	
			$('.wrap-fluid').css({"width":"auto","margin-right":"0px"});
			$(this).removeClass('glyphicon-align-right');
			$(this).addClass('glyphicon-align-left');
		} else {
			$(this).addClass('active');
			$('#menu-right').animate({ right:0 }, 100);
			$('.wrap-fluid').css({"width":"auto","margin-right":"250px"});
			$(this).removeClass('glyphicon-align-left');
			$(this).addClass('glyphicon-align-right');
		}
		if ($('.grid-container > .grid-item').length > 0)
			viewModel.designer.packery.layout();
		return false;
	});

	setTimeout(function(){ $("#imenu-right").addClass('active').trigger('click'); },10);
	
}); // end doc.ready

