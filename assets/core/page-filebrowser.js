
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            /*url: 'https://gist.githubusercontent.com/yanda15/bf83bc831ca7363e5ec2/raw/ee63e18b7617dab8542ab8dbbabe946b44808329/Sample%2520data%2520File%2520Browser',*/
            /*url: '//demos.telerik.com/kendo-ui/service/Employees',*/
            url: '/filebrowser/gettree',
            call: 'GET',
            callData: 'search'/*,
            pathField: "EmployeeId",
            hasChildrenField:"HasEmployees",
            nameField:"FullName"*/
        }, 
        serverSource:{
            // url: 'https://gist.githubusercontent.com/yanda15/cfcc16748f09bc6518fd/raw/c16bc1e411c9005d86d988cfce079fb018224036/Sample%2520Server%2520Data',
            url: '/server/getservers',
            call: 'POST',
            callData: 'search'
        }
    });

});
    