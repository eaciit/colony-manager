app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.templateConfigScrapper = {
	_id: "",
	DataSourceOrigin: "",
	DataSourceDestination: "",
	IgnoreFieldsDestination: [],
	IntervalType: "seconds",
	GrabInterval: 20,
	TimeoutInterval: 20,
	Map: [],
	RunAt: []
};
dg.templateMap = {
	FieldOrigin: "",
	FieldDestination: ""
};
dg.templateIntervalType = [
	{ value: "seconds", title: "Seconds" }, 
	{ value: "minutes", title: "Minutes" }, 
	{ value: "hours", title: "Hours" }
];
dg.valDataGrabberFilter = ko.observable('');
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.showDataGrabber = ko.observable(true);
dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.scrapperIntervals = ko.observableArray([]);
dg.dataSourcesData = ko.observableArray([]);

// Test Data Child
// dg.dataTestBind = ko.observableArray( [
// {"Format":"","Label":"Age","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"double","_id":"Age"},
// {"Format":"","Label":"Address","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"string","_id":"Address"},
// {"Format":"","Label":"Job","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"string","_id":"Job", "expanded":true, "items":[{"_id":"testA", "Label":"testA", "items":[{"_id":"asa", "Label":"ere"}]}, {"_id":"testB", "Label":"testB"}]},
// {"Format":"","Label":"email","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"string","_id":"email"},
// {"Format":"","Label":"FullName","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"string","_id":"FullName"},
// {"Format":"","Label":"_id","Lookup":{"DataSourceID":"","DisplayField":"","IDField":"","LookupFields":[],"_id":""},"Type":"string","_id":"_id"}]);

