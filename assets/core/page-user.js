app.section('user');

viewModel.user = {};
var usr = viewModel.user;

usr.templateUser = {
    _id: "",
    LoginID: "",
    FullName: "",
    Email: "",
    Password: "",
    confPass: "",
    LoginType : "",
    LoginConf : "",
    Enable: ko.observable(false),
    Groups: ko.observableArray([]),
    Grants: [],
};

usr.templateFilter = {
    _id: "",
    LoginID: "",
    FullName: "",
    Email: "",
    Groups: ko.observableArray([]),
};
usr.templateLdap = { 
    Address: "",
    BaseDN: "",
    Filter: "",
    Username: "",
    Password: "",
    Attribute: ko.observableArray([])
};

usr.templateAccessGrant = function() {
    var self = {
        AccessID: ko.observable(""),
        AccessCreate: ko.observable(false),
        AccessRead: ko.observable(false),
        AccessUpdate: ko.observable(false),
        AccessDelete: ko.observable(false),
        AccessSpecial1: ko.observable(false),
        AccessSpecial2: ko.observable(false),
        AccessSpecial3: ko.observable(false),
        AccessSpecial4: ko.observable(false),
        NameSpecial1: ko.observable(""),
        NameSpecial2: ko.observable(""),
        NameSpecial3: ko.observable(""),
        NameSpecial4: ko.observable(""),
    }
    return self;
};
usr.templateAccessGrant2 = function() {
    var self = {
        AccessID: ko.observable(""),
        AccessCreate: ko.observable(false),
        AccessRead: ko.observable(false),
        AccessUpdate: ko.observable(false),
        AccessDelete: ko.observable(false),
        AccessSpecial1: ko.observable(false),
        AccessSpecial2: ko.observable(false),
        AccessSpecial3: ko.observable(false),
        AccessSpecial4: ko.observable(false),
        NameSpecial1: ko.observable(""),
        NameSpecial2: ko.observable(""),
        NameSpecial3: ko.observable(""),
        NameSpecial4: ko.observable(""),
    }
    return self;
};
usr.tempDataGrup = ko.observableArray([]);
usr.tapNum = ko.observable(0);
usr.dataAccess = ko.observableArray([]);
usr.attribute = ko.observableArray("");
usr.Access = ko.observableArray([]);
usr.AccessGrant = ko.mapping.fromJS(usr.templateAccessGrant);
usr.ldap=ko.mapping.fromJS(usr.templateLdap);
usr.LoginID = ko.observable("");
usr.NewPassword = ko.observable("");
usr.ConfirmPass = ko.observable("");
usr.confpass = ko.observable();
usr.confloginid = ko.observable();
usr.filter = ko.mapping.fromJS(usr.templateFilter);
usr.isNew = ko.observable(false);
usr.editUser = ko.observable("");
usr.showUser = ko.observable(false);
usr.UsersData = ko.observableArray([]);
usr.search = ko.observable("");
usr.config = ko.mapping.fromJS(usr.templateUser);
usr.listGroup = ko.observableArray([]);
usr.SelectedGroup = ko.observableArray([]);
usr.modeLoad=ko.observable(true)
usr.Logintype = ko.observableArray(["","Ldap","Google","Facebook"])
usr.valueLogintype = ko.observable("");
usr.ListAddress = ko.observableArray([]);
usr.ListLdap = ko.observableArray([]);
usr.selectedAddress = ko.observable("");
usr.resultAccessID = ko.observableArray([]);
// usr.unselectedAccess = ko.computed(function(){
//     // usr.dataAccess().forEach(function(d){
//     //     if( usr.dataSelected().indexOf(d) === -1 ){
//     //         result.push(d)
//     //     }

//     // });
//     // if(usr.tapNum()== 1){
//         return usr.dataAccess();
//     //}
//     //return result;
// });
usr.dataSelected = ko.observable([]);
usr.UsersColumns = ko.observableArray([{
    template: "<input type='checkbox' name='checkboxuser' class='ckcGrid' value='#: _id #' />",
    width: 50
    }, {
    field: "loginid",
    title: "Login Id"
    }, {
    field: "fullname",
    title: "Fullame"
    }, {
    field: "email",
    title: "Email"
    }, {
    field: "password",
    title: "Password"
    }, {
    field: "enable",
    title: "Enable"
    }
]);

