	
$(document).ready(function(){

$("#FileBrowser").ecFileBrowser({
        dataSource:{
            url: '//demos.telerik.com/kendo-ui/service/Employees',
            call: 'GET',
            pathField: "EmployeeId",
            hasChildrenField:"HasEmployees",
            nameField:"FullName"
        }, 
        serverSource:{
             url: 'https://gist.githubusercontent.com/yanda15/cfcc16748f09bc6518fd/raw/2dab77f5b2b3ad3ec7e4edee31d04a11da17abdc/Sample%2520Server%2520Data',
             call: 'GET',
             dataTextField:"text",
             dataValueField:"text"
        }
    });

});
    