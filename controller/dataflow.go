package controller

import (
	// "github.com/eaciit/controller/data-flow"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
)

type DataFlowController struct {
	App
}

func CreateDataFlowController(s *knot.Server) *DataFlowController {
	var controller = new(DataFlowController)
	controller.Server = s
	return controller
}

func Start(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	// dataf.Start("test")

	return helper.CreateResult(true, nil, "")
}
