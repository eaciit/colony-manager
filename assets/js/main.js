head.js("/static/assets/js/skin-select/jquery.cookie.js");
head.js("/static/assets/js/skin-select/skin-select.js");

head.js("/static/assets/js/tip/jquery.tooltipster.js", function() {

    $('.tooltip-tip-x').tooltipster({
        position: 'right'

    });

    $('.tooltip-tip').tooltipster({
        position: 'right',
        animation: 'slide',
        theme: '.tooltipster-shadow',
        delay: 1,
        offsetX: '-12px',
        onlyOne: true

    });
    $('.tooltip-tip2').tooltipster({
        position: 'right',
        animation: 'slide',
        offsetX: '-12px',
        theme: '.tooltipster-shadow',
        onlyOne: true

    });
    $('.tooltip-top').tooltipster({
        position: 'top'
    });
    $('.tooltip-right').tooltipster({
        position: 'right'
    });
    $('.tooltip-left').tooltipster({
        position: 'left'
    });
    $('.tooltip-bottom').tooltipster({
        position: 'bottom'
    });
    $('.tooltip-reload').tooltipster({
        position: 'right',
        theme: '.tooltipster-white',
        animation: 'fade'
    });
    $('.tooltip-fullscreen').tooltipster({
        position: 'left',
        theme: '.tooltipster-white',
        animation: 'fade'
    });
    //For icon tooltip

});

head.js("/static/assets/js/custom/scriptbreaker-multiple-accordion-1.js", function() {
    $(".topnav").accordionze({
        accordionze: true,
        speed: 500,
        closedSign: '<span class="glyphicon glyphicon-option-horizontal"></span>',
        openedSign: '<span class="glyphicon glyphicon-option-vertical"></span>'
    });

});