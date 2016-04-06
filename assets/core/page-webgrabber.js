app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;

wg.isDaemonRunning = ko.observable(false);
wg.logData = ko.observable('');
wg.scrapperMode = ko.observable('');
wg.modeSetting = ko.observable(0);
wg.modeSelector = ko.observable("");
wg.tempIndexColumn = ko.observable(0);
wg.tempIndexSetting = ko.observable(0);
wg.scrapperData = ko.observableArray([]);
wg.historyData = ko.observableArray([]);
wg.viewLogData = ko.observableArray([]);
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
wg.breadcrumb = ko.observable('');
wg.tempCheckIdWebGrabber = ko.observableArray([]);
wg.searchfield = ko.observable('');
wg.filtercond = ko.observable('');
wg.modeSetup = ko.observable();
wg.timePreset = ko.observable();
wg.selectedSeconds = ko.observable(0);
wg.selectedMinutes = ko.observable(0);
wg.selectedHour = ko.observable('');
wg.selectedDay = ko.observable('');
wg.selectedMonth = ko.observable('');
wg.selectedDayweek = ko.observable('');
wg.hours = ko.observableArray([]);
wg.minutes = ko.observableArray([]);
wg.seconds = ko.observableArray([]);
wg.days = ko.observableArray([]);
wg.months = ko.observableArray([
	{value: 1 , title: "January"},
	{value: 2 , title: "February"},
	{value: 3 , title: "March"},
	{value: 4 , title: "April"},
	{value: 5 , title: "May"},
	{value: 6 , title: "June"},
	{value: 7 , title: "July"},
	{value: 8 , title: "August"},
	{value: 9 , title: "September"},
	{value: 10 , title: "October"},
	{value: 11 , title: "November"},
	{value: 12 , title: "December"},
]);
wg.dayweek = ko.observableArray([
	{value: 0 , title: "Sunday"},
	{value: 1 , title: "Monday"},
	{value: 2 , title: "Tuesday"},
	{value: 3 , title: "Wednesday"},
	{value: 4 , title: "Thursday"},
	{value: 5 , title: "Friday"},
	{value: 6 , title: "Saturday"},
]);
for (var i = 0; i < 60; i++) {
	wg.minutes.push(""+i+"")
	wg.seconds.push(""+i+"")
}
for (var hour = 0; hour < 24; hour++) {
	wg.hours.push(""+hour+"")
}
for (var day = 1; day <= 31; day++) {
	wg.days.push(day)
}
wg.templateConfigScrapper = {
    _id: "",
    sourcetype: "SourceType_HttpHtml",
    grabconf:
            {
                "url": "http://www.google.com",
                "calltype": "GET",
                "authtype" : "",
                "loginurl" : "", 
                "logouturl" : "", 
                "username" : "",
                "password" : "", 
                "formvalues": {},
                "timeout" : 20,
                "temp" : {
                	"parameters" : []
                }

            },
    intervalconf:
            {
                "starttime": new Date(),
                "expiredtime": new Date(),
                "intervaltype": "seconds",
                "grabinterval": "20" ,
                "timeoutinterval": "20",
                "cronconf": {}
            },
    logconf:
            {
                "logpath": "",
                "filename": "LOG-GRABDCE",
                "filepattern": ""
            },
    histconf:
            {
                "histpath": "",
                "recpath": "",
                "filename": "HIST-GRABDCE",
                "filepattern": "YYYYMMDD"
            },
    datasettings: [],
    running: false
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
wg.taskMode = ko.observableArray([
	{value: "hourly", title:"Hourly"},
	{value: "daily", title: "Daily"},
	{value: "weekly", title: "Weekly" },
	{value: "monthly", title: "Monthly" },
	{value: "yearly", title: "Yearly"},
	{value: "custom", title: "Custom" },
]);
wg.templateCron = {
	second : "*",
	min: "",
	hour: "",
	dayofmonth: "",
	month: "",
	dayofweek: "",
	mode:"hourly", 

}
wg.templateConfigSelector = {
	nameid: "",
	rowselector: "",
	filtercond: "",
	limitrow: {
		"take" : 0,
		"skip" : 0,
	},
	conditionlist: [],
	destoutputtype: "database",
	desttype: "mongo",
	columnsettings: [],
	connectioninfo: {
		host: "",
		database: "",
		username: "",
		password: "",
		collection: "",
		connectionid: "",
		settings: {
			filename: "",
			useheader: true,
			delimiter: "",
		}
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
wg.configSetup = ko.observableArray([
	{value: "onetime", title:"One Time"},
	{value: "interval", title: "Interval"},
	{value: "schedule", title: "Schedule" }
]);
wg.scrapperPayloads = ko.observableArray([]);
wg.selectorRowSetting = ko.observableArray([]);
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.configSelector = ko.mapping.fromJS(wg.templateConfigSelector);
wg.configCron = ko.mapping.fromJS(wg.templateCron);
wg.scrapperColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='webgrabbercheckall' onclick=\"wg.checkDeleteWebGrabber(this, 'webgrabberall', 'all')\"/></center>", width: 40, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<input type='checkbox' class='webgrabbercheck' idcheck='"+d._id+"' onclick=\"wg.checkDeleteWebGrabber(this, 'webgrabber')\" />"
		].join(" ");
	}, locked: true },
	{ field: "_id", title: "Web Grabber ID", width: 130, locked: true },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>", locked: true },
	{ title: "", width: 160, attributes: { style: "text-align: center;"}, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' onclick='wg.startScrapper(\"" + d._id + "\")' title='Start Service'><span class='fa fa-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster' onclick='wg.stopScrapper(\"" + d._id + "\")' title='Stop Service'><span class='fa fa-stop'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' onclick='wg.viewHistory(\"" + d._id + "\")' title='View History'><span class='fa fa-history'></span></button>", 
		].join(" ");
	}, locked: true },
	{ field: "grabconf.calltype", title: "Request Type", width: 150 },
	{ field: "sourcetype", title: "Source Type", width: 150 },
	{ title: "Execution setting", template: function (d) {
		var k = JSON.parse(kendo.stringify(d));

		if($.isEmptyObject(k.intervalconf.cronconf) === true && k.intervalconf.intervaltype == ""){
			return 'onetime';
		}

		if($.isEmptyObject(k.intervalconf.cronconf) === false){
			return 'schedule';
		}

		if(k.intervalconf.intervaltype != ""){
			return 'interval';
		}

		return "invalid setting";
	}, width: 150 },
	// { field: "intervalconf.intervaltype", title: "Interval Unit", width: 150 },
	// { field: "intervalconf.grabinterval", title: "Interval Duration", width: 150 },
	// { field: "intervalconf.timeoutinterval", title: "Timeout Duration", width: 150 },
	{ field: "note", title: "NOTE", encoded: false, filterable: false, width: 200 },
]);
wg.historyColumns = ko.observableArray([
	{ field: "id", title: "ID", filterable: false, width: 50, attributes: { class: "align-center" }}, 
	{ field: "grabstatus", title: "STATUS", attributes: { class: "align-center" }, template: function (d) {
		if (["SUCCESS", "done", "running"].indexOf(d.grabstatus) > -1) {
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
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='wg.viewHistoryRecord(" + d.id + ")'><span class='fa fa-file-text'></span> View Records</button>",
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='wg.viewLog(\"" + kendo.toString(d.grabdate, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text-o'></span> View Log</button>"
		].join(" ");
	}, filterable: false }
]);
wg.viewLogColumns = ko.observableArray([
	{ field: "Type",title: "Type", filterable: false, width: 30}, 
	{ field: "Date",title: "Date", filterable: false, width: 30, attributes: { class: "align-center" }}, 
	{ field: "Desc",title: "Description", filterable: false, width: 200}, 
	]);
