package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	//"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
)

type DataBrowserController struct {
	App
}

func CreateDataBrowserController(s *knot.Server) *DataBrowserController {
	var controller = new(DataBrowserController)
	controller.Server = s
	return controller
}

func (b *DataBrowserController) GetBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cursor, err := colonycore.Find(new(colonycore.DataBrowser), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.DataBrowser{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}
