viewModel.dataflow = {
    ActionItems:[
    {
        "Name"  :"Spark",
        "Id"    :"1",
        "Image" : "icon_spark.png",
        "Type"  : "Action",
        "Color" : "#F17B48"
    },
    {
        "Name"  :"HDFS",
        "Id"    :"2",
        "Image" : "icon_hdfs.png",
        "Type"  : "Action",
        "Color" : "#3087C5"
    },
    {
        "Name"  :"Hive",
        "Id"    :"3",
        "Image" : "icon_hive.png",
        "Type"  : "Action",
         "Color" : "#CEBF00"
    },
    {
        "Name"  :"SSH Script",
        "Id"    :"4",
        "Image" : "icon_ssh.png",
        "Type"  : "Action",
        "Color" : "brown"
    },
    // {
    //     "Name"  :"Shell Script",
    //     "Id"    :"4",
    //     "Image" : "icon_console.png",
    //     "Type"  : "Action",
    //     "Color" : "black"
    // },
    {
        "Name"  :"Kafka",
        "Id"    :"5",
        "Image" : "icon_kafka.png",
        "Type"  : "Action",
        "Color" : "#C1C1C1"
    },
    {
        "Name"  :"Map Reduce",
        "Id"    :"6",
        "Image" : "icon_mapreduce.png",
        "Type"  : "Action",
        "Color" : "#00B3B3"
    },
     {
        "Name"  :"Java App",
        "Id"    :"7",
        "Image" : "icon_java.png",
        "Type"  : "Action",
        "Color" : "#D20000"
    },
     {
        "Name"  :"Email",
        "Id"    :"8",
        "Image" : "icon_email.png",
        "Type"  : "Action",
        "Color" : "#017932"
    },
     {
        "Name"  :"Fork",
        "Id"    :"9",
        "Image" : "icon_fork.png",
        "Type"  : "Fork",
        "Color" : "#CF29D8"
    },
     {
        "Name"  :"Stop",
        "Id"    :"10",
        "Image" : "icon_stop.png",
        "Type"  : "Action",
        "Color" : "#FF0000"
    },
    ], 
    Name: ko.observable("Add Title"),
    Description: ko.observable("Add Description"),
    Actions:ko.observableArray([]),
    DataShape:ko.observable({}),
    Mode: ko.observable("Grid"),
    ID: ko.observable("")
}; 

viewModel.dataFlowList = ko.observableArray([]);

var df = viewModel.dataflow;
var dfl = viewModel.dataFlowList;
df.arrayconn = ko.observableArray([]);
df.globalVar = ko.observableArray([]);
df.popoverMode = ko.observable('');
df.detailMode = ko.observable("");

df.outputType = ko.observableArray([
"json",
"sv",
"text"
    ]);

df.actionDetails = ko.observable({
    whenFailed : ko.observable(""),
    input : ko.observableArray([]),
    output:{
        type:ko.observable(""),
        param:ko.observableArray([])
    }
});

df.newActionDetails = function(){
   return { whenFailed : ko.observable(""),
        input : ko.observableArray([]),
        output:{
            type:ko.observable(""),
            param:ko.observableArray([])
        }
    }
};

df.whenFailed = ko.observable("");
df.selectedServer = ko.observable("");
df.allAction = ko.observableArray([]);

df.detailModeDo = function(text,detail) {
    var diagram = $(".diagram").getKendoDiagram();
    var cls = $(".btn-transition").find("span").attr("class");
    var close = cls.indexOf("down") > -1?true:false;
    if(df.popoverMode() != detail && close){
        df.popoverMode("Transitions");
        df.detailMode(text);
        $(".btn-transition").find("span").attr("class","glyphicon glyphicon-chevron-up");
    }else{
        $(".btn-transition").find("span").attr("class","glyphicon glyphicon-chevron-down");
        df.popoverMode(df.detailMode());
        df.detailMode("");
    }
}

df.sparkModel = ko.observable({
  //UI not yet
  // type : ko.observable(""),
  server : ko.observable(""),
  // args:ko.observableArray([]),

  appname:ko.observable(""),
  master : ko.observable(""),
  mode:ko.observable(""),
  args:ko.observable(""),

  //back end not yet
  mainclass:ko.observable(""),
  appfiles:ko.observable("")
});

df.newSparkModel = function(){
    return {
    //UI not yet
    // type : ko.observable(""),
    server : ko.observable(""),
    // args:ko.observableArray([]),

    // appname:ko.observable(""),
    master : ko.observable(""),
    mode:ko.observable(""),
    args:ko.observable(""),

    //back end not yet
    mainclass:ko.observable(""),
    appfiles:ko.observable("")
  }
}

//need discuss with all team
df.hdfsModel = ko.observable({
//it must be array

//beta in UI
server : ko.observable(""),
script : ko.observable("")
});

df.newHdfsModel = function(){
  return {
    server : ko.observable(""),
    script : ko.observable("")
  }
}

df.hsModel = ko.observable({
    server : ko.observable(""),
  mapper : ko.observable(""),
  // mapfiles : ko.observableArray([]),
  reducer : ko.observable(""),
  files : ko.observableArray([]),
  input : ko.observable(""),
  output:ko.observable(""),
  parameters:ko.observable("")
});

