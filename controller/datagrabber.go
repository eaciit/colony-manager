package controller

import (
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/toolkit"
	"github.com/eaciit/colony-core/v0"
)

type DataGrabberController struct {
	App
}

func CreateDataGrabberController(s *knot.Server) *DataGrabberController {
	var controller = new(DataGrabberController)
	controller.Server = s
	return controller
}

type Maps struct {
	fieldOrigin		string
	fieldDestination	string
}
type ResponseTest struct {
	_id		string
	DataSourceOrigin	string
	DataSourceDestination	string
	Map []*Maps
}
func (d *DataGrabberController) SaveDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.DataGrabber)
	o.ID = payload["_id"].(string)
	o.DataSourceOrigin = payload["DataSourceOrigin"].(string)
	o.DataSourceDestination = payload["DataSourceDestination"].(string)

	imap := toolkit.JsonString(payload["Map"])
	var imaps []*colonycore.Maps
	toolkit.UnjsonFromString(imap, &imaps)
	o.Map = imaps

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, o, "")
}
func (d *DataGrabberController) SelectDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	data := new(colonycore.DataGrabber)
	err = colonycore.Get(data, id)

	return helper.CreateResult(true, data, "")
}
