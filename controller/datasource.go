package controller

import (
	"encoding/json"
	"errors"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
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

/** PRIVATE FUNC */

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

func (d *DataSourceController) connectToDataSource(_id string) (*colonycore.DataSource, *colonycore.Connection, dbox.IConnection, dbox.IQuery, error) {
	dataDS := new(colonycore.DataSource)
	err := colonycore.Get(dataDS, _id)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, dataDS.ConnectionID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return nil, nil, nil, nil, err
	}

	conn := helper.Query(dataConn.Driver, dataConn.Host, dataConn.Database, dataConn.UserName, dataConn.Password)

	connection, err := conn.Connect()
	if err != nil {
		return nil, nil, nil, nil, err
	}

	query := d.parseQuery(connection.NewQuery(), dataDS.QueryInfo)
	return dataDS, dataConn, connection, query, nil
}

func (d *DataSourceController) parseQuery(query dbox.IQuery, queryInfo toolkit.M) dbox.IQuery {
	if qFrom := queryInfo.Get("from", "").(string); qFrom != "" {
		query = query.From(qFrom)
	}
	if qSelect := queryInfo.Get("select", "").(string); qSelect != "" {
		if qSelect == "*" {
			query = query.Select()
		} else {
			query = query.Select(strings.Split(qSelect, ",")...)
		}
	}
	if _, qTakeOK := queryInfo["take"]; qTakeOK {
		qTake, _ := strconv.Atoi(queryInfo.Get("take").(string))
		query = query.Take(qTake)
	}
	if _, qSkipOK := queryInfo["skip"]; qSkipOK {
		qSkip, _ := strconv.Atoi(queryInfo.Get("skip").(string))
		query = query.Skip(qSkip)
	}
	if qOrder := queryInfo.Get("order", "").(string); qOrder != "" {
		qOrderPart := strings.Split(qOrder, ",")
		if len(qOrderPart) == 1 {
			query = query.Order(qOrderPart[0])
		} else if len(qOrderPart) == 2 {
			query = query.Order(qOrderPart[0], qOrderPart[1])
		}
	}

	return query
}

/** CONNECTION LIST */

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
	_id := payload["_id"].(string)

	dataDS, _, conn, query, err := d.connectToDataSource(_id)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer conn.Close()

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

		lookup := new(colonycore.Lookup)
		lookup.LookupFields = []string{}

		meta := new(colonycore.FieldInfo)
		meta.ID = key
		meta.Label = label
		meta.Type, _ = helper.GetBetterType(val)
		meta.Format = ""
		meta.Lookup = lookup

		metadata = append(metadata, meta)
	}

	dataDS.MetaData = metadata

	err = colonycore.Save(dataDS)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, dataDS, "")
}

func (d *DataSourceController) FetchDataSourceSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	_id := payload["_id"].(string)

	dataDS, _, conn, query, err := d.connectToDataSource(_id)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer conn.Close()

	if _, isTakeOK := dataDS.QueryInfo["take"]; !isTakeOK {
		query = query.Take(15)
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	data := []toolkit.M{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if len(data) == 0 {
		return helper.CreateResult(false, nil, "No data found")
	}

	metadata := []*colonycore.FieldInfo{}
	for key, val := range data[0] {
		label := key

		lookup := new(colonycore.Lookup)
		lookup.LookupFields = []string{}

		meta := new(colonycore.FieldInfo)
		meta.ID = key
		meta.Label = label
		meta.Type, _ = helper.GetBetterType(val)
		meta.Format = ""
		meta.Lookup = lookup

		metadata = append(metadata, meta)
	}

	result := toolkit.M{"metadata": metadata, "data": data}
	return helper.CreateResult(true, result, "")
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

	needToFetchMetaData := false

	if o.ID == "" {
		// set new ID while inserting fresh new data
		o.ID = helper.RandomIDWithPrefix("ds")
		needToFetchMetaData = true
	} else {
		oldDS := new(colonycore.DataSource)
		colonycore.Get(oldDS, o.ID)

		oldQuery, _ := json.Marshal(oldDS.QueryInfo)
		newQuery, _ := json.Marshal(o.QueryInfo)

		if oldDS.ConnectionID != o.ConnectionID || string(oldQuery) != string(newQuery) {
			needToFetchMetaData = true
		}

		if len(oldDS.MetaData) == 0 {
			needToFetchMetaData = true
		}
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	result := toolkit.M{"data": o, "needTofetchMetaData": needToFetchMetaData}
	return helper.CreateResult(true, result, "")
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