df.newHsModel = function(){
  return {
    server : ko.observable(""),
  mapper : ko.observable(""),
  // mapfiles : ko.observableArray([]),
  reducer : ko.observable(""),
  files : ko.observableArray([]),
  input : ko.observable(""),
  output:ko.observable(""),
  parameters:ko.observable("")
}
}

//model same with hdfs UI not yet
df.sshModel = ko.observable({
 //just in UI
 server : ko.observable(""),
 script:ko.observable(""),
 // userandhost:ko.observable("")
});

df.newSshModel = function(){
  return {
    server : ko.observable(""),
     script:ko.observable(""),
     // userandhost:ko.observable("")
  }
}

//back end not yet
df.emailModel = ko.observable({
    server : ko.observable(""),
  to:ko.observable(""),
  subject:ko.observable(""),
  body:ko.observable("")
});

df.newEmailModel = function(){
  return {
    server : ko.observable(""),
  to:ko.observable(""),
  subject:ko.observable(""),
  body:ko.observable("")
}
}

df.hiveModel = ko.observable({
    server : ko.observable(""),
  scriptpath: ko.observable(""),
  //UI not yet
  param:ko.observableArray([]),
  //back end not yet
  // hivexml:ko.observable("")
});

df.newHiveModel = function(){
  return {
    server : ko.observable(""),
  scriptpath: ko.observable(""),
  //UI not yet
  param:ko.observableArray([]),
  //back end not yet
  // hivexml:ko.observable("")
}
}

//back end not yet
df.shModel = ko.observable({
    server : ko.observable(""),
  script : ko.observable("")
});

df.newShModel = function(){
  return {
    server : ko.observable(""),
    script : ko.observable("")
  }
}

//back end not yet
df.javaAppModel = ko.observable({
  server : ko.observable(""),
  jar : ko.observable(""),
  // mainclass : ko.observable("")
});

df.newJavaAppModel = function(){
    return {
    server : ko.observable(""),
    jar : ko.observable(""),
    // mainclass : ko.observable("")
  }
}

//back end and UI not yet
df.stopModel = ko.observable({
  message: ko.observable("")
});

df.newStopModel = function(){
    return {
    message: ko.observable("")
  }
}

//need discuss with all team
df.forkModel = ko.observable({

});

df.newForkModel = function(){
  return{

  }
}

//need discuss with all team
df.kafkaModel = ko.observable({
    server : ko.observable(""),

});

df.newKafkaModel = function(){
  return{
    server : ko.observable(""),
  }
}

$.fn.popoverShow = function () {
    var $self = $(this);
    $self.off('show.bs.popover').on('show.bs.popover', function () {
        if (!$(".popover").hasClass("ui-draggable")) {
            setTimeout(function () {
                $(".popover").draggable({ handle: '.popover-title' });
            }, 500);
        }
    });
    $self.popover("show");
};

function visualTemplate(options) {
            var dataviz = kendo.dataviz;
            var g = new dataviz.diagram.Group();
            var dataItem = options.dataItem;

                if(dataItem.name == "Fork"){
                     g.append(new dataviz.diagram.Path({
                        width: 120,
                        height: 80,
                        stroke: {
                            width: 0
                        },
                        fill: "#e8eff7",
                        data:"M0.5,37.5 L37.5,0.5 L74.5,37.5 M0.5,37.5 L74.5,37.5 L37.5,74.5 z"
                    }));

                    g.append(new dataviz.diagram.TextBlock({
                        x:48,
                        y:30,
                        text: dataItem.name,
                        fontSize:13
                    }));
                }else if(dataItem.name == "Stop"){
                     g.append(new dataviz.diagram.Path({
                        data:"M74.5,37.5 C74.5,57.91 57.91,74.5 37.5,74.5 C17,74.5 0.5,57.91 0.5,37.5 C0.5,17 17,0.5 37.5,0.5 C57.91,0.5 74.5,17 74.5,37.5 z",
                        width: 75,
                        height: 75,
                        stroke: {
                            width: 0
                        },
                        fill: "#e8eff7"
                    }));

                    g.append(new dataviz.diagram.TextBlock({
                        x:25,
                        y:30,
                        text: dataItem.name,
                        fontSize:13
                    }));
                }else{
                    g.append(new dataviz.diagram.Rectangle({
                        width: 150,
                        height: 45,
                        stroke: {
                            width: 0
                        },
                        fill: "#e8eff7"
                    }));

                    g.append(new dataviz.diagram.Rectangle({
                        width: 8,
                        height: 45,
                        fill: dataItem.color,
                        stroke: {
                            width: 0
                        }
                    }));

                g.append(new dataviz.diagram.Image({
                    source: "/res/img/" + dataItem.image,
                    x: 14,
                    y: 7,
                    width: 30,
                    height: 30
                }));

                g.append(new dataviz.diagram.TextBlock({
                    text: dataItem.name,
                    x: 55,
                    y: 8,
                    fontSize:13
                }));

                g.append(new dataviz.diagram.TextBlock({
                    text: options.id,
                    x: 55,
                    y: 24,
                    fontSize:10
                }));
            }
            return g;
        }



