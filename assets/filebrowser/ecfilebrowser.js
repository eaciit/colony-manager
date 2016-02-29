$.fn.ecFileBrowser = function (method) {
	if (methodsFB[method]) {
		return methodsFB[method].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methodsFB['init'].apply(this,arguments);
	}
}


var Settings_EcFileBrowser = {
	dataSource: {data:[]},
	serverSource: {data:[]}
}

var Setting_DataSource = {
	data: [],
	url: '',
	call: 'get',
	callData: 'q',
	timeout: 20,
	callOK: function(res){
		// console.log('callOK');
	},
	callFail: function(a,b,c){
		// console.log('callFail');
	}
};


var methodsFB = {
	init:function(options){
		var settings = $.extend({}, Settings_EcFileBrowser, options || {});
		var settingsSource = $.extend({}, Setting_DataSource, settings['dataSource'] || {});
		var serverSource = $.extend({}, Setting_DataSource, settings['serverSource'] || {});
		settings["dataSource"] = settingsSource;
		settings["serverSource"] = serverSource;
		if(serverSource.data.length==0||serverSource.url!=""){
			methodsFB.CallAjaxServer(this,settings);
		}else{
		 	methodsFB.CallAjax(this, settings, serverSource.data[0]["text"]);		
		}
		return this.each(function () {
			$(this).data("ecFileBrowser", settings);
		});
	},
	BuildFileExplorer:function(elem,options){
		var $ox = $(elem), $container = $ox.parent(), idLookup = $ox.attr('id');
		var data = options.dataSource.data;

		strcont = "<div class='col-md-12 fb-container'></div>";
		$strcont = $(strcont);
		$strcont.appendTo($ox);

		strpre = "<div class='col-md-3 fb-pre'></div>";
		$strpre = $(strpre);
		$strpre.appendTo($strcont);

		strserv = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label'>Server</label></div><div class='col-md-9'><input class='fb-server'></input></div></div>";
		$strserv = $(strserv);
		$strserv.appendTo($strpre);

		$($(elem).find(".fb-server")).kendoDropDownList({
			dataSource : options.serverSource.data,
			dataTextField: "text",
			dataValueField:"text",
			change: function(){
				methodsFB.CallAjax(elem,$(elem).data("ecFileBrowser"), $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value());
			}
		});

		strsearch = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label' >Search</label></div><div class='col-md-9'><input class='form-control' placeholder='folder,file name, etc..'></input></div></div>"
		$strsearch = $(strsearch);
		$strsearch.appendTo($strpre);

		strtree = "<div></div>"
		$strtree = $(strtree);
		$strtree.appendTo($strpre);

		var datatree = new kendo.data.HierarchicalDataSource({
                    data: data
                });

		$strtree.kendoTreeView({
			dataSource: datatree
		});

		$strtree.data("kendoTreeView").expand(".k-item");

		$strtree.find("span").each(function(){
			if($(this).html()!=""){
				var type = methodsFB.DetectType(this,$(this).html());
				var sp = "<span class='k-sprite "+type+"'></span>";
				$sp = $(sp);
				$sp.prependTo($(this));
			}
		});
		methodsFB.BuildEditor(elem,options);
	},
	BuildEditor:function(elem,options){
		var $ox = $(elem), $container = $ox.parent(), idLookup = $ox.attr('id');
		var data = options.dataSource.data;

		$cont = $($(elem).find(".fb-container"));

		strpre = "<div class='col-md-9 fb-pre'></div>";
		$strpre = $(strpre);
		$strpre.appendTo($cont);

		strbtn = "<div class='col-md-12 btn-cont'><button class='btn btn-primary'><span class='glyphicon glyphicon-file'></span> New File</button>";
		strbtn += "<button class='btn btn-primary'><span class='glyphicon glyphicon-pencil'></span> Rename</button>";
		strbtn += "<button class='btn btn-primary'><span class='glyphicon glyphicon-trash'></span> Delete</button>";
		strbtn += "<button class='btn btn-primary'><span class='glyphicon glyphicon-cog'></span> Permission</button>";
		strbtn += "<button class='btn btn-primary'><span class='glyphicon glyphicon-cloud-upload'></span> Upload</button>";
		strbtn += "<button class='btn btn-primary'><span class='glyphicon glyphicon-cloud-download'></span> Download</button></div>";
		
		streditor = "<div class='col-md-12'><textarea class='fb-editor'></textarea></div>"
		$streditor = $(streditor);

		$strbtn = $(strbtn);
		$strbtn.appendTo($strpre);

		$streditor.appendTo($strpre);
		$($(elem).find(".fb-editor")).kendoEditor({ resizable: {
                        content: true,
                        toolbar: true
                    }});
	},
	CallAjax:function(elem,options,server){
		if(options.dataSource.data.length==0|| options.dataSource.url!=""){
		var ds = options.dataSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.dataSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		 $.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : data,
                contentType: contentType,
                success : function(res) {
                	$(elem).data('ecFileBrowser').dataSource.callOK(res);
					options.dataSource.data = res;
					$(elem).data("ecFileBrowser", options);
					if($(elem).html()!=""){
						var parent = $($(elem).find(".k-treeview")).parent();
						$($(elem).find(".k-treeview")).remove();

						strtree = "<div></div>"
						$strtree = $(strtree);
						$strtree.appendTo($(parent));

						var datatree = new kendo.data.HierarchicalDataSource({
				                    data: options.dataSource.data
				                });

						$strtree.kendoTreeView({
							dataSource: datatree
						});

						$strtree.data("kendoTreeView").expand(".k-item");

						$strtree.find("span").each(function(){
							if($(this).html()!=""){
								var type = methodsFB.DetectType(this,$(this).html());
								var sp = "<span class='k-sprite "+type+"'></span>";
								$sp = $(sp);
								$sp.prependTo($(this));
							}
						});
					}else{
						methodsFB.BuildFileExplorer(elem, options);
					}
                },
                error: function (a, b, c) {
					$(elem).data('ecFileBrowser').dataSource.callFail(a,b,c);
			},
        });
		}else{
			if($(elem).html()==""){
				methodsFB.BuildFileExplorer(elem, options);
			}
		}
	},
	CallAjaxServer:function(elem,options){
		var ds = options.serverSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.serverSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		 $.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : data,
                contentType: contentType,
                success : function(res) {
                	$(elem).data('ecFileBrowser').serverSource.callOK(res);
					options.serverSource.data = res;
					$(elem).data("ecFileBrowser", options);
					methodsFB.CallAjax(elem, options,options.serverSource.data[0]["text"]);
					if($(elem).html()!=""){
						var parent = $($($(elem).find(".fb-server")).parent()[0]);
						$($(elem).find(".fb-server")).remove();

						strserv = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label'>Server</label></div><div class='col-md-9'><input class='fb-server'></input></div></div>";
						$strserv = $(strserv);
						$strserv.appendTo($(parent));

						$($(elem).find(".fb-server")).kendoDropDownList({
							dataSource : options.serverSource.data,
							dataTextField: "text",
							dataValueField:"text",
							change: function(){
								methodsFB.CallAjax(elem,$(elem).data("ecFileBrowser"), $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value());
							}
						});
					}
                },
                error: function (a, b, c) {
					$(elem).data('ecFileBrowser').dataSource.callFail(a,b,c);
			},
        });
	},
	DetectType:function(elem,name){
		name = name.toLowerCase();
		var childcount = $(elem).prev("span").length

		if (childcount > 0){
			return "folder"
		}else if (name.indexOf(".pdf")>-1){
			return "pdf"
		}else if (name.indexOf(".png")>-1||name.indexOf(".jpg")>-1||name.indexOf(".jpeg")>-1||name.indexOf(".gif")>-1||name.indexOf(".tiff")>-1||name.indexOf(".bmp")>-1){
			return "image"
		}else {
			return "html"
		}
	}
}