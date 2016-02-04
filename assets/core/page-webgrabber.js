app.section('scrapper');

viewModel.webGrabber = {}; var wg = viewModel.webGrabber;

wg.logData = ko.observable('');
wg.scrapperMode = ko.observable('');
wg.modeSetting = ko.observable(0);
wg.modeSelector = ko.observable("");
wg.tempIndexColumn = ko.observable(0);
wg.scrapperData = ko.observableArray([]);
wg.historyData = ko.observableArray([]);
wg.isContentFetched = ko.observable(false);
wg.selectedID = ko.observable('');
wg.templateConfigScrapper = {
	_id: "",
	calltype: "GET",
	intervaltype: "",
	sourcetype: "SourceType_Http",
	grabinterval: 0,
	timeoutinterval: 0,
	url: "http://www.shfe.com.cn/en/products/Gold/",
	logconf: {
		filename: "",
		filepattern: "",
		logpath: ""
	},
	grabconf: {},
	datasettings: []
};
wg.templateDataSetting = {
	rowselector: "",
	columnsettings: [],
	rowdeletecond: {},
	rowincludecond: {},
	connectioninfo: {
		host: "",
		database: "",
		username: "",
		password: "",
		settings: "",
		collection: ""
	},
	desttype: "",
	name: ""
};
wg.templateColumnSetting = {
	alias: "",
	index: "",
	selector: "",
	valuetype: ""
}
wg.templateConfigSelector = {
	SelectorName: "",
	RowSelector: "",
	SelectorSetting: {
		ColumnSetting: [],
		FilterCond: "",
		DestinationType: "Mongo",
		Host: "",
		Database: "",
		Collection: "",
		FileName: "",
		UseHeader: true,
		Delimiter: ","
	}
}
wg.templateStepSetting = ko.observableArray(["Set Up", "Data Setting", "Preview"]);
wg.templateIntervalType = [{key:"s",value:"seconds"},{key:"m",value:"minutes"},{key:"h",value:"hours"}];
wg.templateFilterCond = ["Add", "OR", "NAND", "NOR"];
wg.templateDestinationType = ["Mongo", "CSV"];
wg.templateColumnType = [{key:"string",value:"string"},{key:"float",value:"float"},{key:"integer",value:"integer"}, {key:"date",value:"date"}];
wg.templateScrapperPayload = {
	key: "",
	value: ""
};
wg.scrapperPayloads = ko.observableArray([]);
wg.selectorRowSetting = ko.observableArray([]);
wg.configScrapper = ko.mapping.fromJS(wg.templateConfigScrapper);
wg.configSelector = ko.mapping.fromJS(wg.templateConfigSelector);
wg.scrapperColumns = ko.observableArray([
	{ field: "_id", title: "Web Grabber ID", width: 130 },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{ title: "", width: 160, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' onclick='wg.startScrapper(\"" + d._id + "\")' title='Start Service'><span class='fa fa-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster' onclick='wg.stopScrapper(\"" + d._id + "\")' title='Stop Service'><span class='fa fa-stop'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' onclick='wg.viewHistory(\"" + d._id + "\")' title='View History'><span class='fa fa-history'></span></button>", 
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster' onclick='wg.editScrapper(\"" + d._id + "\")' title='Edit Grabber'><span class='fa fa-edit'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger tooltipster' onclick='wg.removeScrapper(\"" + d._id + "\")' title='Delete Grabber'><span class='fa fa-trash'></span></button>"
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
wg.dataSourceTypes = ko.observableArray([
	{ value: "SourceType_Http", title: "HTTP / Web" },
	{ value: "SourceType_Dbox", title: "Data File" },
]);
wg.dataRequestTypes = ko.observableArray([
	{ value: "GET", title: "GET" },
	{ value: "POST", title: "POST" },
]);

wg.editScrapper = function (_id) {
	app.ajaxPost("/webgrabber/selectscrapperdata", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode('editor');
		wg.scrapperMode('edit');
		ko.mapping.fromJS(res.data, wg.configScrapper);
		wg.isContentFetched(false);
	});
};
wg.removeScrapper = function (_id) {
	swal({
	    title: "Are you sure?",
	    text: 'Data connection with id "' + _id + '" will be deleted',
	    type: "warning",
	    showCancelButton: true,
	    confirmButtonColor: "#DD6B55",
	    confirmButtonText: "Delete",
	    closeOnConfirm: true
	}, function() {
	    setTimeout(function () {
			app.ajaxPost("/webgrabber/removegrabber", { _id: _id }, function (res) {
				if (!app.isFine(res)) {
					return;
				}

				wg.backToFront();
				swal({ title: "Data successfully deleted", type: "success" });
			});
	    }, 1000);
	});
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
	wg.scrapperMode('');
	ko.mapping.fromJS(wg.templateConfigScrapper, wg.configScrapper);
	wg.isContentFetched(false);
	wg.scrapperPayloads([]);
	wg.addScrapperPayload();
};
wg.backToFront = function () {
	app.mode("");
	wg.selectedID('');
	wg.getScrapperData();
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
					var $tr = $(".grid-web-grabber").find("tr[data-uid='" + row.uid + "']");

					if (res.data.isRun) {
						$tr.addClass("started");
					} else {
						$tr.removeClass("started");
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
wg.getURL = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
	// wg.encodePayload();
	var param = ko.mapping.toJS(wg.configScrapper);
	app.ajaxPost("/webgrabber/fetchcontent", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		wg.isContentFetched(true);
		var doc = wg.writeContent(res.data);
		wg.modeSetting(1);

		var startofbody = res.data.indexOf("<body");
		var endofbody = res.data.indexOf("</body");
		var bodyyo = res.data.substr(startofbody,endofbody-startofbody);
		startofbody = bodyyo.indexOf(">");
		bodyyo = bodyyo.substr(startofbody+1);
		URLSource = $.parseHTML(bodyyo);
		// console.log(URLSource);
		// var editor = CodeMirror($("inspectElement"), {
		//   mode: "text/html",
		//   // styleActiveLine: true,
		//   // lineNumbers: true,
		//   // lineWrapping: true,
		//   readOnly : true,
		//   value: URLSource
		// });
	// console.log(bodyyo);
		$("#inspectElement").replaceWith("<div id='inspectElement'></div>");
		// $("#inspectElement").html(URLSource);
		var editor = CodeMirror(document.getElementById("inspectElement"), {
	        mode: "text/html",
	        lineNumbers: true,
			lineWrapping: true,
	        readOnly : true,
	        value: bodyyo
	      });
	});
};
wg.saveNewScrapper = function () {
	if (!app.isFormValid(".form-scrapper-top")) {
		return;
	}
	
};
wg.addScrapperPayload = function () {
	var item = ko.mapping.fromJS($.extend(true, {}, wg.templateScrapperPayload));
	wg.scrapperPayloads.push(item);
};
wg.removeScrapperPayload = function (index) {
	return function () {
		var item = wg.scrapperPayloads()[index];
		wg.scrapperPayloads.remove(item);
	};
};
wg.encodePayload = function () {
	wg.configScrapper.Parameter({});

	var p = {};
	wg.scrapperPayloads().forEach(function (e) {
		p[e.key()] = app.couldBeNumber(e.value());
	});
	wg.configScrapper.Parameter(p);
};
wg.decodePayload = function () {
	wg.scrapperPayloads([]);

	var param = wg.configScrapper.Parameter();
	for (var key in param) {
		if (param.hasOwnProperty(key)) {
			wg.scrapperPayloads.push({ key: key, value: param[key] });
		}
	}
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
	wg.modeSetting(wg.modeSetting()+1);
	if (wg.selectorRowSetting().length == 0)
		wg.addSelectorSetting();
};
wg.backSetting = function() {
	wg.modeSetting(wg.modeSetting()-1);
};
wg.addSelectorSetting = function() {
	wg.selectorRowSetting.push(ko.mapping.fromJS(wg.templateConfigSelector));
}
wg.removeSelectorSetting = function(each){
	// console.log(ko.mapping.toJS(each));
	var item = wg.selectorRowSetting()[each];
	wg.selectorRowSetting.remove(item);
}
wg.showSelectorSetting = function(index,nameSelector){
	if (wg.selectorRowSetting()[index].SelectorSetting.ColumnSetting().length == 0)
		wg.selectorRowSetting()[index].SelectorSetting.ColumnSetting.push(ko.mapping.fromJS({Alias: "", Type: "", Selector: ""}));

	ko.mapping.fromJS(wg.selectorRowSetting()[index],wg.configSelector);
	wg.tempIndexColumn(index);
	wg.modeSelector("edit");
}
wg.backSettingSelector = function() {
	wg.modeSelector("");
}
wg.saveSettingSelector = function() {
	ko.mapping.fromJS(wg.configSelector,wg.selectorRowSetting()[wg.tempIndexColumn()]);
	wg.modeSelector("");
}
wg.addColumnSetting = function() {
	wg.configSelector.SelectorSetting.ColumnSetting.push(ko.mapping.fromJS({Alias: "", Type: "", Selector: ""}));
}
wg.removeColumnSetting = function(each){
	var item = wg.configSelector.SelectorSetting.ColumnSetting()[each];
	wg.configSelector.SelectorSetting.ColumnSetting.remove(item);
}
wg.GetRowSelector = function(index){
	ko.mapping.fromJS(wg.selectorRowSetting()[index],wg.configSelector);
	wg.tempIndexColumn(index);
	wg.modeSelector("editElement");
};
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
		param.Driver = baseSetting.desttype;

		if (param.Driver == "mongo") {
			param.Host = baseSetting.Host;
			param.Database = baseSetting.connectioninfo.database;
			param.Collection = baseSetting.connectioninfo.collection;
			param.Username = baseSetting.connectioninfo.username;
			param.Password = baseSetting.connectioninfo.password;
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

$(function () {
	wg.getScrapperData();
});