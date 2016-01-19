package controller

import (
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "net/http"
	"fmt"
)

type DataSourceController struct {
	App
}

func CreateDataSourceController(s *knot.Server) *DataSourceController {
	var controller = new(DataSourceController)
	controller.Server = s
	return controller
}

/** CONNECTION LIST */

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

func (d *DataSourceController) RemoveConnection(r *knot.WebContext) interface{} {
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

	err = connection.NewQuery().Delete().Where(dbox.Eq("id", id)).Exec(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

/** DATA SOURCE */

func (d *DataSourceController) SaveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	connection, err := helper.LoadConfig("config/data-datasource.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	if id == "" {
		// insert new datasource
		payload["id"] = helper.RandomIDWithPrefix("ds")
		err = connection.NewQuery().Insert().Exec(toolkit.M{"data": payload})
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	} else {
		// update datasource
		err = connection.NewQuery().Update().Where(dbox.Eq("id", id)).Exec(toolkit.M{"data": payload})
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	}

	return helper.CreateResult(false, nil, "")
}

func (d *DataSourceController) GetDataSources(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	connection, err := helper.LoadConfig("config/data-datasource.json")
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

	connectionDetail, err := helper.LoadConfig("config/data-connection.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connectionDetail.Close()

	for i, each := range data {
		connectionId := each.Get("connectionId", "").(string)
		cursorDetail, err := connectionDetail.NewQuery().Select().Where(dbox.Eq("id", connectionId)).Cursor(nil)
		if err != nil {
			// just print the error, not breaking the entire function
			helper.CreateResult(false, nil, err.Error())
		}
		defer cursorDetail.Close()

		dataEach := make([]toolkit.M, 0)
		err = cursorDetail.Fetch(&dataEach, 0, false)
		if err != nil {
			// just print the error, not breaking the entire function
			helper.CreateResult(false, nil, err.Error())
		}

		data[i].Set("connectionText", "")

		if len(dataEach) > 0 {
			connectionText := fmt.Sprintf("%s (%s)", dataEach[0].Get("name", "").(string), dataEach[0].Get("id", "").(string))
			data[i].Set("connectionText", connectionText)
		}
	}

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) SelectDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	connection, err := helper.LoadConfig("config/data-datasource.json")
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

func (d *DataSourceController) RemoveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	connection, err := helper.LoadConfig("config/data-datasource.json")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	err = connection.NewQuery().Delete().Where(dbox.Eq("id", id)).Exec(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}
