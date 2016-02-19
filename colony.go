package main

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/knot/knot.v1"
	"net/http"
	"path"
	"path/filepath"
	"runtime"
)

var (
	server *knot.Server
)

func main() {
	if controller.EC_APP_PATH == "" || controller.EC_DATA_PATH == "" {
		fmt.Println("Please set the EC_APP_PATH and EC_DATA_PATH variable")
		return
	}

	runtime.GOMAXPROCS(4)
	colonycore.ConfigPath = filepath.Join(controller.EC_APP_PATH, "config")

	server = new(knot.Server)
	server.Address = "localhost:3000"
	server.RouteStatic("res", path.Join(controller.AppBasePath, "assets"))
	server.Register(controller.CreateWebController(server), "")
	server.Register(controller.CreateDataSourceController(server), "")
	server.Register(controller.CreateDataGrabberController(server), "")
	server.Register(controller.CreateWebGrabberController(server), "")
	server.Register(controller.CreateApplicationController(server), "")
	server.Register(controller.CreateServerController(server), "")
	server.Route("/", func(r *knot.WebContext) interface{} {
		http.Redirect(r.Writer, r.Request, "/web/index", 301)
		return true
	})
	server.Listen()
}
