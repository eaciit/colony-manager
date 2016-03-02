	
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            url: '/filebrowser/getdir',
            call: 'POST',
            pathField: "path",
            hasChildrenField:"isdir",
            nameField:"name"
        }, 
        serverSource:{
             url: '/filebrowser/getservers',
             call: 'POST',
             dataTextField:"_id",
             dataValueField:"_id"
        }
    });

});
    