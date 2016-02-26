app.section('scrapper');

viewModel.dataGrabber = {}; var dg = viewModel.dataGrabber;

dg.templateConfigScrapper = {
	_id: "",
	DataSourceOrigin: "",
	DataSourceDestination: "",
	UseInterval: false,
	IntervalType: "seconds",
	GrabInterval: 20,
	TimeoutInterval: 20,
	Maps: [],
	RunAt: [],
	PreTransferCommand: "",
	PostTransferCommand: ""
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
dg.filterDataGrabber = ko.observable({
	search: '',
	intervalunit: ''
});
dg.valDataGrabberFilter = ko.observable('');
dg.configScrapper = ko.mapping.fromJS(dg.templateConfigScrapper);
dg.showDataGrabber = ko.observable(true);
dg.scrapperMode = ko.observable('');
dg.scrapperData = ko.observableArray([]);
dg.scrapperIntervals = ko.observableArray([]);
dg.dataSourcesData = ko.observableArray([]);
dg.fieldDataTypes = ko.observableArray(['string', 'double', 'int']);

dg.selectedDataGrabber = ko.observable('');
dg.tempCheckIdDataGrabber = ko.observableArray([]);
dg.selectedLogDate = ko.observable('');
dg.searchfield = ko.observable('');
dg.scrapperColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' class='datagrabbercheckall' onclick=\"dg.checkDeleteDataGrabber(this, 'datagrabberall', 'all')\"/></center>", width: 40, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<input type='checkbox' class='datagrabbercheck' idcheck='"+d._id+"' onclick=\"dg.checkDeleteDataGrabber(this, 'datagrabber')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "Data Grabber ID", width: 130 },
	{ title: "Status", width: 80, attributes: { class:'scrapper-status' }, template: "<span></span>", headerTemplate: "<center>Status</center>" },
	{ title: "", width: 160, attributes: { style: "text-align: center;"}, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success btn-start tooltipster' title='Start Transformation Service' onclick='dg.runTransformation(\"" + d._id + "\")'><span class='glyphicon glyphicon-play'></span></button>",
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
dg.dataSourcesDataForSourceAndDest = function (which) {
	return ko.computed(function () {
		return Lazy(dg.dataSourcesData()).filter(function (k) {
			var where = (which != "origin") ? "DataSourceOrigin" : "DataSourceDestination";
			return dg.configScrapper[where]() != k._id;
		}).toArray();
	}, dg);
}
dg.changeDataSourceOrigin = function () {
	dg.prepareFieldsOrigin(this.value());
};
dg.expandMetaData = function (allMetaData, parent, result) {
	parent = (parent == undefined) ? "" : (parent + "|");
	result = (result == undefined) ? [] : result;

	allMetaData.forEach(function (md) {
		result.push({
			_id: parent + md._id,
			Label: md.Label,
			Type: md.Type,
		});

		if (md.Sub != null || md.Sub != undefined) {
			dg.expandMetaData(md.Sub, md._id, result);
		}
	});

	console.log(result);

	return result;
};
dg.changeDataSourceDestination = function () {
	var ds = Lazy(dg.dataSourcesData()).find({
		_id: this.value()
	});

	$(".table-tree-map").find("select.field-destination").each(function (i, each) {
		var $comboBox = $(each).data("kendoComboBox");
		$comboBox.value('');
		$comboBox.setDataSource(new kendo.data.DataSource({
			data: dg.expandMetaData(ds.MetaData)
		}));
	});
}
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

	return dg.expandMetaData(ds.MetaData);
}, dg);
dg.getScrapperData = function (){
	app.ajaxPost("/datagrabber/getdatagrabber", {search: dg.searchfield}, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
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
dg.doSaveDataGrabber = function (c) {
	if (!app.isFormValid(".form-datagrabber")) {
		return;
	}

	dg.parseMap();
	var param = ko.mapping.toJS(dg.configScrapper);
	app.ajaxPost("/datagrabber/savedatagrabber", param, function (res) {
		if(!app.isFine(res)) {
			return;
		}

		if (typeof c != undefined) {
			c();
		}
	});
}
dg.saveDataGrabber = function () {
	dg.doSaveDataGrabber(function () {
		dg.backToFront();
		dg.getScrapperData();
	});
};
dg.backToFront = function () {
	app.mode("");
	dg.tempCheckIdDataGrabber([]);
};
dg.getDataSourceData = function () {
	app.ajaxPost("/datasource/getdatasources", {search: dg.searchfield}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		dg.dataSourcesData(res.data);
	});
};
dg.selectGridDataGrabber = function (e) {
	app.wrapGridSelect(".grid-data-grabber", ".btn", function (d) {
		dg.editScrapper(d._id);
		dg.showDataGrabber(true);
		dg.tempCheckIdDataGrabber.push(d._id);
	});
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

		$.each(res.data.Maps, function(key,val){
			var $valSource = $("tr[data-key= '"+ val.Source +"']");
			var $valSourceType = $valSource.find("td:eq(2) select.type-origin").data("kendoDropDownList");
			var $valDes = $valSource.find("td:eq(3) select.field-destination").data("kendoComboBox");
			var $valDesType = $valSource.find("td:eq(4) select.type-destination").data("kendoDropDownList");
			
			if (val.SourceType != "object" && val.SourceType != "array-objects" && val.SourceType != "array-string"){
				$valSource.find("td:eq(4) div").css("visibility","visible");	
			}

			if ($valSourceType != undefined) {
				$valSourceType.value(val.SourceType);
			}
			
			$valDes.value(val.Destination);
			$valDesType.value(val.DestinationType);
		})
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
	dg.tempCheckIdDataGrabber([]);
};

dg.runTransformationWhenEdit = function () {
	dg.doSaveDataGrabber(function () {
		if (dg.configScrapper.UseInterval()) {
			dg.backToFront();
		}

		dg.getScrapperData();

		app.ajaxPost("/datagrabber/starttransformation", { _id: dg.configScrapper._id() }, function (res) {
			if (!app.isFine(res)) {
				return;
			}

			if (!dg.configScrapper.UseInterval()) {
				swal({ title: "Transformation success", type: "success" });
			}

			dg.checkTransformationStatus();
		});
	});
};
dg.runTransformation = function (_id) {
	app.ajaxPost("/datagrabber/starttransformation", { _id: _id }, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		if (!dg.configScrapper.UseInterval()) {
			swal({ title: "Transformation success", type: "success" });
		}

		dg.checkTransformationStatus();
	});
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
	if(dg.scrapperData()!=""){
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

	$(".table-tree-map").replaceWith('<table class="table tree table-tree-map"></table>');
	var $tree = $(".table-tree-map");
	var index = 1;

	var header = [
		'<thead>',
			'<tr>',
				'<th>&nbsp;</th>',
				'<th>Field Origin</th>',
				'<th>Type</th>',
				'<th>Field Destination</th>',
				'<th>Type</th>',
			'</tr>',
		'</thead>'
	].join('');
	$tree.append(header);

	var renderTheMap = function (data, parent, parentData) {
		data.forEach(function (item) {
			var currentIndex = index;
			var dataClass = 'treegrid-' + currentIndex;
			var dataKey = item._id;
			var dataType = item.Type;
			var sign = '&nbsp;';

			if (parent != undefined) {
				dataClass += ' treegrid-parent-' + parent;
			}
			if (parentData != undefined) {
				dataKey = parentData._id + '|' + dataKey;
			}

			if (dataType.indexOf('array') > -1) {
				if (dataType.indexOf('object') > -1) {
					sign = '[]()';
				} else {
					sign = '[]';
				}
			} else if (dataType.indexOf('object') > -1) {
				sign = '()';
			}

			var content = [
				'<tr class="' + dataClass + '" data-key="' + dataKey + '" data-type="' + dataType + '">',
					'<td style="width: 60px; font-weight: bold;">' + sign + '</td>',
					'<td>' + item._id + '</td>',
					'<td><select class="type-origin" data-value="' + item.Type + '"></select></td>',
					'<td><select class="field-destination" style="width: 200px;"></select></td>',
					'<td><div style="visibility: hidden;"><select class="type-destination"></select></div></td>',
				'</tr>'
			].join("");

			$tree.append(content);
			index++;

			var $row = $tree.find("tr:last");
			var $typeOrigin = $row.find("select.type-origin");
			var $typeDestination = $row.find("select.type-destination");

			if (["array-objects", "array", "object"].indexOf($row.attr("data-type")) > -1) {
				$typeOrigin.closest('td').html($typeOrigin.attr("data-value"));
			} else {
				if ($row.attr("data-type").indexOf('array') > -1) {
					$typeOrigin.closest('td').html($typeOrigin.attr("data-value"));
				} else {
					$typeOrigin.kendoDropDownList({
						dataSource: {
							data: dg.fieldDataTypes()
						},
						value: $typeOrigin.attr("data-value"),
					});
				}
			}

			$row.find("select.field-destination").kendoComboBox({ 
				dataSource: {
					data: dg.fieldOfDataSourceDestination()
				},
				dataValueField: '_id', 
				dataTextField: 'Label', 
				placeholder: 'Select one', 
				filter: 'contains', 
				suggest: true, 
				minLength: 2,
				template: function (d) {
					var sign = '';
					var labelsComp = d._id.split("|").reverse();
					var space = labelsComp.slice(1).map(function (e, i) {
						return "<b class='color-blue'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;>&nbsp;&nbsp;</b>";
					}).join("");

					if (d.Type.indexOf('array') > -1) {
						if (d.Type.indexOf('object') > -1) {
							sign = "<b class='color-green'>[]()</b>&nbsp;";
						} else {
							sign = "<b class='color-green'>[]</b>&nbsp;";
						}
					} else if (d.Type == "object") {
						sign = "<b class='color-green'>()</b>&nbsp;";
					}

					return space + sign + labelsComp[0] + ' (' + d.Type + ')';
				},
				change: function (e) {
					if (this.value() == "") {
						$typeDestination.closest("td").children().css("visibility", "hidden");
						return;
					}

					$typeDestination.closest("td").children().css("visibility", "visible");
					var valueObject = Lazy(dg.fieldOfDataSourceDestination()).find({ 
						_id: this.value()
					});
					
					if (valueObject != undefined) {
						if (valueObject.Type != item.Type && e.sender.value() != '') {
							var standardTypes = ["int", "string", "double", "bool"];
							if (standardTypes.indexOf(item.Type) > -1 && standardTypes.indexOf(valueObject.Type) > -1) {

							} else {
								setTimeout(function () {
									e.sender.value('');
									sweetAlert("Oops...", 'Cannot select source type "' + item.Type + '" and destination type "' + valueObject.Type + '"', "error");
								}, 100);
							}
						}

						if (["array-objects", "array", "object"].indexOf(valueObject.Type) > -1) {
							$typeDestination.closest("td").children().css("visibility", "hidden");
							return;
						} else {
							if (valueObject.Type.indexOf('array') > -1) {
								$typeDestination.closest("td").children().css("visibility", "hidden");
								return;
							}
						}
					}
					$typeDestination.data("kendoDropDownList").value(valueObject.Type);
				}
			});

			$typeDestination.kendoDropDownList({
				dataSource: {
					data: dg.fieldDataTypes()
				}
			});

			if (item.Sub != undefined && item.Sub != null) {
				renderTheMap(item.Sub, currentIndex, item);
			}
		});
	};

	renderTheMap(row.MetaData);

	$tree.treegrid({
		expanderExpandedClass: 'glyphicon glyphicon-minus',
		expanderCollapsedClass: 'glyphicon glyphicon-plus',
		initialState: 'collapsed'
	});
};

dg.parseMap = function () {
	var maps = [];

	$(".table-tree-map tr:gt(0):visible").each(function (i, e) {
		var $fd = $(e).find("select.field-destination").data("kendoComboBox");
		var $td = $(e).find("select.type-destination").data("kendoDropDownList");
		var $to = $(e).find("select.type-origin").data("kendoDropDownList");
		
		if ($fd.value() == "") {
			return;
		}

		var map = {
			Source: $(e).attr("data-key"),
			SourceType: $(e).attr("data-type"),
			Destination: $fd.value(),
			DestinationType: "",
			Sub: []
		};

		if ($to != undefined) {
			map.SourceType = $to.value();
		}

		var typeDestVisiblility = $(e).find("select.type-destination")
			.closest("td")
			.children()
			.css("visibility");
		if (typeDestVisiblility != "hidden") {
			map.DestinationType = $td.value();
		}
		var destinationVisibility = $(e).find("select.field-destination").css("visibility");
		if (destinationVisibility == "hidden"){
			return;
		}

		maps.push(map);
	});

	dg.configScrapper.Maps(maps);

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

$(function () {
	dg.getScrapperData();
	dg.getDataSourceData();
	app.registerSearchKeyup($(".search"), dg.getScrapperData);
});
