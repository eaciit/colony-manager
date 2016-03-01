app.section("databrowser");

viewModel.databrowser ={}; var br = viewModel.databrowser;

br.templateConfigDataBrowser= {
	_id: "",
	BrowserName: ""
}

br.confirBrowser = ko.mapping.fromJS(br.templateConfigDataBrowser);
br.dataBrowser = ko.observableArray([]);
br.searchfield = ko.observable("");
br.pageVisible = ko.observable("");

br.browserColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 5, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{field:"_id", title: "ID", width: 80},
	{title: "Name", width: 130, template: function(d){
		return[
			"<div onclick= 'db.ViewBrowserName(\"" + d._id + "\")' style= 'cursor: pointer;'>"+d.BrowserName+"</div>"
		]
	}},
	{title: "", width: 40, attributes:{class:"align-center"}, template: function(d){
		return[
			"<div onclick= 'db.designDataBrowser(\"" + d._id + "\")' style= 'cursor: pointer;'>Design</div>"
		].join(" ");
	}}
]);

br.getDataBrowser = function(){
	app.ajaxPost("/databrowser/getbrowser", {search: br.searchfield()}, function(res){
		if(!app.isFine(res)){
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		br.dataBrowser(res.data);
	});
}

br.OpenBrowserForm = function(ID){
	br.pageVisible("editor");
	ko.mapping.fromJS(db.templateConfig, db.configDataBrowser);
	$("#grid-databrowser-design").data('kendoGrid').dataSource.data([]);
	// app.ajaxPost("/databrowser/gobrowser", {id: ID}, function (){
	// 	if (!app.isFine) {
	// 		return;
	// 	}
	// })
	
}

br.getAllbrowser = function(){
	$("#selectall").change(function () {
	    $("input:checkbox[name='select[]']").prop('checked', $(this).prop("checked"));
	});
}

var vals = [];
br.DeleteBrowser = function(){
	if ($('input:checkbox[name="select[]"]').is(':checked') == false) {
		swal({
		title: "",
		text: 'You havent choose any application to delete',
		type: "warning",
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "OK",
		closeOnConfirm: true
		});
	} else {
		vals = $('input:checkbox[name="select[]"]').filter(':checked').map(function () {
			return this.value;
		}).get();

		swal({
		title: "Are you sure?",
		text: 'Application with id "' + vals + '" will be deleted',
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: "#DD6B55",
		confirmButtonText: "Delete",
		closeOnConfirm: true
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/databrowser/deletebrowser",{_id: vals}, function () {
					if (!app.isFine) {
						return;
					}

				 swal({title: "Application successfully deleted", type: "success"});
				 br.getDataBrowser();
				});
			},1000);

		});
 	} 
 
}

//SELECTING ON GRID
br.selectBrowser = function(e){
	app.wrapGridSelect(".grid-application", ".btn", function (d) {
		console.log(d._id);
	});
}

br.saveAndBack = function (){
	br.getDataBrowser();
	br.pageVisible("");
}


$(function (){
	br.getDataBrowser();
	br.getAllbrowser();
});