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
    Grants   :[],
};

usr.templateFilter ={
    _id:"",
    LoginID: "", 
    FullName:"",
    Email    :"",
    Groups   :ko.observableArray([]),
};

usr.templateAccessGrant = function(){
    var self = {
        AccessID       :ko.observable(""), 
        AccessCreate   :ko.observable(false),
        AccessRead     :ko.observable(false),
        AccessUpdate   :ko.observable(false),
        AccessDelete   :ko.observable(false),
        AccessSpecial1 :ko.observable(false),
        AccessSpecial2 :ko.observable(false),
        AccessSpecial3 :ko.observable(false),
        AccessSpecial4 :ko.observable(false),
    }
    return self;
}; 
usr.Access= ko.observableArray([]);
usr.AccessGrant = ko.mapping.fromJS(usr.templateAccessGrant);
usr.UsersColumns = ko.observableArray([
    { template: "<input type='checkbox' name='checkboxuser' class='ckcGrid' value='#: _id #' />", width: 50  }, 
    { field: "loginid", title: "Login Id" },
    { field: "fullname", title: "Fullame" },
    { field: "email", title: "Email" },
    { field: "password", title: "Password"},
    { field: "enable", title: "Enable" },
    { field: "groups", title: "Groups" }
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
    var data = [];
    var gr="";
    var param = ko.mapping.toJS(usr.filter); 
    app.ajaxPost("/user/getuser", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        }

        for (var i in res.data) { 
               for (var j in res.data[i].groups) { 
                     if(res.data[i].groups.length==1){
                        gr=res.data[i].groups[j] 
                     }else{
                        gr=gr+","+res.data[i].groups[j] 
                     }
               };
               data.push({
                   _id : res.data[i]._id,
                   loginid:res.data[i].loginid,
                   fullname:res.data[i].fullname,
                   email:res.data[i].email,
                   password:res.data[i].password,
                   enable:res.data[i].enable,
                   groups:gr
               })
           };   
        console.log(data);
        usr.UsersData(data);
        var grid = $(".grid-users").data("kendoGrid"); 
        $(grid.tbody).on("mouseleave", "tr", function (e) {
            $(this).removeClass("k-state-hover");
        });

        if (typeof c == "function") {
            c(res);
        }
    });
};
usr.editUser = function(c) {
    var payload = ko.mapping.toJS(usr.filter._id(c));
    app.ajaxPost("/user/finduser", payload, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        } 
        usr.config.LoginID(res.data.LoginID);  
        usr.config.FullName(res.data.FullName);  
        usr.config.Password(res.data.Password);  
        usr.config.Enable(res.data.Enable); 
        usr.config.Groups(res.data.Groups);  
    });
};
usr.config = ko.mapping.fromJS(usr.templateUser); 
usr.listGroup   = ko.observableArray([]);
usr.saveuser = function () {
    usr.config.Groups($('#Groups').data('kendoMultiSelect').value());
    user = ko.mapping.fromJS(usr.config);
     //======
    var data =ko.mapping.toJS(usr.config.Grants); 
    var AccessGrants= [];
    for (var i = 0; i < data.length; i++) {
        grp.Access.AccessID(data[i].AccessID)
        if (data[i].AccessCreate==true) {
            grp.Access.AccessValue.push("AccessCreate");
        };
        if (data[i].AccessRead==true) {
            grp.Access.AccessValue.push("AccessRead");
        };
        if (data[i].AccessUpdate==true) {
            grp.Access.AccessValue.push("AccessUpdate");
        };
        if (data[i].AccessDelete==true) {
            grp.Access.AccessValue.push("AccessDelete");
        };
        if (data[i].AccessSpecial1==true) {
            grp.Access.AccessValue.push("AccessSpecial1");
        };
        if (data[i].AccessSpecial2==true) {
            grp.Access.AccessValue.push("AccessSpecial2");
        };
        if (data[i].AccessSpecial3==true) {
            grp.Access.AccessValue.push("AccessSpecial3");
        };
        if (data[i].AccessSpecial4==true) {
            grp.Access.AccessValue.push("AccessSpecial4");
        }; 
        AccessGrants.push(ko.mapping.toJSON(grp.Access))
        grp.Access.AccessValue.removeAll()
    };
    console.log(AccessGrants); 
    //======
    app.ajaxPost("/user/saveuser",{user : user,grants : AccessGrants} , function(res) {
    if (!app.isFine(res)) {
        return;
    }
    swal({title: "User successfully created", type: "success",closeOnConfirm: true});
    usr.backToFront();
    });
};
usr.deleteuser = function () { 
    var checkboxes = document.getElementsByName('checkboxuser');
    var selected = [];
    for (var i=0; i<checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selected.push(checkboxes[i].value);
        }
    } 
    for (var i = 0; i < selected.length; i++) {
        payload = ko.mapping.fromJS(usr.filter._id(selected[i]));
        app.ajaxPost("/user/deleteuser", payload, function(res) { 
        if (!app.isFine(res)) {
            return;
        }   
        });
    };
    swal({title: "User successfully deleted", type: "success",closeOnConfirm: true});
    usr.backToFront();
};
usr.Usermode = ko.observable(''); 

