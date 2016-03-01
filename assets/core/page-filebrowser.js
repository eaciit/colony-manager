	
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            url: '//demos.telerik.com/kendo-ui/service/Employees',
            call: 'GET',
            callData: 'search',
            pathField: "EmployeeId",
            hasChildrenField:"HasEmployees",
            nameField:"FullName"
        }, 
        serverSource:{
             url: 'https://gist.githubusercontent.com/yanda15/cfcc16748f09bc6518fd/raw/c16bc1e411c9005d86d988cfce079fb018224036/Sample%2520Server%2520Data',
            call: 'GET',
            callData: 'search'
        }
    });

});
    