wg.filterRequestTypes = ko.observable('');
wg.filterRequestLogView = ko.observable('');
wg.searchRequestLogView = ko.observable('');
wg.filterDataSourceTypes= ko.observable('');
wg.tempViewLog = ko.observableArray([]);
wg.dataSourceTypes = ko.observableArray([
	{ value: "SourceType_HttpHtml", title: "HTTP / Web" },
	{ value: "SourceType_HttpJson", title: "HTTP / Json" },
	//{ value: "SourceType_DocExcel", title: "Data File" },
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

wg.dataAuthType = ko.observableArray([
	//{value : "_blank" , title : "Default"},
	{value : "AuthType_Basic" , title : "Basic"},
	{value : "AuthType_Cookie", title: "Cookie"},
	{value : "AuthType_Session" , title : "Session"},
]);
wg.dataRequestLogView = ko.observableArray([
	{ value: "Type", title: "Type" },
	{ value: "Desc", title: "Description" },
]);
wg.replaceEqWithNthChild = function (s) {
	return s.replace(/eq\(([^)]+)\)/g, function (e) {
		var i = parseInt(e.split("(").reverse()[0].split(")")[0]) + 1;
		return "nth-child(" + i + ")";
	});
}
wg.configConnection = ko.mapping.fromJS(wg.templateConfigConnection);

wg.checkDaemonStatus = function () {
	app.ajaxPost("/webgrabber/daemonstat", {}, function (res) {
		wg.isDaemonRunning(res.data);
	}, {
		withLoader: false
	});
};
wg.toggleDaemon = function (to) {
	return function () {
		app.ajaxPost("/webgrabber/daemontoggle", { op: to }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			setTimeout(function(){
				wg.checkDaemonStatus()
			},300)
		});
	};
};
wg.editScrapper = function (_id) {
	app.miniloader(true);
	app.showfilter(false);
	wg.scrapperMode('edit');
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);

	app.ajaxPost("/webgrabber/selectscrapperdata", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode('editor');
		wg.breadcrumb('Edit');		
		wg.scrapperMode('edit');
		wg.modeSelector('');
		wg.modeSetting(1);
		ko.mapping.fromJS(wg.templateConfigSelector, wg.configScrapper);
		ko.mapping.fromJS(res.data, wg.configScrapper);

		if($.isEmptyObject(wg.configScrapper.intervalconf.cronconf) === true && wg.configScrapper.intervalconf.intervaltype() == ""){
			wg.modeSetup('onetime');
		}

		if($.isEmptyObject(wg.configScrapper.intervalconf.cronconf) === false){
			wg.modeSetup('schedule');
			ko.mapping.fromJS(wg.configScrapper.intervalconf.cronconf, wg.configCron);
		}

		if(wg.configScrapper.intervalconf.intervaltype() != ""){
			wg.modeSetup('interval');
		}

		var parseValue = function (row) {
			var totalEls = 0;
			for (var k in row) if (row.hasOwnProperty(k)) {
				var column = k;
				var operator = "$eq";
				var value = "";

				if (row[k] instanceof Object) {
					for (var l in row[k]) if (row[k].hasOwnProperty(l)) {
						operator = l;
						value = row[k][l];
					}
				} else {
					value = row[k];
				}

				return {
					column: column,
					operator: operator,
					value: value
				};
			}
		}

		wg.selectorRowSetting([]);
		res.data.datasettings.forEach(function (item, index) {
			item.conditionlist = [];

			for (var k in item.filtercond) if (item.filtercond.hasOwnProperty(k)) {
				var isComparisonExists = Lazy(wg.templateFilterCond()).find({ Id: k });

				if (typeof isComparisonExists === "undefined") {
					wg.configSelector.filtercond("$and");

					var parsedValue = parseValue(item.filtercond[k])
					item.conditionlist.push(parsedValue);
				} else {
					wg.configSelector.filtercond(k);
					item.filtercond[k].forEach(function (d) {
						var parsedValue = parseValue(d);
						item.conditionlist.push(parsedValue);
					});
				}
			}

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
	app.ajaxPost("/webgrabber/getscrapperdata", {search: wg.searchfield, requesttype: wg.filterRequestTypes, sourcetype: wg.filterDataSourceTypes}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data = [];;
		}

		res.data = res.data.map(function (each) {
			each.note = "Start 0 <br> Grab 0 times <br> Data retreive 0 rows <br> Error 0 times";
			return each;
		});

		wg.scrapperData(res.data);
		wg.runBotStats();
	});
};
wg.createNewScrapper = function () {
	wg.breadcrumb('Create New');
	app.showfilter(false);
	app.mode("editor");
	ko.mapping.fromJS(wg.templateConfigSelector, wg.configScrapper);
	ko.mapping.fromJS(wg.templateCron, wg.configCron);
	//ko.mapping.fromJS(res.data, wg.configScrapper);
	wg.scrapperMode('');
	wg.isContentFetched(false);
	wg.addScrapperPayload();
	wg.selectorRowSetting([]);
	wg.modeSetting(0);
	wg.modeSetup('');
	wg.filtercond('');
	//wg.timePreset('');
};
wg.backToFront = function () {
	wg.breadcrumb('All');
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
	wg.selectorRowSetting([]);
	wg.modeSetting(0);
	app.mode("");
	wg.selectedID('');
	wg.getScrapperData();
	wg.filtercond('');
	wg.modeSelector("");
	wg.showWebGrabber(false);
	wg.scrapperMode('');
	wg.modeSetup('');
	wg.timePreset('');
	wg.configScrapper.intervalconf.cronconf = {};
	ko.mapping.fromJS(wg.templateCron, wg.configCron);
};
wg.backToHistory = function () {
	app.mode('history')
};
wg.writeContent = function (html) {
	var baseURL = wg.configScrapper.grabconf.url().replace(/^((\w+:)?\/\/[^\/]+\/?).*$/, '$1');
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

	if (wg.scrapperData() != "") {
		wg.scrapperData().forEach(function (each) {
			var checkStat = function () {
				app.ajaxPost("/webgrabber/stat", { _id: each._id }, function (res) {
					var $grid = $(".grid-web-grabber").data("kendoGrid");
					var row = Lazy($grid.dataSource.data()).find({ _id: each._id });

					if (row != undefined) {
						var $tr = $(".grid-web-grabber").find(".k-grid-content-locked tr[data-uid='" + row.uid + "']");

						if (res.success) {
							if (res.data) {
								$tr.addClass("started");
							} else {
								$tr.removeClass("started");
							}
						}

						app.ajaxPost("/webgrabber/getsnapshot", { nameid: each._id }, function (res2) {
							if (!res2.success) {
								return;
							}

							var $tr2 = $(".grid-web-grabber").find(".k-grid-content tr[data-uid='" + row.uid + "']");
							var $td = $tr2.find("td:eq(3)");
							if (res2.data.length > 0) {
								var k = res2.data[0];
						        var summary = [
						        	"Start",  k.starttime,
						        	"<br> Grab",  k.grabcount,
						        	"times <br> Data retreive",  k.rowgrabbed,
						        	"rows <br> Error",  k.errorfound,
						        	"times"
						        ].join(" ");
								$td.html(summary);
							}
						}, {
							withLoader: false
						});
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

			var interval = (each.grabinterval == undefined ? 20 : (each.grabinterval <= 0 ? 20 : each.grabinterval));

			wg.botStats.push({ 
				_id: each._id,
				interval: setInterval(checkStat, interval * 1000)
			});

			checkStat();
		});
	}
};
wg.parsePayload = function () {
	var parameters = {};
	ko.mapping.toJS(wg.configScrapper).grabconf.temp.parameters.forEach(function (each) {
		if (each.key == "" || each.value == "") {
			return;
		}

		parameters[each.key] = each.value;
	});

	return (wg.configScrapper.grabconf.calltype() == "GET") ? null : parameters;
};
wg.getURL = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		if(wg.configScrapper.grabconf.authtype() == ''){
			var errors = $(".form-scrapper-top").data("kendoValidator").errors();
			errors = Lazy(errors).filter(function (d) {
				return ["Login Url cannot be empty","Logout Url cannot be empty","Username cannot be empty","Password cannot be empty"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}else if(wg.configScrapper.grabconf.authtype() == 'AuthType_Basic'){
			var errors = $(".form-scrapper-top").data("kendoValidator").errors();
			errors = Lazy(errors).filter(function (d) {
				return ["Login Url cannot be empty","Logout Url cannot be empty"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}
		else{
			return;
		}
	}
	var param = {
		URL: wg.configScrapper.grabconf.url(),
        Method: wg.configScrapper.grabconf.calltype(),
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
	});
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
	wg.configScrapper.grabconf.temp.parameters.push(item);
};
wg.removeScrapperPayload = function (index) {
	return function () {
		var item = wg.configScrapper.grabconf.temp.parameters()[index];
        wg.configScrapper.grabconf.temp.parameters.remove(item);
	};
};
wg.encodePayload = function () {
	wg.configScrapper.Parameter({});

	var p = {};
	wg.configScrapper.grabconf.temp.parameters().forEach(function (e) {
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
		if(wg.modeSetup() != 'interval'){
			var errors = $(".form-row-1").data("kendoValidator").errors();
			errors = Lazy(errors).filter(function (d) {
				return ["Interval Type cannot be empty","Start time cannot be empty","Expired time cannot be empty","Grab Interval cannot be empty","Timeout Interval cannot be empty"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}else{
			return;
		}
		
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

		if (type == "csv") {
			errors = Lazy(errors).filter(function (d) {
				return ["Connection cannot be empty","Collection is required"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		} else if(type == 'database'){
			errors = Lazy(errors).filter(function (d) {
				return ["FileName is required","Delimiter is required"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}else{
			return;
		}

	}

	if(wg.filtercond() !== "" && wg.isJson(wg.filtercond()) == false){
		swal({ title: "Invalid Filter condition", type: "error" });
	}else{
		var selector = ko.mapping.toJS(wg.configSelector);
		wg.selectorRowSetting.replace(wg.selectorRowSetting()[wg.tempIndexColumn()], selector);
		wg.modeSelector("");
	}
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
wg.DeleteColumnSelector = function(index){
	if (wg.configScrapper.columnsettings().length > index) {
		var item = wg.configScrapper.columnsettings()[index];
		wg.configScrapper.columnsettings.remove(item);
	}
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
		if (typeof item.connectioninfo.settings.useheader == "string") {
			item.connectioninfo.settings.useheader = (item.connectioninfo.settings.useheader == "true");
		}

		item.rowselector = wg.replaceEqWithNthChild(item.rowselector);
		item.columnsettings = item.columnsettings.map(function (c) {
			c.selector = wg.replaceEqWithNthChild(c.selector);
			return c;
		});

		if (item.filtercond == null || item.filtercond == "") {
			item.filtercond = {};
		} else {
			var conditions = item.conditionlist.map(function (cl) {
				var obj = {};
				obj[cl.column] = {};

				var format = ko.utils.arrayFilter(item.columnsettings, function (each) {
			        return each.alias == cl.column;
				});

				if (format.length > 0) {
					switch (format[0]) {
						case "integer": obj[cl.column][cl.operator] = parseInt(cl.value, 10); break;
						case "float":   obj[cl.column][cl.operator] = parseFloat(cl.value); break;
						default:        obj[cl.column][cl.operator] = cl.value; break;
					}
				}

				return obj;
			});

			var filtercond = {};
			filtercond[item.filtercond] = conditions;
			item.filtercond = filtercond;
			console.log("filtercond", filtercond);
		}
		
		delete item["conditionlist"];
		delete item["__ko_mapping__"];

		return JSON.parse(ko.mapping.toJSON(item));
	});

	var modeSetup = wg.modeSetup();
	if(modeSetup == 'schedule'){
		var cron =ko.mapping.toJS(wg.configCron);
		var cronconf = {
			second : (cron.second),
			min: (cron.min == "" ? "*" : cron.min),
			hour: (cron.hour == "" ? "*" : cron.hour),
			dayofmonth: (cron.dayofmonth == "" ? "*" : cron.dayofmonth),
			month: (cron.month == "" ? "*" : cron.month),
			dayofweek: (cron.dayofweek == "" ? "*" : cron.dayofweek),
			mode: cron.mode
		};

		config.intervalconf.cronconf = cronconf;
		config.intervalconf.expiredtime = "";
		config.intervalconf.starttime = "";
		config.intervalconf.intervaltype = "";
		config.intervalconf.grabinterval = 0;
		config.intervalconf.timeoutinterval = 0;
	}
	else if(modeSetup == 'onetime'){
		config.intervalconf.expiredtime = "";
		config.intervalconf.intervaltype = "";
		config.intervalconf.grabinterval = 0;
		config.intervalconf.timeoutinterval = 0;
		config.intervalconf.cronconf = {};
	}else{
		config.intervalconf.cronconf = {};
	}


	config.intervalconf.grabinterval = parseInt(config.intervalconf.grabinterval, 10);
	config.intervalconf.timeoutinterval = parseInt(config.intervalconf.timeoutinterval, 10);

	var grabConfData = {};
	var tempParameters = [];
	config.grabconf.temp.parameters.forEach(function (each) {
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

	config.grabconf.formvalues = grabConfData;
	config.grabconf.temp.parameters = tempParameters;

	return config;
};
wg.saveSelectorConf = function(){
	if (!app.isFormValid(".form-scrapper-top")) {
		if(wg.configScrapper.grabconf.authtype() == ''){
			var errors = $(".form-scrapper-top").data("kendoValidator").errors();
			errors = Lazy(errors).filter(function (d) {
				return ["Login Url cannot be empty","Logout Url cannot be empty","Username cannot be empty","Password cannot be empty"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}else if(wg.configScrapper.grabconf.authtype() == 'AuthType_Basic'){
			var errors = $(".form-scrapper-top").data("kendoValidator").errors();
			errors = Lazy(errors).filter(function (d) {
				return ["Login Url cannot be empty","Logout Url cannot be empty"].indexOf(d) == -1;
			}).toArray();

			if (errors.length > 0) {
				return;
			}
		}
		else{
			return;
		}
	}
	if (!app.isFormValid(".form-row-selector")) {
		return;
	}

	var config = wg.parseGrabConf();
	//console.log("Old Json",config)
	
	app.ajaxPost("/webgrabber/savescrapperdata", config, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		app.mode("");
		wg.modeSetting(0);
		ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
		ko.mapping.fromJS(wg.templateCron, wg.configCron);
		wg.selectorRowSetting([]);
		wg.getScrapperData();
		wg.modeSelector("");
		wg.modeSetup("");
		wg.filtercond("");
	});
}
wg.viewHistoryRecord = function (id) {
	var base = Lazy(wg.scrapperData()).find({ _id: wg.selectedID() });
	var row = Lazy(wg.historyData()).find({ id: id });

	$(".grid-data").replaceWith('<div class="grid-data"></div>');
	app.ajaxPost("/webgrabber/getfetcheddata", { recfile: row.recfile }, function (res) {
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
			// wg.logData(res.data.logs.join(''));
			wg.logData(res.data.logs);
			wg.tempViewLog(wg.logData());
		} catch (err) {

		}
	});
};

wg.findLogView = function(){
	wg.tempViewLog(wg.logData());
	var obj = wg.tempViewLog();
	var key = wg.filterRequestLogView();
	var val = wg.searchRequestLogView();
	if (val == ""){
		wg.tempViewLog(wg.logData());
		return false
	}
	
	var returnedData = $.grep(obj, function (element, index) {
		if (key == "Desc"){
			return element.Desc == val;
		}else{
			return element.Type == val;
		}
	    
	});
	wg.tempViewLog([]);
    wg.tempViewLog(returnedData);

}

wg.refreshLogView = function(){
	wg.filterRequestLogView("");
	wg.searchRequestLogView("");
	wg.tempViewLog(wg.logData());
}

function filterWebGrabber(event) {
	app.ajaxPost("/webgrabber/findwebgrabber", {inputText : wg.valWebGrabberFilter()}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		wg.scrapperData(res.data);
	});
}

wg.getConnection = function () {
	app.ajaxPost("/datasource/getconnections", { search: "", driver: "" }, function (res) {
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

		// if (res.data.Driver != 'mongo') {
		// 	wg.collectionInput(false);
		// 	swal({ title: "Connection driver is " + res.data.Driver + ". Currently supported connection driver only \"mongo\"", type: "success" });
		// 	return;
		// } else {
		// 	wg.collectionInput(true);
		// }
		
		wg.configSelector.desttype(res.data.Driver);
		var connInfo = wg.configSelector.connectioninfo;
		connInfo.connectionid(_id);
		connInfo.host(res.data.Host);
		connInfo.database(res.data.Database);
		connInfo.username(res.data.UserName);
		connInfo.password(res.data.Password);
		for (key in res.data.Settings) {
			if (res.data.Settings.hasOwnProperty(key)) {
				var val = res.data.Settings[key];
				if (connInfo.settings.hasOwnProperty(key)) {
					connInfo.settings[key](val);
				} else {
					connInfo.settings[key] = ko.observable(val);
				}
			}
		}
	});

	return true;
};

wg.selectGridWebGrabber = function (e) {
	app.wrapGridSelect(".grid-web-grabber", ".btn", function (d) {
		wg.editScrapper(d._id);
		wg.showWebGrabber(true);
	});
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

wg.showSetupForm = function(mode){
	$("#IntervalMode").hide();
	$("#ScheduleMode").hide();
	$("#Onetime").hide();

}

wg.isJson = function(str) {
    try {
        var obj = JSON.parse(str);
         //console.log("Valid JSON",obj)
    } catch (e) {
     var obj = "Error: Parse error"
     //console.log(obj)
        return false;
    }
    return true;
}
$(function () {
	wg.breadcrumb('All');
	app.showfilter(false);
	wg.getConnection();
	wg.getScrapperData();
	app.registerSearchKeyup($(".search"), wg.getScrapperData);
	wg.checkDaemonStatus();
	setInterval(wg.checkDaemonStatus, 1000 * 10);
});