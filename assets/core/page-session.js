app.section('session');


viewModel.session = {}; var ses = viewModel.session;
ses.search = ko.observable("");

ses.SessionColumns = ko.observableArray([
	{ field: "status", title: "" },
	{ field: "loginid", title: "Username" },
	{ field: "created", title: "Created", template:'# if (created == "0001-01-01T00:00:00Z") {#-#} else {# #:moment(created).utc().format("DD-MMM-YYYY HH:mm:ss")# #}#' },
	{ field: "expired", title: "Expired", template:'# if (expired == "0001-01-01T00:00:00Z") {#-#} else {# #:moment(expired).utc().format("DD-MMM-YYYY HH:mm:ss")# #}#' },
	{ field: "duration", title: "Active In", template:'#= kendo.toString(duration, "n2")# H'},
	{ title: "Action", width: 80, attributes: { class: "align-center" }, template:"#if(status=='ACTIVE'){# <button data-value='#:_id #' onclick='ses.setexpired(\"#: _id #\", \"#: loginid #\")' name='expired' type='button' class='btn btn-sm btn-default btn-text-danger btn-stop tooltipster' title='Set Expired'><span class='fa fa-times'></span></button> #}else{# #}#" }
	// { title: "", width: 80, attributes: { class: "align-center" }, template: function (d) {
	// 	if (status == "ACTIVE") {
	// 		return [
	// 			"<button class='btn btn-sm btn-default btn-text-success tooltipster' onclick='ses.selectGridSession(\"" + d._id + "\")' title='Set Expired'><span class='fa fa fa-times'></span></button>"
	// 		].join(" ");
	// 	}
	// 	return ""
	// } }
]); 

ses.SessionData=ko.observableArray([]);
ses.selectGridSession = function (e) {
	// adm.isNew(false);
	app.wrapGridSelect(".grid-sessions", ".btn", function (d) {
		// adm.editAccess(d._id); 
		// adm.showAccess(true);
		// app.mode("editor"); 
	});
};

// ses.getSession = function(c) {
	 
	// ses.SessionData([]);
	// var param = {};
	// app.ajaxPost("/session/getsession", param, function (res) {
	// 	if (!app.isFine(res)) {
	// 		return;
	// 	}
	// 	if (res.data==null){
	// 		res.data = [];;
	// 	}
	// 	// console.log(res)
	// 	ses.SessionData(res.data);
	// 	var grid = $(".grid-sessions").data("kendoGrid");
	// 	$(grid.tbody).on("mouseleave", "tr", function (e) {
	// 	    $(this).removeClass("k-state-hover");
	// 	});

	// 	if (typeof c == "function") {
	// 		c(res);
	// 	}
	// });
// };
 
ses.setexpired = function (_id,username) {
	var param ={ _id: _id,
				username: username };
	app.ajaxPost("/session/setexpired", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		$('.grid-sessions').data('kendoGrid').refresh();
		location.reload();
	});
} 

ses.GetFilter = function(){
	data = {
		find : ses.search,
	}

	return data
}

ses.searchsession = function(event){
	if ((event != undefined) && (event.keyCode == 13)){
		$('.grid-sessions').data('kendoGrid').dataSource.read();
	}
	return
}

ses.GenerateGrid = function() {
    $(".grid-sessions").html("");
    $('.grid-sessions').kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: "/session/getsession",
                    dataType: "json",
                    data: ses.GetFilter(),
                    type: "POST",
                    success: function(data) {
                        $(".grid-sessions>.k-grid-content-locked").css("height", $(".grid-sessions").data("kendoGrid").table.height());
                    }
                }
            },
            schema: {
                data: "data.Datas",
                total: "data.total"
            },

            pageSize: 10,
            serverPaging: true, // enable server paging
            serverSorting: true,
        },
        resizable: true,
        scrollable: true,
        // sortable: true,
        // filterable: true,
        pageable: {
            refresh: false,
            pageSizes: 10,
            buttonCount: 5
        },
        columns: ses.SessionColumns(),
        dataBound: app.gridBoundTooltipster('.grid-sessions'), 
    });

}
// ses.editGroup = function(c) {
// 	var payload = ko.mapping.toJS(ses.filter._id(c));
// 	app.ajaxPost("/session/findsession", payload, function (res) {
// 		if (!app.isFine(res)) {
// 			return;
// 		}
// 		if (res.data==null){
// 			res.data = [];;
// 		}
// 		ses.config._id(res.data._id);  
// 		ses.config.Title(res.data.Title);  
// 		ses.config.Enable(res.data.Enable);  
// 		ses.config.Grants(res.data.Grants); 
// 		ses.config.Owner(res.data.Owner);  
// 	});
// };

 
$(function () {
	// ses.getSession(); 
	ses.GenerateGrid();
});

