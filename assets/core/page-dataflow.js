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
        "Name"  :"Shell Script",
        "Id"    :"4",
        "Image" : "icon_console.png",
        "Type"  : "Action",
        "Color" : "black"
    },
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
    ]
}; 
var df = viewModel.dataflow;

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
                }else{
                    g.append(new dataviz.diagram.Rectangle({
                        width: 200,
                        height: 50,
                        stroke: {
                            width: 0
                        },
                        fill: "#e8eff7"
                    }));

                    g.append(new dataviz.diagram.Rectangle({
                        width: 8,
                        height: 50,
                        fill: dataItem.color,
                        stroke: {
                            width: 0
                        }
                    }));

                 g.append(new dataviz.diagram.Image({
                    source: "/res/img/" + dataItem.image,
                    x: 14,
                    y: 7,
                    width: 35,
                    height: 35
                }));
            }

            return g;
        }


df.init = function () {
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
                    content: {
                        template: "#= dataItem.name #",
                        fontSize: 15
                    },
            // content: {
            //     template: function (d) {
            //         console.log(d);
            //         return "<foreignobject><input value='" + d.name + "' /></foreignobject>";
            //     },
            // },
            html: true,
            // width: 300,
            // height: 200
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
        click:function(e){
            var diagram = kendo.dataviz.diagram;
            var Shape = diagram.Shape;
            var item = e.item;

            if(item instanceof Shape){
                $("#popbtn").popover("show");
                $(".popover-title").html(item.dataItem.name);
                $(".arrow").attr("style","left:30px");
                if (item.dataItem.name == "Spark") {
                    $(".popover").attr("style","display: block; top: " +(ymouse-220)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").removeClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "HDFS"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-120)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").removeClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "Hive"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-150)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").removeClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "Shell Script"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-120)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").removeClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "Map Reduce"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-150)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").removeClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "Java App"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-150)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").removeClass("hide");
                    $(".popover-content #email").addClass("hide");
                }else if(item.dataItem.name == "Email"){
                    $(".popover").attr("style","display: block; top: " +(ymouse-210)+"px; left: "+(xmouse-30)+"px;");
                    $(".popover-content #spark").addClass("hide");
                    $(".popover-content #hdfs").addClass("hide");
                    $(".popover-content #hive").addClass("hide");
                    $(".popover-content #shell").addClass("hide");
                    $(".popover-content #mapreduce").addClass("hide");
                    $(".popover-content #java").addClass("hide");
                    $(".popover-content #email").removeClass("hide");
                };
            }
        },
        dragEnd: df.onDragEnd,
        remove: df.onRemove,
    });

   $(".tooltipster").tooltipster({
        theme: 'tooltipster-val',
        animation: 'grow',
        delay: 0,
        offsetY: -5,
        touchDevices: false,
        trigger: 'hover',
        position: "right"
    });

    $("#popbtn").popover({
        html : true,
        placement : 'top',
        content: function() {
          return $(".popover-content").html();
        }        
    });

    var xmouse = 0;
    var ymouse = 0;

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

                            var posdiag = $(".diagram")[0].getBoundingClientRect();
                            var xpos = (xmouse - posdiag.left);
                            var ypos = (ymouse - posdiag.top);

                            if(xpos>0&&ypos>0){
                             var diagram = $(".diagram").data("kendoDiagram");
                             diagram.addShape({ 
                                x:xpos,
                                y:ypos, 
                                dataItem:{name:name,image :image, color:color} 
                             });
                            }

                        },
       });

      $("body").mousemove(function(e) {
            xmouse = e.pageX;
            ymouse = e.pageY;
        });
};

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
    for(var c in conn){
        var co = conn[c];
        if(co.from == null || co.to == null ||  co.from.shape ==undefined || co.to.shape == undefined){
            diagram.remove(co);
        }
    }

    df.counts = {};
    conn = diagram.connections;

    //delete invalid connection
    for(var c in conn){
        var co = conn[c];
        var sh = co.from.shape;
        var shto = co.to.shape;
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
    }
}

df.checkFlow = function(elem){
    var diagram = $(elem).getKendoDiagram();
    var shap = diagram.shapes;
    var conn = diagram.connections;
    df.counts = {};

    for(var c in conn){
        var co = conn[c];
        var sh = co.from.shape;
        var shto = co.to.shape;

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
        alert("Infinite Flow !");
    }else if(noconnshape>0){
        alert("Invalid Flow !")
    }
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
            // text += $.map(elements, function (element) {
            //     return elementText(element);
            // }).join(",");
            return text;
        }

$(function () {
    df.init();
    app.section('');
});