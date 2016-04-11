app.section('group');

viewModel.group = {};
var grp = viewModel.group;
grp.templateGroup = {
    _id: "",
    Title: "",
    Enable: ko.observable(false),
    Owner: "",
    GroupType: "",
    Grants: ko.observableArray([]),
    Filter: "",
    LoginID: "",
    Fullname: "",
    Email: "",
};
grp.templateFilter = {
    _id: "",
    Title: "",
    Owner: "",
};
grp.AccessGrantGroup = {
    AccessID: "",
    AccessValue: [],
};
grp.DataTypeTemplate = {
    Address: "",
    BaseDN: "",
    Filter: "",
    Username: "",
    Password: "",
    Attribute: ko.observableArray([]),
}
grp.templateLdapAuth={
    username: "",
    password: "",
    groupid: "",
}
grp.groupID = ko.observableArray("");
grp.ArrayDataID = ko.observableArray([]);
grp.generateFilter = ko.observable("");
grp.configLdapAuht = ko.mapping.fromJS(grp.templateLdapAuth);
grp.dataType = ko.observable("0");
grp.dataSearch = ko.observable('');
grp.dataTypeConfig = ko.mapping.fromJS(grp.DataTypeTemplate);
grp.Access = ko.mapping.fromJS(grp.AccessGrantGroup);
grp.ListAccess = ko.observableArray([]);
grp.attribute = ko.observable("");
grp.listAddress = ko.observableArray([]);
grp.listLdap = ko.observableArray([]);
grp.tempDataGrup = ko.observableArray([]);
grp.GrupModalgrid = ko.observable('');
grp.GroupsColumns = ko.observableArray([{
    template: "<input type='checkbox' name='checkboxgroup' class='ckcGrid' value='#: _id #' />",
    width: 50
    }, {
    field: "_id",
    title: "ID"
    }, {
    field: "title",
    title: "Title"
    }, {
    field: "enable",
    title: "Enable"
    }, {
    field: "owner",
    title: "Owner"
    },{
    title: "<center>Action</center>",
    width: 70,
    template: function(d){
        if(d.grouptype == "1"){
            grp.configLdapAuht.groupid(d._id);
            grp.configLdapAuht.username(d.memberconf.username);
            return "<center><button class=\"btn btn-sm btn-default btn-start tooltipster tooltipstered\" title=\"Refresh Ldap Group\" onclick=\"grp.refreshGroupLdap()\"><span class=\"glyphicon glyphicon-refresh\"></span></button></center>"
         }else{
            return "";
         }
       
        }
    } 
]);

grp.listGroupsColumns = ko.observableArray([  
    {
    field: "_id",
    title: "List Group" 
    }
]);