usr.UsersColumnsldap = ko.observableArray([ {
    field: "cn",
    title: "Cn"
    }, {
    field: "givenName",
    title: "Name"
    }  
]);
usr.selectGridUsers = function() { 
    app.mode('edit')
    usr.Access.removeAll();
    usr.getAccess();
    usr.isNew(false);
    app.wrapGridSelect("#grid-users", ".btn", function(d) {
        usr.config.Grants.removeAll();
        grp.getlistGroups();
        usr.editUser(d._id);
        usr.displayAccessUser(d._id);
        usr.showUser(true);
        app.mode("editor");
        grp.selectedGroupsData.removeAll(); 
    });
};
usr.selectGridLdap = function() {    
    app.wrapGridSelect("#grid-ldap", ".btn", function(d) {
        usr.config.LoginID(d.cn)
        usr.config.FullName(d.givenName)
        $(".modal-checklogin").modal("hide");
    });
    
};
 
usr.GetFilter = function(){
    data = {
        find : usr.search,
    }

    return data
}

usr.GetFilterLdap = function(){
    data = {
        Address : usr.ldap.Address(),
        BaseDN : usr.ldap.BaseDN(),
        Filter : usr.ldap.Filter(),
        Username : usr.ldap.Username(),
        Password : usr.ldap.Password(),
    }

    return data
}
usr.getUsers = function() {
    $("#grid-users").html("");
    $('#grid-users').kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: "/user/getuser",
                    dataType: "json",
                    data: usr.GetFilter(),
                    type: "POST",
                    success: function(data) { 
                        $("#grid-users>.k-grid-content-locked").css("height", $("#grid-users").data("kendoGrid").table.height());
                         
                    }
                }
            },
            schema: {
                data: "data.Datas",
                total: "data.total"
            },

            pageSize: 10,
            serverPaging: true,   
            serverSorting: true,
        },
        resizable: true,
        scrollable: true, 
        pageable: {
            refresh: false,
            pageSizes: 10,
            buttonCount: 5
        },
        pageable: true,  
        sortable: true,
        selectable: 'multiple, row', 
        filterfable: false,
        change: usr.selectGridUsers,
        columns: usr.UsersColumns()
    });

}
 usr.getUsersLdap = function() {
    if (!app.isFormValid("#form-modal-user")) {
        return;
    }
    var array = usr.attribute().replace(/\s/g, '').split(",");
    if(array.length != 3){
        array = [];
    }else{
        $.each(array, function(i){
            usr.ldap.Attribute.push(array[i]);
        });
    }
    var param = ko.mapping.toJS(usr.ldap);
    usr.tempDataGrup.push(param);
    app.ajaxPost("/user/testfinduserldap", param, function(res){
        if(!app.isFine(res)){
            return;
        }
        grp.GrupModalgrid('show')
        $('#grid-ldap').kendoGrid({
            dataSource: {
                data: res.data,
                pageSize: 5
            },
            pageable: true,  
            sortable: true,  
            selectable: 'multiple, row', 
            filterfable: true,
            change: usr.selectGridLdap,
            columns: [
                {title: "ID", field: array[0]},
                {title: "Name", field: array[1]},
            ],
            dataBound :usr.saveConfigLdap()
        });
    });
    
}
usr.searchUser = function(event){
    if ((event != undefined) && (event.keyCode == 13)){
        $('#grid-users').data('kendoGrid').dataSource.read();
    }
    return
};
usr.editUser = function(c) {
    app.mode('edit')
    usr.modeLoad(true)
    var payload = ko.mapping.toJS(usr.filter._id(c));
    var data  = [];
    var data2 = [];
    var data3 = []
    app.ajaxPost("/user/finduser", payload, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        usr.config._id(res.data._id);
        usr.config.LoginID(res.data.LoginID);
        usr.config.FullName(res.data.FullName);
        usr.config.Email(res.data.Email);
        usr.config.Password(res.data.Password);
        usr.config.Enable(res.data.Enable);
        if(res.data.LoginType==1){
            usr.valueLogintype("Ldap")
        }else if (res.data.LoginType==2){
            usr.valueLogintype("Google")
        }else if (res.data.LoginType==3){
            usr.valueLogintype("Facebook")
        }else{
            usr.valueLogintype("")
        }
        for (var i = 0; i < res.data.Groups.length; i++) {
            data.push({
                text: res.data.Groups[i],
                value: res.data.Groups[i]
            });
            data2.push({
                _id:res.data.Groups[i],
                title:res.data.Groups[i]
            })
        }; 
        var index = 0; 
        for (var j = 0; j < data2.length; j++) {
            console.log("ls "+grp.listGroupsData().length)
            for (var i = 0; i < grp.listGroupsData().length; i++) { 
                if (grp.listGroupsData()[i]._id == data2[j]._id){
                    index=i; 
                } 
        } 

        grp.listGroupsData().splice(index, 1);  
        };
        
        for (var i = 0; i < grp.listGroupsData().length; i++) {
             data3.push({
                _id:grp.listGroupsData()[i]._id,
                title:grp.listGroupsData()[i].title
             })
        };

        setTimeout(function(){ 
            grp.listGroupsData.removeAll();
            grp.listGroupsData(data3) 
            grp.selectedGroupsData(data2);
            usr.SelectedGroup(data); 
            usr.config.Groups();
            usr.modeLoad(false);
        }, 1000);
    });
};

