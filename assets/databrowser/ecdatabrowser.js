var Settings_EcDataBrowserFilter = {
	dataSource: {data:[]},
	maxColumn:3
}

var Setting_DataSource = {
	data: [],
	url: '',
	call: 'get',
	callData: 'q',
	timeout: 20,
	callOK: function(res){
		console.log('callOK');
	},
	callFail: function(a,b,c){
		console.log('callFail');
	}
};

var methodsDB = {
	init: function(options){
		var settings = $.extend({}, Settings_EcDataBrowserFilter, options || {});
		var settingsSource = $.extend({}, Setting_DataSource, settings['dataSource'] || {});
		settings["dataSource"] = settingsSource;
		if(settingsSource.data.length==0||settingsSource.url!=""){
			methodsDB.CallAjax(this,settings);
		}else{
			methodsDB.GenerateFilter(this, settings);		
		}

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
			var str = "<div class='"+width+" DB-margin' >";
			str += "</div>";
			$str = $(str); 
			$str.appendTo($ox);

			$o = $str;
			var strlabel = "<div class='col-md-3 align-right'><label class='filter-label' >";
				strlabel += data[i].Label;
			strlabel+="</label></div>";
			$strlabel = $(strlabel);
			$strlabel.appendTo($o)

			var strField = "<div  class='col-md-7'> <input>";
			strField += "</input></div>";
			$strField = $(strField);
			$strField.appendTo($o);

			$Field = $($strField.find("input"));

			$Field.attr("placeholder","Fill "+ data[i].Label);

			var dtype = data[i].Format.toLowerCase().indexOf("n0") > -1 ? "int" : data[i].Format.toLowerCase().indexOf("n") > -1 ? "float" : data[i].Format.toLowerCase().indexOf("m") > -1 || data[i].Format.toLowerCase().indexOf("d") > -1 || data[i].Format.toLowerCase().indexOf("y") > -1 ? "date":data[i].Format.toLowerCase().indexOf("bool") > -1? "bool":"string";
			if(dtype.toLowerCase() == "bool"){
				$Field.attr("type","checkbox");
			}else if(dtype.toLowerCase() =="float" || dtype.toLowerCase() =="double"){
				$Field.attr("class","form-control");
				$Field.attr("type","number");
			}else if(dtype.toLowerCase() =="int"){
				$Field.attr("class","form-control");
				$Field.attr("type","number");
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
					$Field.kendoDatePicker({
						format: data[i].Format,
						depth: depthx,
						start:depthx
					});
				// }
			}else {
				$Field.attr("class","form-control");
			}

			if(!data[i].SimpleFilter && data[i].AdvanceFilter){
				$str.hide();
				$str.attr("class",$str.attr("class")+" advance-filter")
			}else if(!data[i].SimpleFilter){
				$str.hide();
			}
		}

		var strBtn = "<div class='col-md-12 DB-margin' >";
		strBtn+= "<button class='btn btn-primary pull left refresh'><span class='glyphicon glyphicon-repeat'></span> Refresh</button>";
		strBtn+= "<button class='btn btn-primary pull left DB-margin-left af' ><span class='glyphicon glyphicon-plus'></span> Advance Filter</button>";
		strBtn+= "</div>";
		$strBtn = $(strBtn);
		$strBtn.appendTo($ox)

		$($strBtn.find(".refresh")).bind("click").click(function(){
			methodsDB.GetFilter(elem);
		});

		$($strBtn.find(".af")).bind("click").click(function(){
			methodsDB.ShowAdvance(elem);
		});

	},
	ShowAdvance:function(elem){
		$($(elem).find(".advance-filter")).each(function(){
		if($(this).attr("style")!= undefined && $(this).attr("style").indexOf("none")>-1)
			$(this).show();
		else
			$(this).hide();
		});
	},
	GetFilter:function(elem){
		var res = {};
		var opt = $(elem).data("ecDataBrowserFilter").dataSource.data;
		for(var i in opt){
			var value = $($(elem).find("input")[i]).val();
			var field = opt[i].Field;
			if($($(elem).find("input")[i]).attr("type") == "checkbox"){
				res[field] = $($(elem).find("input")[i])[0].checked;
			}else{
				res[field] = value;
			}
		}
		return res;
	},
	CallAjax:function(elem,options){
		var ds = options.dataSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.dataSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		 $.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : data,
                contentType: contentType,
                success : function(res) {
                	$(elem).data('ecDataBrowserFilter').dataSource.callOK(res);
					options.dataSource.data = res;
					methodsDB.GenerateFilter(elem, options);
                },
                error: function (a, b, c) {
					$(elem).data('ecDataBrowserFilter').dataSource.callFail(a,b,c);
			},
        });
		
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
	
	$("#TestFilter2").ecDataBrowserFilter({		
-	dataSource:{		
-			url: 'https://gist.githubusercontent.com/yanda15/2d7147452690a5bbaf96/raw/5a365c260025480ea3ae689ade4681f4e6b91e29/gistfile1.txt',		
-			call: 'GET',		
-			callData: 'search'		
-	}, 		
-	maxColumn:3		
-	});
*/
