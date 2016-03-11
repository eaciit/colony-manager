app.section("databrowser");

viewModel.databrowser ={}; var br = viewModel.databrowser;

br.templateConfigDataBrowser= {
	_id: "",
	BrowserName: ""
}

//br.confirBrowser= ko.mapping.fromJS(br.templateConfigDataBrowser);
br.dataBrowser 	= ko.observableArray([]);
br.dataBrowserDesc = ko.observableArray([]);
br.dataBrowserDescColumns = ko.observableArray([]);
br.searchfield 	= ko.observable("");
br.pageVisible	= ko.observable("");
br.onVisible 	= ko.observable("");
br.selectedID = ko.observable("");

br.browserColumns = ko.observableArray([
	{title: "<center><input type='checkbox' id='selectall'></center>", width: 50, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' id='select' class='selecting' name='select[]' value=" + d._id + ">"
		].join(" ");
	}},
	{field:"_id", title: "ID" },
	{title: "Name", template: function(d){
		return[
			"<div onclick= 'br.ViewBrowserName(\"" + d._id + "\")' style= 'cursor: pointer;'>"+d.BrowserName+"</div>"
		]
	}},
	{title: "", width: 80, attributes:{class:"align-center"}, template: function(d){
		return[
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' title='Design the Data Browser' onclick='db.designDataBrowser(\"" + d._id + "\")'><span class='fa fa-pencil'></span></button>",
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
	dbq.clearQuery()
	$("#grid-databrowser-design").data('kendoGrid').dataSource.data([]);
	db.showHideFreeQuery();
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

br.ViewBrowserName = function(id){
	br.selectedID(id);
	var datacol =[];
	br.dataBrowserDescColumns([]);
	app.ajaxPost("/databrowser/detaildb", {id: id}, function(res){
		if(!app.isFine(res)){
			return;
		}

		if (!res.data) {
			res.data = [];
		}

		br.pageVisible("view");
		br.onVisible("simple");
		console.log(res.data.dataresult.MetaData);
		$('#grid-databrowser-decription').ecDataBrowser({
			title: "",
			widthPerColumn: 6,
			showFilter: "Simple",
			dataSource: { 
	                  url: "/databrowser/detaildb",
	                  type: "post",
	                  callData: {id: id},
	                  fieldTotal: "DataCount",
	                  fieldData: "DataValue",
	                  serverPaging: true,
	                  pageSize: 10,
	                  serverSorting: true,
	                  callOK: function(res){
	                  	console.log(res);
	                  }
	            },
			metadata: res.data.dataresult.MetaData,
		});
	// 	var ondata = res.data;
	// 	var ondataval =ondata.DataValue;
	// 	var ondatacol = ondata.dataresult.MetaData;
	// 	for(var i=0; i< ondatacol.length; i++){
	// 		datacol.push({field: ondatacol[i].Field , title: ondatacol[i].Label, sortable: ondatacol[i].Sortable})
	// 	}
	// 	//br.dataBrowserDescColumns(datacol);
	// 	br.dataBrowserDesc(ondataval);
	// 	br.dataBrowserDescColumns(datacol);
	});
	
}

br.saveAndBack = function (){
	br.getDataBrowser();
	br.pageVisible("");
}

br.filterAdvance = function(){
	//alert("masuk advance");
	br.onVisible("advance");
	$('#grid-databrowser-decription').ecDataBrowser("setShowFilter","advance");
}

br.filterSimple = function(){
	//alert("masuk advance");
	br.onVisible("simple");
	$('#grid-databrowser-decription').ecDataBrowser("setShowFilter","simple");
}
br.filterDataBrowser = function(){
	$('#grid-databrowser-decription').ecDataBrowser("postDataFilter");
}

$(function (){
	br.getDataBrowser();
	br.getAllbrowser();
	app.registerSearchKeyup($(".searchbr"), br.getDataBrowser);
});