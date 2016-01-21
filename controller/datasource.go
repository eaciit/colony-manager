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

func (d *DataSourceController) parseSettings(payloadSettings interface{}, defaultValue interface{}) interface{} {
	if payloadSettings == nil {
		return defaultValue
	}

	settingsRaw := []map[string]interface{}{}
	json.Unmarshal([]byte(payloadSettings.(string)), &settingsRaw)

	settings := map[string]interface{}{}
	for _, each := range settingsRaw {
		settings[each["key"].(string)] = each["value"].(string)
	}

	return settings
}

func (d *DataSourceController) checkIfDriverIsSupported(driver string) error {
	supportedDrivers := "mongo mysql"

	if !strings.Contains(supportedDrivers, driver) {
		drivers := strings.Replace(supportedDrivers, " ", ", ", -1)
		return errors.New("Currently tested driver is only " + drivers)
	}

	return nil
}

func (d *DataSourceController) SaveConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	payload["settings"] = d.parseSettings(payload["settings"], map[string]interface{}{})
	id := payload["id"].(string)

	if id == "" {
		// insert new connection
		payload["id"] = helper.RandomIDWithPrefix("c")
		err = helper.Query("json", "config/data-connection.json").Save("", payload)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, nil, "")
	} else {
		// update connection
		err = helper.Query("json", "config/data-connection.json").Save("", payload, dbox.Eq("id", id))
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

	data, err := helper.Query("json", "config/data-connection.json").SelectAll("")
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

	data, err := helper.Query("json", "config/data-connection.json").SelectOne("", dbox.Eq("id", id))
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

	err = helper.Query("json", "config/data-connection.json").Delete("", dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataSourceController) TestConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	driver := payload["driver"].(string)
	host := payload["host"].(string)
	database := payload["database"].(string)
	username := payload["username"].(string)
	password := payload["password"].(string)
	var settings toolkit.M = nil

	if settingsRaw := d.parseSettings(payload["settings"], nil); settingsRaw != nil {
		settings, err = toolkit.ToM(settingsRaw)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	if err := d.checkIfDriverIsSupported(driver); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = helper.Query(driver, host, database, username, password, settings).CheckIfConnected()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

/** DATA SOURCE */

func (d *DataSourceController) FetchDataSourceMetaData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	dataDS, err := helper.Query("json", "config/data-datasource.json").SelectOne("", dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// oldMetadata := dataDS.Get("metadata", []toolkit.M{}).([]toolkit.M)
	// if len(oldMetadata) > 0 {
	// 	return helper.CreateResult(true, dataDS, nil)
	// }

	connectionId := dataDS.Get("connectionId", "").(string)
	dataConn, err := helper.Query("json", "config/data-connection.json").SelectOne("", dbox.Eq("id", connectionId))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	driver := dataConn.Get("driver", "").(string)
	host := dataConn.Get("host", "").(string)
	database := dataConn.Get("database", "").(string)
	username := dataConn.Get("username", "").(string)
	password := dataConn.Get("password", "").(string)

	if err := d.checkIfDriverIsSupported(driver); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	_ = database
	conn := helper.Query(driver, host, "msig", username, password)
	data, err := conn.SelectOne("Financial")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	metadata := []toolkit.M{}
	for key, val := range data {
		label := key

		eachMeta := toolkit.M{}
		eachMeta["id"] = key
		eachMeta["label"] = label
		eachMeta["type"], _ = helper.GetBetterType(val)
		eachMeta["format"] = ""
		eachMeta["lookup"] = map[string]interface{}{
			"dataSourceId": "",
			"lookupFields": []interface{}{},
		}

		metadata = append(metadata, eachMeta)
	}
	// ds.templateLookup = {
	// 	dataSourceOriginId: "",
	// 	idField: "",

	// 	dataSourceId: "",
	// 	displayField: "",
	// 	lookupFields: [],
	// };

	dataDS["metadata"] = metadata
	err = helper.Query("json", "config/data-datasource.json").Save("", dataDS, dbox.Eq("id", id))
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, dataDS, "")
}

func (d *DataSourceController) SaveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)
	item := map[string]interface{}{
		"id":           payload["id"].(string),
		"connectionId": payload["connectionId"].(string),
		"name":         payload["name"].(string),
		"query":        payload["query"].(string),
		"metadata":     []interface{}{},
	}

	if payload["metadata"] != nil {
		metadataString := payload["metadata"].(string)

		if metadataString != "" {
			metadata := []map[string]interface{}{}
			json.Unmarshal([]byte(metadataString), &metadata)
			fmt.Println("-----", metadata)

			item["metadata"] = metadata
		}
	}

	if id == "" {
		// insert new datasource
		item["id"] = helper.RandomIDWithPrefix("ds")
		err = helper.Query("json", "config/data-datasource.json").Save("", item)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, item["metadata"], "")
	} else {
		// update datasource
		err = helper.Query("json", "config/data-datasource.json").Save("", item, dbox.Eq("id", id))
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

	data, err := helper.Query("json", "config/data-datasource.json").SelectAll("")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for i, each := range data {
		connectionId := each.Get("connectionId", "").(string)
		detail, err := helper.Query("json", "config/data-connection.json").SelectOne("", dbox.Eq("id", connectionId))
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

	data, err := helper.Query("json", "config/data-datasource.json").SelectOne("", dbox.Eq("id", id))
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

	err = helper.Query("json", "config/data-datasource.json").Delete("", dbox.Eq("id", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}