grp.selectedGroupsColumns = ko.observableArray([{
    field: "_id",
    title: "Selected Group"
    } 
]);
grp.filter = ko.mapping.fromJS(grp.templateFilter);
grp.isNew = ko.observable(false);
grp.editGroup = ko.observable("");
grp.showGroup = ko.observable(false);
grp.GroupsData = ko.observableArray([]);
grp.search = ko.observable("");
grp.selectGridGroups = function(e) {
    usr.Access.removeAll();
    usr.getAccess();
    grp.isNew(false);
    app.wrapGridSelect("#grid-groups", ".btn", function(d) {
        grp.editGroup(d._id);
        grp.showGroup(true);
        app.mode("editor");
    });
};
grp.temp=ko.observableArray([]);
grp.selectlistGridGroups = function(e) {    
    usr.Access.removeAll();
    usr.getAccess();
    grp.isNew(false);
    var data = {};
    var data2 = [];
    app.wrapGridSelect(".listgroup", ".btn", function(d) { 
        data = {
            _id : d._id,
            title:d.title
        }
        usr.displayAccess(d._id);
        var index = 0;
        for (var i = 0; i < grp.listGroupsData().length; i++) {
            if (grp.listGroupsData()[i]._id == d._id){
                index=i; 
            } 
        }
        grp.listGroupsData().splice(index, 1); 
        for (var i = 0; i < grp.listGroupsData().length; i++) {
             data2.push({
                _id:grp.listGroupsData()[i]._id,
                title:grp.listGroupsData()[i].title
             })
        };
        grp.listGroupsData.removeAll();
        grp.listGroupsData(data2) 
        grp.selectedGroupsData.push(data);
    });
};
grp.refreshGroupLdap = function(){
    // app.ajaxPost("/group/refreshgroupldap", param, function(res) {
    //     if (!app.isFine(res)) {
    //         return;
    //     }
    // });

    $('#modalRefresh').modal({show: 'true'});
    
}
grp.getRefresh = function(){
    var param = ko.mapping.toJS(grp.configLdapAuht);
    console.log(param);
    app.ajaxPost("/group/refreshgroupldap", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }

        $('#modalRefresh').modal("hide");

    });

}
grp.removeselectGridGroups = function(e) {
    usr.Access.removeAll();
    usr.getAccess();
    grp.isNew(false);
    var data = {};
    var data2 = [];
    app.wrapGridSelect(".selectedgroup", ".btn", function(d) { 
        data = {
            _id : d._id,
            title:d.title
        }
        var index = 0;
        for (var i = 0; i < grp.selectedGroupsData().length; i++) {
            if (grp.selectedGroupsData()[i]._id == d._id){
                index=i; 
            } 
        }
        grp.selectedGroupsData().splice(index, 1); 
        for (var i = 0; i < grp.selectedGroupsData().length; i++) {
             data2.push({
                _id:grp.selectedGroupsData()[i]._id,
                title:grp.selectedGroupsData()[i].title
             })
        };
        grp.selectedGroupsData.removeAll();
        grp.selectedGroupsData(data2) 
        grp.listGroupsData.push(data);
    });
};
grp.getGroups = function(c) {
    
    //var param = ko.mapping.toJS(grp.filter);
    // //console.log("")
    // app.ajaxPost("/group/getgroup", param, function(res) {
        // if (!app.isFine(res)) {
        //     return;
        // }
        // if (res.data == null) {
        //     res.data = "";
        // }
    //     grp.GroupsData(res.data);
        // var grid = $(".grid-groups").data("kendoGrid");
        // $(grid.tbody).on("mouseleave", "tr", function(e) {
        //     $(this).removeClass("k-state-hover");
        // });

        // if (typeof c == "function") {
        //     c(res);
    //     }
    // });
    var param = ko.mapping.toJS(grp.filter);
    $("#grid-groups").kendoGrid({
            columns: grp.GroupsColumns(),
            dataSource: {
                   transport: {
                        read:{
                            url:"/group/search",
                            data:{search:grp.search()},
                            dataType:"json",
                            type: "POST",
                            success: function(data) {
                                var grid = $("#grid-groups").data("kendoGrid");
                                $(grid.tbody).on("mouseleave", "tr", function(e) {
                                    $(this).removeClass("k-state-hover");
                                });
                                if (typeof c == "function") {
                                    c(res);
                                }
                            }
                        }
                   },
                   schema: {
                        data: "data.Datas",
                        total: "data.total"
                   },
                   pageSize: 5,
                   serverPaging: true, 
                   serverSorting: true,
                   serverFiltering: true,
               },
            pageable: true,
            scrollable: true,
            sortable: true,
            selectable: 'multiple, row',
            change: grp.selectGridGroups,
            filterfable: false,
            dataBound: app.gridBoundTooltipster('#grid-groups'), 
            columns: grp.GroupsColumns()
    });
                                
};
grp.listGroupsData=ko.observableArray([]);
grp.selectedGroupsData=ko.observableArray([]);
grp.getlistGroups = function(c) {
    grp.listGroupsData([]);
    var param = ko.mapping.toJS(grp.filter);
    var data = [];
    app.ajaxPost("/group/getgroup", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        // console.log("----- 264 ",res.data[8].grouptype);
        for (var i = 0; i < res.data.length; i++) {
            if(res.data[i].grouptype != 1){
                data.push({
                    _id:res.data[i]._id,
                    title : res.data[i].title
                })
            }
            
        };
        grp.listGroupsData(data);
        // var grid = $(".listgroup").data("kendoGrid");
        // $(grid.tbody).on("mouseleave", "tr", function(e) {
        //     $(this).removeClass("k-state-hover");
        // });

        // if (typeof c == "function") {
        //     c(res);
        // }
    }); 
};

