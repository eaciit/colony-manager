package controller

import (
	"fmt"
	"github.com/eaciit/knot/knot.v1"
)

type WebController struct {
	App
}

func CreateWebController(s *knot.Server) *WebController {
	var controller = new(WebController)
	controller.Server = s
	return controller
}

func (w *WebController) Index(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/index.html"

	fmt.Println(LayoutFile, IncludeFiles)

	return "Asdfsadfs"
}
