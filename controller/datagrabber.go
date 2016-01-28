package controller

import (
	"github.com/eaciit/knot/knot.v1"
)

type DataGrabberController struct {
	App
}

func CreateDataGrabberController(s *knot.Server) *DataGrabberController {
	var controller = new(DataGrabberController)
	controller.Server = s
	return controller
}