usr.createNewUser = function () {
    usr.Access.removeAll();
    usr.config.Grants.removeAll();
    usr.config.LoginID("");  
    usr.config.FullName("");  
    usr.config.Password("");  
    usr.config.Enable(""); 
    usr.config.Groups(""); 
    usr.getAccess();
    app.mode("editor");
    usr.getGroup();
};


usr.OnRemove = function (_id) {
};

usr.backToFront = function () {
    usr.Access.removeAll();
    app.mode('');
    usr.getUsers();
    app.section('user');
};
usr.getmultiplegroup = function () {
    var param = ko.mapping.toJS(usr.filter);
    var data = [];
    app.ajaxPost("/group/getgroup", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        }
        for (var i in res.data) {
            data.push({
                text : res.data[i]._id,
                value: res.data[i].title
            }); 
        };
        // console.log(data);
        $("#Groups").kendoMultiSelect({
          dataTextField: "text",
          dataValueField: "value",
          dataSource: data,
          select: usr.displayAccess
        });
    });
  };
$(function () {
    usr.getmultiplegroup();
    usr.getUsers(); 
});
 
usr.createGridPrivilege = function (ds) {
         var grid  = $("#gridaccess").kendoGrid({
            columns: [ 
              { template: "<input type='checkbox' class='ckcGrid' value='#: _id #' onclick=\"addAccess('#: _id #',this)\" data-bind=\"click:usr.selectRow\"/>", width: 10  },
              { field: "title", title: "Access", width: 110 },
              { title: "Create",template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessCreate',this)\" />", width: 30 },
              { title: "Read",template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessRead',this)\" />", width: 30 },
              { title: "Update",template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessUpdate',this)\"  />", width: 30 },
              { title: "Delete",template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessDelete',this)\" />", width: 30 },
              { title: "SA 1",template: "<input type='checkbox' class=\"chkbx-#=uid#\"  title=\"#: specialaccess1 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess1 #',this)\" />", width: 20 },
              { title: "SA 2",template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess2 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess2 #',this)\" />", width: 20 },
              { title: "SA 3",template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess3 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess3 #',this)\" />", width: 20 },
              { title: "SA 4",template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess4 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess4 #',this)\"/>", width: 20 }           
            ],
            dataSource: {
                data: ds 
            }
        }).data("kendoGrid");

    //bind click event to the checkbox
    // grid.table.on("click", ".ckcGrid" , usr.selectRow);
    // usr.disableAllChkbx();
};

function addPrivilage(id,p,o){
    var value = $(o).is(":checked");
    
};

function addAccess(id,o){
    var value = $(o).is(":checked");
    if(o==true){
        usr.AccessGrant.AccessID("aa")
        usr.config.Grants.push(usr.AccessGrant);
    }
    console.log(usr.AccessGrant.AccessID());
};

usr.getAccess = function() { 
    var param = ko.mapping.toJS(usr.filter);
    var data = [];
    app.ajaxPost("/administration/getaccess", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        }
        for (var i in res.data) {
            usr.Access.push(res.data[i]._id);
            data.push({
                text : res.data[i]._id,
                value: res.data[i].title
            }); 
        };
        usr.createGridPrivilege(res.data); 
        usr.dropdownAccess(res.data)
    });
};

usr.getGroup = function() { 
    var param = ko.mapping.toJS(usr.filter);
    app.ajaxPost("/group/getgroup", param, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data==null){
            res.data="";
        }
        // usr.getmultiplegroup(res.data)
        console.log(res.data);
    });
};
usr.selectRow = function() {
    alert("aa");
    var checked = this.checked,
    row = $(this).closest("tr"),
    grid = $("#gridaccess").data("kendoGrid"),
    dataItem = grid.dataItem(row);

    if (checked) {
        $(".chkbx-"+dataItem.uid).attr("disabled", true);
    }else{
        $(".chkbx-"+dataItem.uid).removeAttr("disabled");
    }
}
usr.addFromPrivilage = function () {
    console.log(usr.templateAccessGrant);
    var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant));
    console.log(item);
    usr.config.Grants.push(new usr.templateAccessGrant()); 
};
usr.displayAccess = function(e){ 
    var dataItem = this.dataSource.view()[e.item.index()];
    
    // for (var i = 0; i < groups.length; i++) {
    //    var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant)); 
    //    usr.config.Grants.push(new usr.templateAccessGrant()); 
    // };

};
usr.removeAccess = function (each) {
    return function () {
        console.log(each);
        usr.config.Grants.remove(each);
    };
};
usr.dropdownAccess = function(ds){
    var data = [];
    for (var i in ds) {
        
        data.push({
            text : ds[i]._id,
            value: ds[i].title
        }); 
    };
      
    $("#dropdownAccess").kendoDropDownList({
    filter: "startswith",
    dataSource: data,
    dataTextField: "text",
    dataValueField: "value"
  }); 
};
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

usr.selectRow = function() {
    var checked = this.checked,
    row = $(this).closest("tr"),
    grid = $("#gridaccess").data("kendoGrid"),
    dataItem = grid.dataItem(row);

    if (checked) {
        $(".chkbx-"+dataItem.uid).removeAttr("disabled");
    }else{
        $(".chkbx-"+dataItem.uid).attr("disabled", true);
    }
}

usr.disableAllChkbx = function() {
    var grid = $("#gridaccess").data("kendoGrid");
    $.each(grid.dataSource.data(), function(key, value) {
        $(".chkbx-"+value.uid).attr("disabled", true);
    });
}