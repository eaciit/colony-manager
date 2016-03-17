$(function() {
	$('li.eclookup-txt>input').bind('focus', function () {
		$(this).closest('div.eclookup-container').addClass('eclookup-list-selected');
	});
	$('li.eclookup-txt>input').bind('blur', function () {
		$(this).closest('div.eclookup-container').removeClass('eclookup-list-selected');
	});
	$('body').click(function(e) {
		var target = $(e.target);
		if(!target.is('div.eclookup-dropdown') && !target.is('ul.eclookup-list') && !target.is('ul.eclookup-listsearch') && !target.is('li.eclookup-itemsearch')) {
			$('div.eclookup-dropdown').hide();
		}
	});
});

var KEY = {
	BACKSPACE    : 8,
	TAB          : 9,
	ENTER        : 13,
	ESCAPE       : 27,
	SPACE        : 32,
	PAGE_UP      : 33,
	PAGE_DOWN    : 34,
	END          : 35,
	HOME         : 36,
	LEFT         : 37,
	UP           : 38,
	RIGHT        : 39,
	DOWN         : 40,
	NUMPAD_ENTER : 108,
	COMMA        : 188
};

var operationCond = [
	{Id:"eq",Title:"EQ ( == )"},
	{Id:"ne",Title:"NE ( != )"},
	{Id:"gt",Title:"GT ( > )"},
	{Id:"gte",Title:"GTE ( >= )"},
	{Id:"lt",Title:"LT ( < )"},
	{Id:"lte",Title:"LTE ( <= )"},
	{Id:"regex",Title:"Contains"},
	{Id:"notcontains",Title:"Not Contains"}];

var filterlist = [
	{Id:"and",Title:"AND"},
	{Id:"or",Title:"OR"},
	// {Id:"nand",Title:"NAND"},
	// {Id:"nor",Title:"NOR"},
]

var Settings_EcLookup = {
	dataSource: {data:[]},
	inputType: 'multiple',
	inputSearch: 'value',
	idField: 'id',
	idText: 'value',
	// displayFields: 'value',
	placeholder: 'Input Type Here !',
	minChar: 0,
	displayTemplate: function(){
		return "";
	},
};
var Setting_DataSource_Lookup = {
	data: [],
	url: '',
	call: 'get',
	callData: {},
	timeout: 20,
	callOK: function(res){

	},
	callFail: function(a,b,c){

	},
	resultData: function(res){
		return res;
	},
	dataTemp: [],
	dataSelect: []
};

// ecLookupDD