df.init = function () {
    df.createGrid();
    df.getServers();
    var dataSource = new kendo.data.HierarchicalDataSource({
        data: [],
        schema: {
            model: {
                children: "items"
            }
        }
    });
    $(".diagram").kendoDiagram({
        dataSource: dataSource,
        zoom: 1,
        zoomMax: 1,
        zoomMin: 1,
        layout: {
            type: "tree",
            subtype: "radial"
        },
        shapeDefaults: {
            visual: visualTemplate,
            // content: {
            //     template: function (d) {
            //         console.log(d);
            //         return "<foreignobject><input value='" + d.name + "' /></foreignobject>";
            //     },
            // },
            html: true,
        },
        editable:{
            resize:false,
        },
        connectionDefaults: {
            stroke: {
                color: "#979797",
                width: 1
            },
            type: "polyline",
            startCap: "FilledCircle",
            endCap: "ArrowEnd"
        },
        autoBind: true,
        select:function(e){
            df.closePopover("#poptitle");
            df.closePopover("#popbtn");
            df.closePopover("#popGlobalVar");
        },
        click:function(e){
            var diagram = kendo.dataviz.diagram;
            var Shape = diagram.Shape;
            var item = e.item;

            if(item instanceof Shape){
                //double click checking
                  clickonshape++;
                  if (clickonshape == 1) {

                    setTimeout(function(){
                      if(clickonshape == 2) {
                        df.closePopover("#poptitle");
                        df.closePopover("#popGlobalVar");

                        $("#popbtn").popoverShow();

                        var scres = screen.width;
                        var scresh = screen.height;
                        var maxxmouse = scres - 450;
                        var minymouse = 370;

                        if(xmouse>maxxmouse){
                            xmouse = maxxmouse;
                        }

                        if(ymouse<minymouse){
                            ymouse = ymouse + 350;
                        }
                        $(".popover-title").removeAttr("style");

                        $(".popover-title").html(item.dataItem.name+" - "+$(".diagram").getKendoDiagram().select()[0].id);

                        $btn = $("<button title='Action details' class='btn btn-primary btn-xs pull-right btn-transition'><span class='glyphicon glyphicon-chevron-down'></span></button>")
                        
                        if(item.dataItem.name!="Fork" && item.dataItem.name!="Stop")
                        $(".popover-title").append($btn);

                        $btn.click(function(){
                            df.detailModeDo(df.popoverMode(),"Transitions");
                        });

                         $btn.tooltipster({
                            theme: 'tooltipster-val',
                            animation: 'grow',
                            delay: 0,
                            offsetY: -5,
                            touchDevices: false,
                            trigger: 'hover',
                            position: "top"
                        });

                        setTimeout(function () {
                            ko.cleanNode($(".popover-content:last")[0]);
                            ko.applyBindings(viewModel, $(".popover-content:last")[0]);
                        }, 10);

                        df.popoverMode(item.dataItem.name);
                        $(".popover").attr("style","display: block; top: " +(ymouse-320)+"px; left: "+(xmouse-30)+"px;");
                      df.renderActionData();
                      }
                      df.draggablePopover();
                      clickonshape = 0;
                    }, 300);
                
                }
            }
        },
        dragEnd: df.onDragEnd,
        remove: df.onRemove,
    });

    var clickonshape = 0;

   $(".tooltipster").tooltipster({
        theme: 'tooltipster-val',
        animation: 'grow',
        delay: 0,
        offsetY: -5,
        touchDevices: false,
        trigger: 'hover',
        position: "right"
    });

    $(".btn-tooltip").tooltipster({
        theme: 'tooltipster-val',
        animation: 'grow',
        delay: 0,
        offsetY: -5,
        touchDevices: false,
        trigger: 'hover',
        position: "top"
    });

    $("#popbtn").popover({
        html : true,
        placement : 'top',
        content: $("#popover-content-template").html()        
    });

     $("#popGlobalVar").popover({
        html : true,
        placement : 'top',
        content: $("#popover-content-globalvar").html()        
    });

    $("#poptitle").popover({
        html : true,
        placement : 'right',
        content: $(".poptitle-content").html()        
    });

    // $(".pTitle").dblclick(function(e){
    //     $("#popbtn").popover("hide");
    //     $("#popGlobalVar").popover("hide");
    //     $("#poptitle").popover("show");
    //     $(".popover-title").removeAttr("style");
    //     $(".popover-title").html("Edit Title");
    //     $(".popover").attr("style","display: block; top: " +(ymouse-25)+"px; left: "+(xmouse+25)+"px;");
    //     $(".arrow").attr("style","top:46%");
    //     $(".pop-txt").val(df.Name());

    //     $(".poptitle-close").click(function(e){
    //         $("#poptitle").popover("hide");
    //     });

    //     $(".poptitle-save").click(function(e){
    //         df.Name($(".pop-txt:visible").val());
    //         $("#poptitle").popover("hide");
    //     });
    // });

    // $(".pDesc").dblclick(function(e){
    //     $("#popbtn").popover("hide");
    //     $("#popGlobalVar").popover("hide");
    //     $("#poptitle").popover("show");
    //     $(".popover-title").removeAttr("style");
    //     $(".popover-title").html("Edit Desciption");
    //     $(".popover").attr("style","display: block; top: " +(ymouse-25)+"px; left: "+(xmouse+25)+"px;");
    //     $(".arrow").attr("style","top:46%");
    //     $(".pop-txt").val(df.Description());
   

    //     $(".poptitle-close").click(function(e){
    //         $("#poptitle").popover("hide");
    //     });

    //     $(".poptitle-save").click(function(e){
    //         df.Description($(".pop-txt:visible").val());
    //         $("#poptitle").popover("hide");
    //     });
    // });

  

    var xmouse = 0;
    var ymouse = 0;

    df.ymouse = ko.observable(0);
    df.xmouse = ko.observable(0);

    $("#sortable-All").kendoSortable({
        hint: function(element) {
            return element.clone().addClass("hint");
        },
        placeholder: function(element) {
            return element.clone().addClass("placeholder");
        },
        end:function(e){
            var name = $(e.item).attr("name");
            var image = $(e.item).attr("image");
            var color = $(e.item).attr("color");
            var type = $(e.item).attr("type");

            var posdiag = $(".diagram")[0].getBoundingClientRect();
            var xpos = (xmouse - posdiag.left);
            var ypos = (ymouse - posdiag.top);
            ypos = (screen.height - 200)<ypos?(ypos - 200):ypos; 
            if(xpos>0&&ypos>0){
                var diagram = $(".diagram").data("kendoDiagram");
                diagram.addShape({ 
                    x:xpos,
                    y:ypos, 
                    dataItem:{name:name,image :image, color:color,type:type} 
                });
                if(name!="Fork")
                    df.allAction.push(name + " - "+ diagram.shapes[diagram.shapes.length-1].id);
            }
        },
    });

      $("body").mousemove(function(e) {
            xmouse = e.pageX;
            ymouse = e.pageY;
            df.xmouse(xmouse);
            df.ymouse(ymouse);
        });
};
df.dataRow = ko.observableArray([]);
df.run = function () {
    app.ajaxPost("/dataflow/start", {}, function (res) {
        if (!app.isFine(res)) {
            return;
        }
        
    });
}

