package controller

import (
	"encoding/json"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type WebController struct {
	App
}

func CreateWebController(s *knot.Server) *WebController {
	var controller = new(WebController)
	controller.Server = s
	return controller
}

func (w *WebController) PredefinedVariables(params ...toolkit.M) interface{} {
	templateModels, _ := json.Marshal(toolkit.M{
		"Application":         colonycore.Application{},
		"Connection":          colonycore.Connection{},
		"DataBrowser":         colonycore.DataBrowser{},
		"DataFlow":            colonycore.DataFlow{},
		"DataGrabber":         colonycore.DataGrabber{},
		"FileInfo":            colonycore.FileInfo{},
		"LanguageEnvironment": colonycore.LanguageEnviroment{},
		"Page":                colonycore.Page{},
		"PageDetail":          colonycore.PageDetail{},
		"Server":              colonycore.Server{},
		"WebGrabber":          colonycore.WebGrabber{},
		"Widget":              colonycore.Widget{},
	})

	vars := toolkit.M{"templateModels": string(templateModels)}
	if len(params) > 0 {
		for key, val := range params[0] {
			vars[key] = val
		}
	}

	return vars
}

func (w *WebController) Index(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-index.html"

	return w.PredefinedVariables()
}

func (w *WebController) DataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-datasource.html"

	return w.PredefinedVariables()
}

func (w *WebController) DataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-datagrabber.html"

	return w.PredefinedVariables()
}

func (w *WebController) WebGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-webgrabber.html"

	return w.PredefinedVariables()
}

func (w *WebController) Application(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-application.html"

	return w.PredefinedVariables()
}

func (w *WebController) DataBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-databrowser.html"

	return w.PredefinedVariables()
}

func (w *WebController) WidgetGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/museum/page-widgetgrid.html"

	return w.PredefinedVariables()
}

func (w *WebController) FileBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-filebrowser.html"

	return w.PredefinedVariables()
}

func (w *WebController) Administration(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-administration.html"

	return w.PredefinedVariables()
}

func (w *WebController) WidgetSelector(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/museum/page-widgetselector.html"

	return w.PredefinedVariables()
}

func (w *WebController) WidgetChart(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/museum/page-widgetchart.html"

	return w.PredefinedVariables()
}

func (w *WebController) Login(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-login.html"

	return w.PredefinedVariables()
}

func (w *WebController) Widget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-widget.html"

	return w.PredefinedVariables()
}

func (w *WebController) ConfirmReset(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-reset.html"

	return w.PredefinedVariables()
}

func (w *WebController) DataFlow(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-dataflow.html"

	return w.PredefinedVariables()
}

func (w *WebController) Pages(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-pages.html"

	return w.PredefinedVariables()
}

func (w *WebController) PageDesigner(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-designer.html"
	payload := map[string]string{}
	r.GetForms(&payload)

	return w.PredefinedVariables(toolkit.M{"href": "/pagedesigner", "pageID": payload["id"]})
}

func (w *WebController) PageView(r *knot.WebContext, args []string) interface{} {
	r.Config.OutputType = knot.OutputTemplate
	r.Config.LayoutTemplate = LayoutFile
	r.Config.IncludeFiles = IncludeFiles
	r.Config.ViewName = "views/page-view.html"

	data := toolkit.M{"pageID": args[0]}
	if len(args) == 0 {
		return data
	}

	return w.PredefinedVariables(data)
}
