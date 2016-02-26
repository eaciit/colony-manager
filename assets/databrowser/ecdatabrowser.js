var Settings_EcDataBrowserFilter = {
	dataSource: {data:[]},
	maxColumn:3
}

var methodsDB = {
	init: function(options){
		var settings = $.extend({}, Settings_EcDataBrowserFilter, options || {});
		methodsDB.GenerateFilter(this, settings);
		return this.each(function () {
			$(this).data("ecDataBrowserFilter", settings);
		});
	},
	GenerateFilter :function(elem,options){
		var $ox = $(elem), $container = $ox.parent(), idLookup = $ox.attr('id');
		var datax = options.dataSource.data;
		var data = [];
		var lastindex = 0;

		for(var i in datax){
			if(datax[i].ShowIndex<=lastindex){
				data.unshift(datax[i]);
			}else{
				data.push(datax[i]);
			}
			lastindex = datax[i].ShowIndex;
		}

		var width = "col-md-"+(12/options.maxColumn)
		for(var i in data){
			var str = "<div class='"+width+" DB-margin' id='DBFilter"+i+"'>";
			str += "</div>";
			$str = $(str); 
			$str.appendTo($ox);

			$o = $("#DBFilter"+i);
			var strlabel = "<div class='col-md-3 align-right'><label class='filter-label' id='DBLabel"+i+"' >";
				strlabel += data[i].Label;
			strlabel+="</label></div>";
			$strlabel = $(strlabel);
			$strlabel.appendTo($o)

			var strField = "<div  class='col-md-7'> <input id='DBField"+i+"'>";
			strField += "</input></div>";
			$strField = $(strField);
			$strField.appendTo($o);

			$("#DBField"+i).attr("placeholder","Fill "+ data[i].Label);

			var dtype = data[i].Format.indexOf("N0") > -1 ? "int" : data[i].Format.indexOf("N") > -1 ? "float" : data[i].Format.toLowerCase().indexOf("m") > -1 || data[i].Format.toLowerCase().indexOf("d") > -1 || data[i].Format.toLowerCase().indexOf("y") > -1 ? "date":data[i].Format.toLowerCase().indexOf("bool") > -1? "bool":"string";
			if(dtype.toLowerCase() == "bool"){
				$("#DBField"+i).attr("type","checkbox");
			}else if(dtype.toLowerCase() =="float" || dtype.toLowerCase() =="double"){
				$("#DBField"+i).attr("class","form-control");
				$("#DBField"+i).attr("type","number");
			}else if(dtype.toLowerCase() =="int"){
				$("#DBField"+i).attr("class","form-control");
				$("#DBField"+i).attr("type","number");
			}else if(dtype.toLowerCase() =="date") {
				var depthx = data[i].Format.indexOf("dd") > -1 ? "month" : data[i].Format.toLowerCase().indexOf("m") > -1 ? "year":"decade";
				// if(data[i].DateRange){
				// 	$FieldParent = $("#DBField"+i).parent();
				// 	$FieldDate = $("<input id='DBField"+i+"a'> </input> - ")
				// 	$FieldDate.appendTo($FieldParent);
				// 	$("#DBField"+i).kendoDatePicker({
				// 		format: data[i].Format,
				// 		depth: depthx
				// 	});
				// 	$("#DBField"+i+"a").kendoDatePicker({
				// 		format: data[i].Format,
				// 		depth: depthx
				// 	});
				// }else{
					$("#DBField"+i).kendoDatePicker({
						format: data[i].Format,
						depth: depthx,
						start:depthx
					});
				// }
			}else {
				$("#DBField"+i).attr("class","form-control");
			}

			if(!data[i].SimpleFilter && data[i].AdvanceFilter){
				$("#DBFilter"+i).hide();
				$("#DBFilter"+i).attr("class",$("#DBFilter"+i).attr("class")+" advance-filter")
			}
		}

		var strBtn = "<div class='col-md-12 DB-margin' >";
		strBtn+= "<button class='btn btn-primary pull left' onclick='methodsDB.GetFilter(\""+idLookup+"\");'><span class='glyphicon glyphicon-repeat'></span> Refresh</button>";
		strBtn+= "<button class='btn btn-primary pull left DB-margin-left' onclick='methodsDB.ShowAdvance();'><span class='glyphicon glyphicon-plus'></span> Advance Filter</button>";
		strBtn+= "</div>";
		$strBtn = $(strBtn);
		$strBtn.appendTo($ox)
	},
	ShowAdvance:function(){
		$(".advance-filter").each(function(){
		if($(this).attr("style")!= undefined && $(this).attr("style").indexOf("none")>-1)
			$(this).show();
		else
			$(this).hide();
		});
	},
	GetFilter:function(id){
		var res = {};
		var opt = $("#"+id).data("ecDataBrowserFilter").dataSource.data;
		for(var i in opt){
			var value = $("#DBField"+i).val();
			var field = opt[i].Field;
			if($("#DBField"+i).attr("type") == "checkbox"){
				res[field] = $("#DBField"+i)[0].checked;
			}else{
				res[field] = value;
			}
		}
		return res;
	},
	CallAjax:function(elem,options){
		
	}

}

$.fn.ecDataBrowserFilter = function (method) {
	if (methodsDB[method]) {
		return methodsDB[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsDB['init'].apply(this,arguments);
	}
}

/* Sample for use
$("#TestFilter").ecDataBrowserFilter({
		dataSource:{data:[

		{
			"Field": "Name",
			"Label":"User Name",
			"Format":"",
			"Align":"Left",
			"ShowIndex":1,
			"Sortable":true,
			"SimpleFilter":true,
			"AdvanceFilter":true,
			"Aggregate":"",
		},
		{
			"Field": "Date",
			"Label":"Birth Date",
			"Format":"MMM-yyyy",
			"Align":"Left",
			"ShowIndex":2,
			"Sortable":true,
			"SimpleFilter":true,
			"AdvanceFilter":true,
			"Aggregate":"",
		},
		{
			"Field": "Salary",
			"Label":"Salary",
			"Format":"N2",
			"Align":"Left",
			"ShowIndex":3,
			"Sortable":true,
			"SimpleFilter":true,
			"AdvanceFilter":true,
			"Aggregate":"",
		},
		{
			"Field": "Bool",
			"Label":"Is Active",
			"Format":"bool",
			"Align":"Left",
			"ShowIndex":4,
			"Sortable":true,
			"SimpleFilter":false,
			"AdvanceFilter":true,
			"Aggregate":"",
		}
			]},
	maxColumn:3
	});
*/