usr.saveConfigLdap = function () { 
    var payload = ko.mapping.toJS(usr.ldap); 
    app.ajaxPost("/user/saveconfigldap", payload, function (res) {
        if (!app.isFine(res)) {
            return;
        } 
    });

};

usr.saveuser = function() {
    if (!app.isFormValid("#form-add-user")) {
        return;
    }
    if (usr.config.Enable() == "") {
        usr.config.Enable(false);
    }
    var data=[]
    for (var i = 0; i < grp.selectedGroupsData().length; i++) {
        data.push(grp.selectedGroupsData()[i]._id);
    };
    usr.config.Groups(data)
    // usr.config.Groups($('#Groups').data('kendoMultiSelect').value());
    user = ko.mapping.fromJS(usr.config);
    //======
    var data = ko.mapping.toJS(usr.config.Grants);
    var AccessGrants = [];
    for (var i = 0; i < data.length; i++) {
        grp.Access.AccessID(data[i].AccessID)
        if (data[i].AccessCreate == true) {
            grp.Access.AccessValue.push("AccessCreate");
        };
        if (data[i].AccessRead == true) {
            grp.Access.AccessValue.push("AccessRead");
        };
        if (data[i].AccessUpdate == true) {
            grp.Access.AccessValue.push("AccessUpdate");
        };
        if (data[i].AccessDelete == true) {
            grp.Access.AccessValue.push("AccessDelete");
        };
        if (data[i].AccessSpecial1 == true) {
            grp.Access.AccessValue.push("AccessSpecial1");
        };
        if (data[i].AccessSpecial2 == true) {
            grp.Access.AccessValue.push("AccessSpecial2");
        };
        if (data[i].AccessSpecial3 == true) {
            grp.Access.AccessValue.push("AccessSpecial3");
        };
        if (data[i].AccessSpecial4 == true) {
            grp.Access.AccessValue.push("AccessSpecial4");
        };
        AccessGrants.push(ko.mapping.toJSON(grp.Access))
        grp.Access.AccessValue.removeAll()
    };
    var userModal = {
        Address:  usr.tempDataGrup()[0].Address,
        BaseDN:  usr.tempDataGrup()[0].BaseDN,
        Filter:  usr.tempDataGrup()[0].Filter,
        Username:  usr.tempDataGrup()[0].Username,
        Password:  usr.tempDataGrup()[0].Password,
        Attribute:  usr.tempDataGrup()[0].Attribute,
    };
    console.log(AccessGrants);
    //====== 
    app.ajaxPost("/user/saveuser", {
        user: user,
        grants: AccessGrants,
        userConfig: userModal
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        usr.config._id("");
        swal({
            title: "User successfully created",
            type: "success",
            closeOnConfirm: true
        });
        usr.backToFront();
    });
};
usr.deleteuser = function() {
    var checkboxes = document.getElementsByName('checkboxuser');
    var selected = [];
    for (var i = 0; i < checkboxes.length; i++) {
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
    swal({
        title: "User successfully deleted",
        type: "success",
        closeOnConfirm: true
    });
    usr.backToFront();
};
usr.Usermode = ko.observable('');

usr.createNewUser = function() {
    usr.Access.removeAll();
    usr.config.Grants.removeAll();
    usr.config._id("");
    usr.config.LoginID("");
    usr.config.FullName("");
    usr.config.Password("");
    usr.config.Enable("");
    usr.getAccess();
    app.mode("new");
    usr.getGroup();
    usr.SelectedGroup.removeAll();
    grp.listGroupsData.removeAll();
    grp.selectedGroupsData.removeAll();
    grp.getlistGroups();
    usr.modeLoad(false);
};


usr.backToFront = function() {
    usr.Access.removeAll();
    app.mode('');
    usr.getUsers();
    app.section('user');
};
usr.getmultiplegroup = function() {
    var param = ko.mapping.toJS(usr.filter);
    var data = [];
    app.ajaxPost("/group/getgroup", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        for (var i in res.data) {
            data.push({
                text: res.data[i]._id,
                value: res.data[i].title
            });
        };
        usr.listGroup(data);
    });
};

