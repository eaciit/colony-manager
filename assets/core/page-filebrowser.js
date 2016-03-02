    
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            url: '/filebrowser/getdir',
            call: 'POST',
            callData: {ServerID: ""},
            pathField: "name",
            hasChildrenField:"",
            nameField:"name"
        }, 
        serverSource:{
            url: '/filebrowser/getservers',
            call: 'POST'
        }
    });

});
    