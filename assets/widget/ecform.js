$.fn.ecForm = function (method) {
	if (methodsForm[method]) {
		return methodsForm[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsForm['init'].apply(this,arguments);
	}
}

var SettingForm = {
	title: "",
	widthPerColumn: 4,
	widthKeyFilter: 3,
	metadata: [],
};

var SettingMetadata = {
	name: "",
	title: "",
	type: "",
	data: "",
	value: "",
}

var methodsForm = {
	init: function(options){
		var settings = $.extend({}, SettingForm, options || {});
		return this.each(function () {
			$(this).data("ecForm", new $.ecFormSetting(this, settings));
			methodsForm.createElement(this, settings);
		});
	},
	createElement: function(element, options){
		$(element).html("");
		var $o = $(element), settingMetaData = {};
		$divContainer = $('<div class="col-md-12 ecform-container"></div>');
		$divContainer.appendTo($o);
		for (var key in options.metadata){
			settingMetaData = $.extend({}, SettingMetadata, options.metadata[key] || {});
			widthfilter = 12-options.widthKeyFilter;

			$divKey = $('<div class="col-md-'+options.widthPerColumn+' form-'+key+' ecform-column"></div>');
			$divKey.appendTo($divContainer);
			$formLabel = $("<label class='col-md-"+options.widthKeyFilter+" ecform-formlabel'>"+settingMetaData.title+"</label>");
			$formLabel.appendTo($divKey);
			$divValue = $('<div class="col-md-'+widthfilter+' form-value"></div>');
			$divValue.appendTo($divKey);
			methodsForm.createElementValue(settingMetaData, key, $divValue, $o);
		}
	},
	createElementValue: function(settingMetaData, index, element, id){
		var $divElementFilter;
		if (settingMetaData.type.toLowerCase() == 'number'){
			$divElementFilter = $('<input class="ecform-value" idform="form-value-'+index+'" typedata="'+settingMetaData.type.toLowerCase()+'" fielddata="'+ settingMetaData.name +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idform=form-value-'+index+']').kendoNumericTextBox({
				value: settingMetaData.value
			});
			return '';
		}
		else if (settingMetaData.type.toLowerCase() == 'bool') {
			$divElementFilter = $('<input type="checkbox" idform="form-value-'+index+'" typedata="bool" fielddata="'+ settingMetaData.name +'"/>');
			$divElementFilter.prop("checked", settingMetaData.value);
			$divElementFilter.appendTo(element);
			return '';
		}
		else if (settingMetaData.type.toLowerCase() == 'dropdown'){
			$divElementFilter = $('<input class="ecform-value" idform="form-value-'+index+'" typedata="'+settingMetaData.type.toLowerCase()+'" fielddata="'+ settingMetaData.name +'"/>');
			$divElementFilter.appendTo(element);
			id.find('input[idform=form-value-'+index+']').kendoDropDownList({
				dataSource: settingMetaData.data.split(','),
				value: settingMetaData.value
			});
			return '';
		}
		else {
			$divElementFilter = $('<input type="text" class="form-control input-sm" idform="form-value-'+index+'" typedata="text" fielddata="'+ settingMetaData.name +'"/>');
			$divElementFilter.val(settingMetaData.value);
			$divElementFilter.appendTo(element);
			return '';
		}
	},
	getData: function(){
		var res = $(this).data('ecForm').GetDataForm();
		return res;
	}
}

$.ecFormSetting = function(element,options){
	this.mapdataform = options;
	this.GetDataForm = function(){
		var metadata = this.mapdataform.metadata, newmetadata = [], tempmetadata = {}, typedata = "";
		for (key in metadata){
			tempmetadata = metadata[key];
			$elem = $(element).find('input[idform=form-value-'+key+']');
			typedata = $elem.attr('typedata');
			if(typedata == "number"){
				metadata[key]["value"] = parseFloat($elem.val());
			} else if (typedata == "bool"){
				metadata[key]["value"] = $elem[0].checked;
			} else if (typedata == "dropdown"){
				metadata[key]["value"] = $elem.val();
			} else{
				metadata[key]["value"] = $elem.val();
			}
			newmetadata.push(metadata[key]);
		}
		return newmetadata;
	}
};