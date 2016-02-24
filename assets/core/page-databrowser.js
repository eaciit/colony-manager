app.section("databrowser");

viewModel.databrowser ={}; var br = viewModel.databrowser;

br.templateConfigDataBrowser= {
	_id: "",
	BrowserNmame: ""
}

br.confirBrowser = ko.mapping.fromJS(br.templateConfigDataBrowser);
br.dataBrowser = ko.observableArray([]);

br.browserColumns = ko.observableArray([
	{field:"_id", title: "ID", width: 80},
	{field:"BrowserName", title: "Name", width: 130},
	{title: "", width: 40, attributes:{class:"align-center"}, template: function(d){
		return[
			"<a href='#'>Browse</a>"
		].join(" ");
	}}
]);

br.getDataBrowser = function(){
	app.ajaxPost("/databrowser/getbrowser", {}, function(res){
		if(!app.isFine(res)){
			return;
		}

		var mydata = br.dataBrowser(res.data);
		console.log("=======>>"+mydata);
	})
}

$(function (){
	br.getDataBrowser();
});