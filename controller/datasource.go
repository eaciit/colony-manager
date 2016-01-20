package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"strings"
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
	} else {
		settingsRaw := []map[string]interface{}{}
		json.Unmarshal([]byte(payload["settings"].(string)), &settingsRaw)

		settings := map[string]interface{}{}
		for _, each := range settingsRaw {
			settings[each["key"].(string)] = each["value"].(string)
		}
		fmt.Printf("--- %#v", settings)
		payload["settings"] = settings
	}
	id := payload["id"].(string)

	if id == "" {
		// insert new connection
		payload["id"] = helper.RandomIDWithPrefix("c")
		err = helper.Query("json", "config/data-connection.json").Save(payload)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	} else {
		// update connection
		err = helper.Query("json", "config/data-connection.json").Save(payload, dbox.Eq("id", id))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	}

	return helper.CreateResult(false, nil, "nothing changes")
}

func (d *DataSourceController) GetConnections(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data, err := helper.Query("json", "config/data-connection.json").SelectAll()
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

	data, err := helper.Query("json", "config/data-connection.json").SelectOne(dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	settings := []map[string]interface{}{}
	settingsRaw := data.Get("settings", map[string]interface{}{}).(map[string]interface{})
	for key, value := range settingsRaw {
		settings = append(settings, map[string]interface{}{
			"key":   key,
			"value": value.(string),
		})
	}
	data["settings"] = settings

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) RemoveConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	err = helper.Query("json", "config/data-connection.json").Delete(dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

/** DATA SOURCE */

func (d *DataSourceController) fetchMetaData(id string) ([]toolkit.M, error) {
	dataConn, err := helper.Query("json", "config/data-datasource.json").SelectOne(dbox.Eq("id", id))
	if err != nil {
		return nil, err
	}

	supportedDrivers := "mongo mssql mysql oracle"
	driver := dataConn.Get("driver", "").(string)
	host := dataConn.Get("host", "").(string)
	username := dataConn.Get("username", "").(string)
	password := dataConn.Get("password", "").(string)

	if !strings.Contains(supportedDrivers, driver) {
		return nil, errors.New("this driver is not yet supported")
	}

	data, err := helper.Query(driver, host, "", username, password).SelectAll()
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, errors.New("empty data !")
	}

	// metadata := []map[string]interface{}{}
	// firs := data[0].(toolkit.M)
	// for key, val := range firstRow {
	// 	label := key
	// 	eachType := "string"

	// 	eachMeta := map[string]interface{}{}
	// 	eachMeta["id"] = key
	// 	eachMeta["label"] = label
	// 	eachMeta["type"] = eachType
	// 	eachMeta["format"] = ""
	// 	eachMeta["lookup"] = nil

	// 	metadata = append(metadata, eachMeta)
	// }

	return nil, nil
	// return metadata, nil
}

func (d *DataSourceController) SaveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	metadataSample := []map[string]interface{}{
		{"id": "id", "label": "ID", "type": "string", "format": "", "lookup": nil},
		{"id": "username", "label": "User Name", "type": "string", "format": "", "lookup": nil},
		{"id": "age", "label": "Age", "type": "numeric", "format": "", "lookup": nil},
	}

	if id == "" {
		// insert new datasource
		payload["id"] = helper.RandomIDWithPrefix("ds")
		payload["metadata"] = metadataSample
		err = helper.Query("json", "config/data-datasource.json").Save(payload)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, payload["metadata"], "")
	} else {
		// update datasource
		payload["metadata"] = metadataSample
		err = helper.Query("json", "config/data-datasource.json").Save(payload, dbox.Eq("id", id))
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	}

	return helper.CreateResult(false, payload["metadata"], "")
}

func (d *DataSourceController) GetDataSources(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data, err := helper.Query("json", "config/data-datasource.json").SelectAll()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for i, each := range data {
		connectionId := each.Get("connectionId", "").(string)
		detail, err := helper.Query("json", "config/data-connection.json").SelectOne(dbox.Eq("id", connectionId))
		if err != nil {
			// just print it, not wrecking the entire function
			helper.CreateResult(false, nil, err.Error())
		}

		data[i].Set("connectionText", "")
		if detail != nil {
			text := fmt.Sprintf("%s (%s)", detail.Get("name", "").(string), connectionId)
			data[i].Set("connectionText", text)
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

	data, err := helper.Query("json", "config/data-datasource.json").SelectOne(dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) RemoveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	err = helper.Query("json", "config/data-datasource.json").Delete(dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}
