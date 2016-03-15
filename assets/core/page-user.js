app.section('user');

viewModel.user = {}; var usr = viewModel.user;
usr.templateUser = {
	_id     :"",
	LoginID  :"",
	FullName :"",
	Email    :"",
	Password :"",
	Enable   :false,
	Groups   :ko.observableArray([]),
	Grants   :"",
};
usr.templateFilter ={
    LoginID: "", 
    FullName:"",
    Email    :"",
    Groups   :ko.observableArray([]),
};
usr.UsersColumns = ko.observableArray([
    { template: "<input type='checkbox' class='ckcGrid' />", width: 50  },
    { field: "loginid", title: "Login Id" },
    { field: "fullname", title: "Fullame" },
    { field: "email", title: "Email" },
    { field: "password", title: "Password"},
    { field: "enable", title: "Enable" },
    { field: "groups", title: "Groups" },
    { field: "grants", title: "Grants"}
]);
usr.filter = ko.mapping.fromJS(usr.templateFilter);
usr.isNew=ko.observable(false);
usr.editUser=ko.observable("");
usr.showUser=ko.observable(false);
usr.UsersData=ko.observableArray([]);
usr.selectGridUsers = function (e) {
    usr.isNew(false);
    app.wrapGridSelect(".grid-users", ".btn", function (d) {
        usr.editUser(d._id);
        usr.showUser(true);
        app.mode("editor");
    });
};

usr.getUsers = function(c) {
    usr.UsersData([]);
    var param = ko.mapping.toJS(usr.filter);
    app.ajaxPost("/user/getuser", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        }
        usr.UsersData(res.data);
        var grid = $(".grid-users").data("kendoGrid"); 
        $(grid.tbody).on("mouseleave", "tr", function (e) {
            $(this).removeClass("k-state-hover");
        });

        if (typeof c == "function") {
            c(res);
        }
    });
};
 
usr.config = ko.mapping.fromJS(usr.templateUser); 
usr.listGroup 	= ko.observableArray([]);
usr.saveuser = function () {
	usr.templateUser.Groups($('#Groups').data('kendoMultiSelect').value());
	payload = ko.mapping.fromJS(usr.templateUser);
	
	var dataInv = $('#gridaccess').data('kendoGrid').dataSource;
    var arrayID = new Array();
    $(".ckcGrid").each(function (i) {
        if (this.checked) {
            dataInv.fetch(function () {
            var view = dataInv.view();
            arrayID.push(view[i].ID);
            });
        }
    }); 

	app.ajaxPost("/user/saveuser", payload, function(res) {
	if (!app.isFine(res)) {
		return;
	}
	});
};

usr.Usermode = ko.observable('');
usr.getUser = function(c) {

};

usr.createNewUser = function () {
	app.mode("editor");
};


usr.OnRemove = function (_id) {
};

usr.backToFront = function () {
	app.mode('');
	usr.getUsers();
	app.section('user');
};
usr.getmultiplegroup = function () {
    $("#Groups").kendoMultiSelect({
      dataTextField: "text",
      dataValueField: "value",
      dataSource: [
        { text: "Item1", value: "Item1" },
        { text: "Item2", value: "2" },
        { text: "Item3", value: "3" },
        { text: "Item4", value: "4" }
      ]
    });
  };
$(function () {
	usr.getmultiplegroup();
    usr.getUsers();
	// adm.getAdministraions();
	// adm.getUploadFile();
	// adm.codemirror();
	// adm.treeView("") ;
	// app.prepareTooltipster($(".tooltipster"));
	// app.registerSearchKeyup($(".search"), adm.getAdministraions);
});

//========
 $(document).ready(function(){
        $("#gridaccess").kendoGrid({
            columns: [ 
   			  { template: "<input type='checkbox' class='ckcGrid' />", width: 10  },
	          { field: "LastName", title: "LastName", width: 110 },
	          { title: "Create",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 },
	          { title: "Read",template: '<input type="checkbox" #= LastName ? \'checked="checked"\' : "" # class="chkbx2" />', width: 30 },
	       	  { title: "Update",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 },
	          { title: "Delete",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 },
	          { title: "SA 1",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 },
	          { title: "SA 2",template: '<input type="checkbox" #= LastName ? \'checked="checked"\' : "" # class="chkbx2" />', width: 30 },
	       	  { title: "SA 3",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 },
	          { title: "SA 4",template: '<input type="checkbox" #= FirstName ? \'checked="checked"\' : "" # class="chkbx" />', width: 30 }
	        
	        ],
            dataSource: {
                data: [{
                    FirstName: "Joe",
                    LastName: "Smith"
                },
                {
                    FirstName: "Jane",
                    LastName: "Smith"
                }]
            }
        });
    });

 // var crudServiceBaseUrl = "http://demos.kendoui.com/service",
 //          dataSource = new kendo.data.DataSource({
 //            transport: {
 //              read:  {
 //                url: crudServiceBaseUrl + "/Products",
 //                dataType: "jsonp"
 //              },
 //              update: {
 //                url: crudServiceBaseUrl + "/Products/Update",
 //                dataType: "jsonp"
 //              },
 //              destroy: {
 //                url: crudServiceBaseUrl + "/Products/Destroy",
 //                dataType: "jsonp"
 //              },
 //              create: {
 //                url: crudServiceBaseUrl + "/Products/Create",
 //                dataType: "jsonp"
 //              },
 //              parameterMap: function(options, operation) {
 //                if (operation !== "read" && options.models) {
 //                  return {models: kendo.stringify(options.models)};
 //                }
 //              }
 //            },
 //            batch: true,
 //            pageSize: 20,
 //            schema: {
 //              model: {
 //                id: "ProductID",
 //                fields: {
 //                  ProductID: { editable: false, nullable: true },
 //                  ProductName: { validation: { required: true } },
 //                  UnitPrice: { type: "number", validation: { required: true, min: 1} },
 //                  Discontinued: { type: "boolean" },
 //                  ss: { type: "boolean" },
 //                  UnitsInStock: { type: "number", validation: { min: 0, required: true } }
 //                }
 //              }
 //            }
 //          });

 //      $("#grid").kendoGrid({
 //        dataSource: dataSource,
 //        pageable: true,
 //        height: 430,
 //        toolbar: ["create", "save", "cancel"],
        // columns: [
        //   "ProductName",
        //   { field: "UnitPrice", title: "Unit Price", format: "{0:c}", width: 110 },
        //   { field: "UnitsInStock", title: "Units In Stock", width: 110 },
        //   { template: '<input type="checkbox" #= Discontinued ? \'checked="checked"\' : "" # class="chkbx" />', width: 110 },
        //   { template: '<input type="checkbox" #= ss ? \'checked="checked"\' : "" # class="chkbx2" />', width: 110 },
        //   { command: "destroy", title: "&nbsp;", width: 100 }],
 //        editable: true
 //      });

      $("#grid .k-grid-content").on("change", "input.chkbx", function(e) {
        var grid = $("#grid").data("kendoGrid"),
            dataItem = grid.dataItem($(e.target).closest("tr"));

        dataItem.set("FirstName", this.checked); 
      });
      
        $("#grid .k-grid-content").on("change", "input.chkbx2", function(e) {
        var grid = $("#grid").data("kendoGrid"),
            dataItem = grid.dataItem($(e.target).closest("tr"));
        dataItem.set("LastName", this.checked); 
      });