dg.selectedDataGrabber = ko.observable('');
dg.tempCheckIdDataGrabber = ko.observableArray([]);
dg.selectedLogDate = ko.observable('');
dg.scrapperColumns = ko.observableArray([
	{ headerTemplate: "<input type='checkbox' class='datagrabbercheckall' onclick=\"dg.checkDeleteDataGrabber(this, 'datagrabberall', 'all')\"/>", width:25, template: function (d) {
		return [
			"<input type='checkbox' class='datagrabbercheck' idcheck='"+d._id+"' onclick=\"dg.checkDeleteDataGrabber(this, 'datagrabber')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Data Grabber ID", width: 130 },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{ title: "", width: 160, attributes: { style: "text-align: center;"}, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster excludethis' title='Start Transformation Service' onclick='dg.runTransformation(\"" + d._id + "\")()'><span class='glyphicon glyphicon-play'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster notthis' onclick='dg.stopTransformation(\"" + d._id + "\")()' title='Stop Transformation Service'><span class='fa fa-stop'></span></button>",
			"<button class='btn btn-sm btn-default btn-text-primary tooltipster neitherthis' onclick='dg.viewHistory(\"" + d._id + "\")' title='View History'><span class='fa fa-history'></span></button>", 
		].join(" ");
	} },
	{ field: "DataSourceOrigin", title: "Data Source Origin", width: 150 },
	{ field: "DataSourceDestination", title: "Data Source Destination", width: 150 },
	{ field: "IntervalType", title: "Interval Unit" },
	{ field: "GrabInterval", title: "Interval Duration" },
	{ field: "TimeoutInterval", title: "Timeout Duration" },
]);
dg.logData = ko.observable('');
dg.historyData = ko.observableArray([]);
dg.historyColumns = ko.observableArray([
	{ field: "_id", title: "Number", width: 100, },
	{ field: "Date", title: "History At" },
	{ title: "&nbsp;", width: 200, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='dg.viewData(\"" + kendo.toString(d.Date, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text'></span> View Data</button>",
			"<button class='btn btn-sm btn-default btn-text-primary' onclick='dg.viewLog(\"" + kendo.toString(d.Date, 'yyyy/MM/dd HH:mm:ss') + "\")'><span class='fa fa-file-text-o'></span> View Log</button>",
		].join(" ");
	}, filterable: false }
]);
dg.changeDataSourceOrigin = function () {
	dg.prepareFieldsOrigin(this.value());
};
dg.fieldOfDataSource = function (which) {
	return ko.computed(function () {
		var ds = Lazy(dg.dataSourcesData()).find({
			_id: dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]()
		});

		if (ds == undefined) {
			return [];
		}

		return ds.MetaData;
	}, dg);
};
dg.isDataSourceNotEmpty = function (which) {
	return ko.computed(function () {
		var dsID = dg.configScrapper[which == "origin" ? "DataSourceOrigin" : "DataSourceDestination"]();

		return dsID != "";
	}, dg);
};
dg.fieldOfDataSourceDestination = ko.computed(function () {
	var ds = Lazy(dg.dataSourcesData()).find({
		_id: dg.configScrapper.DataSourceDestination()
	});

	if (ds == undefined) {
		return [];
	}

	return ds.MetaData;
}, dg);
dg.getScrapperData = function (){
	app.ajaxPost("/datagrabber/getdatagrabber", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.scrapperData(res.data);
		dg.checkTransformationStatus();
	});
};
dg.addMap = function () {
	var o = ko.mapping.fromJS($.extend(true, {}, dg.templateMap));
	dg.configScrapper.Map.push(o);
};
dg.removeMap = function (index) {
	return function () {
		var item = dg.configScrapper.Map()[index];
		dg.configScrapper.Map.remove(item);
	};
}
dg.createNewScrapper = function () {
	app.mode("editor");
	dg.scrapperMode('');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);
	dg.addMap();
	dg.showDataGrabber(false);
};
dg.saveDataGrabber = function () {
	if (!app.isFormValid(".form-datagrabber")) {
		return;
	}

	var param = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/savedatagrabber", param, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		dg.backToFront();
		dg.getScrapperData();
	});
};
dg.backToFront = function () {
	app.mode("");
};
dg.getDataSourceData = function () {
	app.ajaxPost("/datasource/getdatasources", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.dataSourcesData(res.data);
	});
};
dg.selectGridDataGrabber = function(e){
	var grid = $(".grid-data-grabber").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	var target = $( event.target );
	if ( $(target).parents( ".excludethis" ).length ) {
	    return false;
	  }else if ($(target).parents(".notthis").length ) {
	  	return false;
	  }else if ($(target).parents(".neitherthis" ).length ) {
	  	return false;
	  }else{
		dg.editScrapper(selectedItem._id);
	  }

	dg.showDataGrabber(true);
};
dg.editScrapper = function (_id) {
	dg.scrapperMode('edit');
	ko.mapping.fromJS(dg.templateConfigScrapper, dg.configScrapper);

	app.ajaxPost("/datagrabber/selectdatagrabber", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		app.mode("editor");
		dg.scrapperMode('editor');
		app.resetValidation("#form-add-scrapper");
		ko.mapping.fromJS(res.data, dg.configScrapper);
		dg.prepareFieldsOrigin(dg.configScrapper.DataSourceOrigin());
	});
};
dg.removeScrapper = function (_id) {
	if (dg.tempCheckIdDataGrabber().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any datagrabber to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	}else{
		swal({
			title: "Are you sure?",
			text: 'Data grabber with id '+dg.tempCheckIdDataGrabber().toString()+' will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: true
		}, function() {
			setTimeout(function () {
				app.ajaxPost("/datagrabber/removemultipledatagrabber", { _id: dg.tempCheckIdDataGrabber() }, function (res) {
					if (!app.isFine(res)) {
						return;
					}

					swal({ title: "Data successfully deleted", type: "success" });
					dg.backToFrontPage();
				});
			}, 1000);
		});
	}
};
dg.backToFrontPage = function () {
	app.mode('');
	dg.getScrapperData();
	dg.getDataSourceData();
};
dg.runTransformation = function (_id) {
	return function () {
		app.ajaxPost("/datagrabber/starttransformation", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			dg.checkTransformationStatus();
		});
	};
};
dg.stopTransformation = function (_id) {
	return function () {
		app.ajaxPost("/datagrabber/stoptransformation", { _id: _id }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			dg.checkTransformationStatus();
		});
	};
};
dg.checkTransformationStatus = function () {
	dg.scrapperIntervals().forEach(function (interval) {
		try {
			clearInterval(interval);
		} catch (err) {
			console.log("interval err: ", _id, err);
		}
	});
	dg.scrapperIntervals([]);
	dg.scrapperData().forEach(function (each) {
		var process = function () {
			var $grid = $(".grid-data-grabber");
			var $kendoGrid = $grid.data("kendoGrid");
			var gridData = $kendoGrid.dataSource.data();

			app.ajaxPost("/datagrabber/stat", { _id: each._id }, function (res) {
				if (!app.isFine(res)) {
					return;
				}

				var row = Lazy(gridData).find({ _id: each._id });
				if (row == undefined) {
					row = { uid: "fake!" };
				}

				var $row = $grid.find("tr[data-uid='" + row.uid + "']");

				if (res.data) {
					$row.addClass("started");
				} else {
					$row.removeClass("started");
				}
			}, function (a) {
				var row = Lazy(gridData).find({ _id: each._id });
				if (row == undefined) {
					row = { uid: "fake!" };
				}

				var $row = $grid.find("tr[data-uid='" + row.uid + "']");

				$row.removeClass("started");
			});
		};

		process();
		dg.scrapperIntervals.push(setInterval(process, 10 * 1000));
	});
};
dg.viewHistory = function (_id) {
	app.ajaxPost("/datagrabber/selectdatagrabber", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("history");
		dg.selectedDataGrabber(_id);
		dg.historyData([]);
		res.data.RunAt.forEach(function (e, i) {
			dg.historyData.push({ _id: (i + 1), Date: e });
		});
	});
};
dg.backToHistory = function () {
	app.mode("history");
};
dg.viewLog = function (date) {
	var param = { 
		_id: dg.selectedDataGrabber(), 
		Date: date
	};
	app.ajaxPost("/datagrabber/getlogs", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("log");
		dg.selectedLogDate(date);

		var startLine = "SUCCESS " + moment(date, "YYYYMMDD-HHmmss")
			.format("YYYY/MM/DD HH:mm:ss");
		var message = res.data;
		message = startLine + message.split(startLine).slice(1).join(startLine);
		message = message.split("Starting transform!").slice(0, 2)
			.join("Starting transform!").split("SUCCESS");
		message = message.slice(0, message.length - 1).join("SUCCESS");
		message = $.trim(message);

		dg.logData(message.split("\n").map(function (e) { 
			return "<li>" + e + "</li>";
		}).join(""));
	});
};
dg.viewData = function (date) {
	var param = { 
		_id: dg.selectedDataGrabber(), 
		Date: date
	};
	app.ajaxPost("/datagrabber/gettransformeddata", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		app.mode("data");
		dg.selectedLogDate(date);

		var columns = [{ title: "&nbsp" }];
		if (res.data.length > 0) {
			columns = [];
			var sample = res.data[0];
			for (key in sample) {
				if (sample.hasOwnProperty(key)) {
					columns.push({
						field: key,
						width: 100
					});
				}
			}
		}

		$(".grid-transformed-data").replaceWith("<div class='grid-transformed-data'></div>");
		$(".grid-transformed-data").kendoGrid({
			filterable: false,
			dataSource: {
				data: res.data,
				pageSize: 10
			},
			columns: columns
		});

		console.log(columns);
		console.log(res.data);
	});
};
dg.prepareFieldsOrigin = function (_id) {
	var row = Lazy(dg.dataSourcesData()).find({ _id: _id });

	var ds = new kendo.data.HierarchicalDataSource({
        data: row.MetaData,
        schema: {
            model: {
                children: "Sub"
            }
        }
    });

	$(".fields-origin").replaceWith('<div class="fields-origin"></div>');
    $(".fields-origin").kendoTreeView({
        dataSource: ds,
        dataTextField: ["Label"],
        template: function (d) {
        	return [
        		"<div style='width: 200px;'>" + d.item._id + "</div>",
    		].join("")
        },
    });
};
dg.checkDeleteDataGrabber = function(elem, e){
	if (e === 'datagrabberall'){
		if ($(elem).prop('checked') === true){
			$('.datagrabbercheck').each(function(index) {
				$(this).prop("checked", true);
				dg.tempCheckIdDataGrabber.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.datagrabbercheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				dg.tempCheckIdDataGrabber.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			dg.tempCheckIdDataGrabber.push($(elem).attr('idcheck'));
		} else {
			dg.tempCheckIdDataGrabber.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}

function filterDataGrabber(event) {
	app.ajaxPost("/datagrabber/finddatagrabber", {inputText : dg.valDataGrabberFilter()}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (!res.data) {
			res.data = [];
		}
		dg.scrapperData(res.data);
	});
}
$(function () {
	dg.getScrapperData();
	dg.getDataSourceData();
});
