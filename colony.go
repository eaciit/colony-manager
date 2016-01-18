package main

import (
	"github.com/eaciit/colony-manager/controller"
	"github.com/eaciit/knot/knot.v1"
	"net/http"
	"path"
)

var (
	server *knot.Server
)

func main() {
	server = new(knot.Server)
	server.Address = "localhost:3000"
	server.RouteStatic("res", path.Join(controller.AppViewPath, "assets"))
	server.Register(controller.CreateWebController(server), "")
	server.Route("/", func(r *knot.WebContext) interface{} {
		http.Redirect(r.Writer, r.Request, "/web/index", 301)
		return true
	})
	server.Listen()
}
