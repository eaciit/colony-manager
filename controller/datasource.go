package controller

import (
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "net/http"
)

type DataSourceController struct {
	App
}

func CreateDataSourceController(s *knot.Server) *DataSourceController {
	var controller = new(DataSourceController)
	controller.Server = s
	return controller
}

func (d *DataSourceController) SaveConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if payload["settings"] == nil {
		payload["settings"] = map[string]interface{}{}
	}
	id := payload["id"].(string)

	connection, err := helper.LoadConfig("config/data-connection.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	if id == "" {
		// insert new connection
		payload["id"] = helper.RandomIDWithPrefix("c")
		err = connection.NewQuery().Insert().Exec(toolkit.M{"data": payload})
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	} else {
		// update connection
		err = connection.NewQuery().Update().Where(dbox.Eq("id", id)).Exec(toolkit.M{"data": payload})
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	}

	return helper.CreateResult(false, nil, "")
}

func (d *DataSourceController) GetConnections(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	connection, err := helper.LoadConfig("config/data-connection.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	cursor, err := connection.NewQuery().Select().Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) SelectConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	connection, err := helper.LoadConfig("config/data-connection.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	cursor, err := connection.NewQuery().Select().Where(dbox.Eq("id", id)).Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if len(data) == 0 {
		return helper.CreateResult(false, nil, "No data found")
	}

	return helper.CreateResult(true, data[0], "")
}
