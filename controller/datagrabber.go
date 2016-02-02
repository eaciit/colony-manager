package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
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

func (d *DataGrabberController) SaveDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataGrabberController) SelectDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)

	return helper.CreateResult(true, payload, "")
}

func (d *DataGrabberController) GetDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := []colonycore.DataGrabber{}
	cursor, err := colonycore.Find(new(colonycore.DataGrabber), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}
