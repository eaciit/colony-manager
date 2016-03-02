	
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            /*url: 'https://gist.githubusercontent.com/yanda15/bf83bc831ca7363e5ec2/raw/ee63e18b7617dab8542ab8dbbabe946b44808329/Sample%2520data%2520File%2520Browser',*/
            url: '/filebrowser/gettree',
            call: 'GET',
            callData: 'search'
        }, 

        serverSource:{
            // url: 'https://gist.githubusercontent.com/yanda15/cfcc16748f09bc6518fd/raw/c16bc1e411c9005d86d988cfce079fb018224036/Sample%2520Server%2520Data',
            url: '/server/getservers',
            call: 'POST',
            callData: 'search'
        }
    });

$("#FileBrowser2").ecFileBrowser({
        dataSource:{
            data: [
                        { text: "ABC", items: [
                            { text: "Tables & Chairs.pdf" },
                            { text: "Sofas.png" },
                            { text: "Occasional Furniture.skype" }
                        ] },
                        { text: "DEF", items: [
                            { text: "Bed Linen" },
                            { text: "Curtains & Blinds" },
                            { text: "Carpets" }
                        ] }
                    ]
        }, 
        serverSource:{
             data:[
                { text: "Server c"},
                { text: "Server d"}
            ]
        }
    });

});
    