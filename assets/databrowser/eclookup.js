$(function() {
	$('li.eclookup-txt>input').bind('focus', function () {
		$(this).closest('div.eclookup-container').addClass('eclookup-list-selected');
	});
	$('li.eclookup-txt>input').bind('blur', function () {
		$(this).closest('div.eclookup-container').removeClass('eclookup-list-selected');
	});
	$('body').click(function(e) {
		var target = $(e.target);
		if(!target.is('div.eclookup-dropdown') && !target.is('ul.eclookup-list')) {
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
	callData: 'q',
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
		return methodsLookup[method].apply(this, Array.prototype.slice.call(arguments, 1));
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

		$divClear = $('<div style="clear: both;"></div>');
		$divClear.appendTo($divSearch);

		$liLookupTxt = $('<li class="eclookup-txt"></li>');
		$liLookupTxt.appendTo($ulLookup);

		$textSearch = $('<input type="text"/>');
		$textSearch.attr({'placeholder': options.placeholder});
		$textSearch.bind('keyup keydown').keyup(function(event){
			var search = $(this).val();
			// switch(event.keyCode) {
			// 	case KEY.BACKSPACE:
			// 		$o.data('ecLookupDD').searchResult(search);
			// 		break;
			// 	default:
			// 		if (search.length >= options.minChar){
			// 			$o.data('ecLookupDD').searchResult(search);
			// 		}
			// }
		});
		$textSearch.appendTo($liLookupTxt);

		$divDropdown = $('<div class="eclookup-dropdown"></div>');
		$divDropdown.appendTo($container);

		$ulDropdown = $('<ul class="eclookup-listsearch"></ul>');
		$ulDropdown.appendTo($divDropdown);
	},
	get: function() {
		// var idLookup = $(this).attr('id');
		// var dataGet = $('#'+idLookup).data('ecLookupDD').ParamDataSource.dataSelect;
		// return dataGet;
	},
}
$.ecDataSourceDDLookup = function(element,options){
}
