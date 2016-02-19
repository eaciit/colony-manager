app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;


wg.logData = ko.observable('');
wg.scrapperMode = ko.observable('');
wg.modeSetting = ko.observable(0);
wg.modeSelector = ko.observable("");
wg.tempIndexColumn = ko.observable(0);
wg.tempIndexSetting = ko.observable(0);
wg.scrapperData = ko.observableArray([]);
wg.historyData = ko.observableArray([]);
wg.isContentFetched = ko.observable(false);
wg.selectedID = ko.observable('');
wg.selectedItem = ko.observable('');
wg.selectedItemNode = ko.observable('');
wg.valWebGrabberFilter = ko.observable('');
wg.requestType = ko.observable();
wg.sourceType = ko.observable();
wg.connectionListData = ko.observableArray([]);
wg.collectionInput = ko.observable();
wg.showWebGrabber = ko.observable(true);
wg.tempCheckIdWebGrabber = ko.observableArray([]);
wg.templateConfigScrapper = {
	_id: "",
	nameid: "",
	calltype: "GET",
	sourcetype: "SourceType_Http",
	intervaltype: "seconds",
	grabinterval: 20,
	timeoutinterval: 20,
	// url: "http://www.shfe.com.cn/en/products/Gold/",
	url: "http://www.google.com",
	logconf: {
		"filename": "LOG-GRABDCE",
		"filepattern": "",
		"logpath": ""
	},
	datasettings: [],
	grabconf: {
		data: {}
	},
	temp: {
		parameters: [],
	}
};
wg.parametersPattern = ko.observableArray([
	{ value: "", title: "-" },
	{ value: "time.Now()", title: "Now" },
	{ value: "time.Now()+1", title: "Now + 1" }
]);
wg.useHeaderOptions = ko.observableArray([
	{ value: true, title: 'YES' }, 
	{ value: false, title: 'NO' }
]);
wg.templateConfigSelector = {
	name: "",
	rowselector: "",
	filtercond: "",
	conditionlist: [],
	// rowdeletecond: {},
	// rowincludecond: {},
	destoutputtype: "database",
	desttype: "mongo",
	columnsettings: [],
	connectioninfo: {
		filename: "",
		useheader: true,
		delimiter: ",",

		host: "",
		database: "",
		username: "",
		password: "",
		collection: "",
		connectionid: ""
	}
}
wg.templateStepSetting = ko.observableArray(["Set Up", "Data Setting", "Preview"]);
wg.templateIntervalType = [{key:"seconds",value:"seconds"},{key:"minutes",value:"minutes"},{key:"hours",value:"hours"}];
wg.templateFilterCond = ko.observableArray([
	{Id:"$and",Title:"AND"},
	{Id:"$or",Title:"OR"},
	{Id:"$nand",Title:"NAND"},
	{Id:"$nor",Title:"NOR"},
]),
wg.templatedesttype = ["database", "csv"];
wg.templateColumnType = [{key:"string",value:"string"},{key:"float",value:"float"},{key:"integer",value:"integer"}, {key:"date",value:"date"}];
wg.operationcondList = ko.observableArray([
	{Id:"$eq",Title:"EQ ( == )"},
	{Id:"$ne",Title:"NE ( != )"},
	{Id:"$gt",Title:"GT ( > )"},
	{Id:"$gte",Title:"GTE ( >= )"},
	{Id:"$lt",Title:"LT ( < )"},
	{Id:"$lte",Title:"LTE ( <= )"},
	{Id:"$regex",Title:"Contains"},
	{Id:"$notcontains",Title:"Not Contains"},
]),
wg.templateScrapperPayload = {
	format: "",
	key: "",
	pattern: "",
	value: "",
};
wg.scrapperPayloads = ko.observableArray([]);
wg.selectorRowSetting = ko.observableArray([]);
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.configSelector = ko.mapping.fromJS(wg.templateConfigSelector);
wg.scrapperColumns = ko.observableArray([
	{ headerTemplate: "<input type='checkbox' class='webgrabbercheckall' onclick=\"wg.checkDeleteWebGrabber(this, 'webgrabberall', 'all')\"/>", width:20, template: function (d) {
		return [
			"<input type='checkbox' class='webgrabbercheck' idcheck='"+d._id+"' onclick=\"wg.checkDeleteWebGrabber(this, 'webgrabber')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Web Grabber ID", width: 130 },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{ title: "", width: 160, attributes: { style: "text-align: center;"}, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster excludethis' onclick='wg.startScrapper(\"" + d._id + "\")' title='Start Service'><span class='fa fa-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster notthis' onclick='wg.stopScrapper(\"" + d._id + "\")' title='Stop Service'><span class='fa fa-stop'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster neitherthis' onclick='wg.viewHistory(\"" + d._id + "\")' title='View History'><span class='fa fa-history'></span></button>", 
		].join(" ");
	} },
	{ field: "calltype", title: "Request Type", width: 150 },
	{ field: "sourcetype", title: "Source Type", width: 150 },
	{ field: "intervaltype", title: "Interval Unit", width: 150 },
	{ field: "grabinterval", title: "Interval Duration", width: 150 },
	{ field: "timeoutinterval", title: "Timeout Duration", width: 150 },
]);
wg.historyColumns = ko.observableArray([
	{ field: "id", title: "ID", filterable: false, width: 50, attributes: { class: "align-center" }}, 
	{ field: "grabstatus", title: "STATUS", attributes: { class: "align-center" }, template: function (d) {
		if (d.grabstatus == "SUCCESS") {
			return '<i class="fa fa-check fa-2x color-green"></i>';
		} else {
			return '<i class="fa fa-times fa-2x color-red"></i>';
		}
	}, filterable: false, width: 60 },
	{ field: "datasettingname", title: "DATA NAME" }, 
	{ field: "grabdate", filterable: { ui: "datetimepicker" }, title: "START", format: "{0:yyyy/MM/dd HH:mm tt}" },
	{ field: "rowgrabbed", title: "GRAB COUNT" },
	{ field: "rowsaved", title: "ROW SAVE" },
	{ field: "notehistory", title: "NOTE" },
	{ title: "&nbsp;", width: 200, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='wg.viewData(" + d.id + ")'><span class='fa fa-file-text'></span> View Data</button>",
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='wg.viewLog(\"" + kendo.toString(d.grabdate, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text-o'></span> View Log</button>"
		].join(" ");
	}, filterable: false }
]);
wg.filterRequestTypes = ko.observable('');
wg.filterDataSourceTypes= ko.observable('');
wg.dataSourceTypes = ko.observableArray([
	{ value: "SourceType_Http", title: "HTTP / Web" },
	{ value: "SourceType_Dbox", title: "Data File" },
]);
wg.dataRequestTypes = ko.observableArray([
	{ value: "GET", title: "GET" },
	{ value: "POST", title: "POST" },
]);