df.counts = {};
df.checkConnection = function(elem){
    var diagram = $(elem).getKendoDiagram();
    var conn = diagram.connections;
    var shap = diagram.shapes;
    //delete connection with one shape
    var idx = 0;
    var deleted = 0;
    while(conn.length>0){
        var co = conn[idx];
        var sh = co.from == null?co.from : co.from.shape == undefined ?co.from: co.from.shape;
        var shto = co.to == null?co.to: co.to.shape == undefined ?co.to:co.to.shape;
        if(sh == null || shto == null ||  sh ==undefined || shto == undefined){
            diagram.remove(co);
            deleted+=1;
        }
        var newcount = diagram.connections.length;
        if(deleted>0){
            idx = 0;
            deleted=0;
            conn = diagram.connections;
        }else if(idx==newcount-1){
            break;
        }else{
            idx+=1;
        }
    }

    df.counts = {};
    conn = diagram.connections;

    //delete invalid connection
    for(var c in conn){
        try{
            var co = conn[c];
            var sh = co.from.shape == undefined ?co.from: co.from.shape;
            var shto = co.to.shape == undefined ?co.to:co.to.shape;
                df.counts[sh.id+shto.id] = df.counts[sh.id+shto.id] == undefined?1:df.counts[sh.id+shto.id]+1;
                df.counts[shto.id+sh.id] = df.counts[shto.id+sh.id] == undefined?1:df.counts[shto.id+sh.id]+1;

            if(sh.dataItem.name !="Fork" ){
                df.counts[sh.id+"-"] =  df.counts[sh.id+"-"] == undefined?1: df.counts[sh.id+"-"]+1;
                if(df.counts[sh.id+"-"] >1){
                    diagram.remove(co);
                    continue;
                }
            }   

            if(shto.dataItem.name !="Fork"){
                df.counts["-"+shto.id] =  df.counts["-"+shto.id] == undefined?1: df.counts["-"+shto.id]+1;
                 if(df.counts["-"+shto.id] >1){
                    diagram.remove(co);
                    continue;
                }
            }

            if(df.counts[sh.id+shto.id]>1||df.counts[shto.id+sh.id]>1){
                diagram.remove(co);
            }
        }catch(e){
            diagram.remove(co);
        }
    }
}

df.checkFlow = function(elem){
    var diagram = $(elem).getKendoDiagram();
    var shap = diagram.shapes;
    var conn = diagram.connections;
    df.counts = {};

    for(var c in conn){
        var co = conn[c];
        var sh = co.from.shape == undefined ?co.from: co.from.shape;
        var shto = co.to.shape == undefined ?co.to:co.to.shape;

        if(sh.dataItem.name !="Fork" ){
            df.counts[sh.id+"-"] =  df.counts[sh.id+"-"] == undefined?1: df.counts[sh.id+"-"]+1;
        }

         if(shto.dataItem.name !="Fork"){
            df.counts["-"+shto.id] =  df.counts["-"+shto.id] == undefined?1: df.counts["-"+shto.id]+1;
        }
    }

    //check for infiniteloop
    var startfinish = 0;
    var noconnshape = 0;
    for(var c in shap){
        if(shap[c].dataItem.name=="Fork")
            continue;

        var id = shap[c].id;

        if(df.counts["-"+id] == undefined){
            startfinish+=1;
        }

        if(df.counts[id+"-"] == undefined){
            startfinish+=1;
        }

        var sc = shap[c].connectors;
        var conn = 0
        for(var i in sc){
            if(sc[i].connections.length>0){
                conn+=1;
            }
        }
        noconnshape+= conn==0?1:0;
    }

    if(startfinish==0){
        swal("Warning!", "Infinite Flow !", "warning");
        return  false;
    }else if(noconnshape>0){
         swal("Warning!", "Invalid Flow !", "warning");
        return  false;
    }
    return  true;
}

