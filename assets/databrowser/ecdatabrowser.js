$.fn.ecDataBrowser = function (method) {
	if (methodsDataBrowser[method]) {
		return methodsDataBrowser[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsDataBrowser['init'].apply(this,arguments);
	}
}
// Format : Integer, Double, Float, Currency, Date, DateTime and Date Format
var Setting_DataBrowser = {
	title: "",
	widthPerColumn: 4,
	widthKeyFilter: 3,
	showFilter: "Simple",
	dataSource: {
		data:[],
	},
	metadata: [],
	dataSimple: [],
	dataAdvance: [],
};
var Setting_ColumnGridDB = {
	Field: "",
    Label: "",
    DataType: "",
    Format: "",
    Align: "",
    ShowIndex: 1,
    Sortable: true,
    SimpleFilter: true,
    AdvanceFilter: true,
    Aggregate: ""
};
var SettingDataSourceBrowser = {
	data: [],
	url: "",
	type: "",
	fieldTotal: "",
	fieldData: "",
	serverPaging: true,
	pageSize: 10,
	serverSorting: true,
	callOK: function(a){

	}, 
	callFail: function(a,b,c){

	},
}
var Setting_TypeData = {
	number: ['integer', 'int', 'double', 'float', 'n0'],
	date: ['date','datetime'],
}

var methodsDataBrowser = {
	init: function(options){
		var databrowser = $.extend({}, SettingDataSourceBrowser, options.dataSource || {});
		var settings = $.extend({}, Setting_DataBrowser, options || {});
		settings.dataSource = databrowser;
		var sortMeta = settings.metadata.sort(function(a, b) {
		    return parseFloat(a.ShowIndex) - parseFloat(b.ShowIndex);
		});
		settings.metadata = sortMeta;
		// var settingDataSources = $.extend({}, Setting_DataBrowser, settings['dataSource'] || {});
		return this.each(function () {
			// $(this).data("ecDataSource", settingDataSources);
			$(this).data("ecDataBrowser", new $.ecDataBrowserSetting(this, settings));
			methodsDataBrowser.createElement(this, settings);
		});
	},
	createElement: function(element, options){
		$(element).html("");
		var $o = $(element), settingFilter = {}, widthfilter = 0, dataSimple= [], dataAdvance= [];

		$divFilterSimple = $('<div class="col-md-12 ecdatabrowser-filtersimple"></div>');
		$divFilterSimple.appendTo($o);
		$divFilterAdvance = $('<div class="col-md-12 ecdatabrowser-filteradvance"></div>');
		$divFilterAdvance.appendTo($o);
		for (var key in options.metadata){
			settingFilter = $.extend({}, Setting_ColumnGridDB, options.metadata[key] || {});
			widthfilter = 12-options.widthKeyFilter;
			if (settingFilter.SimpleFilter){
				$divFilter = $('<div class="col-md-'+options.widthPerColumn+' filter-'+key+'"></div>');
				$divFilter.appendTo($divFilterSimple);
				$labelFilter = $("<label class='col-md-"+options.widthKeyFilter+" ecdatabrowser-filter'>"+settingFilter.Label+"</label>");
				$labelFilter.appendTo($divFilter);
				$divContentFilter = $('<div class="col-md-'+widthfilter+' filter-form"></div>');
				$divContentFilter.appendTo($divFilter);
				methodsDataBrowser.createElementFilter(settingFilter, 'simple', key, $divContentFilter, $o);
				dataSimple.push('filter-simple-'+key);
			}
			if (settingFilter.AdvanceFilter){
				$divFilter = $('<div class="col-md-'+options.widthPerColumn+' filter-'+key+'"></div>');
				$divFilter.appendTo($divFilterAdvance);
				$labelFilter = $("<label class='col-md-"+options.widthKeyFilter+" ecdatabrowser-filter'>"+settingFilter.Label+"</label>");
				$labelFilter.appendTo($divFilter);
				$divContentFilter = $('<div class="col-md-'+widthfilter+' filter-form"></div>');
				$divContentFilter.appendTo($divFilter);
				methodsDataBrowser.createElementFilter(settingFilter, 'advance', key, $divContentFilter, $o);
				dataAdvance.push('filter-advance-'+key);
			}
		}
		$(element).data("ecDataBrowser").dataSimple = dataSimple;
		$(element).data("ecDataBrowser").dataAdvance = dataAdvance;

		$divContainerGrid = $('<div class="col-md-12 ecdatabrowser-gridview"></div>');
		$divContainerGrid.appendTo($o);

		$divGrid = $('<div class="ecdatabrowser-grid"></div>');
		$divGrid.appendTo($divContainerGrid);

		methodsDataBrowser.createGrid($divGrid, options, $o);

		$(element).data("ecDataBrowser").ChangeViewFilter(options.showFilter);

	},
	createElementFilter: function(settingFilter, filterchoose, index, element, id){
		var $divElementFilter;
		if (settingFilter.DataType.toLowerCase() == 'integer' || settingFilter.DataType.toLowerCase() == "float32" || settingFilter.DataType.toLowerCase() == 'int' || settingFilter.DataType.toLowerCase() == 'float64' || settingFilter.DataType.toLowerCase() == 'date'){
			$divElementFilter = $('<input type="checkbox" class="ecdatabrowser-ckcrange"/>');
			$divElementFilter.bind('click').click(function(){
				if ($(this).prop("checked")){
					$(this).parent().find('.ecdatabrowser-spacerange').show();
					$(this).parent().find('.ecdatabrowser-filterto').css('display','inline-table');
				}else{
					$(this).parent().find('.ecdatabrowser-spacerange').hide();
					$(this).parent().find('.ecdatabrowser-filterto').hide();
				}
			});
			$divElementFilter.appendTo(element);
		}
		if (settingFilter.DataType.toLowerCase() == 'integer' || settingFilter.DataType.toLowerCase() == "float32" || settingFilter.DataType.toLowerCase() == 'int' || settingFilter.DataType.toLowerCase() == 'float64'){
			$divElementFilter = $('<input class="ecdatabrowser-filterfrom" idfilter="filter-'+filterchoose+'-'+index+'" typedata="'+settingFilter.DataType.toLowerCase()+'" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			$divElementFilter = $('<span class="ecdatabrowser-spacerange"> - </span><input class="ecdatabrowser-filterto" idfilter="filter-'+filterchoose+'-'+index+'" typedata="'+settingFilter.DataType.toLowerCase()+'" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idfilter=filter-'+filterchoose+'-'+index+']').kendoNumericTextBox();
			return '';
		}
		else if (settingFilter.DataType.toLowerCase() == 'date'){
			$divElementFilter = $('<input class="ecdatabrowser-filterfrom" idfilter="filter-'+filterchoose+'-'+index+'" typedata="date" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			$divElementFilter = $('<span class="ecdatabrowser-spacerange"> - </span><input class="ecdatabrowser-filterto" idfilter="filter-'+filterchoose+'-'+index+'" typedata="date" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idfilter=filter-'+filterchoose+'-'+index+']').kendoDatePicker({
				format: settingFilter.Format,
			});
			return '';
		} else if (settingFilter.DataType.toLowerCase() == 'bool') {
			$divElementFilter = $('<input type="checkbox" idfilter="filter-'+filterchoose+'-'+index+'" typedata="bool" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			return '';
		}
		else {
			if (settingFilter.Lookup == false){
				$divElementFilter = $('<input type="text" class="form-control input-sm" idfilter="filter-'+filterchoose+'-'+index+'" typedata="string" fielddata="'+ settingFilter.Field +'" haslookup="false"/>');
				$divElementFilter.appendTo(element);
			} else {
				$divElementFilter = $('<input type="text" class="form-control input-sm" idfilter="filter-'+filterchoose+'-'+index+'" typedata="string" fielddata="'+ settingFilter.Field +'" haslookup="true"/>');
				$divElementFilter.appendTo(element);
				var callData = {};
				callData['id'] = id.data('ecDataBrowser').mapdatabrowser.dataSource.callData.id;
				callData['take'] = 10;
				callData['skip'] = 0;
				callData['page'] = 1;
				callData['pageSize'] = 10;
				callData['haslookup'] = true;
				$('input[idfilter=filter-'+filterchoose+'-'+index+']').ecLookupDD({
					dataSource:{
						url: id.data('ecDataBrowser').mapdatabrowser.dataSource.url,
						call: 'post',
						callData: callData,
						resultData: function(a){
							return a.data.DataValue;
						}
					}, 
					inputType: 'multiple', 
					inputSearch: settingFilter.Field, 
					idField: settingFilter.Field, 
					idText: settingFilter.Field, 
					displayFields: settingFilter.Field, 
				});
			}
			return '';
		}
	},
	createGrid: function(element, options, id){
		var colums = [], format="", aggr= {}, footerText = "", column = {};
		for(var key in options.metadata){
			if ((options.metadata[key].DataType.toLowerCase() == 'integer' || options.metadata[key].DataType.toLowerCase() == "float32" || options.metadata[key].DataType.toLowerCase() == 'int' || options.metadata[key].DataType.toLowerCase() == 'float64') && options.metadata[key].Format != "" ){
				format = "{0:"+options.metadata[key].Format+"}"
			} else {
				format = "";
			}
			// aggr = JSON.parse("{\"avg\":\"220000.0000\",\"sum\":\"1100000\"}");
			if (options.metadata[key].Aggregate != '')
				aggr = JSON.parse(options.metadata[key].Aggregate);
			footerText = "";
			$.each( aggr, function( key, value ) {
				footerText+= key + ' : ' + value + '<br/>';
			});
			if (options.metadata[key].HiddenField != true){
				if (options.metadata[key].DataType.toLowerCase() == 'date'){
					if (options.metadata[key].Format != '')
						format = "moment(Date.parse("+options.metadata[key].Field+")).format('"+options.metadata[key].Format.toUpperCase()+"')";
					else 
						format = options.metadata[key].Field;
					column = {
						field: options.metadata[key].Field,
						title: options.metadata[key].Label,
						// format: format,
						sortable: options.metadata[key].Sortable,
						attributes: {
							style: "text-align: "+options.metadata[key].Align+";",
						},
						headerAttributes: {
							style: "text-align: "+options.metadata[key].Align+";",
						},
						aggregates: aggr,
						footerTemplate: footerText,
						template: "#:"+format+"#",
					};
				} else {
					column = {
						field: options.metadata[key].Field,
						title: options.metadata[key].Label,
						format: format,
						sortable: options.metadata[key].Sortable,
						attributes: {
							style: "text-align: "+options.metadata[key].Align+";",
						},
						headerAttributes: {
							style: "text-align: "+options.metadata[key].Align+";",
						},
						aggregates: aggr,
						footerTemplate: footerText,
					};
				}
				colums.push(column);
			}
		}

		// colums = Lazy(colums).map(function (e, i) {
		// 	if (colums.length > 5) {
		// 		e.width = 150;

		// 		if (i == 0) {
		// 			e.width = 200;
		// 			e.locked = true;
		// 		}
		// 	}

		// 	return e;
		// }).toArray();

		$divElementGrid = $('<div idfilter="gridFilterBrowser"></div>');
		$divElementGrid.appendTo(element);
		if (options.dataSource.data.length > 0){
			id.find('div[idfilter=gridFilterBrowser]').kendoGrid({
				dataSource: {data: options.dataSource.data},
				sortable: true,
				columns: colums,
			});
		} else {
			id.find('div[idfilter=gridFilterBrowser]').kendoGrid({
				dataSource: {
					transport: {
	                    read: function(yo){
							var callData = $(id).data('ecDataBrowser').GetDataFilter(), $parentElem = id;
							// var callData = {}, $parentElem = id;
							$.each( options.dataSource.callData, function( key, value ) {
								callData[key] = value;
							});
      						for(var i in yo.data){
	                            callData[i] = yo.data[i];
	                        }
				            app.ajaxPost($parentElem.data('ecDataBrowser').mapdatabrowser.dataSource.url,callData, function (res){
				            	yo.success(res.data);
				            	$parentElem.data('ecDataBrowser').mapdatabrowser.dataSource.callOK(res.data);
	                        });
	                    }
	                },
	                schema: {
	                    data: options.dataSource.fieldData,
	                    total: options.dataSource.fieldTotal
	                },
	                pageSize: options.dataSource.pageSize,
	                serverPaging: options.dataSource.serverPaging, // enable server paging
	                serverSorting: options.dataSource.serverSorting,
					// serverFiltering: true,
				},
				sortable: true,
	            pageable: true,
	            scrollable: true,
				columns: colums,
			});
		}
	},
	setShowFilter: function(res){
		$(this).data("ecDataBrowser").ChangeViewFilter(res);
	},
	getDataFilter: function(){
		var res = $(this).data('ecDataBrowser').GetDataFilter();
		return res;
	},
	postDataFilter: function(){
		$(this).data('ecDataBrowser').refreshDataGrid();
	},
	setDataGrid: function(res){
		// var mapNewGrid = $.extend({}, $(this).data("ecDataBrowser").mapdatabrowser, res || {});
		// var mapNewGrid = $(this).data("ecDataBrowser").mapdatabrowser
	}
}

