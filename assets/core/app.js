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

$(function () {
	app.prepare();
});