df.onDragEnd = function(e){
    if(df.draggedElementsTexts(e)=="connections"){
        df.checkConnection($(".diagram"));
    }
}

df.onRemove = function(e){
    setTimeout(function(){
            if(e.shape != undefined){
            df.checkConnection($(".diagram"));
            df.allAction.remove(e.shape.dataItem.name+" - "+e.shape.id);
        }
    },500);
}

df.draggedElementsTexts = function(e) {
    var text;
    var elements;
    if (e.shapes.length) {
        text = "shapes";
        elements = e.shapes;
    } else {
        text = "connections";
        elements = e.connections;
    }
    return text;
}

df.getShapeData = function(elem){
    var diagram = $(elem).getKendoDiagram();
    var shap = diagram.shapes;
    var conn = diagram.connections;
    var dtshap = [];
    var dtconn = [];

    for(var c in shap){
        var sh = shap[c];
        var dt ={};
        dt["dataItem"] = sh.dataItem;
        dt["x"] = sh.options.x;
        dt["y"] = sh.options.y;
        dt["id"] = sh.id;
        dtshap.push(dt);
    }

    for(var c in conn){
        var co = conn[c];
        var dt ={};
        dt["fromId"] = co.from.shape == undefined ? co.from.id : co.from.shape.id;
        dt["toId"] = co.to.shape == undefined ?co.to.id : co.to.shape.id;
        dtconn.push(dt);
    }

    return {shapes:dtshap,connections:dtconn}
}

df.renderDiagram = function(elem,data){
    var diagram = $(elem).getKendoDiagram();
    var shapes = data.shapes;
    var conn = data.connections;
    df.allAction([]);
    for(var c in shapes){
        var sh = shapes[c];
        diagram.addShape(sh);
        
        if(sh.dataItem.name!="Fork")
        df.allAction.push(sh.dataItem.name + " - "+ diagram.shapes[diagram.shapes.length-1].id);
    }

    diagram = $(elem).getKendoDiagram();

    for(var c in conn){
        var co = conn[c];
        var shfrom = diagram.getShapeById(co.fromId);
        var shto = diagram.getShapeById(co.toId);
        
        var connection = new kendo.dataviz.diagram.Connection(shfrom, shto,{
            stroke: {
                color: "#979797",
                width: 1
            },
            type: "polyline",
            startCap: "FilledCircle",
            endCap: "ArrowEnd"
        });

        diagram.addConnection(connection);
    }
}

df.Reload = function(){
    df.clearDiagram();  
    df.renderDiagram(".diagram",df.DataShape());
}

df.Save = function(){
    var ch = df.checkFlow(".diagram");
    if(ch){
        df.DataShape(df.getShapeData(".diagram"));
    }else{
      return false;
    }

    var actdt = df.buildShapeData(".diagram");
    if(actdt==undefined){
        swal("Warning", "Data not completed!", "warning");
        return;
    }

    app.ajaxPost("/dataflow/save", {
        ID : df.ID(),
        Name:df.Name(),
        Description:df.Description(),
        Actions: actdt,
        DataShapes:df.DataShape(),
        GlobalParam:df.globalVar()
    }, function(res){
        if(!app.isFine(res)){
          return;
        }else{
           swal("Success", "Data Saved !", "success");
        }
    });
}

df.clearDiagram = function(){
    df.closePopover("#popbtn");
    df.closePopover("#poptitle");
    df.closePopover("#popGlobalVar");

    $(".diagram").getKendoDiagram().clear();
}

df.closePopover = function(elem){
    $(elem).popover("hide");
}

df.popTitleSave = function(val){
    df.Name = val;
}

df.popDescSave = function(val){
    df.Desciption = val  
}

