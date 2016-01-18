viewModel.methodsMenu = {
    top: function(item){
        var $self = this, $ulnavbar, $linavbar, $linknavbar;

        var putSubMenu = function (each, $parent) {
            if (each.submenu.length == 0) {
                var $child = $("<li><a href='" + each.href + "'>" + each.title + "</a></li>");
                $child.appendTo($parent);
            } else {
                var $child = $("<li><a href='" + each.href + "' class='dropdown dropdown-toggle' data-toggle='dropdown' style='cursor: pointer;'>" + each.title + "</a></li>");
                $child.appendTo($parent);

                var $subParent = $("<ul class='dropdown-menu' rola='menu'></ul>");
                $subParent.appendTo($child);

                each.submenu.forEach(function (sub) {
                    putSubMenuSub(sub, $subParent);
                });
            }
        };

        var putSubMenuSub = function(each, $parent){
            var $child = $("<li class='dropdown-submenu'><a href='" + each.href + "' class='dropdown dropdown-toggle' data-toggle='dropdown' style='cursor: pointer;'>" + each.title + "</a></li>");
            $child.appendTo($parent);

            var $subParent = $("<ul class='dropdown-menu' rola='menu'></ul>");
            $subParent.appendTo($child);

            each.submenu.forEach(function (sub) {
                putSubMenuSub(sub, $subParent);
            });
        }

        item.forEach(function (each) {
            var $parent = $("<ul class='nav navbar-nav'></ul>");
            $parent.appendTo($self);

            putSubMenu(each, $parent);
        });
    },
    right: function(){
        console.log('right');
    },
    left: function(item){
        var $o = this, $ulnav, $ligroup, $linkgroup, $spangroup, $linav, $linknav, $spannav, $iconav, $ulnavsub;
        for(var key in item){
            $ulnav = jQuery('<ul />');
            $ulnav.addClass('topnav menu-left-nest');
            $ulnav.css('margin','10px');
            $ulnav.appendTo($o);

            $ligroup = jQuery('<li />');
            $ligroup.css('text-align','left');
            $ligroup.appendTo($ulnav);

            $linkgroup = jQuery('<div />');
            // $linkgroup.attr('href','#');
            $linkgroup.css({'border-left-width':'0px !important', 'border-left-style':'solid !important','display':'inline-block','float':'none'});
            $linkgroup.addClass('title-menu-left');
            $linkgroup.appendTo($ligroup);

            $spangroup = jQuery('<span />');
            $spangroup.css({'display':'inline-block', 'float':'none'});
            $spangroup.html(item[key].titlegroup);
            $spangroup.appendTo($linkgroup);

            for(var key2 in item[key].leftmenu){
                $linav = jQuery('<li />');
                $linav.appendTo($ulnav);

                $linknav = jQuery('<a />');
                $linknav.addClass('tooltip-tip ajax-load tooltipster-disable');
                if(item[key].leftmenu[key2].submenu.length === 0){
                    $linknav.attr('href',item[key].leftmenu[key2].href);
                    $linknav.appendTo($linav);
                } else {
                    $linknav.attr('href','#');
                    $linknav.appendTo($linav);

                    $ulnavsub = jQuery('<ul />');
                    $ulnavsub.appendTo($linav);

                    var navleftTemplateSub = function (item,parentsub){
                        var $linav, $linknav, $iconav, $spannav;
                        $linav = jQuery('<li />');
                        $linav.css('text-align','left');
                        $linav.appendTo(parentsub);

                        $linknav = jQuery('<a />');
                        $linknav.addClass('tooltip-tip ajax-load tooltipster-disable');
                        $linknav.attr('href',item.href);
                        $linknav.appendTo($linav);

                        $iconav = jQuery('<i />');
                        $iconav.addClass(item.icon);
                        $iconav.appendTo($linknav);

                        $spannav = jQuery('<span />');
                        $spannav.css({'display':'inline-block','float':'none'});
                        $spannav.html(item.title);
                        $spannav.appendTo($linknav);
                    };


                    for(var key3 in item[key].leftmenu[key2].submenu){
                        navleftTemplateSub(item[key].leftmenu[key2].submenu[key3], $ulnavsub);
                    }
                }

                $iconav = jQuery('<i />');
                $iconav.addClass(item[key].leftmenu[key2].icon);
                $iconav.appendTo($linknav);

                $spannav = jQuery('<span />');
                $spannav.css({'display':'inline-block','float':'none'});
                $spannav.html(item[key].leftmenu[key2].title);
                $spannav.appendTo($linknav);
            }
        }
    }
};