// grp.searchGroup = function() {
//     grp.GroupsData([]);
//     app.ajaxPost("/group/search", {
//         search: grp.search()
//     }, function(res) {
//         if (!app.isFine(res)) {
//             return;
//         }
//         if (res.data == null) {
//             res.data = "";
//         }
//         grp.GroupsData(res.data);
//         var grid = $(".grid-access").data("kendoGrid");
//         $(grid.tbody).on("mouseleave", "tr", function(e) {
//             $(this).removeClass("k-state-hover");
//         });

//         if (typeof c == "function") {
//             c(res);
//         }
//     });
// };

grp.config = ko.mapping.fromJS(grp.templateGroup);
grp.Groupmode = ko.observable('');

grp.savegroup = function() {
    if (!app.isFormValid("#form-add-Group")) {
        return;
    }
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
    var groupModal = {
        Address:  grp.dataTypeConfig.Address(),
        BaseDN:  grp.dataTypeConfig.BaseDN(),
        Filter:  grp.dataTypeConfig.Filter(),
        Username:  grp.dataTypeConfig.Username(),
        Password:  grp.dataTypeConfig.Password(),
        Attribute:  grp.dataTypeConfig.Attribute(),
    };
    grp.config.GroupType(grp.dataType());
    group = ko.mapping.fromJS(grp.config);
    console.log("======= group ", group);
    app.ajaxPost("/group/savegroup", {
        group: group,
        grants: AccessGrants,
        groupConfig: groupModal
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        swal({
            title: "Group successfully created",
            type: "success",
            closeOnConfirm: true
        });
        grp.backToFront();
    });
};
grp.deletegroup = function() {
    var checkboxes = document.getElementsByName('checkboxgroup');
    var selected = [];
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selected.push(checkboxes[i].value);
        }
    }
    for (var i = 0; i < selected.length; i++) {
        payload = ko.mapping.fromJS(grp.filter._id(selected[i]));
        app.ajaxPost("/group/deletegroup", payload, function(res) {
            if (!app.isFine(res)) {
                return;
            }
        });
    };
    swal({
        title: "Group successfully deleted",
        type: "success",
        closeOnConfirm: true
    });
    grp.backToFront();
};
grp.createNewGroup = function() {
    usr.Access.removeAll();
    usr.config.Grants.removeAll();
    usr.getAccess();
    grp.config._id("");
    grp.config.Title("");
    grp.config.Enable("");
    grp.config.Grants("");
    grp.config.Owner("");
    app.mode("editor");
};
grp.editGroup = function(c) {
    usr.config.Grants.removeAll();
    var payload = ko.mapping.toJS(grp.filter._id(c));
    app.ajaxPost("/group/findgroup", payload, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        console.log(res.data);
        grp.config._id(res.data._id);
        grp.config.Title(res.data.Title);
        grp.config.Enable(res.data.Enable);
        grp.config.Grants(res.data.Grants);
        grp.config.Owner(res.data.Owner);
        grp.displayAccess(res.data._id);
        grp.dataType(JSON.stringify(res.data.GroupType));
    });
};

grp.displayAccess = function(e) {
    app.ajaxPost("/group/getaccessgroup", {
        idGroup: e
    }, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        console.log(res.data);
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
        };
    });
};
grp.content = ko.observable('test');
  grp.isOpen = ko.observable(false);

grp.backToFront = function() {
    app.mode('');
    grp.getGroups();
    app.section('group');
};

grp.showModalType = function(){
    $('#modalForgot').modal({show: 'true'});
    $('#attribute-group').tokenfield({});
    //grp.GrupModalgrid('hide');
    $('#attribute-group').tokenfield('setTokens', []);
    grp.attribute('');
    grp.dataTypeConfig.Attribute([]);
    grp.autoDataAddress();
    grp.tempDataGrup([]);
}