wg.templateConfigConnection = {
	_id: "",
	Driver: "",
	Host: "",
	Database: "",
	UserName: "",
	Password: "",
	Settings: []
};
wg.replaceEqWithNthChild = function (s) {
	return s.replace(/eq\(([^)]+)\)/g, function (e) {
		var i = parseInt(e.split("(").reverse()[0].split(")")[0]) + 1;
		return "nth-child(" + i + ")";
	});
}
wg.configConnection = ko.mapping.fromJS(wg.templateConfigConnection);

wg.editScrapper = function (_id) {
	wg.scrapperMode('edit');
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);

	app.ajaxPost("/webgrabber/selectscrapperdata", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode('editor');
		wg.scrapperMode('edit');
		wg.modeSelector('');
		wg.modeSetting(1);
		ko.mapping.fromJS(wg.templateConfigSelector, wg.configScrapper);
		ko.mapping.fromJS(res.data, wg.configScrapper);

		wg.selectorRowSetting([]);
		res.data.datasettings.forEach(function (item, index) {
			item.filtercond = "";
			item["conditionlist"] = [];
			wg.selectorRowSetting.push(ko.mapping.fromJS(item));
		});

		wg.getURL();
		wg.addScrapperPayload();
	});
};
wg.removeScrapper = function (_id) {
	if (wg.tempCheckIdWebGrabber().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any webgrabber to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
		    title: "Are you sure?",
		    text: 'Web Grabber with id  '+wg.tempCheckIdWebGrabber().toString()+' will be deleted',
		    type: "warning",
		    showCancelButton: true,
		    confirmButtonColor: "#DD6B55",
		    confirmButtonText: "Delete",
		    closeOnConfirm: true
		}, function() {
		    setTimeout(function () {
				app.ajaxPost("/webgrabber/removemultiplewebgrabber", { _id:  wg.tempCheckIdWebGrabber() }, function (res) {
					if (!app.isFine(res)) {
						return;
					}
					wg.backToFront();
					swal({ title: "Data successfully deleted", type: "success" });
				});
		    }, 1000);
		});
	}
};
wg.getScrapperData = function () {
	wg.scrapperData([]);
	app.ajaxPost("/webgrabber/getscrapperdata", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wg.scrapperData(res.data);
		wg.runBotStats();
	});
};
wg.createNewScrapper = function () {
	app.mode("editor");
	ko.mapping.fromJS(wg.templateConfigSelector, wg.configScrapper);
	ko.mapping.fromJS(res.data, wg.configScrapper);
	wg.scrapperMode('');
	wg.isContentFetched(false);
	wg.addScrapperPayload();
	wg.selectorRowSetting([]);
	wg.modeSetting(0);
};
wg.backToFront = function () {
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
	wg.selectorRowSetting([]);
	wg.modeSetting(0);
	app.mode("");
	wg.selectedID('');
	wg.getScrapperData();
	wg.modeSelector("");
	wg.showWebGrabber(false);
};
wg.backToHistory = function () {
	app.mode('history')
};
wg.writeContent = function (html) {
	var baseURL = wg.configScrapper.url().replace(/^((\w+:)?\/\/[^\/]+\/?).*$/,'$1');
	html = html.replace(new RegExp("=\"/", 'g'), "=\"" + baseURL);
	
	var contentDoc = $("#content-preview")[0].contentWindow.document;
	contentDoc.open();
	contentDoc.write(html);
	contentDoc.close();
	return contentDoc;
};
wg.botStats = ko.observableArray([]);
wg.runBotStats = function () {
	wg.botStats().forEach(function (bot) {
		clearInterval(bot.interval);
	});

	var isThereAnyError = false;

	wg.scrapperData().forEach(function (each) {
		var checkStat = function () {
			app.ajaxPost("/webgrabber/stat", { _id: each._id }, function (res) {
				if (res.success) {
					var $grid = $(".grid-web-grabber").data("kendoGrid");
					var row = Lazy($grid.dataSource.data()).find({ _id: res.data.name });

					if (row != undefined) {
						var $tr = $(".grid-web-grabber").find("tr[data-uid='" + row.uid + "']");

						if (res.data.isRun) {
							$tr.addClass("started");
						} else {
							$tr.removeClass("started");
						}
					}
				}

				if (isThereAnyError) {
					return;
				}

				if (!app.isFine(res)) {
					isThereAnyError = true;
					return;
				}
			}, function (a) {
		        sweetAlert("Oops...", a.statusText, "error");
			}, {
				withLoader: false
			});
		};

		wg.botStats.push({ 
			_id: each._id,
			interval: setInterval(checkStat, each.grabinterval * 1000)
		});

		checkStat();
	});
};
wg.parsePayload = function () {
	var parameters = {};
	ko.mapping.toJS(wg.configScrapper).temp.parameters.forEach(function (each) {
		if (each.key == "" || each.value == "") {
			return;
		}

		parameters[each.key] = each.value;
	});

	return (wg.configScrapper.calltype() == "GET") ? null : parameters;
};
wg.getURL = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	var param = {
		URL: wg.configScrapper.url(),
		Method: wg.configScrapper.calltype(),
		Payloads: wg.parsePayload()
	};

	app.ajaxPost("/webgrabber/fetchcontent", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.isContentFetched(true);
		var doc = wg.writeContent(res.data);
		wg.modeSetting(1);

		$("#content-preview").load(function(){
			var startofbody = res.data.indexOf("<body");
			var endofbody = res.data.indexOf("</body");
			var bodyyo = res.data.substr(startofbody,endofbody-startofbody);
			startofbody = bodyyo.indexOf(">");
			bodyyo = bodyyo.substr(startofbody+1);
			URLSource = $.parseHTML(bodyyo);
			$("#inspectElement>ul").replaceWith("<ul></ul>");
			$(URLSource).each(function(i,e){
				if($(this).html()!==undefined){
					linenumber = wg.GetElement($(this),0,0,0,"body", "#inspectElement");
				}
			})
		});
	});
};
wg.getNodeElement = function(obj,classes,id){
	var selector = "", nodeName = obj.get()[0].nodeName.toLowerCase();

	if(id!=="" && id!==undefined)
		selector+= nodeName+"#"+id.split(" ")[0];
	else if(classes!=="" && classes!==undefined)
		selector+= nodeName+"."+classes.split(" ")[0];
	else
		selector+= nodeName;

	return {element: selector, id: id, classes: classes, node: nodeName };
};
wg.GetElement = function(obj,parent,linenumber,index,selector, contentid){
	linenumber +=1;
	var classes = obj.attr("class"), id = obj.attr("id"), nodeName = obj.get()[0].nodeName.toLowerCase(), nodeelement = wg.getNodeElement(obj, classes, id), parentselector = selector;
	if(id !== undefined && id !== "")
		id = "id='"+id+"'";
	else
		id = "";
	
	if( classes !== undefined && classes !== "" )
		classes = "class='"+classes+"'";
	else
		classes = "";

	if (contentid === '#inspectElement2' && linenumber > 1)
		selector2 = selector + " > " + nodeelement.element+":eq("+index+")";
	else if (contentid === '#inspectElement')
		selector2 = selector + " > " + nodeelement.element+":eq("+index+")";

	var indexTemp = $("#content-preview").contents().find(selector2).index()+1;
	// console.log(selector2);
	// console.log($("#content-preview").contents().find(selector2).index());
	if (contentid === '#inspectElement2' && linenumber > 1)
		selector += " > " + nodeelement.element+":nth-child("+indexTemp+")";
	else if (contentid === '#inspectElement')
		selector += " > " + nodeelement.element+":nth-child("+indexTemp+")";

	// console.log(selector);
	$liElem = $("<li id='scw"+linenumber+"' class='selector' parentid='scw"+parent+"'></li>");
	// $liElem.attr({"onclick":"wg.GetCurrentSelector('"+"scw"+linenumber+"','"+selector+"', '"+nodeelement.element+":eq("+index+")')", "indexelem":index});
	$liElem.attr({"onclick":"wg.GetCurrentSelector('"+"scw"+linenumber+"','"+selector+"', '"+nodeelement.element+":nth-child("+indexTemp+")')", "indexelem":index});
	$liElem.appendTo($(contentid+">ul"));

	$divSeqElem = $("<div></div>");
	$divSeqElem.text(linenumber+". ");
	$divSeqElem.css("display","inline");
	$divSeqElem.appendTo($liElem);

	$divContentElem = $("<div></div>");
	$divContentElem.text("<"+nodeName+" "+id+" "+classes+"> "+obj.text().replace(/ /g,'').substring(0,20));
	$divContentElem.css({'margin-left':parseFloat(parent)*10+"px", "display":"inline"});
	$divContentElem.appendTo($liElem);

	if (contentid === '#inspectElement2' && linenumber == 1){
		$liElem.css('display','none');
	}

	var idx = 0, tempIndex = 0, prevNode = new Array();
	obj.children().each(function(i,e){
		var nodeelement = wg.getNodeElement($(this), $(this).attr("class"), $(this).attr("id")), indexsearch = 0;

		var searchElem = ko.utils.arrayFilter(prevNode,function (item,index) {
			if (item.name === nodeelement.element){
				indexsearch = index;
				return item;
			}
        });
        if (searchElem.length == 0){
        	idx=0;
        	prevNode.push({name:nodeelement.element, value: 0});
        	if (nodeelement.element !== nodeelement.node){
	        	var searchElem2 = ko.utils.arrayFilter(prevNode,function (item) {
			        return item.name === nodeelement.node;
			    });
			    if (searchElem2.length == 0){
			    	prevNode.push({name:nodeelement.node, value: 0});
			    }
			}
        } else {
        	if (nodeelement.element !== nodeelement.node){
        		var indexsearch2=0, searchElem2 = ko.utils.arrayFilter(prevNode,function (item,index) {
        			if (item.name === nodeelement.node){
						indexsearch2 = index;
						return item;
					}
			    });
			    prevNode[indexsearch2].value += 1;
        	}
        	idx = prevNode[indexsearch].value + 1;
        	prevNode[indexsearch].value = idx;
        }
		
		if($(this).html()!==undefined && nodeelement.node!== "link" && nodeelement.node !=="script" && nodeelement.node !=="br" && nodeelement.node !=="hr" ){
			linenumber = wg.GetElement($(this),parseFloat(parent+1),linenumber,idx,selector, contentid);
		}
	})
	return linenumber;
};
wg.GetCurrentSelector = function(id,selector, node){
	$("*.selector").attr("class","selector");
	$("#"+id).attr("class","selector active");
	var existingStyle = $(wg.selectedItem(), $("#content-preview").contents()).attr("style");
	
	if(existingStyle!==undefined){
		existingStyle = existingStyle.replace(";border:5px solid #FF9900","");
		existingStyle = existingStyle.replace("border:5px solid #FF9900","");
		$(wg.selectedItem(), $("#content-preview").contents()).attr("style",existingStyle);
	}
	$("body", $("#content-preview").contents()).scrollTop($(selector, $("#content-preview").contents()).offset().top);

	wg.selectedItem(selector);
	wg.selectedItemNode(node);
	existingStyle = "";
	existingStyle = $(selector, $("#URLPreview").contents()).attr("style");
	if(existingStyle!==undefined){
		if(existingStyle[existingStyle.length-1]==";"){
			existingStyle += existingStyle+"border:5px solid #FF9900";
		}else{
			existingStyle += existingStyle+";border:5px solid #FF9900";
		}
		
	}else{
		existingStyle = "border:5px solid #FF9900";
	}
	$(selector, $("#content-preview").contents()).attr("style",existingStyle);
};
wg.CreateElementChild = function(selectorParent){
	$("#inspectElement2>ul").replaceWith("<ul></ul>");
	var childElem = $(selectorParent, $("#content-preview").contents()), idx = 0;
	$(childElem).each(function(i,e){
		if($(this).html()!==undefined){
			linenumber = wg.GetElement($(this),0,0,0,selectorParent, "#inspectElement2");
		}
	})
};
wg.addScrapperPayload = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, wg.templateScrapperPayload));
	wg.configScrapper.temp.parameters.push(item);
};
wg.removeScrapperPayload = function (index) {
	return function () {
		var item = wg.configScrapper.temp.parameters()[index];
		wg.configScrapper.temp.parameters.remove(item);
	};
};
wg.encodePayload = function () {
	wg.configScrapper.Parameter({});

	var p = {};
	wg.configScrapper.temp.parameters().forEach(function (e) {
		p[e.key()] = app.couldBeNumber(e.value());
	});
	wg.configScrapper.Parameter(p);
};
wg.startScrapper = function (_id) {
	app.ajaxPost("/webgrabber/startservice", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.runBotStats();
	});
};
wg.stopScrapper = function (_id) {
	app.ajaxPost("/webgrabber/stopservice", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.runBotStats();
	});
};
wg.viewHistory = function (_id) {
	app.ajaxPost("/webgrabber/gethistory", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.selectedID(_id);
		app.mode('history');
		wg.historyData(res.data);
	});
}
wg.nextSetting = function() {
	if (!app.isFormValid(".form-row-1")) {
		return;
	}

	wg.modeSetting(wg.modeSetting()+1);
	if (wg.selectorRowSetting().length == 0)
		wg.addSelectorSetting();
};
wg.backSetting = function() {
	app.resetValidation(".form-row-selector");
	app.resetValidation(".form-row-column-selector");
	wg.modeSetting(wg.modeSetting()-1);
};
wg.addSelectorSetting = function() {
	wg.selectorRowSetting.push(ko.mapping.fromJS($.extend(true, {}, wg.templateConfigSelector)));
}
wg.removeSelectorSetting = function(each){
	var item = wg.selectorRowSetting()[each];
	wg.selectorRowSetting.remove(item);
}
wg.showSelectorSetting = function(index,nameSelector){
	if (!app.isFormValid(".form-row-selector")) {
		return;
	}

	var selector = ko.mapping.toJS(wg.selectorRowSetting()[index]);
	if (selector.columnsettings.length == 0) {
		selector.columnsettings.push({alias: "", valuetype: "", selector: "", index: 0});
	}
	if (selector.conditionlist.length == 0) {
		selector.conditionlist.push({column: "", operator: "$eq", value: ""});
	}
	ko.mapping.fromJS(selector, wg.configSelector);

	wg.tempIndexColumn(index);
	wg.modeSelector("edit");
	wg.CreateElementChild(selector.rowselector);
}
wg.backSettingSelector = function() {
	if (wg.modeSelector() === 'editElementSelector')
		wg.modeSelector("");
	else if(wg.modeSelector() === 'edit')
		wg.modeSelector("");
	else if (wg.modeSelector() === 'editElementConfig')
		wg.modeSelector("edit");
}
wg.saveSettingSelector = function() {
	if (!app.isFormValid(".form-row-column-selector")) {
		var type = ko.mapping.toJS(wg.configSelector).destoutputtype;
		var totalAllowedForCSV = 0, totalAllowedForDB = 0;
		var errors = $(".form-row-column-selector").data("kendoValidator").errors();

		errors.forEach(function (item) {
			if (type == "csv") {
				if (item.indexOf("FileName") > -1 || item.indexOf("Delimiter") > -1) {
					totalAllowedForCSV++;
				}
			} else {
				if (item.indexOf("ConnectionId") > -1 || item.indexOf("Collection") > -1) {
					totalAllowedForDB++;
				}
			}
		});

		if (type == "csv") {
			if (errors.length >= 0 && totalAllowedForCSV == 0) {

			} else {
				return;
			}
		} else {
			if (errors.length >= 0 && totalAllowedForDB == 0) {

			} else {
				return;
			}
		}
	}

	var selector = ko.mapping.toJS(wg.configSelector);
	wg.selectorRowSetting.replace(wg.selectorRowSetting()[wg.tempIndexColumn()], selector);

	wg.modeSelector("");
}
wg.addColumnSetting = function() {
	var selector = $.extend(true, {}, ko.mapping.toJS(wg.configSelector));
	selector.columnsettings.push({
		alias: "", 
		valuetype: "", 
		selector: "", 
		index: wg.configSelector.columnsettings().length - 1
	});

	ko.mapping.fromJS(selector, wg.configSelector);
}
wg.removeColumnSetting = function(each){
	var item = wg.configSelector.columnsettings()[each];
	wg.configSelector.columnsettings.remove(item);
}
wg.addFilterCondition = function() {
	var selector = $.extend(true, {}, ko.mapping.toJS(wg.configSelector));
	selector.conditionlist.push({
		column: "", 
		operator: "$eq", 
		value: ""
	});

	ko.mapping.fromJS(selector, wg.configSelector);
}
wg.removeFilterCondition = function(each){
	var item = wg.configSelector.conditionlist()[each];
	wg.configSelector.conditionlist.remove(item);
}
wg.GetRowSelector = function(index){
	if (wg.modeSelector() === ''){
		ko.mapping.fromJS(wg.selectorRowSetting()[index],wg.configSelector);
		wg.tempIndexColumn(index);
		wg.modeSelector("editElementSelector");
	} else {
		wg.tempIndexSetting(index);
		wg.modeSelector("editElementConfig");
	}
	wg.selectedItem('');
};
wg.saveSelectedElement = function(index){
	app.resetValidation(".form-row-selector");
	if (wg.modeSelector() === 'editElementSelector'){
		wg.selectorRowSetting()[index].rowselector(wg.replaceEqWithNthChild(wg.selectedItem()));
		wg.modeSelector("");
	} else {
		wg.configSelector.columnsettings()[wg.tempIndexSetting()].selector(wg.replaceEqWithNthChild(wg.selectedItemNode()));
		wg.modeSelector("edit");
	}
	wg.selectedItem('');
};
wg.parseGrabConf = function () {
	wg.configSelector.desttype(wg.configSelector.destoutputtype());

	var config = ko.mapping.toJS(wg.configScrapper);
	config.datasettings = ko.mapping.toJS(wg.selectorRowSetting).map(function (item) {
		if (typeof item.connectioninfo.useheader == "string") {
			item.connectioninfo.useheader = (item.connectioninfo.useheader == "true");
		}

		item.rowselector = wg.replaceEqWithNthChild(item.rowselector);
		item.columnsettings = item.columnsettings.map(function (c) {
			c.selector = wg.replaceEqWithNthChild(c.selector);
			return c;
		});
		
		var condition = {}, conditionlist = item.conditionlist, columnsettings = item.columnsettings;
		condition[item.filtercond] = [];
		if (item.filtercond != ''){
			for (var key in conditionlist){
				var obj = {}, col = conditionlist[key].column, operation = conditionlist[key].operator, val = conditionlist[key].value;
				obj[col] = {};
				var format = ko.utils.arrayFilter(columnsettings,function (item) {
			        return item.alias == col;
			    });
				switch (format[0]){
					case "integer":
						obj[col][operation] = parseInt(val);
						break;
					case "float":
						obj[col][operation] = parseFloat(val);
						break;
					default:
						obj[col][operation] = val;
						break;
				}
				condition[item.filtercond].push(obj);
			}
			item.filtercond = condition;
		} else {
			item.filtercond = {};
		}
		delete item["conditionlist"];

		return item;
	});
	config.nameid = config._id;

	var grabConfData = {};
	var tempParameters = [];
	config.temp.parameters.forEach(function (each) {
		if (each.key == "" || each.value == "") {
			return;
		}

		tempParameters.push(each);

		if ($.trim(each.pattern) != "") {
			grabConfData[each.key] = "Date2String(" + each.pattern + ",'" + each.format + "')";
		} else {
			grabConfData[each.key] = String(each.value);
		}
	});

	config.grabconf.data = grabConfData;
	config.temp.parameters = tempParameters;
	return config;
};
wg.saveSelectorConf = function(){
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	if (!app.isFormValid(".form-row-selector")) {
		return;
	}

	var config = wg.parseGrabConf();
	app.ajaxPost("/webgrabber/savescrapperdata", config, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		app.mode("");
		wg.modeSetting(0);
		ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
		wg.selectorRowSetting([]);
		wg.getScrapperData();
		wg.modeSelector("");
	});
}
wg.viewData = function (id) {
	var base = Lazy(wg.scrapperData()).find({ nameid: wg.selectedID() });
	var row = Lazy(wg.historyData()).find({ id: id });

	var param = {
		Driver: "csv",
		Host: row.recfile,
		Database: "",
		Collection: "",
		Username: "",
		Password: ""
	};

	if (base.datasettings.length > 0) {
		var baseSetting = base.datasettings[0];
		param.Driver = baseSetting.destoutputtype;

		if (baseSetting.desttype == "database") {
			param.Host = baseSetting.Host;
			param.Database = baseSetting.connectioninfo.database;
			param.Collection = baseSetting.connectioninfo.collection;
			param.Username = baseSetting.connectioninfo.username;
			param.Password = baseSetting.connectioninfo.password;
		} else {
			param.FileName = baseSetting.connectioninfo.filename;
			param.UseHeader = baseSetting.connectioninfo.useheader;
			param.Delimiter = baseSetting.connectioninfo.delimiter;
		}
	}

	$(".grid-data").replaceWith('<div class="grid-data"></div>');
	
	app.ajaxPost("/webgrabber/getfetcheddata", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		var columns = [{ title: "&nbsp;", width: 5 }];
		var data = res.data.map(function (e) {
			var f = {};

			for (var key in e) {
				if (e.hasOwnProperty(key)) {
					f[key.replace(/ /g, "_")] = e[key];
				}
			} 

			return f;
		});

		if (data.length > 0) {
			columns[0].locked = true;
			var sample = data[0];

			for (var key in sample) {
				if (sample.hasOwnProperty(key)) {
					var column = { field: key, width: 100 };
					columns.push(column);
				}
			}
		}

		var gridConfig = {
			dataSource: { 
				pageSize: 10,
				data: data
			}, 
			columns: columns,
			filterfable: false,
			pageable: true
		};

		app.mode('data');
		$(".grid-data").kendoGrid(gridConfig);
	});
};
wg.viewLog = function (date) {
	wg.logData('');

	var param = { date: date, _id: wg.selectedID() };
	app.ajaxPost("/webgrabber/getlog", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode('log');

		try {
			wg.logData(res.data.logs.join(''));
		} catch (err) {

		}
	});
};

