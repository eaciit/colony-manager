app.section('access');

viewModel.access = {};
var adm = viewModel.access;
adm.templateAccess = {
    _id: "",
    Title: "",
    Group1: "",
    Group2: "",
    Group3: "",
    Enable: false,
    SpecialAccess1: "",
    SpecialAccess2: "",
    SpecialAccess3: "",
    SpecialAccess4: "",
};
adm.templateFilter = {
    _id: "",
    Title: "",
};

adm.SumAccess = ko.observable(0);
adm.AccessColumns = ko.observableArray([{
    template: "<input type='checkbox' name='checkboxaccess' class='ckcGrid' value='#: _id #' />",
    width: 50
}, {
    field: "_id",
    title: "ID"
}, {
    field: "title",
    title: "Title"
}, {
    field: "group1",
    title: "Group 1"
}, {
    field: "group2",
    title: "Group 2"
}, {
    field: "group3",
    title: "Group 3"
}, {
    field: "enable",
    title: "Enable"
}, {
    field: "specialaccess1",
    title: "Special Access 1"
}, {
    field: "specialaccess2",
    title: "Special Access 2"
}, {
    field: "specialaccess3",
    title: "Special Access 3"
}, {
    field: "specialaccess4",
    title: "Special Access 4"
}]);
adm.filter = ko.mapping.fromJS(adm.templateFilter);
adm.isNew = ko.observable(false);
adm.editAccess = ko.observable("");
adm.search = ko.observable("");
adm.showAccess = ko.observable(false);
adm.AccessData = ko.observableArray([]);

adm.selectGridAccess = function(e) {
    // console.log("test")
    adm.isNew(false);
    app.wrapGridSelect(".grid-access", ".btn", function(d) { 
        // console.log(d)
        adm.editAccess(d._id);
        adm.showAccess(true);
        app.mode("editor");
    });
    return
};

adm.GetFilter = function(){
    data = {
        find : adm.search,
    }

    return data
}

adm.searchAccess = function(event){
    if ((event != undefined) && (event.keyCode == 13)){
        $('.grid-access').data('kendoGrid').dataSource.read();
    }
    return
};

adm.getAccess = function(c) {
    adm.AccessData([]);
    var param = ko.mapping.toJS(adm.filter);
    console.log(param);
    app.ajaxPost("/administration/getaccess", param, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        adm.SumAccess(res.data.length);
        adm.AccessData(res.data);
        var grid = $(".grid-access").data("kendoGrid");
        $(grid.tbody).on("mouseleave", "tr", function(e) {
            $(this).removeClass("k-state-hover");
        });

        if (typeof c == "function") {
            c(res);
        }
    });
};

adm.editAccess = function(c) {
    var payload = ko.mapping.toJS(adm.filter._id(c));
    app.ajaxPost("/administration/findaccess", payload, function(res) {
        if (!app.isFine(res)) {
            return;
        }
        if (res.data == null) {
            res.data = "";
        }
        adm.config._id(res.data._id);
        adm.config.Title(res.data.Title);
        adm.config.Group1(res.data.Group1);
        adm.config.Group2(res.data.Group2);
        adm.config.Group3(res.data.Group3);
        adm.config.Enable(res.data.Enable);
        adm.config.SpecialAccess1(res.data.SpecialAccess1);
        adm.config.SpecialAccess2(res.data.SpecialAccess2);
        adm.config.SpecialAccess3(res.data.SpecialAccess3);
        adm.config.SpecialAccess4(res.data.SpecialAccess4);
    });
};

adm.AccessSpecial1 = ko.observable("");
adm.AccessSpecial2 = ko.observable("");
adm.AccessSpecial3 = ko.observable("");
adm.AccessSpecial4 = ko.observable("");

adm.getTitle = function(c) {
    var payload = ko.mapping.toJS(adm.filter._id(c));
    $.ajax({
        type: 'POST',
        url: '/administration/findaccess',
        data: ko.mapping.toJSON(payload),
        dataType: 'json',
        async: false,
        success: function(res) {
            adm.AccessSpecial1(res.data.SpecialAccess1);
            adm.AccessSpecial2(res.data.SpecialAccess2);
            adm.AccessSpecial3(res.data.SpecialAccess3);
            adm.AccessSpecial4(res.data.SpecialAccess4);
        }
    });
};
adm.config = ko.mapping.fromJS(adm.templateAccess);
adm.access = ko.observable('');
adm.saveaccess = function() {
    payload = ko.mapping.fromJS(adm.config);
    console.log(payload)
    app.ajaxPost("/administration/saveaccess", payload, function(res) {
        console.log(res)
        if (!app.isFine(res)) {
            return;
        }
        swal({
            title: "Access successfully created",
            type: "success",
            closeOnConfirm: true
        });
        adm.backToFront();
    });
};
adm.createNewAccess = function() {
    adm.config._id("");
    adm.config.Title("");
    adm.config.Group1("");
    adm.config.Group2("");
    adm.config.Group3("");
    adm.config.Enable("");
    adm.config.SpecialAccess1("");
    adm.config.SpecialAccess2("");
    adm.config.SpecialAccess3("");
    adm.config.SpecialAccess4("");
    app.mode("editor");
};
adm.deleteaccess = function() {
    var checkboxes = document.getElementsByName('checkboxaccess');
    var selected = [];
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selected.push(checkboxes[i].value);
        }
    }
    for (var i = 0; i < selected.length; i++) {
        payload = ko.mapping.fromJS(adm.filter._id(selected[i]));
        app.ajaxPost("/administration/deleteaccess", payload, function(res) {
            if (!app.isFine(res)) {
                return;
            }
        });
    };
    swal({
        title: "Access successfully deleted",
        type: "success",
        closeOnConfirm: true
    });
    adm.getAccess();
};

adm.OnRemove = function(_id) {};

adm.backToFront = function() {
    app.mode('');
    adm.getAccess();
};

adm.GenerateGrid = function() {
    $(".grid-access").html("");
    $('.grid-access').kendoGrid({
        dataSource: {
            transport: {
                read: {
                    url: "/administration/getaccess",
                    dataType: "json",
                    data: adm.GetFilter(),
                    type: "POST",
                    success: function(data) {
                        $(".grid-sessions>.k-grid-content-locked").css("height", $(".grid-access").data("kendoGrid").table.height());
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
        selectable: "multiple, row",
        change: adm.selectGridAccess,
        resizable: true,
        scrollable: true,
        // sortable: true,
        // filterable: true,
        pageable: {
            refresh: false,
            pageSizes: 10,
            buttonCount: 5
        },
        columns: adm.AccessColumns()
    });

}

$(function() {
    app.section("access");
    // adm.getAccess(); 
    adm.GenerateGrid();
});