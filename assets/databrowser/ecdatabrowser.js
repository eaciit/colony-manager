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
		var data = options.dataSource.data;
		var width = "col-md-"+(12/options.maxColumn)
		for(var i in data){
			var str = "<div class='"+width+" DB-margin' id='DBFilter"+i+"'>";
			str += "</div>";
			$str = $(str); 
			$str.appendTo($ox);
			$o = $("#DBFilter"+i);
			var strlabel = "<div class='col-md-3'><label class='filter-label align-right' id='DBLabel"+i+"' >";
				strlabel += data[i].Label;
			strlabel+="</label></div>";
			$strlabel = $(strlabel);
			$strlabel.appendTo($o)

			var strField = "<div  class='col-md-7'> <input id='DBField"+i+"'>";
			strField += "</input></div>";
			$strField = $(strField);
			$strField.appendTo($o);

			$("#DBField"+i).attr("placeholder","Fill "+ data[i].Label);

			var dtype = data[i].Type;
			if(dtype.toLowerCase() == "bool"){
				$("#DBField"+i).attr("type","checkbox");
			}else if(dtype.toLowerCase() =="float" || dtype.toLowerCase() =="double"){
				$("#DBField"+i).attr("class","form-control");
				$("#DBField"+i).attr("type","number");
				$("#DBField"+i).attr("step","0.1");
			}else if(dtype.toLowerCase() =="int"){
				$("#DBField"+i).attr("class","form-control");
				$("#DBField"+i).attr("type","number");
				$("#DBField"+i).attr("step","1");
			}else if(dtype.toLowerCase() =="date") {
				var depthx = data[i].Format.indexOf("dd") > -1 ? "month" : data[i].Format.toLowerCase().indexOf("M") ? "year":"decade";
				if(data[i].DateRange){
					$FieldParent = $("#DBField"+i).parent();
					$FieldDate = $("<input id='DBField"+i+"a'> </input> - ")
					$FieldDate.appendTo($FieldParent);
					$("#DBField"+i).kendoDatePicker({
						format: data[i].Format,
						depth: depthx
					});
					$("#DBField"+i+"a").kendoDatePicker({
						format: data[i].Format,
						depth: depthx
					});
				}else{
					$("#DBField"+i).kendoDatePicker({
						format: data[i].Format,
						depth: depthx
					});
				}
			}else {
				$("#DBField"+i).attr("class","form-control");
			}

		}
	}

}

$.fn.ecDataBrowserFilter = function (method) {
	if (methodsDB[method]) {
		return methodsDB[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsDB['init'].apply(this,arguments);
	}
}