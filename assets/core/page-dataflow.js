viewModel.dataflow = {}; var df = viewModel.dataflow;

df.init = function () {
    // var dataSource = new kendo.data.HierarchicalDataSource({
    //     data: [{
    //         "name": "Telerik",
    //         "items": [
    //             {"name": "Kendo",
    //                 "items":[
    //                     {"name": "Tree"},
    //                     {"name": "Chart"}
    //                 ]
    //             },
    //             {"name": "Icenium"}
    //         ]
    //     }],
    //     schema: {
    //         model: {
    //             children: "items"
    //         }
    //     }
    // });
    var dataSource = new kendo.data.HierarchicalDataSource({
        data: [{
            "name": "Telerik",
            "type": "start",
        }],
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
            content: {
                template: function (d) {
                    console.log(d);
                    return "<foreignobject><input value='" + d.name + "' /></foreignobject>";
                },
            },
            html: true,
            width: 300,
            height: 200
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
        autoBind: true
    });
};

$(function () {
    df.init();
});