$(function() {
    usr.getmultiplegroup();
    usr.getUsers();
});
usr.visit = ko.observable(false);
usr.createGridPrivilege = function(ds) {
    var grid = $("#gridaccess").kendoGrid({
        columns: [{
            template: "<input type='checkbox' class='ckcGrid' value='#: _id #' onclick=\"addAccess('#: _id #',this)\" data-bind=\"click:usr.selectRow\"/>",
            width: 10
        }, {
            field: "title",
            title: "Access",
            width: 110
        }, {
            title: "Create",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessCreate',this)\" />",
            width: 30
        }, {
            title: "Read",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessRead',this)\" />",
            width: 30
        }, {
            title: "Update",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessUpdate',this)\"  />",
            width: 30
        }, {
            title: "Delete",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" onclick=\"addPrivilage('#: _id #','AccessDelete',this)\" />",
            width: 30
        }, {
            title: "SA 1",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\"  title=\"#: specialaccess1 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess1 #',this)\" />",
            width: 20
        }, {
            title: "SA 2",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess2 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess2 #',this)\" />",
            width: 20
        }, {
            title: "SA 3",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess3 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess3 #',this)\" />",
            width: 20
        }, {
            title: "SA 4",
            template: "<input type='checkbox' class=\"chkbx-#=uid#\" title=\"#: specialaccess4 #\" onclick=\"addPrivilage('#: _id #','#: specialaccess4 #',this)\"/>",
            width: 20
        }],
        dataSource: {
            data: ds
        }
    }).data("kendoGrid");

};



usr.getAccess = function() {
    var param = ko.mapping.toJS(usr.filter);
    var data = [];
    app.ajaxPost("/administration/getaccessdropdown", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        for (var i in res.data) {
            usr.Access.push(res.data[i]._id);
             usr.dataAccess.push(res.data[i]._id)
            data.push({
                text: res.data[i]._id,
                value: res.data[i].title
            });
        };
        usr.createGridPrivilege(res.data);
        usr.dropdownAccess(res.data)
    });

};

usr.getGroup = function() {
    var param = ko.mapping.toJS(usr.filter);
    app.ajaxPost("/group/getgroup", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        // usr.getmultiplegroup(res.data)

    });
};

