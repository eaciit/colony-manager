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
	call: 'POST',
	callData: 'q',
	timeout: 20,
	dataTextField:"text",
	dataValueField:"value",
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
	call: 'POST',
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
             "<a style='display:none' path=\"#:item.pathf #\" name=\"#:item.text #\" permission=\"#:item.permissions#\"></a> ";

var methodsFB = {
	init:function(options){
		var settings = $.extend({}, Settings_EcFileBrowser, options || {});
		var settingsSource = $.extend({}, Setting_DataSource, settings['dataSource'] || {});
		var serverSource = $.extend({}, Setting_ServerSource, settings['serverSource'] || {});
		settings["dataSource"] = settingsSource;
		settings["serverSource"] = serverSource;

		settings["dataSource"].GetDirAction = "GetDir";
		settings["dataSource"].originUrl = settingsSource.url;

		templatetree = templatetree.replace("text",options.dataSource.nameField).replace("text",options.dataSource.nameField);
		templatetree = templatetree.replace("pathf",options.dataSource.pathField);

		this.each(function () {
			$(this).data("ecFileBrowser", settings);
		});

		if(serverSource.data.length==0||serverSource.url!=""){
			methodsFB.CallAjaxServer(this,settings);
		}else{
			methodsFB.BuildFileExplorer(this, settings);
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
			dataTextField: options.serverSource.dataTextField,
			dataValueField:options.serverSource.dataValueField,
			change: function(){
            		$($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
					$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
			}
		});

		strsearch = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label' >Search</label></div><div class='col-md-8'><input class='form-control fb-txt-search' placeholder='folder,file name, etc..'></input></div><div class='col-md-1'><button class='btn btn-primary fb-search'><span unselectable='on' class='glyphicon glyphicon-search'></span></button></div></div>"
		$strsearch = $(strsearch);
		$strsearch.appendTo($strpre);

		$($strsearch.find("button")).click(function(){
				methodsFB.ActionRequest(elem,options,{action:"Search"},this);
		});

		strtree = "<div></div>"
		$strtree = $(strtree);
		$strtree.appendTo($strpre);
		var ds = options.dataSource;
		var url = methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction);
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
	                dataType: "json",
	                type: call,
	                complete: function(){
	                	$(elem).data("ecFileBrowser").dataSource.GetDirAction = "GetDir";
	                	$strtree.find("span").each(function(){
							if($(this).html()!=""){
								if($($(this).find("span")).length==0){
									var type = methodsFB.DetectType(this,$(this).html());
									var sp = "<span class='k-sprite "+type+"'></span>";
									$sp = $(sp);
									$sp.prependTo($(this));

									if(type!="folder"){
										$(this).dblclick(function(){
											methodsFB.ActionRequest(elem,options,{action:"GetContent"},this);
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
	            		 
	            		dt["action"] = $(elem).data("ecFileBrowser").dataSource.GetDirAction;
	            		if (dt["action"]=="GetDir"){
	            			dt["serverId"] = $($(elem).find("input[class='fb-server']")).getKendoDropDownList().value();
	            			dt["search"] = $($(elem).find(".fb-txt-search")).val();
	            		}else{
	            			//dt["search"] = $($(elem).find(".fb-txt-search")).val();
	            		}
	            		return dt
	            	}
	            }
	        },
	        schema: {
	        	data: "data",
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
		methodsFB.BuildPopUp(elem,options);
	},
	SetUrl:function(elem,action){
		$(elem).data("ecFileBrowser").dataSource.url = $(elem).data("ecFileBrowser").dataSource.originUrl + "/"+action.toLowerCase();
		return $(elem).data("ecFileBrowser").dataSource.url;
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
			methodsFB.ActionRequest(elem,options,{"action":"Edit"});
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
	BuildPermission:function(elemarr,permstr){
		var idx = 0;
		$(elemarr).each(function(){
			$($(this).find("input")).each(function(){
				if(permstr.charAt(idx)!="-"){
					$(this)[0].checked = true;
				}
				idx++;
			});
		});
	},
	BuildPopUp : function(elem,options){
		$div = $("<div class='modal fade modal-fb' tabindex='-1' role='dialog'></div>");
		$div.appendTo($(elem));

		$divmod = $("<div class='modal-dialog modalcustom'></div>");
		$divmod.appendTo($div);

		$divcont = $("<div class='modal-content'></div>");
		$divcont.appendTo($divmod);

		$divhead = $("<div class='modal-header'>"+
					"<button type='button' class='close' data-dismiss='modal' aria-label='Close'>"+
					"<span aria-hidden='true'>&times;</span>"+
					"</button>"+
					"<h4 class='modal-title'>"+
					"</h4>"+
					"</div>");
		$divhead.appendTo($divcont);

		$divbody = $("<div class='modal-body'></div>");
		$divbody.appendTo($divcont);

		$divfooter = $("<div class='modal-footer'>"+
					"<button type='button' class='btn btn-sm btn-danger' data-dismiss='modal'>"+
					"<span class='glyphicon glyphicon-repeat'></span> Cancel"+
					"</button>"+
					"<button type='button' class='btn btn-sm btn-primary fb-submit' >"+
					"<span class='glyphicon glyphicon-floppy-disk'></span> Submit"+
					"</button>"+
			"</div>");
		$divfooter.appendTo($divcont);
	},
	CallPopUp:function(elem,content,title){
		$($(elem).find("h4")).html(title);
		$body =	$($(elem).find(".modal-body"));
		$btn =	$($(elem).find(".fb-submit"));
		$btn.unbind("click");
		$body.html("");
		var name = $($($(elem).find(".k-state-selected")).find("a")).attr("name");
		var type = methodsFB.DetectType($(elem).find(".k-state-selected"),name);

		if(content.action=="NewFile"){
			if (type!="folder"){
				alert("Please choose folder !");
				return;
			}


			$divNewFile = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>File Name</label></div><div class='col-md-9'><input placeholder='Type File Name ..' class='form control'></input></div></div>");
			$divNewFile.appendTo($body);
			$btn.click(function(){
					content.path = content.path	+ $($body.find("input")).val();
					methodsFB.SendActionRequest(elem,content);
			});
		}else if(content.action=="NewFolder"){
			if (type!="folder"){
				alert("Please choose folder !");
				return;
			}


			$divNewFile = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>Folder Name</label></div><div class='col-md-9'><input placeholder='Type Folder Name ..' class='form control'></input></div></div>");
			$divNewFile.appendTo($body);
			$btn.click(function(){
					content.path = content.path	+ $($body.find("input")).val();
					methodsFB.SendActionRequest(elem,content);
			});
		}else if(content.action=="Rename"){
			var lbl = "File"
			if(type	=="folder"){
				lbl = "Folder";
			    $($(elem).find("h4")).html(lbl + " Name");
			}

			$divNewFile = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>" +lbl+ " Name</label></div><div class='col-md-9'><input placeholder='Type "+lbl+" Name ..' class='form control'></input></div></div>");
			$($divNewFile.find("input")).val(name);
			$divNewFile.appendTo($body);

			$btn.click(function(){
					content.newname = $($body.find("input")).val();
					methodsFB.SendActionRequest(elem,content);
			});		
		}else if (content.action=="Permission"){
			$divperm = $("<div class='col-md-12'><div class='col-md-2'><label class='filter-label'>Permission</label></div>"+
					"<div class='col-md-3'><label class='perm-label'>Owner</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"<div class='col-md-3'><label class='perm-label'>Group Member</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"<div class='col-md-3'><label class='perm-label'>All User</label><div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Read</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Write</label>"+
			  		"</div>"+
			  		"<div class='checkbox'>"+
			  		"<label><input type='checkbox' value=''>Execute</label>"+
			  		"</div>"+
					"</div>"+
					"</div>");
			$divperm.appendTo($body);

			$btn.click(function(){
					var strperm = "";
					var arr = ["r","w","x"];
					$($body.find(".col-md-3")).each(function(){
						$($(this).find("input")).each(function(i){
								if($(this)[0].checked){
									strperm	+= arr[i];
								}else{
									strperm	+="-";
								}
						});
					});
					content.permission = strperm;
					methodsFB.SendActionRequest(elem,content);
			});	
			methodsFB.BuildPermission($($body.find(".col-md-3")),$($($(elem).find(".k-state-selected")).find("a")).attr("permission"));
		}else if (content.action=="Upload"){
			if (type!="folder"){
				alert("Please choose folder !");
				return;
			}

			$form =	$("<form class='form-signin' method='post' action='/Test/Upload' enctype='multipart/form-data'></form>");
			$fs =	$("<fieldset></fieldset>");
			$inp =	$("<div class='col-md-3'><label class='filter-label'>Upload File</label></div><div class='col-md-9'><input type='file' name='myfiles' multiple='multiple'></div>");

			$form.appendTo($body);
			$fs.appendTo($form);
			$inp.appendTo($fs);	
		}
		$($(elem).find(".modal")).modal("show");		
	},
	ActionRequest:function(elem,options,content,sender){
		// console.log(content);		
		var SelectedPath = $($(elem).find(".k-state-selected")).length > 0 ?  $($($(elem).find(".k-state-selected")).find("a")).attr("path"):"";
		// console.log(SelectedPath);
		var name = "";
		var type = "";
		if(SelectedPath=="" && content.action!="Cancel" && content.action!="GetContent" && content.action!="Search"){
			alert("Select the directory/file !");
			return;
		}

		if(content.action!="Search"){
			name  = $($($(elem).find(".k-state-selected")).find("a")).attr("name");
			type = methodsFB.DetectType($(elem).find(".k-state-selected"),name);
		}

		content.path = SelectedPath;
		if(content.action=="Cancel"){
			$($(elem).find(".fb-filename")).html("");
			$($(elem).find(".fb-editor")).data("kendoEditor").value("");
			return;
		}else if(content.action=="GetContent"){
			var path = ($($(sender).find("a")).attr("path")); 
			content.path = path;
			methodsFB.SetUrl(elem,content.action);
		}else if(content.action=="Rename"){
			methodsFB.CallPopUp(elem,content,"Rename File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="NewFile"){
			methodsFB.CallPopUp(elem,content,"Create New File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="NewFolder"){
			methodsFB.CallPopUp(elem,content,"Create New Folder");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Delete"){
			methodsFB.SetUrl(elem,content.action);
		}else if(content.action=="Permission"){
			methodsFB.CallPopUp(elem,content,"Edit Permission");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Upload"){
			methodsFB.CallPopUp(elem,content,"Upload File");
			methodsFB.SetUrl(elem,content.action);
			return;
		}else if(content.action=="Edit"){
			content.contents = $($(elem).find(".fb-editor")).getKendoEditor().value();
			methodsFB.SetUrl(elem,content.action);
		}else if(content.action=="Search"){
			$(elem).data("ecFileBrowser").dataSource.GetDirAction = "GetDir";
            $($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
			$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
			return;
		}else if(content.action=="Download"){
			if (type=="folder"){
				alert("Please choose file !");
				return;
			}
			methodsFB.SetUrl(elem,content.action);
		}
		methodsFB.SendActionRequest(elem,content);
	},
	SendActionRequest:function(elem,param){
		var ds = $(elem).data("ecFileBrowser").dataSource;
		var url = ds.url;
		var data = ds.callData;
		var call = ds.call;
		var contentType = "";
		if (ds.call.toLowerCase() == 'post'){
			contentType = 'application/json; charset=utf-8';
		}
		 $.ajax({
                url: url,
                type: call,
                dataType: 'json',
                data : param,
                contentType: contentType,
                success : function(res) {
                	alert("OK");
                	$(elem).data('ecFileBrowser').serverSource.callOK(res);
                	if(param.action == "GetContent"){
                		$($(elem).find(".fb-filename")).html(param.path);
						$($(elem).find(".fb-editor")).data("kendoEditor").value(res.data);
                	}else{
                		methodsFB.RefreshTreeView(elem);
                	}
                		$(elem).find(".modal").modal("hide");
                },
                error: function (a, b, c) {
					$(elem).data('ecFileBrowser').dataSource.callFail(a,b,c);
			},
        });
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
					options.serverSource.data = res.data;
					$(elem).data("ecFileBrowser", options);
					if($(elem).html()!=""){
						var parent = $($($(elem).find(".fb-server")).parent()[0]);
						$($(elem).find(".fb-server")).remove();

						strserv = "<div class='col-md-12'><div class='col-md-3'><label class='filter-label'>Server</label></div><div class='col-md-9'><input class='fb-server'></input></div></div>";
						$strserv = $(strserv);
						$strserv.appendTo($(parent));

						$($(elem).find(".fb-server")).kendoDropDownList({
							dataSource : options.serverSource.data,
							dataTextField: options.serverSource.dataTextField,
							dataValueField:options.serverSource.dataValueField,
							change: function(){
            		 			$($(elem).find('.k-treeview')).getKendoTreeView().dataSource.transport.options.read.url =  methodsFB.SetUrl(elem,$(elem).data("ecFileBrowser").dataSource.GetDirAction)			
								$($(elem).find(".k-treeview")).data("kendoTreeView").dataSource.read();
							}
						});					
					}else{
						methodsFB.BuildFileExplorer(elem, options);
					}
                },
                error: function (a, b, c) {
					$(elem).data('ecFileBrowser').serverSource.callFail(a,b,c);
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
	},
	RefreshTreeView:function(elem){
		var tree = $($("#FileBrowser").find(".k-treeview")).getKendoTreeView();
		var selectedUid = $($($($("#FileBrowser").find(".k-state-selected")).parentsUntil("li")).parent()).attr("data-uid");
		var selectedparent = tree.parent(tree.findByUid(selectedUid));
		if(selectedparent.length==0){
			tree.dataSource.read();
			return;
		}
		var dtItem = tree.dataItem(selectedparent);
		dtItem.dirty = false;
		dtItem.expanded = false;
		dtItem.loaded(false);
		$(selectedparent[0].firstChild.firstChild).click();
		$(selectedparent[0].firstChild.firstChild).trigger("click");
	}
}