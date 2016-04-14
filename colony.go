package main

import (
	"flag"
	"fmt"
	"net/http"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/colony-manager/installation"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
)

var (
	server *knot.Server
)

func main() {
	var isSetupACL bool
	flag.BoolVar(&isSetupACL, "setupacl", false, "")
	flag.BoolVar(&controller.IsDevMode, "devmode", controller.IsDevMode, "")
	flag.Parse()

	if controller.EC_APP_PATH == "" || controller.EC_DATA_PATH == "" {
		fmt.Println("Please set the EC_APP_PATH and EC_DATA_PATH variable")
		return
	}

	runtime.GOMAXPROCS(4)
	colonycore.ConfigPath = filepath.Join(controller.EC_APP_PATH, "config")

	webController := controller.CreateWebController(server)

	server = new(knot.Server)
	server.Address = "localhost:3000"
	server.RouteStatic("res", path.Join(controller.AppBasePath, "assets"))
	server.RouteStatic("res-widget", path.Join(controller.EC_DATA_PATH, "widget"))
	server.Register(webController, "")
	server.Register(controller.CreateDataBrowserController(server), "")
	server.Register(controller.CreateDataSourceController(server), "")
	server.Register(controller.CreateDataGrabberController(server), "")
	server.Register(controller.CreateDataFlowController(server), "")
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
	server.Register(controller.CreatePageController(server), "")
	server.Register(controller.CreateLoginController(server), "")

	if colonycore.GetConfig(colonycore.CONF_DB_ACL) == nil || isSetupACL {
		if colonycore.GetConfig(colonycore.CONF_DB_ACL) == nil {
			fmt.Println("Seems like ACL DB is not yet configured")
		}

		setup.ACL()
	}

	if err := setAclDatabase(); err != nil {
		fmt.Println("Warning!", "Colony Manager will running without ACL")
		fmt.Println("ACL Error", err.Error())
	}

	server.Route("/", func(r *knot.WebContext) interface{} {
		// page router
		regex := regexp.MustCompile("/page/[a-zA-Z0-9_]+(/.*)?$")
		rURL := r.Request.URL.String()
		if regex.MatchString(rURL) {
			args := strings.Split(strings.Replace(rURL, "/page/", "", -1), "/")
			return webController.PageView(r, args)
		}

		// is dev mode?
		if controller.IsDevMode {
			http.Redirect(r.Writer, r.Request, "/web/index", 301)
			return true
		}

		// session detect
		sessionid := r.Session("sessionid", "")
		if sessionid == "" {
			http.Redirect(r.Writer, r.Request, "/web/login", 301)
			return true
		} else {
			http.Redirect(r.Writer, r.Request, "/web/index", 301)
			return true
		}

		return true
	})

	server.Listen()
}

func setAclDatabase() (err error) {
	driver, ci := new(colonycore.Login).GetACLConnectionInfo()
	conn, err := dbox.NewConnection(driver, ci)

	if err != nil {
		return
	}

	err = conn.Connect()
	if err != nil {
		return
	}

	if colonycore.GetConfig("default_username") == nil {
		colonycore.SetConfig("default_username", "eaciit")
		colonycore.SetConfig("default_password", "Password.1")
	}

	err = acl.SetDb(conn)
	new(controller.LoginController).PrepareDefaultUser()
	return
}
