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
usr.Access = ko.observableArray([]);
usr.AccessGrant = ko.mapping.fromJS(usr.templateAccessGrant);
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
    }, {
    field: "groups",
    title: "Groups"
}]);
usr.filter = ko.mapping.fromJS(usr.templateFilter);
usr.isNew = ko.observable(false);
usr.editUser = ko.observable("");
usr.showUser = ko.observable(false);
usr.UsersData = ko.observableArray([]);
usr.search = ko.observable("");
usr.selectGridUsers = function(e) {
    app.mode('edit')
    usr.Access.removeAll();
    usr.getAccess();
    usr.isNew(false);
    app.wrapGridSelect(".grid-users", ".btn", function(d) {
        usr.config.Grants.removeAll();
        usr.editUser(d._id);
        usr.displayAccessUser(d._id);
        usr.showUser(true);
        app.mode("editor");

    });
};

usr.getUsers = function(c) {
    usr.UsersData([]);
    var data = [];
    var gr = "";
    var param = ko.mapping.toJS(usr.filter);
    app.ajaxPost("/user/getuser", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }

        for (var i in res.data) {
            for (var j in res.data[i].groups) {
                if (res.data[i].groups.length == 1) {
                    gr = res.data[i].groups[j]
                } else {
                    gr = gr + "," + res.data[i].groups[j]
                }
            };
            data.push({
                _id: res.data[i]._id,
                loginid: res.data[i].loginid,
                fullname: res.data[i].fullname,
                email: res.data[i].email,
                password: res.data[i].password,
                enable: res.data[i].enable,
                groups: gr
            })
        };
        console.log(data);
        usr.UsersData(data);
        var grid = $(".grid-users").data("kendoGrid");
        $(grid.tbody).on("mouseleave", "tr", function(e) {
            $(this).removeClass("k-state-hover");
        });

        if (typeof c == "function") {
            c(res);
        }
    });
};

usr.searchUser = function() {
    usr.UsersData([]);
    app.ajaxPost("/user/search", {
        search: usr.search()
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        usr.UsersData(res.data);
        var grid = $(".grid-access").data("kendoGrid");
        $(grid.tbody).on("mouseleave", "tr", function(e) {
            $(this).removeClass("k-state-hover");
        });

        if (typeof c == "function") {
            c(res);
        }
    });
};

usr.editUser = function(c) {
    app.mode('edit')
    var payload = ko.mapping.toJS(usr.filter._id(c));
    var data = [];
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

        for (var i = 0; i < res.data.Groups.length; i++) {
            data.push({
                text: res.data.Groups[i],
                value: res.data.Groups[i]
            });
        };
        console.log(data)
        usr.SelectedGroup(data);
        console.log(usr.SelectedGroup())
        usr.config.Groups();
    });
};
usr.config = ko.mapping.fromJS(usr.templateUser);
usr.listGroup = ko.observableArray([]);
usr.SelectedGroup = ko.observableArray([]);
usr.saveuser = function() {
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
    console.log(AccessGrants);
    //====== 
    app.ajaxPost("/user/saveuser", {
        user: user,
        grants: AccessGrants
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
    app.ajaxPost("/administration/getaccess", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        for (var i in res.data) {
            usr.Access.push(res.data[i]._id);
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
        console.log(res.data);
    });
};
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
    app.mode('new');
    if (usr.config.Grants().length < adm.SumAccess()) {
        var item = ko.mapping.fromJS($.extend(true, {}, usr.templateAccessGrant));
        usr.config.Grants.push(new usr.templateAccessGrant());
    }
};
usr.displayAccess = function(e) {
    // var dataItem = this.dataSource.view()[e.item.index()];
    app.ajaxPost("/group/getaccessgroup", {
        //idGroup: dataItem.value
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
usr.LoginID = ko.observable("");
usr.NewPassword = ko.observable("");
usr.ConfirmPass = ko.observable("");
usr.confpass = ko.observable();
usr.confloginid = ko.observable();
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

usr.addaccessgroup=function(){

}