viewModel.servers = {}; var srv = viewModel.servers;
srv.templateOS = ko.observableArray([
	{ value: "windows", text: "Windows" },
	{ value: "linux", text: "Linux/Darwin" }
]);
srv.templateConfigServer = {
	_id: "",
	os: "linux",
	appPath: "",
	dataPath: "",
	host: "",
	sshtype: "",
	sshfile: "",
	sshuser: "",
	sshpass:  "",
};
srv.templatetype = ko.observableArray([
	{ value: "Local", text: "Local" },
	{ value: "Remote", text: "Remote" }
]);
srv.templatetypeSSH = ko.observableArray([
	{ value: "Credentials", text: "Credentials" },
	{ value: "File", text: "File" }
]);
srv.WizardColumns = ko.observableArray([
	{ field: "host", title: "Host", width: 200 },
	{ field: "status", title: "Status" }
]);
srv.dataWizard = ko.observableArray([]);
srv.validator = ko.observable('');
srv.txtWizard = ko.observable('');
srv.showModal = ko.observable('modal1');
srv.showFile = ko.observable(true);
srv.showUserPass = ko.observable(true);
srv.filterValue = ko.observable('');
srv.configServer = ko.mapping.fromJS(srv.templateConfigServer);
srv.showServer = ko.observable(true);
srv.ServerMode = ko.observable('');
srv.ServerData = ko.observableArray([]);
srv.tempCheckIdServer = ko.observableArray([]);
srv.ServerColumns = ko.observableArray([
	{ headerTemplate: "<center><input type='checkbox' id='selectall' onclick=\"srv.checkDeleteServer(this, 'serverall', 'all')\"/></center>", width: 40, attributes: { style: "text-align: center;" }, template: function (d) {
		return [
			"<input type='checkbox' class='servercheck' idcheck='"+d._id+"' onclick=\"srv.checkDeleteServer(this, 'server')\" />"
		].join(" ");
	} },
	{ field: "_id", title: "ID" },
	// { field: "type", title: "Type" },
	{ field: "host", title: "Host" },
	{ field: "os", title: "OS", template: function (d) {
		var row = Lazy(srv.templateOS()).find({ value: d.os });
		if (row != undefined) {
			return row.text;
		}

		return d.os;
	} },
	{ field: "sshtype", title: "SSH Type" },
	// { field: "appPath", title: "App Path" },
	// { field: "dataPath", title: "Data Path" },
	// { field: "enable", title: "Enable" },
]);

srv.getServers = function() {
	srv.ServerData([]);
	app.ajaxPost("/server/getservers", {}, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		srv.ServerData(res.data);
		var grid = $(".grid-server").data("kendoGrid");
		$(grid.tbody).on("mouseenter", "tr", function (e) {
		    $(this).addClass("k-state-hover");
		});
		$(grid.tbody).on("mouseleave", "tr", function (e) {
		    $(this).removeClass("k-state-hover");
		});
	});
};

srv.createNewServer = function () {
	app.mode("editor");
	srv.ServerMode('');
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	srv.showServer(false);
    srv.showFileUserPass();
};
srv.doSaveServer = function (c) {
	if (!app.isFormValid(".form-server")) {
		return;
	}

	var data = ko.mapping.toJS(srv.configServer);
	app.ajaxPost("/server/saveservers", data, function (res) {
		if (!app.isFine(res)) {
			return;
		}

		if (typeof c != "undefined") {
			c();
		}
	});
}
srv.saveServer = function(){
	srv.doSaveServer(function () {
		swal({title: "Server successfully created", type: "success",closeOnConfirm: true});
		srv.backToFront();
	});
};

srv.selectGridServer = function(e){
	var grid = $(".grid-server").data("kendoGrid");
	var selectedItem = grid.dataItem(grid.select());
	srv.editServer(selectedItem._id);
	srv.showServer(true);
};

srv.editServer = function (_id) {
	ko.mapping.fromJS(srv.templateConfigServer, srv.configServer);
	app.ajaxPost("/server/selectservers", { _id: _id }, function(res) {
		if (!app.isFine(res)) {
			return;
		}
		
		app.mode('editor');
		srv.ServerMode('edit');
		ko.mapping.fromJS(res.data, srv.configServer);
	});
	srv.showFileUserPass();
}
srv.ping = function () {
	srv.doSaveServer(function () {
		app.ajaxPost("/server/testconnection", { _id: srv.configServer._id() }, function(res) {
			if (!app.isFine(res)) {
				return;
			}
			
			swal({title: "Connected", type: "success"});
		});
	});
};

srv.checkDeleteServer = function(elem, e){
	if (e === 'serverall'){
		if ($(elem).prop('checked') === true){
			$('.servercheck').each(function(index) {
				$(this).prop("checked", true);
				srv.tempCheckIdServer.push($(this).attr('idcheck'));
			});
		} else {
			var idtemp = '';
			$('.servercheck').each(function(index) {
				$(this).prop("checked", false);
				idtemp = $(this).attr('idcheck');
				srv.tempCheckIdServer.remove( function (item) { return item === idtemp; } );
			});
		}
	}else {
		if ($(elem).prop('checked') === true){
			srv.tempCheckIdServer.push($(elem).attr('idcheck'));
		} else {
			srv.tempCheckIdServer.remove( function (item) { return item === $(elem).attr('idcheck'); } );
		}
	}
}