usr.GetConfigLdap = function() {
    var param = ko.mapping.toJS(usr.filter);
    usr.ListLdap.removeAll();
    usr.ListAddress.removeAll();
    var data = [];
    app.ajaxPost("/user/getconfigldap", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        for (var i = 0; i < res.data.length; i++) {
            data.push({
                Address  :res.data[i].Address,
                BaseDN   :res.data[i].BaseDN,
                Filter :res.data[i].FilterUser,
                Username :res.data[i].Username,
                Password :res.data[i].Password,
                Attribute :res.data[i].AttributesUser,
            });

            usr.ListAddress.push(res.data[i].Address);   
        };
        usr.ListLdap(data); 
        $("#Address").kendoAutoComplete({
            dataSource: usr.ListAddress(),
            filter: "startswith",
            change : usr.setLdap,
            select: function (ev) {
                usr.ldap.Address(this.dataItem(ev.item.index())) 
            }
        }); 
    });
};
usr.setLdap = function(){  
    for (var i = 0; i < usr.ListLdap().length; i++) {
        console.log(usr.ListLdap()[i].Address)
        if(usr.ldap.Address()==usr.ListLdap()[i].Address){
           usr.ldap.Address(usr.ListLdap()[i].Address);
           usr.ldap.BaseDN(usr.ListLdap()[i].BaseDN);
           usr.ldap.Filter(usr.ListLdap()[i].Filter);
           usr.ldap.Username(usr.ListLdap()[i].Username);
           //usr.ldap.Password(usr.ListLdap()[i].Password);
           $('#usr-attribute').tokenfield('setTokens', usr.ListLdap()[i].Attribute);
        }
    };
}
usr.selectRow = function() {

    var checked = this.checked,
        row = $(this).closest("tr"),
        grid = $("#gridaccess").data("kendoGrid"),
        dataItem = grid.dataItem(row);

    if (checked) {
        $(".chkbx-" + dataItem.uid).attr("disabled", true);
    } else {
        $(".chkbx-" + dataItem.uid).removeAttr("disabled");
    }
}
usr.addFromPrivilage = function() {
    usr.tapNum(usr.tapNum()+1);
    app.mode('new'); 
    var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant));
    usr.config.Grants.push(new usr.templateAccessGrant());

};
usr.displayAccess = function(e) { 
    app.ajaxPost("/group/getaccessgroup", { 
        idGroup: e
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        var n = 0;
        var m = 0;
        if (app.mode() == 'new') {
            n = usr.config.Grants().length;
            m = res.data.length;
        } else {
            n = usr.config.Grants().length
            m = res.data.length + n;
        }
        app.mode('new');
        console.log(ko.mapping.toJSON(res.data))
        for (var i = n; i < m; i++) {
            var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant));
            usr.config.Grants.push(new usr.templateAccessGrant2());
            usr.config.Grants()[i].AccessID(res.data[i - n].AccessID);
            if (res.data[i - n].AccessValue.indexOf(1) == -1) {
                usr.config.Grants()[i].AccessCreate(false)
            } else {
                usr.config.Grants()[i].AccessCreate(true)
            }
            if (res.data[i - n].AccessValue.indexOf(2) == -1) {
                usr.config.Grants()[i].AccessRead(false)
            } else {
                usr.config.Grants()[i].AccessRead(true)
            }
            if (res.data[i - n].AccessValue.indexOf(4) == -1) {
                usr.config.Grants()[i].AccessUpdate(false)
            } else {
                usr.config.Grants()[i].AccessUpdate(true)
            }
            if (res.data[i - n].AccessValue.indexOf(8) == -1) {
                usr.config.Grants()[i].AccessDelete(false)
            } else {
                usr.config.Grants()[i].AccessDelete(true)
            }
            if (res.data[i - n].AccessValue.indexOf(16) == -1) {
                usr.config.Grants()[i].AccessSpecial1(false)
            } else {
                usr.config.Grants()[i].AccessSpecial1(true)
            }
            if (res.data[i - n].AccessValue.indexOf(32) == -1) {
                usr.config.Grants()[i].AccessSpecial2(false)
            } else {
                usr.config.Grants()[i].AccessSpecial2(true)
            }
            if (res.data[i - n].AccessValue.indexOf(64) == -1) {
                usr.config.Grants()[i].AccessSpecial3(false)
            } else {
                usr.config.Grants()[i].AccessSpecial3(true)
            }
            if (res.data[i - n].AccessValue.indexOf(128) == -1) {
                usr.config.Grants()[i].AccessSpecial4(false)
            } else {
                usr.config.Grants()[i].AccessSpecial4(true)
            }
        };
    });
};

