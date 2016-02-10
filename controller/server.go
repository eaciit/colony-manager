package controller

import (
	"github.com/eaciit/knot/knot.v1"
)

type ServerController struct {
	App
}

func CreateServerController(s *knot.Server) *ApplicationController {
	var controller = new(ApplicationController)
	controller.Server = s
	return controller
}
