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

var Setting_ServerSource = {
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

var Setting_DataSource = {
	data: [],
	url: '',
	call: 'get',
	callData: 'q',
	timeout: 20,
	pathField : 'path',
	nameField:'text',
	hasChildrenField:'hasChild',
	callOK: function(res){
		// console.log('callOK');
	},
	callFail: function(a,b,c){
		// console.log('callFail');
	}
};

var templatetree = "#: item.text# "+
             "<a style='display:none' path=\"#:item.pathf #\"></a> ";

var methodsFB = {
	init:function(options){
		var settings = $.extend({}, Settings_EcFileBrowser, options || {});
		var settingsSource = $.extend({}, Setting_DataSource, settings['dataSource'] || {});
		var serverSource = $.extend({}, Setting_ServerSource, settings['serverSource'] || {});
		settings["dataSource"] = settingsSource;
		settings["serverSource"] = serverSource;

		templatetree = templatetree.replace("text",options.dataSource.nameField);
		templatetree = templatetree.replace("pathf",options.dataSource.pathField);

		this.each(function () {
			$(this).data("ecFileBrowser", settings);
		});

		if(serverSource.data.length==0||serverSource.url!=""){
			methodsFB.CallAjaxServer(this,settings);
		}else{
			methodsFB.BuildFileExplorer(this, options);
		}
		return 
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
			dataTextField: "_id",
			dataValueField:"_id",
			change: function(){
					$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
			}
		});

		strsearch = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label' >Search</label></div><div class='col-md-9'><input class='form-control' placeholder='folder,file name, etc..'></input></div></div>"
		$strsearch = $(strsearch);
		$strsearch.appendTo($strpre);

		strtree = "<div></div>"
		$strtree = $(strtree);
		$strtree.appendTo($strpre);

		var ds = options.dataSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (options.dataSource.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}

		var datatree = new kendo.data.HierarchicalDataSource({
        transport: {
            read: {
                url: url,
                dataType: "jsonp",
                complete: function(){
                	$strtree.find("span").each(function(){
						if($(this).html()!=""){
							if($($(this).find("span")).length==0){
								var type = methodsFB.DetectType(this,$(this).html());
								var sp = "<span class='k-sprite "+type+"'></span>";
								$sp = $(sp);
								$sp.prependTo($(this));

								if(type!="folder"){
									$(this).dblclick(function(){
										methodsFB.ActionRequest(elem,options,{action:"Edit"},this);
									});
								}
							}
						}
					});
                },
            },
            parameterMap:function(data,type){
            	if(type=="read"){
            		var dt = data;
            		dt["ServerID"] = $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value();
            		return dt
            	}
            }
        },
        schema: {
            model: {
                id: options.dataSource.pathField,
                hasChildren: options.dataSource.hasChildrenField,

            }
        }
    });

		$strtree.kendoTreeView({
			template: templatetree,
			dataSource: datatree,
			dataTextField: options.dataSource.nameField
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

		$strcont = $("<div class='col-md-12 btn-cont'></div>");
		
		$strbtn = $("<button class='btn btn-primary dropdown-toggle' data-toggle='dropdown'><span class='glyphicon glyphicon-file'></span> New</button>");
		$strul = $("<ul class='dropdown-menu'></ul>");

		$strli = $("<li><a href=\"#\">File</a></li>");
		$strli.appendTo($strul);
		$strli.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"NewFile"},$strbtn);
		});

		$strli = $("<li class='divider'></li>");
		$strli.appendTo($strul);

		$strli = $("<li><a href=\"#\">Folder</a></li>");
		$strli.appendTo($strul);
		$strli.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"NewFolder"},$strbtn);
		});

		$strbtn.appendTo($strcont);
		$strul.appendTo($strcont);

		$strbtn = $("<button class='btn btn-primary'><span class='glyphicon glyphicon-pencil'></span> Rename</button>");
		$strbtn.appendTo($strcont);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Rename"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-primary'><span class='glyphicon glyphicon-trash'></span> Delete</button>");
		$strbtn.appendTo($strcont);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Delete"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-primary'><span class='glyphicon glyphicon-cog'></span> Permission</button>");
		$strbtn.appendTo($strcont);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Permission"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-primary'><span class='glyphicon glyphicon-cloud-upload'></span> Upload</button>");
		$strbtn.appendTo($strcont);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Upload"},$strbtn);
		})

		$strbtn = $("<button class='btn btn-primary'><span class='glyphicon glyphicon-cloud-download'></span> Download</button>");
		$strbtn.appendTo($strcont);
		$strbtn.click(function(){
			methodsFB.ActionRequest(elem,options,{action:"Download"},$strbtn);
		})

		streditor = "<div class='col-md-12'><textarea class='fb-editor'></textarea></div>"
		$streditor = $(streditor);

		$strcont.appendTo($strpre);

		$streditor.appendTo($strpre);
		$($(elem).find(".fb-editor")).kendoEditor({ resizable: {
                        content: true,
                        toolbar: true
                    }});

		$conted = $($(elem).find("ul[data-role='editortoolbar']"));

		$edli = $("<li class='k-tool-group k-button-group pull-right' role='presentation'></li>");
		$edhref = $("<a href='' role='button' class='k-tool k-group-start k-group-end fb-ed-btn' unselectable='on' title='Save' aria-pressed='false'></a>");
		$edspan = $("<span unselectable='on' class='glyphicon glyphicon-floppy-disk'></span>");
		$edlbl = $("<span class='k-tool-text'>Save</span>");

		$edli.appendTo($conted);
		$edhref.appendTo($edli);
		$edspan.appendTo($edhref);
		$edlbl.appendTo($edhref);

		$edhref.click(function(){
			methodsFB.ActionRequest(elem,options,{"action":"Save"});
		});

		$edli = $("<li class='k-tool-group k-button-group pull-right' role='presentation'></li>");
		$edhref = $("<a href='' role='button' class='k-tool k-group-start k-group-end fb-ed-btn' unselectable='on' title='Cancel' aria-pressed='false'></a>");
		$edspan = $("<span unselectable='on' class='glyphicon glyphicon-repeat'></span>");
		$edlbl = $("<span class='k-tool-text'>Cancel</span>");

		$edli.appendTo($conted);
		$edhref.appendTo($edli);
		$edspan.appendTo($edhref);
		$edlbl.appendTo($edhref);

		$edhref.click(function(){
			methodsFB.ActionRequest(elem,options,{"action":"Cancel"});
		});

		$edli = $("<li class='k-tool-group k-button-group' role='presentation'></li>");
		$edtxt = $("<label class='fb-filename'></label>");

		$edli.appendTo($conted);
		$edtxt.appendTo($edli);

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


			app.ajaxPost(url, {search: ""}, function (res) {

				if (!app.isFine(res)) {
					return;
				}
				if (res.data==null){
					res.data="";
				}

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
			});

			/*$.ajax({
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
	        });*/
	},
	ActionRequest:function(elem,options,content,sender){
		console.log(content);		
		var SelectedPath = $($(elem).find("span[class='k-in k-state-selected']")).length > 0 ?  $($($(elem).find("span[class='k-in k-state-selected']")).find("a")).attr("path"):"";
		console.log(SelectedPath);

		if(content.action=="Cancel"){
			$($(elem).find(".fb-filename")).html("");
			$($(elem).find(".fb-editor")).data("kendoEditor").value("");
		}else if(content.action=="Edit"){
			var path = ($($(sender).find("a")).attr("path")); 
			$($(elem).find(".fb-filename")).html(($($(sender).find("a")).attr("path")));

			$($(elem).find(".fb-editor")).data("kendoEditor").value(path);
		}else if(content.action=="Rename"){

		}else if(content.action=="NewFile"){

		}else if(content.action=="NewFolder"){

		}else if(content.action=="Delete"){

		}else if(content.action=="Permission"){

		}else if(content.action=="Upload"){

		}else{

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

		app.ajaxPost(url, {search: ""}, function (res) {

			if (!app.isFine(res)) {
				return;
			}
			if (res.data==null){
				res.data="";
			}

			$(elem).data('ecFileBrowser').serverSource.callOK(res);
			options.serverSource.data = res.data;
			$(elem).data("ecFileBrowser", options);
			methodsFB.CallAjax(elem, options,options.serverSource.data[0]["_id"]);
			if($(elem).html()!=""){
				var parent = $($($(elem).find(".fb-server")).parent()[0]);
				$($(elem).find(".fb-server")).remove();

				strserv = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label'>Server</label></div><div class='col-md-9'><input class='fb-server'></input></div></div>";
				$strserv = $(strserv);
				$strserv.appendTo($(parent));
				$($(elem).find(".fb-server")).kendoDropDownList({
					dataSource : options.serverSource.data,
					dataTextField: "_id",
					dataValueField:"_id",
					change: function(){
						methodsFB.CallAjax(elem,$(elem).data("ecFileBrowser"), $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value());

		}
		/*$.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : data,
                contentType: contentType,
                success : function(res) {
                	$(elem).data('ecFileBrowser').serverSource.callOK(res);
					options.serverSource.data = res;
					$(elem).data("ecFileBrowser", options);
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
								$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
							}
						});					
					}else{
						methodsFB.BuildFileExplorer(elem, options);
					}
				});
			}
		});*/
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