package main

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/knot/knot.v1"
	"net/http"
	"os"
	"path"
	"path/filepath"
)

var (
	server *knot.Server
)

func main() {
	wd, _ := os.Getwd()
	colonycore.ConfigPath = filepath.Join(wd, "config")

	knot.SharedObject().Set("FilePath", path.Join(controller.AppViewPath, "config", "files"))

	server = new(knot.Server)
	server.Address = "localhost:3000"
	server.RouteStatic("res", path.Join(controller.AppViewPath, "assets"))
	server.Register(controller.CreateWebController(server), "")
	server.Register(controller.CreateDataSourceController(server), "")
	server.Route("/", func(r *knot.WebContext) interface{} {
		http.Redirect(r.Writer, r.Request, "/web/index", 301)
		return true
	})
	server.Listen()
}