function filterWebGrabber(event) {
	app.ajaxPost("/webgrabber/findwebgrabber", {inputText : wg.valWebGrabberFilter()}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		console.log(res.data);
		wg.scrapperData(res.data);
	});
}

wg.getConnection = function () {
	var param = ko.mapping.toJS(wg.configConnection);
	app.ajaxPost("/datasource/getconnections", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wg.connectionListData(res.data);
	});
};

wg.changeConnectionID = function (e) {
	app.resetValidation(".form-row-column-selector");

	var _id = this.value();
	app.ajaxPost("/datasource/selectconnection", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		if (res.data.Driver != 'mongo') {
			wg.collectionInput(false);
			swal({ title: "Connection driver is " + res.data.Driver + ". Currently supported connection driver only \"mongo\"", type: "success" });
			return;
		} else {
			wg.collectionInput(true);
		}
		
		wg.configSelector.desttype(res.data.Driver);
		var connInfo = wg.configSelector.connectioninfo;
		connInfo.connectionid(_id);
		connInfo.host(res.data.Host);
		connInfo.database(res.data.Database);
		connInfo.username(res.data.UserName);
		connInfo.password(res.data.Password);
	});

	return true;
};

wg.selectGridWebGrabber = function(e){
	var grid = $(".grid-web-grabber").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	var target = $( event.target );
	if ( $(target).parents( ".excludethis" ).length ) {
	    return false;
	  }else if ($(target).parents(".notthis").length ) {
	  	return false;
	  }else if ($(target).parents(".neitherthis" ).length ) {
	  	return false;
	  }else{
		wg.editScrapper(selectedItem._id);
	  }
	wg.showWebGrabber(true);
};

wg.checkDeleteWebGrabber = function(elem, e){
	if (e === 'webgrabberall'){
		if ($(elem).prop('checked') === true){
			$('.webgrabbercheck').each(function(index) {
				$(this).prop("checked", true);
				wg.tempCheckIdWebGrabber.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.webgrabbercheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				wg.tempCheckIdWebGrabber.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			wg.tempCheckIdWebGrabber.push($(elem).attr('idcheck'));
		} else {
			wg.tempCheckIdWebGrabber.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}

$(function () {
	wg.getConnection();
	wg.getScrapperData();
});