$.ecDataBrowserSetting = function(element,options){
	this.mapdatabrowser = options;
	this.ChangeViewFilter = function(res){
		if (res.toLowerCase() == 'simple'){
			$(element).find('div.ecdatabrowser-filtersimple').show();
			$(element).find('div.ecdatabrowser-filteradvance').hide();
			this.mapdatabrowser.showFilter = "Simple";
		} else {
			$(element).find('div.ecdatabrowser-filtersimple').hide();
			$(element).find('div.ecdatabrowser-filteradvance').show();
			this.mapdatabrowser.showFilter = "Advance";
		}
	};
	this.CheckRangeData = function(findElem, typeData){
		$elemfrom = $(element).find(findElem+'.ecdatabrowser-filterfrom');
		$elemto = $(element).find(findElem+'.ecdatabrowser-filterto');
		if ($elemfrom.closest('.filter-form').find('.ecdatabrowser-ckcrange').prop("checked")){
			return $elemfrom.val() + '..' + $elemto.val();
		} else {
			var res = $elemfrom.val();
			if (typeData == 'float')
				return parseFloat(res);
			else if (typeData == 'int')
				return parseInt(res);
			else
				return res;
		}
	}
	this.GetDataFilter = function(){
		var resFilter = {}, dataTemp = [], $elem = '', valtype = '', lookupdata = [];
		if (this.mapdatabrowser.showFilter.toLowerCase() == "simple"){
			dataTemp = $(element).data('ecDataBrowser').dataSimple;
		} else {
			dataTemp = $(element).data('ecDataBrowser').dataAdvance;
		}
		for (var i in dataTemp){
			$elem = $(element).find('input[idfilter='+dataTemp[i]+']');
			field = $elem.attr('fielddata');
			if (($elem.val() != '' || $elem.attr('haslookup') == "true") && $elem.ecLookupDD('get').length > 0){
				if ($elem.attr("typedata") == "integer" || $elem.attr("typedata") == "int" || $elem.attr("typedata") == "number"){
					// valtype = parseInt($elem.val());
					valtype = this.CheckRangeData('input[idfilter='+dataTemp[i]+']', 'int');
				} else if ($elem.attr("typedata") == "float32" || $elem.attr("typedata") == "float64"){
					// valtype = parseFloat($elem.val());
					valtype = this.CheckRangeData('input[idfilter='+dataTemp[i]+']', 'float');
				} else if ($elem.attr("typedata") == "bool"){
					valtype = $(element).find('input[idfilter='+dataTemp[i]+']')[0].checked;
				} else if ($elem.attr("typedata") == "date"){
					valtype = this.CheckRangeData('input[idfilter='+dataTemp[i]+']', 'date');
				} else {
					if ($elem.attr('haslookup') == "false")
						valtype = $elem.val();
					else {
						lookupdata = [];
						for(var a in $elem.ecLookupDD('get')){
							lookupdata.push($elem.ecLookupDD('get')[a][$elem.attr('fielddata')]);
						}
						valtype = lookupdata;
					}
				}
				resFilter[field] = valtype;
			}
		}
		return resFilter;
	};
	this.refreshDataGrid = function(){
		$(element).find('div[idfilter=gridFilterBrowser]').data('kendoGrid').dataSource.read();
		$(element).find('div[idfilter=gridFilterBrowser]').data('kendoGrid').refresh();
	}
}

// ecLookupDropdown
