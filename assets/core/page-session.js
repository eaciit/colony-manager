app.section('session');

viewModel.session = {}; var ses = viewModel.session;
  
ses.SessionColumns = ko.observableArray([
	{ template: "<input type='checkbox' name='checkboxsession' class='ckcGrid' value='#: _id #' />", width: 50  },
	{ field: "_id", title: "ID" },
	{ field: "userid", title: "Userid" },
	{ field: "created", title: "Created" },
	{ field: "expired", title: "Expired" },
	{ title: "", width: 80, attributes: { class: "align-center" }, template: function (d) {
		return [
			"<button class='btn btn-sm btn-default btn-text-success tooltipster' onclick='ses.selectGridSession(\"" + d._id + "\")' title='destroy session'><span class='fa fa fa-times'></span></button>"
		].join(" ");
	} }
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
ses.getSession = function(c) {
	 
	ses.SessionData([]);
	var param = {};
	app.ajaxPost("/session/getsession", param, function (res) {
		if (!app.isFine(res)) {
			return;
		}
		if (res.data==null){
			res.data="";
		}
		// console.log(res)
		ses.SessionData(res.data);
		var grid = $(".grid-sessions").data("kendoGrid"); 
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});

		if (typeof c == "function") {
			c(res);
		}
	});
};
 
 
 
// ses.editGroup = function(c) {
// 	var payload = ko.mapping.toJS(ses.filter._id(c));
// 	app.ajaxPost("/session/findsession", payload, function (res) {
// 		if (!app.isFine(res)) {
// 			return;
// 		}
// 		if (res.data==null){
// 			res.data="";
// 		}
// 		ses.config._id(res.data._id);  
// 		ses.config.Title(res.data.Title);  
// 		ses.config.Enable(res.data.Enable);  
// 		ses.config.Grants(res.data.Grants); 
// 		ses.config.Owner(res.data.Owner);  
// 	});
// };

 
$(function () {
	ses.getSession(); 
});

