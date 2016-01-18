package main

import (
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/knot/knot.v1"
	"os"
	"os/exec"
	"time"
)

type (
	ColonyManager struct {
		appViewsPath string
		layoutFile   string
		includeFiles []string
		Server       *knot.Server

		templateController *controller.TemplateController
		pageController     *controller.PageController
	}
)

func InitColonyManager() *ColonyManager {
	yo := new(ColonyManager)

	// prepare view path
	v, _ := os.Getwd()
	yo.appViewsPath = v + "/"
	yo.layoutFile = "views/layout.html"
	yo.includeFiles = []string{"views/_head.html"}
	yo.Server = new(knot.Server)

	knot.DefaultOutputType = knot.OutputTemplate

	// initiate controller
	yo.templateController = &controller.TemplateController{yo.appViewsPath, yo.Server, yo.layoutFile, yo.includeFiles}
	yo.pageController = &controller.PageController{yo.appViewsPath}

	// initiate server
	yo.Server.Address = "localhost:3000"
	yo.Server.RouteStatic("static", yo.appViewsPath)
	yo.templateController.RegisterRoutes()
	yo.Server.Register(yo.templateController, "")
	yo.Server.Register(yo.pageController, "")

	return yo
}

func (t *ColonyManager) Open() {
	time.AfterFunc(time.Second, func() {
		exec.Command("open", "http://"+t.Server.Address).Run()
	})
}

func main() {
	yo := InitColonyManager()
	yo.Server.Address = "localhost:8787"
	// yo.Open()
	yo.Server.Listen()
}