viewModel.methodsHeader = {
    add: function(item){
        var $o = this, $header, $linkheader, $search, $searchcontent, $icosearch, $inputsearch;
        $header = jQuery('<div />');
        $header.addClass('header-logo aside-md');
        $header.appendTo($o);

        $linkheader = jQuery('<a />');
        $linkheader.addClass('header-brand');
        $linkheader.attr({'data-toggle':'fullscreen'});
        $linkheader.html('<img src="'+ item.logo +'" class="m-r-sm">'+ item.title);
        $linkheader.appendTo($header);

        $search = jQuery('<div />');
        $search.addClass('header-search aside-lg');
        $search.appendTo($o);

        $searchcontent = jQuery('<div />');
        $searchcontent.addClass('search-content');
        $searchcontent.appendTo($search);

        $icosearch = jQuery('<span />');
        $icosearch.addClass('glyphicon glyphicon-search ico-search');
        $icosearch.appendTo($searchcontent);

        $inputsearch = jQuery('<input />');
        $inputsearch.addClass('search-input');
        $inputsearch.appendTo($searchcontent);

        var $menuright, $liright, $contentli, $iconright, $menubadge;
        $menuright = jQuery('<ul />');
        $menuright.addClass('nav navbar-nav navbar-right m-n hidden-xs nav-user');
        $menuright.appendTo($o);

        for(var key in item.right){
            $liright = jQuery('<li />');
            $liright.addClass('hidden-xs');
            $liright.appendTo($menuright);

            $contentli = jQuery('<a />');
            $contentli.addClass('dropdown-toggle dk');
            if (item.right[key].dropdown.visible == true)
                $contentli.attr({'href': item.right[key].href, 'data-toggle': 'dropdown'});
            else
                $contentli.attr({'href': item.right[key].href});
            $contentli.appendTo($liright);

            $iconright = jQuery('<i />');
            $iconright.addClass(item.right[key].icon);
            $iconright.appendTo($contentli);

            if(item.right[key].number.visible === true){
                $menubadge = jQuery('<span />');
                $menubadge.addClass('badge badge-sm up bg-danger m-l-n-sm count');
                $menubadge.html(item.right[key].number.value);
                $menubadge.appendTo($contentli);
            }

            if(item.right[key].dropdown.visible === true){
                var ddmenuright = item.right[key].dropdown, $ddcontent, $ddheader, $panelsection, $listdd, $itemdd, $icondd, $itemtitledd, $ddfooter;
                $ddcontent = jQuery('<section />');
                $ddcontent.addClass('dropdown-menu aside-xl');
                $ddcontent.appendTo($liright);

                $panelsection = jQuery('<section />');
                $panelsection.addClass('panel');
                $panelsection.appendTo($ddcontent);

                $ddheader = jQuery('<header />');
                $ddheader.addClass('panel-heading b-light bg-light');
                $ddheader.html('<strong>'+ ddmenuright.header +'</strong>');
                $ddheader.appendTo($panelsection);

                $listdd = jQuery('<div />');
                $listdd.addClass('list-group list-group-alt animated fadeInRight');
                $listdd.appendTo($panelsection);

                for(var key2 in ddmenuright.data){
                    $itemdd = jQuery('<a />');
                    $itemdd.addClass('media list-group-item');
                    $itemdd.attr('href',ddmenuright.data[key2].href);
                    if (ddmenuright.data[key2].onclick != undefined)
                        $itemdd.attr({'onclick': ddmenuright.data[key2].onclick});
                    $itemdd.appendTo($listdd);

                    if(ddmenuright.data[key2].icon !== ''){
                        $icondd = jQuery('<span />');
                        $icondd.addClass('pull-left thumb-sm text-center');
                        $icondd.html('<i class="'+ ddmenuright.data[key2].icon +'"></i>');
                        $icondd.appendTo($itemdd);
                    }
                    $itemtitledd = jQuery('<span />');
                    $itemtitledd.addClass('media-body block m-b-none');
                    $itemtitledd.html(ddmenuright.data[key2].content + '<br><small class="text-muted">'+ ddmenuright.data[key2].detail +'</small>');
                    $itemtitledd.appendTo($itemdd);
                }

                $ddfooter = jQuery('<footer />');
                $ddfooter.addClass('panel-footer text-sm');
                $ddfooter.html('<span class="pull-right"><i class="fa fa-cog"></i></span><span data-toggle="class:show animated fadeInRight" class="active">'+ ddmenuright.footer +'</span>');
                $ddfooter.appendTo($panelsection);
            }
        }

        var $usermenu, $userphoto, $menuuser, $arrow, $limenuuser;
        $usermenu = jQuery('<li />');
        $usermenu.addClass('dropdown hidden-xs');
        $usermenu.appendTo($menuright);

        $userphoto = jQuery('<a />');
        $userphoto.addClass('dropdown-toggle');
        $userphoto.attr({'href':'#','data-toggle':'dropdown'});
        $userphoto.html('<span class="thumb-sm avatar pull-left"><img src="'+ item.user.photo +'" /></span><b class="caret"></b>');
        $userphoto.appendTo($usermenu);

        $menuuser = jQuery('<ul />');
        $menuuser.addClass('dropdown-menu animated fadeInRight');
        $menuuser.appendTo($usermenu);

        $arrow = jQuery('<span />');
        $arrow.addClass('arrow top');
        $arrow.appendTo($menuuser);

        for(var key in item.user.data){
            $limenuuser = jQuery('<li />');
            $limenuuser.attr('href',item.user.data[key].href);
            if(item.user.data[key]['number'])
                $limenuuser.html('<a href="'+item.user.data[key].href+'"><span class="badge bg-danger pull-right">'+ item.user.data[key].number +'</span>' + item.user.data[key].title + '</a>');
            else
                $limenuuser.html('<a href="'+item.user.data[key].href+'">'+item.user.data[key].title+'</a>');
            $limenuuser.appendTo($menuuser);
        }
        $limenuuser = jQuery('<li />');
        $limenuuser.addClass('divider');
        $limenuuser.appendTo($menuuser);

        $limenuuser = jQuery('<li />');
        $limenuuser.html('<span class="title-chage-color">Change Color</span><div class="content-color"><ul class="list-color"><li id="blue"></li><li id="orange"></li><li id="yellow"></li><li id="green"></li><li id="red"></li></ul></div>');
        $limenuuser.appendTo($menuuser);

        $limenuuser = jQuery('<li />');
        $limenuuser.addClass('divider');
        $limenuuser.appendTo($menuuser);

        $limenuuser = jQuery('<li />');
        $limenuuser.html('<a href="'+ item.user.linkLogout +'" data-toggle="ajaxModal">Logout</a>');
        $limenuuser.appendTo($menuuser);

    },
    change: function(item){
        var $linkcss = $('link[id=customlayout]');
        if(item === 'yellow')
            $linkcss.attr('href','/static/asset/css/customyellow.css');
        else if(item === 'blue')
            $linkcss.attr('href','/static/asset/css/customblue.css');
        else if(item === 'orange')
            $linkcss.attr('href','/static/asset/css/customorange.css');
        else if(item === 'green')
            $linkcss.attr('href','/static/asset/css/customgreen.css');
        else
            $linkcss.attr('href','/static/asset/css/customred.css');
    }
};