grp.autoDataAddress = function(){
    grp.listLdap.removeAll();
    grp.listAddress.removeAll();
    var data = [];
    app.ajaxPost("/group/getldapdataaddress", {}, function(res){
        if(!app.isFine(res)){
            return;
        }

        for(var i=0; i< res.data.length; i++){
            grp.listAddress.push(res.data[i].Address);
            data.push({
                Address  :res.data[i].Address,
                BaseDN   :res.data[i].BaseDN,
                Filter   :res.data[i].FilterGroup,
                Username :res.data[i].Username,
                Password :res.data[i].Password,
                Attribute :res.data[i].AttributesGroup,

            });
        }

        grp.listLdap(data);
        $('#address').kendoAutoComplete({
            dataSource: grp.listAddress(),
            filter: "startswith",
            change: grp.setDataType,
            select: function(e) {
                grp.dataTypeConfig.Address(this.dataItem(e.item.index()))
            }
        });

    });
}

grp.setDataType = function(){
    for(var i=0; i< grp.listLdap().length; i++){
        if(grp.dataTypeConfig.Address() == grp.listLdap()[i].Address){
            console.log(grp.listLdap()[i].Address);
            grp.dataTypeConfig.Address(grp.listLdap()[i].Address);
            grp.dataTypeConfig.BaseDN(grp.listLdap()[i].BaseDN);
            grp.dataTypeConfig.Filter(grp.listLdap()[i].Filter);
            grp.dataTypeConfig.Username(grp.listLdap()[i].Username);
            grp.dataTypeConfig.Password(grp.listLdap()[i].Password);
            $('#attribute-group').tokenfield('setTokens', grp.listLdap()[i].Attribute);
        }
    }
}

grp.getDataUserLdap = function(){
    if (!app.isFormValid("#form-modal-group")) {
        return;
    }
    grp.ArrayDataID(grp.attribute().replace(/\s/g, '').split(","));
    console.log("------- 551 ",grp.ArrayDataID().length);
    if(grp.ArrayDataID().length != 3){
        grp.ArrayDataID([])
    }else{
        $.each(grp.ArrayDataID(), function(i){
            grp.dataTypeConfig.Attribute.push(grp.ArrayDataID()[i]);
        });
    }
    var param = ko.mapping.toJS(grp.dataTypeConfig);
    grp.tempDataGrup.push(param);
    app.ajaxPost("/group/finduserldap", param, function(res){
        if(!app.isFine(res)){
            return;
        }
        grp.GrupModalgrid('show')
        $('#grid-ldap-group').kendoGrid({
            dataSource: {
                data: res.data,
                pageSize: 5
            },
            pageable: true,  
            sortable: true,  
            selectable: 'multiple, row', 
            filterfable: true,
            change: grp.selectLdapGroup,
            columns: [
                {title: "ID", field: grp.ArrayDataID()[0]},
                {title: "Name", field: grp.ArrayDataID()[1]},
                {title: "Owner", field: grp.ArrayDataID()[2]},
            ],
            dataBound :grp.saveGroupLdap()
        });
    });
    
}

grp.saveGroupLdap = function(){
    var param = ko.mapping.toJS(grp.dataTypeConfig);
    app.ajaxPost("/group/savegroupconfigldap", param, function(res){
        if(!app.isFine(res)){
            return;
        }

    });
}

grp.selectLdapGroup = function(){
    app.wrapGridSelect("#grid-ldap-group", ".btn", function(d) {
        var id = grp.ArrayDataID()[0];
        var name = grp.ArrayDataID()[1];
        var owner = grp.ArrayDataID()[2];
        console.log(d);
        console.log(d[id]);
        grp.config._id(d[id]);
        grp.config.Title(d[name]);
        grp.config.Owner(d[owner]);
        $('#modalForgot').modal("hide");
        grp.config.Filter("memberOf=CN="+d.cn+",CN=Users,"+grp.dataTypeConfig.BaseDN());
        

    });
}


grp.OnRemove = function(_id) {};
$(function() {
    grp.getGroups();

     $('[data-toggle="tooltip"]').tooltip();   

});