usr.displayAccessUser = function(e) {
    app.ajaxPost("/user/getaccess", {
        id: e
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        } 
        for (var i = 0; i < res.data.length; i++) {
            var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant));
            usr.config.Grants.push(new usr.templateAccessGrant2());
            usr.config.Grants()[i].AccessID(res.data[i].AccessID);
            if (res.data[i].AccessValue.indexOf(1) == -1) {
                usr.config.Grants()[i].AccessCreate(false)
            } else {
                usr.config.Grants()[i].AccessCreate(true)
            }
            if (res.data[i].AccessValue.indexOf(2) == -1) {
                usr.config.Grants()[i].AccessRead(false)
            } else {
                usr.config.Grants()[i].AccessRead(true)
            }
            if (res.data[i].AccessValue.indexOf(4) == -1) {
                usr.config.Grants()[i].AccessUpdate(false)
            } else {
                usr.config.Grants()[i].AccessUpdate(true)
            }
            if (res.data[i].AccessValue.indexOf(8) == -1) {
                usr.config.Grants()[i].AccessDelete(false)
            } else {
                usr.config.Grants()[i].AccessDelete(true)
            }
            if (res.data[i].AccessValue.indexOf(16) == -1) {
                usr.config.Grants()[i].AccessSpecial1(false)
            } else {
                usr.config.Grants()[i].AccessSpecial1(true)
            }
            if (res.data[i].AccessValue.indexOf(32) == -1) {
                usr.config.Grants()[i].AccessSpecial2(false)
            } else {
                usr.config.Grants()[i].AccessSpecial2(true)
            }
            if (res.data[i].AccessValue.indexOf(64) == -1) {
                usr.config.Grants()[i].AccessSpecial3(false)
            } else {
                usr.config.Grants()[i].AccessSpecial3(true)
            }
            if (res.data[i].AccessValue.indexOf(128) == -1) {
                usr.config.Grants()[i].AccessSpecial4(false)
            } else {
                usr.config.Grants()[i].AccessSpecial4(true)
            }
        }
    });
};
usr.removeAccess = function(each) {
    return function() {
        console.log(each);
        usr.config.Grants.remove(each);
    };
};
usr.dropdownAccess = function(ds) {
    var data = [];
    for (var i in ds) {

        data.push({
            text: ds[i]._id,
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
 

usr.selectRow = function() {
    var checked = this.checked,
        row = $(this).closest("tr"),
        grid = $("#gridaccess").data("kendoGrid"),
        dataItem = grid.dataItem(row);

    if (checked) {
        $(".chkbx-" + dataItem.uid).removeAttr("disabled");
    } else {
        $(".chkbx-" + dataItem.uid).attr("disabled", true);
    }
}

usr.disableAllChkbx = function() {
    var grid = $("#gridaccess").data("kendoGrid");
    $.each(grid.dataSource.data(), function(key, value) {
        $(".chkbx-" + value.uid).attr("disabled", true);
    });
}

usr.showModalChPass = function() {
    $(".modal-chpass").modal("show");
};

usr.CheckLoginType =  function(){
    usr.getUsersLdap();
}

usr.DisplayLdap =  function(){
   if(usr.valueLogintype()=="Ldap"){
        $(".modal-checklogin").modal("show");
        $('#usr-attribute').tokenfield({});
        usr.ldap.Attribute([]);
        $('#usr-attribute').tokenfield('setTokens', []);
        //usr.attribute('');

        usr.GetConfigLdap();
        usr.config.LoginType("1");
   }else{
        usr.config.LoginType("0");
   } 
}
usr.CheckPass = function() {
    if (usr.NewPassword() != "" && usr.ConfirmPass() != "" && usr.NewPassword() == usr.ConfirmPass()) {
        usr.confpass(true)
    } else {
        usr.confpass(false)
    }

    if (usr.LoginID != "") {
        usr.confloginid(true)
    } else {
        usr.confloginid(false)
    }
};

// usr.click = function(){
//     alert(usr.config.Grants()[0].AccessID());
// }

usr.ChangePass = function() {
    usr.CheckPass();
    user = ko.mapping.fromJS(usr.config);
    if (usr.confpass() == true && usr.confloginid() == true) {
        app.ajaxPost("/user/changepass", {
            user: user,
            pass: usr.NewPassword()
        }, function(res) {
            if (!app.isFine(res)) {
                return;
            }
            usr.config._id("");
            swal({
                title: "Password successfully Changed",
                type: "success",
                closeOnConfirm: true
            });
            usr.backToFront();
            $(".modal-chpass").modal("hide");
        });
    }
};

// $(function() { 
//     if(usr.tapNum() >1){
//         var ind = usr.Access().indexOf(usr.config.Grants()[0].AccessID())
//         usr.Access().splice(ind,1); 
//     }
//     alert('lalala');
// });
//  