viewModel.ajaxPost = function (url, data, callbackSuccess, callbackError) {
    var config = {
        url: url,
        type: 'post',
        dataType: 'json',
        data: data,
        success: callbackSuccess,
        error: function (a, b, c) {
            if (callbackError !== undefined) {
                callbackError();
            }
        }
    };

    if (data instanceof FormData) {
        config.async = false;
        config.cache = false;
        config.contentType = false;
        config.processData = false;
    }
    
    $.ajax(config);
};

viewModel.fixSideMenuHeight = function () {
    $('#menu-left .list-group').css('min-height', $('.content-all').height() - $('.content-header').height() - $('.content-breadcrumb').height());
    $('#menu-right .list-menu-right').css('min-height', $('.content-all').height());
};

$.fn.eaciitMenu = function (method) {
    viewModel.methodsMenu[method].apply(this, Array.prototype.slice.call(arguments, 1));
};

viewModel.mode = ko.observable('');
viewModel.dataSource = {};
viewModel.panel = {};
viewModel.chart = {};
viewModel.grid = {};
viewModel.dataSource = {};
viewModel.page = {};
viewModel.designer = {};
viewModel.selector = {};

viewModel.camelToCapitalize = function (s) {
    return s.replace(/_/g, ' ').replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
};

$.fn.eaciitHeader = function (method){
    viewModel.methodsHeader[method].apply(this, Array.prototype.slice.call(arguments, 1));
}