var vals = [];
srv.removeServer = function(){
	if (srv.tempCheckIdServer().length === 0) {
		swal({
			title: "",
			text: 'You havent choose any server to delete',
			type: "warning",
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "OK",
			closeOnConfirm: true
		});
	} else {
		// vals = $('input:checkbox[name="select[]"]').filter(':checked').map(function () {
		// return this.value;
		// }).get();
		swal({
			title: "Are you sure?",
			text: 'Server with id "' + srv.tempCheckIdServer().toString() + '" will be deleted',
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Delete",
			closeOnConfirm: false
		},
		function() {
			setTimeout(function () {
				app.ajaxPost("/server/deleteservers", srv.tempCheckIdServer(), function () {
					if (!app.isFine) {
						return;
					}

					srv.backToFront();
					swal({title: "Server successfully deleted", type: "success"});
				});
			},1000);

		});
	} 
	
}

srv.getUploadFile = function() {
	$('#uploadserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#upload-name').val(filename);
	     $("#nama").text(filename)
	 });
};

function ServerFilter(event){
	app.ajaxPost("/server/serversfilter", {inputText : srv.filterValue()}, function(res){
		if(!app.isFine(res)){
			return;
		}

		if (!res.data) {
			res.data = [];
		}

		srv.ServerData(res.data);
	});
}

srv.backToFront = function () {
	app.mode('');
	srv.getServers();
	$("#selectall").attr("checked",false)
};

srv.getServerFile = function() {
	$('#fileserver').change(function(){
		var filename = $(this).val().replace(/^.*[\\\/]/, '');
	     $('#file-name').val(filename);
	     $("#nama").text(filename)
	 });
};

srv.UploadServer = function(){ 

      	var inputFiles = document.getElementById("uploadserver");
      	console.log(inputFiles.files[0].name)
      	var formdata = new FormData();

      	for (i = 0; i < inputFiles.files.length; i++) {
            formdata.append('uploadfile', inputFiles.files[i]);
            formdata.append('filetypes', inputFiles.files[i].type);
            formdata.append('filesizes', inputFiles.files[i].size);           
        }
       
      	var xhr = new XMLHttpRequest();
        xhr.open('POST', "/server/uploadfile"); 
        xhr.send(formdata);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                alert(xhr.responseText);
            }
        }
         
        return false;
};
 

srv.sendFile = function(){
	var inputFiles = document.getElementById("uploadserver");
    console.log(inputFiles.files[0].name);
	if (!app.isFormValid(".form-server")) {
		return;
	}
	srv.configServer.sshfile(inputFiles.files[0].name);
	var data = ko.mapping.toJS(srv.configServer);
	console.log(data);
	app.ajaxPost("/server/sendfile", data, function (res) {
		if (!app.isFine(res)) {
			return;
		}
	});
	swal({title: "File successfully Send", type: "success",closeOnConfirm: true
	});
	srv.backToFront()
};

srv.showFileUserPass = function (){	
	if ($("#type-ssh").val() === 'Credentials') {
		srv.showFile(false);
		srv.showUserPass(true);
	}else{
		srv.showFile(true);
		srv.showUserPass(false);
	};
};

srv.popupWizard = function () {
	srv.showModal('modal1');
	srv.txtWizard('');
	srv.dataWizard([]);
}

srv.validate = function () {
	if (!app.isFormValid("#form-wizard")) {
		return;
	}
}

srv.dataBoundWizard = function () {
	var $sel = $(".grid-data-wizard");
	var $grid = $sel.data("kendoGrid");
	var ds = $grid.dataSource;

	ds.data().forEach(function (e) {
		var $row = $sel.find("tr[data-uid='" + e.uid + "']");
		$row.removeClass("ok not-ok");

		if (e.status == "OK") {
			$row.addClass("ok");
		} else {
			$row.addClass("not-ok");
		}
	});
};
srv.navModalWizard = function (status) {
	if(status == 'modal2' && srv.txtWizard() !== '' ){
		srv.txtWizard().replace( /\n/g, " " ).split( " " ).forEach(function (e) {
			var ip = (e.indexOf(":") == -1) ? (e + ":80") : e;
			
			app.ajaxPost("/server/checkping", { ip: ip }, function (res) {
				app.isLoading(true);
				var o = { 
					host: ip, 
					status: res.data 
				};

				if (!res.success) {
					o.status = res.message;
				}

				srv.dataWizard.push(o);
			}, {
				timeout: 5000
			});
		});
			$(document).ajaxStop(function() {
			  app.isLoading(false);
			});

		srv.showModal(status);
	}else if(status == 'modal1'){
		srv.txtWizard('');
		srv.showModal(status);
		srv.dataWizard([]);		
	}
};

srv.finishButton = function () {
	srv.showModal('modal1');
	srv.txtWizard('');
	srv.dataWizard([]);
};

$(function () {
    srv.getServers();
});