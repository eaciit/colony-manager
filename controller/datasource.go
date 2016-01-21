package controller

import (
	"encoding/json"
	"errors"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"strconv"
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
		if each["key"] == nil {
			continue
		}
		if each["key"].(string) == "" {
			continue
		}

		if each["value"] == nil {
			continue
		}
		if each["value"].(string) == "" {
			continue
		}

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

	o := new(colonycore.Connection)
	o.ID = payload["_id"].(string)
	o.ConnectionName = payload["ConnectionName"].(string)
	o.Driver = payload["Driver"].(string)
	o.Host = payload["Host"].(string)
	o.Database = payload["Database"].(string)
	o.UserName = payload["UserName"].(string)
	o.Password = payload["Password"].(string)
	o.Settings = d.parseSettings(payload["Settings"], map[string]interface{}{}).(map[string]interface{})

	if o.ID == "" {
		// set new ID while inserting fresh new data
		o.ID = helper.RandomIDWithPrefix("c")
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataSourceController) GetConnections(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.Connection{}
	cursor, err := colonycore.Find(new(colonycore.Connection), nil)
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

func (d *DataSourceController) SelectConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	data := new(colonycore.Connection)
	err = colonycore.Get(data, id)

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) RemoveConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	o := new(colonycore.Connection)
	o.ID = id
	err = colonycore.Delete(o)
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

	driver := payload["Driver"].(string)
	host := payload["Host"].(string)
	database := payload["Database"].(string)
	username := payload["UserName"].(string)
	password := payload["Password"].(string)
	var settings toolkit.M = nil

	if settingsRaw := d.parseSettings(payload["Settings"], nil); settingsRaw != nil {
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
	id := payload["_id"].(string)

	dataDS := new(colonycore.DataSource)
	err = colonycore.Get(dataDS, id)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, dataDS.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// {"from":"test","select":"*"}

	conn := helper.Query(dataConn.Driver, dataConn.Host, dataConn.Database, dataConn.UserName, dataConn.Password)

	connection, err := conn.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()
	query := connection.NewQuery()

	if qFrom := dataDS.QueryInfo.Get("from", "").(string); qFrom != "" {
		query = query.From(qFrom)
	}
	if qSelect := dataDS.QueryInfo.Get("select", "").(string); qSelect != "" {
		if qSelect == "*" {
			query = query.Select()
		} else {
			query = query.Select(strings.Split(qSelect, ",")...)
		}
	}
	if _, qTakeOK := dataDS.QueryInfo["take"]; qTakeOK {
		qTake, _ := strconv.Atoi(dataDS.QueryInfo.Get("take").(string))
		query = query.Take(qTake)
	}
	if _, qSkipOK := dataDS.QueryInfo["skip"]; qSkipOK {
		qSkip, _ := strconv.Atoi(dataDS.QueryInfo.Get("skip").(string))
		query = query.Skip(qSkip)
	}
	if qOrder := dataDS.QueryInfo.Get("order", "").(string); qOrder != "" {
		qOrderPart := strings.Split(qOrder, ",")
		if len(qOrderPart) == 1 {
			query = query.Order(qOrderPart[0])
		} else if len(qOrderPart) == 2 {
			query = query.Order(qOrderPart[0], qOrderPart[1])
		}
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	data := toolkit.M{}
	err = cursor.Fetch(&data, 1, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	metadata := []*colonycore.FieldInfo{}
	for key, val := range data {
		label := key

		meta := new(colonycore.FieldInfo)
		meta.ID = key
		meta.Label = label
		meta.Type, _ = helper.GetBetterType(val)
		meta.Format = ""
		meta.Lookup = new(colonycore.Lookup)

		metadata = append(metadata, meta)
	}

	dataDS.MetaData = metadata

	err = colonycore.Save(dataDS)
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

	queryInfo := toolkit.M{}
	err = json.Unmarshal([]byte(payload["QueryInfo"].(string)), &queryInfo)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.DataSource)
	o.ID = payload["_id"].(string)
	o.DataSourceName = payload["DataSourceName"].(string)
	o.ConnectionID = payload["ConnectionID"].(string)
	o.QueryInfo = queryInfo
	o.MetaData = []*colonycore.FieldInfo{}

	if payload["MetaData"] != nil {
		metadataString := payload["MetaData"].(string)

		if metadataString != "" {
			metadata := []*colonycore.FieldInfo{}
			json.Unmarshal([]byte(metadataString), &metadata)

			o.MetaData = metadata
		}
	}

	if o.ID == "" {
		// set new ID while inserting fresh new data
		o.ID = helper.RandomIDWithPrefix("ds")
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, o.MetaData, "")
}

func (d *DataSourceController) GetDataSources(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cursor, err := colonycore.Find(new(colonycore.DataSource), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.DataSource{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) SelectDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	data := new(colonycore.DataSource)
	err = colonycore.Get(data, id)
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
	id := payload["_id"].(string)

	o := new(colonycore.DataSource)
	o.ID = id
	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}