$(function () {
    viewModel.fixSideMenuHeight();

    $('#page-header').eaciitHeader('add',
        {
            title:'Colony Manager',
            logo: '/static/assets/img/logoeaciittrans.png',
            right: [
                {
                    icon:'fa fa-bell',
                    number: {visible: true, value: 3},
                    href: '#',
                    dropdown:{
                        visible:true, header: 'You have 3 notifications', footer: 'See all notifications', 
                        data:[
                            {icon:'fa fa-envelope-o fa-2x text-success', href:'#', content:'Arfian sent you a email', detail:'1 minutes ago'},
                            {icon:'fa fa-envelope-o fa-2x text-success', href:'#', content:'Noval sent you a email', detail:'1 hour ago'},
                            {icon:'', content:'Release Web Template v1.1', href:'#', detail:'3 hour ago'}
                        ]
                    }
                },
                {
                    icon:'fa fa-gear',
                    number: {visible: false},
                    dropdown:{
                        visible:true, header: 'Admin Menu', footer: '&nbsp;', 
                        data:[
                            {icon:'fa fa fa-gear fa-2x text-success', href:'#', content:'Page', detail:'', onclick: 'location.href = "/page"'},
                            {icon:'fa fa fa-gear fa-2x text-success', href:'#', content:'Data Source', detail:'', onclick: 'location.href = "/datasource"'},
                        ]
                    },
                    href: '#'
                }
            ],
            user: { photo:'/static/assets/img/DSC_4844.jpg', linkLogout: '#', data: [
                {title : 'Setting', href:'#'},
                {title : 'Profile', href:'#'},
                {title : 'Notification', href:'#', number: 3 },
                {title : 'Help', href:'#'}
            ]}
        }
    );

    viewModel.ajaxPost("/template/getroutes", {}, function (res) {
        res = [{"href":"/index","submenu":[],"selected":false,"title":"Dashboard"}].concat(res);
        $('#navbar').eaciitMenu('top', res);
    });

    viewModel.ajaxPost("/template/getmenuleft", {}, function (res) {
        $('#listmenuleft').eaciitMenu('left', res);
    });

    viewModel.ajaxPost("/template/getbreadcrumb", viewModel.header, function (res) {
        $('#title-app').html(viewModel.header.title);
        var $breadcrumbs = $("ul.breadcrumb");
        $breadcrumbs.empty();

        res.forEach(function (e, i) {
            if (i + 1 < res.length) {
                $('<li><a href="' + e.href + '""><i class="fa fa-home"></i> ' + e.title + '</a></li>').appendTo($breadcrumbs);
            } else {
                $('<li class="active">' + (i == 0 ? '<i class="fa fa-home"></i> ' : '') + e.title + '</li>').appendTo($breadcrumbs);
            }
        });

        $('.navbar-nav li').removeClass('selected');
        if (res.length > 0){
            var $target = $('.navbar-nav a[href="' + res.reverse()[0].href + '"]');
            $target.parents('li').last().addClass('selected');
        }
    });

    $("header#page-header").on("click", "div.content-color>ul.list-color>li", function() {
        viewModel.methodsHeader.change($(this).attr('id'));
    });

    $('header#page-header').on('keyup', '.header-search input.search-input', function(res){
        console.log($(this).val());
    });
});
viewModel.chart.parseConfig = function (config, isProduction) {
    config = $.extend(true, {}, config);
    
    if (config.categoryAxis.template == "")
        delete config.categoryAxis.template;
    
    if (!config.outsider.valueAxisUseMaxMode)
        delete config.valueAxis.max;
    
    if (!config.outsider.valueAxisUseMinMode)
        delete config.valueAxis.min;

    if (isProduction == true) {
        delete config.chartArea.width;
    }

    // console.log("config", config);

    return config;
};