app.section('pageView');

viewModel.pageView ={}; var pv = viewModel.pageView;

pv.getUrlView = function(){
	var title = $('#url').text()
	app.ajaxPost("/pagedesigner/pageview", {title: title}, function(res){
		if(!app.isFine(res)){
			return;
		}
		var result = JSON.stringify(res.data);
		document.getElementById("show").innerHTML = result;
		
	});
	
}


$(function(){
	pv.getUrlView();
})