viewModel.app = {}; var app = viewModel.app;

app.applyNavigationActive = function () {
	var currentURL = document.URL.split("/").slice(3).join("/");
	var $a = $("a[href='/" + currentURL + "']");

	$a.closest(".navbar-nav").children().removeClass("active");
	if ($a.closest("li").parent().hasClass("navbar-nav")) {
		$a.closest("li").addClass("active");
	} else {
		$a.closest("li").closest("li").addClass("active");
	}
};
app.prepare = function () {
	app.applyNavigationActive();
};
app.ajaxPost = function (url, data, callbackSuccess, callbackError) {
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
app.isFine = function (res) {
    if (!res.success) {
        alert(res.message);
        return false;
    }

    return true;
};
app.isFormValid = function (selector) {
    $(selector).kendoValidator();
    var $validator = $(selector).data("kendoValidator");
    return ($validator.validate());
}


$(function () {
	app.prepare();
});