df.createGrid = function(search){
    var searchtxt = search == undefined?"":search;
    app.ajaxPost("/dataflow/getlistdata", {
        search : searchtxt
    }, function(res){
        if(!app.isFine(res)){
            return;
        }else{
            dfl(res.data);
            $("#dataFlowGrid").html();
            $("#dataFlowGrid").kendoGrid({
                dataSource:{
                    data:res.data,
                    pageSize:10,
                },
                pageable: {
                    input: true,
                    numeric: false
                },
                columns:[
                    {field:"name",title:"Name",width:200},
                    {field:"description", title:"Description"},
                    {field:"createddate",align:"center" , width:150, title:"Created Date" ,template:"#:moment(Date.parse(createddate)).format('DD-MMM-YYYY HH:mm')#"
                        ,attributes: {
                            style: "text-align: center;",
                        },
                        headerAttributes: {
                            style: "text-align: center;",
                        },
                    },
                   {field:"lastmodified",align:"center" , width:150, title:"Last Modified" ,template:"#:moment(Date.parse(lastmodified)).format('DD-MMM-YYYY HH:mm')#"
                        ,attributes: {
                            style: "text-align: center;",
                        },
                            headerAttributes: {
                            style: "text-align: center;",
                        },
                    },
                    {field:"createdby",width:200,title:"Created By"},
                    {width:50,template:"<button class='btn btn-sm tooltipster-grid' title='design' onclick='df.goToDesigner(\"#:_id#\")' ><span class='glyphicon glyphicon-wrench'></span></button>"},
                    {width:50,template:"<button class='btn btn-sm tooltipster-grid' title='delete' onclick='df.delete(\"#:_id#\")' ><span class='glyphicon glyphicon-trash'></span></button>"}
                ],
                dataBound:function(){
                    $(".tooltipster-grid").tooltipster({
                        theme: 'tooltipster-val',
                        animation: 'grow',
                        delay: 0,
                        offsetY: -5,
                        touchDevices: false,
                        trigger: 'hover',
                        position: "top"
                    });
                }
            });
        }
    });
}

df.goToDesigner = function(Id){
    var selected = {};
    for(var c in  dfl()){
        var sdfl = dfl()[c];
        if(sdfl._id==Id){
            selected = sdfl;
            break;
        }
    }
    df.ID(selected._id);
    df.Mode("Designer");
    df.DataShape(selected.datashapes);
    df.Name(selected.name);
    df.Description(selected.description);
    df.globalVar([]);
    df.Reload();

    $(".glyphicon-cog").tooltipster({
        theme: 'tooltipster-val',
        animation: 'grow',
        delay: 0,
        offsetY: -5,
        touchDevices: false,
        trigger: 'hover',
        position: "left"
    });

    $("svg").click(function(){
        if($(".popover-title").html()=="Add Global Variables"){
        df.closePopover("#poptitle");
        df.closePopover("#popbtn");
        df.closePopover("#popGlobalVar");
    }
    });
}

df.backToGrid = function(){
    df.createGrid();
    df.Mode("Grid");
}

df.newDF = function(){
      $(".glyphicon-cog").tooltipster({
        theme: 'tooltipster-val',
        animation: 'grow',
        delay: 0,
        offsetY: -5,
        touchDevices: false,
        trigger: 'hover',
        position: "left"
    });

    $("svg").click(function(){
        if($(".popover-title").html()=="Add Global Variables"){
            df.closePopover("#poptitle");
            df.closePopover("#popbtn");
            df.closePopover("#popGlobalVar");
        }
    });

    df.ID("");
    df.Mode("Designer");
    df.DataShape({});
    df.Name("Add Title");
    df.Description("Add Description");
    df.globalVar([]);
    df.Reload();
}

df.delete = function(Id){
    swal({
        title: "Are you sure?",
        text: "You will delete this data",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        closeOnConfirm: true,
        closeOnCancel: true
    },
    function(isConfirm){
        if (isConfirm) {
            app.ajaxPost("/dataflow/delete", {
                ID : Id,
            }, function(res){
                if(!app.isFine(res)){
                    return;
                }else{
                    df.createGrid();
                    swal("Success", "Data Saved !", "success");
                }
            });
        } 
    });
}


var SearchTimeOut = setTimeout(function(){

},500);

df.Search = function(){
     clearTimeout(SearchTimeOut);
      SearchTimeOut = setTimeout(function(){
          df.createGrid($(".search-txt").val());
      },500);
}

df.checkObservable = function(dt){
    for(var key in dt){
        if(ko.isObservable(dt[key])){
            return dt;
        }else{
            return ko.mapping.fromJS(dt);
        }
    }
}

