package main

import (
	"flag"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/colony-manager/installation"
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
	isSetupACL := *flag.Bool("setupacl", false, "")

	if controller.EC_APP_PATH == "" || controller.EC_DATA_PATH == "" {
		fmt.Println("Please set the EC_APP_PATH and EC_DATA_PATH variable")
		return
	}

	runtime.GOMAXPROCS(4)
	colonycore.ConfigPath = filepath.Join(controller.EC_APP_PATH, "config")

	server = new(knot.Server)
	server.Address = "localhost:3000"
	server.RouteStatic("res", path.Join(controller.AppBasePath, "assets"))
	server.RouteStatic("res-widget", path.Join(controller.EC_DATA_PATH, "widget"))
	server.Register(controller.CreateWebController(server), "")
	server.Register(controller.CreateDataBrowserController(server), "")
	server.Register(controller.CreateDataSourceController(server), "")
	server.Register(controller.CreateDataGrabberController(server), "")
	server.Register(controller.CreateDataBrowserController(server), "")
	server.Register(controller.CreateFileBrowserController(server), "")
	server.Register(controller.CreateWebGrabberController(server), "")
	server.Register(controller.CreateApplicationController(server), "")
	server.Register(controller.CreateServerController(server), "")
	server.Register(controller.CreateLangenvironmentController(server), "")
	server.Register(controller.CreateUserController(server), "")
	server.Register(controller.CreateGroupController(server), "")
	server.Register(controller.CreateAdminisrationController(server), "")
	server.Register(controller.CreateAclController(server), "")
	server.Register(controller.CreateSessionController(server), "")
	server.Register(controller.CreateWidgetController(server), "")
	server.Register(controller.CreateLoginController(server), "")

	if colonycore.GetConfig(colonycore.CONF_DB_ACL) == nil || isSetupACL {
		if colonycore.GetConfig(colonycore.CONF_DB_ACL) == nil {
			fmt.Println("Seems like ACL DB is not yet configured")
		}

		setup.ACL()
	}

	server.Route("/", func(r *knot.WebContext) interface{} {
		sessionid := r.Session("sessionid", "")
		if sessionid == "" {
			http.Redirect(r.Writer, r.Request, "/web/login", 301)
		} else {
			http.Redirect(r.Writer, r.Request, "/web/index", 301)
		}

		return true
	})
	server.Listen()
}
