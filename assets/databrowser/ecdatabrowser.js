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
				$divContentFilter = $('<div class="col-md-'+widthfilter+'"></div>');
				$divContentFilter.appendTo($divFilter);
				methodsDataBrowser.createElementFilter(settingFilter, 'simple', key, $divContentFilter, $o);
				dataSimple.push('filter-simple-'+key);
			}
			if (settingFilter.AdvanceFilter){
				$divFilter = $('<div class="col-md-'+options.widthPerColumn+' filter-'+key+'"></div>');
				$divFilter.appendTo($divFilterAdvance);
				$labelFilter = $("<label class='col-md-"+options.widthKeyFilter+" ecdatabrowser-filter'>"+settingFilter.Label+"</label>");
				$labelFilter.appendTo($divFilter);
				$divContentFilter = $('<div class="col-md-'+widthfilter+'"></div>');
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
		if (settingFilter.DataType.toLowerCase() == 'integer' || settingFilter.DataType.toLowerCase() == "float32" || settingFilter.DataType.toLowerCase() == 'int' || settingFilter.DataType.toLowerCase() == 'float64'){
			$divElementFilter = $('<input idfilter="filter-'+filterchoose+'-'+index+'" typedata="'+settingFilter.DataType.toLowerCase()+'" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idfilter=filter-'+filterchoose+'-'+index+']').kendoNumericTextBox();
			return '';
		}
		else if (settingFilter.DataType.toLowerCase() == 'date'){
			$divElementFilter = $('<input idfilter="filter-'+filterchoose+'-'+index+'" typedata="date" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idfilter=filter-'+filterchoose+'-'+index+']').kendoDatePicker({
				format: settingFilter.Format,
			});
			return '';
		} else if (settingFilter.DataType.toLowerCase() == 'bool') {
			$divElementFilter = $('<input type="checkbox" class="form-control" idfilter="filter-'+filterchoose+'-'+index+'" typedata="bool" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			return '';
		}
		else {
			$divElementFilter = $('<input type="text" class="form-control input-sm" idfilter="filter-'+filterchoose+'-'+index+'" typedata="string" fielddata="'+ settingFilter.Field +'"/>');
			$divElementFilter.appendTo(element);
			return '';
		}
	},
	createGrid: function(element, options, id){
		var colums = [], format="", aggr= "", footerText = "";
		for(var key in options.metadata){
			if ((options.metadata[key].DataType.toLowerCase() == 'integer' || options.metadata[key].DataType.toLowerCase() == "float32" || options.metadata[key].DataType.toLowerCase() == 'int' || options.metadata[key].DataType.toLowerCase() == 'float64') && options.metadata[key].Format != "" ){
				format = "{0:"+options.metadata[key].Format+"}"
			} else {
				format = "";
			}
			aggr = options.metadata[key].Aggregate.split(",");
			// footerText = "";
			// for (var i in aggr){
			// 	if (aggr[i] != '')
			// 		footerText += aggr[i] + ' : ' + 50;
			// }
			if (options.metadata[key].HiddenField != true){
				var column = {
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
				colums.push(column);
			}
		}

		colums = Lazy(colums).map(function (e, i) {
			if (colums.length > 5) {
				e.width = 150;

				if (i == 0) {
					e.width = 200;
					e.locked = true;
				}
			}

			return e;
		}).toArray();

		$divElementGrid = $('<div class="col-md-12" idfilter="gridFilterBrowser"></div>');
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
					serverFiltering: true,
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
	this.GetDataFilter = function(){
		var resFilter = {}, dataTemp = [], $elem = '', valtype = '';
		if (this.mapdatabrowser.showFilter.toLowerCase() == "simple"){
			dataTemp = $(element).data('ecDataBrowser').dataSimple;
		} else {
			dataTemp = $(element).data('ecDataBrowser').dataAdvance;
		}
		for (var i in dataTemp){
			$elem = $(element).find('input[idfilter='+dataTemp[i]+']');
			field = $elem.attr('fielddata');
			if ($elem.val() != ''){
				if ($elem.attr("typedata") == "integer" || $elem.attr("typedata") == "int" || $elem.attr("typedata") == "number"){
					valtype = parseInt($elem.val());
				} else if ($elem.attr("typedata") == "float32" || $elem.attr("typedata") == "float64"){
					valtype = parseFloat($elem.val());
				} else if ($elem.attr("typedata") == "bool"){
					valtype = $(element).find('input[idfilter='+dataTemp[i]+']')[0].checked;
				}else {
					valtype = $elem.val();
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