df.renderActionData = function(){
    var diagram = $(".diagram").getKendoDiagram().select()[0];
    var dataItem = diagram.dataItem;
   
    var action = df.popoverMode();
    dataItem.DataActionDetails= dataItem.DataActionDetails == undefined? df.newActionDetails() :df.checkObservable(dataItem.DataActionDetails);
    df.actionDetails(dataItem.DataActionDetails);
    //set default
    var whenfailed = df.actionDetails().whenFailed() ==""?dataItem.name+" - "+diagram.id: df.actionDetails().whenFailed() ;
    df.actionDetails().whenFailed(whenfailed);
    var outputType = df.actionDetails().output.type() ==""?"json": df.actionDetails().output.type() ;
    df.actionDetails().output.type(outputType);
    //end set default
    
    switch(action){
      case "Spark":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newSparkModel():df.checkObservable(dataItem.DataAction);
          df.sparkModel(dataItem.DataAction);
      break;
      case "HDFS":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newHdfsModel():df.checkObservable(dataItem.DataAction);
          df.hdfsModel(dataItem.DataAction);
      break;
      case "Hive":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newHiveModel():df.checkObservable(dataItem.DataAction);
          df.hiveModel(dataItem.DataAction);
      break;
      case "Shell Script":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newShModel():df.checkObservable(dataItem.DataAction);
          df.shModel(dataItem.DataAction);
      break;
      case "Kafka":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newKafkaModel():df.checkObservable(dataItem.DataAction);
          df.kafkaModel(dataItem.DataAction);
      break;
      case "Map Reduce":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newHsModel():df.checkObservable(dataItem.DataAction);
          df.hsModel(dataItem.DataAction);
      break;
      case "Java App":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newJavaAppModel():df.checkObservable(dataItem.DataAction);
          df.javaAppModel(dataItem.DataAction);
      break;
      case "Email":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newEmailModel():df.checkObservable(dataItem.DataAction);
          df.emailModel(dataItem.DataAction);
      break;
      case "Stop":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newStopModel():df.checkObservable(dataItem.DataAction);
          df.stopModel(dataItem.DataAction);
      break;
      case "SSH Script":
          dataItem.DataAction = dataItem.DataAction == undefined? df.newSshModel():df.checkObservable(dataItem.DataAction);
          df.sshModel(dataItem.DataAction);
      break;
      case "Fork":
            df.arrayconn([]);
            if(dataItem.DataAction == undefined){
                 dataItem.DataAction = [];
            }

            var selected = diagram;
            var cl = selected.connectors.length - 1;
            for (i = 0; i <= cl; i++) {
                var no = selected.connectors[i].connections.length;
               for (ix = 0; ix < no; ix++) {
                    var fromid = selected.connectors[i].connections[ix].from.shape == undefined?selected.connectors[i].connections[ix].from.id :selected.connectors[i].connections[ix].from.shape.id;
                    var shapeid = selected.connectors[i].connections[ix].to.shape == undefined?selected.connectors[i].connections[ix].to.id :selected.connectors[i].connections[ix].to.shape.id;
                    var shapename = selected.connectors[i].connections[ix].to.shape == undefined? selected.connectors[i].connections[ix].to.dataItem.name : selected.connectors[i].connections[ix].to.shape.dataItem.name;
                    var thisid = selected.id;

                        var DAjs = dataItem.DataAction;
                        var condt = Lazy(DAjs).find(function ( d ) { return d.name == shapename+" - "+shapeid });
                       if (condt == undefined && fromid == thisid){
                             df.arrayconn.push({
                            name: shapename+" - "+shapeid, 
                            condition: "true"});
                        }else if(fromid == thisid){
                               df.arrayconn.push({
                            name: shapename+" - "+shapeid, 
                            condition: condt.condition});
                        }
                }
            }

            if(df.arrayconn().length==0){
                $("#popbtn").popover("hide");
            }

            dataItem.DataAction = df.arrayconn();
        break;
    }


    if(action!="Fork"&&action!="Stop"){
        setTimeout(function(){
            if(dataItem.DataAction.server() == ""){
                $(".ddl-server:input").getKendoDropDownList().select(0);
            }
            var serv = dataItem.DataAction.server() == ""? $(".ddl-server:input").getKendoDropDownList().value() :dataItem.DataAction.server();
            dataItem.DataAction.server(serv);
            df.selectedServer(dataItem.DataAction.server());
        },100);
    }
}

df.selectedServer.subscribe(function(val){
    var diagram = $(".diagram").getKendoDiagram().select()[0];
    var dataItem = diagram.dataItem;
    dataItem.DataAction.server(val);
});

df.saveActionData = function(){
    var diagram = $(".diagram").getKendoDiagram().select()[0];
    var dataItem = diagram.dataItem;
    var action = df.popoverMode();
    $("#popbtn").popover("hide");
    dataItem.DataActionDetails = df.actionDetails(); 
    switch(action){
        case "Spark":
            dataItem["DataAction"]=df.sparkModel();
        break;
        case "HDFS":
            dataItem["DataAction"]=df.hdfsModel();
        break;
        case "Hive":
            dataItem["DataAction"]=df.hiveModel();
        break;
        case "Shell Script":
            dataItem["DataAction"]=df.shModel();
        break;
        case "Kafka":
            dataItem["DataAction"]=df.kafkaModel();
        break;
        case "Map Reduce":
            dataItem["DataAction"]=df.hsModel();
        break;
        case "Java App":
            dataItem["DataAction"]=df.javaAppModel();
        break;
        case "Email":
            dataItem["DataAction"]=df.emailModel();          
        break;
        case "Stop":
            dataItem["DataAction"]=df.stopModel();
        break;
        case "SSH Script":
            dataItem["DataAction"]=df.sshModel();
        break;
        case "Fork":
            dataItem["DataAction"]=df.arrayconn();
        break;
    }
}

df.addParamOutput = function () {
    var idx = df.actionDetails().output.param().length;
    df.actionDetails().output.param.push({idx:idx,key:"",value:""});
}

df.deleteParamOutput = function(e){
    var idx = $(e.target).attr("index");
    idx = idx == undefined? $(e.target).parent().attr("index"):idx;
    var dt = Lazy(df.actionDetails().output.param()).find(function ( d ) { return d.idx == idx });
    df.actionDetails().output.param.remove(dt);
}

df.addGlobalVar = function () {
    var idx = df.globalVar().length;
   df.globalVar.push({idx:idx,key:"",value:""});
}