$.fn.ecLookupDD = function (method) {
	if (methodsLookupDD[method]) {
		return methodsLookupDD[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsLookupDD['init'].apply(this,arguments);
	}
}

var methodsLookupDD = {
	init: function(options){
		// var $o = this;
		var settings = $.extend({}, Settings_EcLookup, options || {});
		var settingDataSources = $.extend({}, Setting_DataSource_Lookup, settings['dataSource'] || {});
		methodsLookupDD.createSearchLookup(this, settings);
		return this.each(function () {
			$(this).data("ecLookupDDSettings", settings);
			$(this).data("ecLookupDD", new $.ecDataSourceDDLookup(this, settingDataSources));
		});
	},
	createSearchLookup: function(element, options){
		var $o = $(element), $container = $o.parent(), idLookup = $o.attr('id');
		$o.css({'display':'none'});
		$divSearch = $('<div class="eclookup-container"></div>');
		$divSearch.appendTo($container);

		$ulLookup = $('<ul class="eclookup-list"></ul>');
		$ulLookup.appendTo($divSearch);
		$ulLookup.bind('click').click(function(event){
			var txt = $(this).find('li.eclookup-txt>input').focus();
		});

		$divClear = $('<div style="clear: both;"></div>');
		$divClear.appendTo($divSearch);

		$liLookupTxt = $('<li class="eclookup-txt"></li>');
		$liLookupTxt.appendTo($ulLookup);

		$textSearch = $('<input type="text"/>');
		$textSearch.attr({'placeholder': options.placeholder});
		$textSearch.bind('keyup keydown').keyup(function(event){
			var search = $(this).val();
			var $co = $container.find(".eclookup-dropdown ul.eclookup-listsearch");
			switch(event.keyCode) {
				case KEY.UP:
					if ($co.find('li.hlight').length == 0) {
			            $co.find('li.eclookup-itemsearch').eq(-1).addClass('hlight');
			        }else{
						var indexCO = $co.find("li.hlight").index() - 1;
						$co.find('li.eclookup-itemsearch').removeClass('hlight');
						$co.find('li.eclookup-itemsearch').eq(indexCO).addClass('hlight');
			        }
                break;
				case KEY.DOWN:
					if ($co.find('li.hlight').length == 0) {
			            $co.find('li.eclookup-itemsearch').eq(0).addClass('hlight');
			        }else{
						var indexCO = $co.find("li.hlight").index() + 1;
						$co.find('li.eclookup-itemsearch').removeClass('hlight');
						$co.find('li.eclookup-itemsearch').eq(indexCO).addClass('hlight');
			        }
                break;
                case KEY.ENTER:
					$co.find('li.hlight').bind('click').click();
                break;
				case KEY.BACKSPACE:
					if (search.length > 0){
				    	$o.data('ecLookupDD').searchResult(search);
					}
					break;
				default:
					if (search.length >= options.minChar){
						$o.data('ecLookupDD').searchResult(search);
					}
			}
		}).keydown(function(event){
			var search = $(this).val();
			switch(event.keyCode) {		
				case KEY.BACKSPACE:
					if (search.length == 0){
						$le = $(".eclookup-item").length - 1;
						$(".eclookup-item").eq($le).remove();
						$o.data('ecLookupDD').ParamDataSource.dataSelect.splice(-1,1);
				    }
		    	break;
		    }
		});
		$textSearch.appendTo($liLookupTxt);

		$divDropdown = $('<div class="eclookup-dropdown"></div>');
		$divDropdown.appendTo($container);

		$ulDropdown = $('<ul class="eclookup-listsearch"></ul>');
		$ulDropdown.appendTo($divDropdown);	

	},
	get: function() {
		// var idLookup = $(this).attr('id');
		var dataGet = $(this).data('ecLookupDD').ParamDataSource.dataSelect;
		return dataGet;
	},
	gettext: function(){
		return $(this).parent().find('.eclookup-container li.eclookup-txt>input[type=text]').val();
	}
}
$.ecDataSourceDDLookup = function(element,options){
	var elementLookup = element, chooseData = 'data';
	this.ParamDataSource = options;
	this.DataKey = [];
	this.getGetStorage = function(){
		if (this.ParamDataSource.data.length > 0){
			chooseData = 'data';
			this.ParamDataSource.dataTemp = this.ParamDataSource.data;
		} else if (typeof(this.ParamDataSource.url) == 'string' && this.ParamDataSource.url != '' ){
			chooseData = 'url';
		}
	};
	this.getUrlData = function(query){
		var dataPost = {}, contentType = '';
			// dataPost[this.ParamDataSource.callData] = query;
		$.each(this.ParamDataSource.callData, function( key, value ) {
			dataPost[key] = value;
		});
		dataPost[$(elementLookup).data('ecLookupDDSettings').inputSearch] = query;
		if (this.ParamDataSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		$.ajax({
			url: this.ParamDataSource.url,
			type: this.ParamDataSource.call,
			dataType: 'json',
			contentType: contentType,
			data: ko.mapping.toJSON(dataPost),
			success: function (a) {
				$(elementLookup).data('ecLookupDD').ParamDataSource.callOK(a);
				var resultdata = $(elementLookup).data('ecLookupDD').ParamDataSource.resultData(a)
				$(elementLookup).data('ecLookupDD').ParamDataSource.dataTemp = resultdata;
				$(elementLookup).data('ecLookupDD').resultSearchData(resultdata, query);
			},
			error: function (a, b, c) {
				$(elementLookup).data('ecLookupDD').ParamDataSource.callFail(a,b,c);
				var resultdata = $(elementLookup).data('ecLookupDD').ParamDataSource.resultData([]);
				$(elementLookup).data('ecLookupDD').resultSearchData(resultdata, '');
			},
		});
	};
	this.searchResult = function(query){
		if (chooseData == 'data' && this.ParamDataSource.dataTemp.length == 0){
			this.getGetStorage();
		}
		var searchData = jQuery.grep(this.ParamDataSource.dataTemp, function( item ) {
			var itemSearch = '';
			if ($(elementLookup).data('ecLookupDDSettings').inputSearch != ''){
				itemSearch = item[$(elementLookup).data('ecLookupDDSettings').inputSearch];
			} else {
				itemSearch = item;
			}
			return itemSearch.toLowerCase().indexOf(query.toLowerCase()) >= 0;
		});
		if (chooseData == 'url' && searchData.length == 0){
			this.getUrlData(query);
		} else if (chooseData == 'data'){
			this.resultSearchData(searchData, query);
		} else if (chooseData == 'url' && searchData.length > 0){
			this.resultSearchData(searchData, query);
		}
	};

	this.resultSearchData = function(data,query){
		var $ulDropdown = $(elementLookup).parent().find('ul.eclookup-listsearch');
		$(elementLookup).parent().find('div.eclookup-dropdown').show();
		$ulDropdown.html('');		

		if (data.length > 0 && query !== ''){
			for (var key in data){
				var changeElemSearch = $(elementLookup).data('ecLookupDDSettings').displayTemplate();
				$liContentSearch = $('<li class="eclookup-itemsearch" idfield="'+ data[key][$(elementLookup).data('ecLookupDDSettings').idField] +'" valueDisplay="'+data[key][$(elementLookup).data('ecLookupDDSettings').displayFields]+'"></li>');
				if (changeElemSearch == ''){
					$liContentSearch.html(data[key][$(elementLookup).data('ecLookupDDSettings').idText]);
				} else{
					var splitElement = changeElemSearch.split('#'), elementCreate = '';
					for (var i in splitElement){
						var res = splitElement[i].substring(0,1);
						if (res == '*'){
							elementCreate += data[key][splitElement[i].substring(1,splitElement[i].length)];
						} else {
							elementCreate += splitElement[i];
						}
					}
					$liContentSearch.html(elementCreate);
				}
				$liContentSearch.bind('click').click(function(event){
					var $searchtxt = $(elementLookup).parent().find('ul.eclookup-list>li.eclookup-txt');
					var settings = $.extend({}, Settings_EcLookup, options || {});
					if ($(elementLookup).data('ecLookupDDSettings').inputType == 'ddl'){
						$liLookup = $('<li class="eclookup-item max"></li>');
						$(elementLookup).parent().find('li.eclookup-txt').css('display','none');
					}else{
						$liLookup = $('<li class="eclookup-item"></li>');
					}

					$liLookup.insertBefore($searchtxt);

					$titleLookup = $('<p></p>');
					$titleLookup.html($(this).attr('valueDisplay'));
					$titleLookup.appendTo($liLookup);

					var $searchtext = $(elementLookup).parent().find('li.eclookup-txt>input'), idField = $(this).attr('idfield');

					$btnRemoveLookup = $('<span class="eclookup-remove"></span>');
					$btnRemoveLookup.html('x');
					$btnRemoveLookup.bind('click').click(function(){
						$(elementLookup).parent().find('li.eclookup-txt').css('display','block');
						$(this).parent().remove();
						// $searchtext.val('');
						$searchtext.focus();
						var dataResult = $.grep($(elementLookup).data('ecLookupDD').ParamDataSource.dataSelect, function(e){ 
							var idGrep = idField;
							if (typeof(e[$(elementLookup).data('ecLookupDDSettings').idField]) == 'number')
								idGrep = parseInt(idGrep);
							return e[$(elementLookup).data('ecLookupDDSettings').idField] != idGrep; 
						});
						$(elementLookup).data('ecLookupDD').ParamDataSource.dataSelect = dataResult;
					});
					$btnRemoveLookup.appendTo($liLookup);

					// $searchtext.val('');
					$searchtext.focus();

					var dataResult = $.grep(data, function(e){ 
						var idGrep = idField;
						if (typeof(e[$(elementLookup).data('ecLookupDDSettings').idField]) == 'number')
							idGrep = parseInt(idGrep);
						return e[$(elementLookup).data('ecLookupDDSettings').idField] == idGrep; 
					}), dataSelectTemp = $(elementLookup).data('ecLookupDD').ParamDataSource.dataSelect;
					dataSelectTemp = dataSelectTemp.concat(dataResult);
					$(elementLookup).data('ecLookupDD').ParamDataSource.dataSelect = dataSelectTemp;
				});
				$liContentSearch.appendTo($ulDropdown);
			}
		} else if (query !== ''){
			$liContentSearch = $('<li class="eclookup-itemsearch">Search Not Found !</li>');
			$liContentSearch.appendTo($ulDropdown);
		}
	};
}