df.deleteGlobalVar = function(e){
    var idx = $(e.target).attr("index");
    idx = idx == undefined? $(e.target).parent().attr("index"):idx;
    var dt = Lazy(df.globalVar()).find(function ( d ) { return d.idx == idx });
    df.globalVar.remove(dt);
}

df.servers = ko.observableArray([]);
df.addParamInput = function () {
    var idx = df.actionDetails().input().length;
    df.actionDetails().input.push({idx:idx,key:"",value:""});
}

df.deleteParamInput = function(e){
    var idx = $(e.target).attr("index");
    idx = idx == undefined? $(e.target).parent().attr("index"):idx;
    var dr = Lazy(df.actionDetails().input()).find(function ( d ) { return d.idx == idx });
    df.actionDetails().input.remove(dr);
}

df.addFileMapReduce = function () {
    var idx = df.hsModel().files().length;
    df.hsModel().files.push({idx:idx,path:""});
}

df.deleteFileMapReduce = function(e){
    var idx = $(e.target).attr("index");
    idx = idx == undefined? $(e.target).parent().attr("index"):idx;
    var dm = Lazy(df.hsModel().files()).find(function ( d ) { return d.idx == idx });
    df.hsModel().files.remove(dm);
}

df.setContext = function(){

    df.closePopover("#poptitle");
    df.closePopover("#popbtn");

    $("#popGlobalVar").popover("show");

    if(df.globalVar().length==0)
    df.addGlobalVar();
    
    $(".popover-title").removeAttr("style");
    $(".popover-title").html("Add Global Variables")
    var scres = screen.width;
    var scresh = screen.height;
    var maxxmouse = scres - 450;
    var minymouse = 370;

    if(df.xmouse()>maxxmouse){
        df.xmouse(maxxmouse);
    }

    if(df.ymouse()<minymouse){
        df.ymouse(df.ymouse() + 350);
    }

      setTimeout(function () {
        ko.cleanNode($(".popover-content:last")[0]);
        ko.applyBindings(viewModel, $(".popover-content:last")[0]);
    }, 10);

    $(".popover").attr("style","display: block; top: " +(df.ymouse()-320)+"px; left: "+(df.xmouse()-50)+"px;");
}

df.getServers = function (){
    var  url= '/filebrowser/getservers';
    $.ajax({
        url: url,
        call: 'POST',
        dataType: 'json',
        // data : data,
        contentType: 'application/json; charset=utf-8',
        success : function(res) {
            df.servers(res.data);
        },
        error: function (a, b, c) {
        },
    });
}

df.buildShapeData = function(id){
    var shapes = $(id).getKendoDiagram().shapes
    var res = [];
    for(var i in shapes){
        var re = df.convertShapeToFlowAction(shapes[i])
        if(re == undefined){
            return undefined;
        }else{
            res.push(re);
        }
    }
    return res;
}

df.convertShapeToFlowAction = function(shape){
var res = {};


var item = shape.dataItem;
var action = item.DataAction;
var details = item.DataActionDetails;

if(item.name=="Fork"||item.name=="Stop"){
    $(".diagram").getKendoDiagram().select(shape);
    df.popoverMode(item.name);
    df.renderActionData();
    var dtemp =  $(".diagram").getKendoDiagram().select()[0];
    item = dtemp.dataItem;
    action = item.DataAction;
    details = item.DataActionDetails;
}else if(action==undefined||details==undefined){
    return undefined;
}

res.id = shape.id;
res.name = item.name;
res.description = res.id +" - "+res.name;
res.type = item.type;
res.server =  res.name == "Fork" || res.name == "Stop"?"" : action.server();

var actj = JSON.parse(ko.toJSON(action));

// delete actj.server

res.action = actj;
res.OK = [];
res.KO = [];

var conn = df.getConnectionShape(shape);
var inc = conn.in;
var outc = conn.out;
var det = JSON.parse(ko.toJSON(details));

for(var i in outc){
    var co = outc[i];
    res.OK.push(co.id);
}

res.KO.push(det.whenFailed.split("-")[1].trim());
res.Retry = 0;
res.Interval = 0;

res.firstaction = false;

if(inc.length==0)
res.firstaction = true;

res.inputparam = det.input;
res.outputparam = det.output.param;
res.outputtype = det.output.type;


return res;
}

df.getConnectionShape = function(shape){
    var conn = shape.connectors;
    var res = [];
    var resfrom = [];
    for(var i in conn){
        var co = conn[i].connections
        for(var x in co){
            var dt = co[x];
            var dshape = dt.to.shape == undefined?dt.to:dt.to.shape;
            var dshapef = dt.from.shape == undefined?dt.from:dt.from.shape;

            if(dshapef.id==shape.id)//conn out
            res.push(dshape);

            if(dshape.id==shape.id)//conn in
            resfrom.push(dshapef);
        }
    }
    return {in:resfrom,out:res};
}
df.draggablePopover = function(e){
    var draggableDiv = $('.popover').draggable({handle: ".popover-title"});
    $('.popover-content', draggableDiv).mousedown(function(e) {
        draggableDiv.draggable('enable');
    }).mouseup(function(e) {
        draggableDiv.draggable('disable');
    });
}

$(function () {
    df.init();
    app.section('');  
});