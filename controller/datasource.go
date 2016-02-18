package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type DataSourceController struct {
	App
}

type MetaSave struct {
	keyword string
	data    string
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
	supportedDrivers := "mongo mysql weblink"

	if !strings.Contains(supportedDrivers, driver) {
		drivers := strings.Replace(supportedDrivers, " ", ", ", -1)
		return errors.New("Currently tested driver is only " + drivers)
	}

	return nil
}

func (d *DataSourceController) ConnectToDataSource(_id string) (*colonycore.DataSource, *colonycore.Connection, dbox.IConnection, dbox.IQuery, MetaSave, error) {
	dataDS := new(colonycore.DataSource)
	err := colonycore.Get(dataDS, _id)
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, dataDS.ConnectionID)
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	query, metaSave := d.parseQuery(connection.NewQuery(), dataDS.QueryInfo)
	return dataDS, dataConn, connection, query, metaSave, nil
}
func (d *DataSourceController) filterParse(where toolkit.M) *dbox.Filter {
	field := where.Get("field", "").(string)
	value := fmt.Sprintf("%v", where["value"])

	if key := where.Get("key", "").(string); key == "Eq" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Eq(field, valueInt)
		} else {
			return dbox.Eq(field, value)
		}
	} else if key == "Ne" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Ne(field, valueInt)
		} else {
			return dbox.Ne(field, value)
		}
	} else if key == "Lt" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Lt(field, valueInt)
		} else {
			return dbox.Lt(field, value)
		}
	} else if key == "Lte" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Lte(field, valueInt)
		} else {
			return dbox.Lte(field, value)
		}
	} else if key == "Gt" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Gt(field, valueInt)
		} else {
			return dbox.Gt(field, value)
		}
	} else if key == "Gte" {
		valueInt, errv := strconv.Atoi(fmt.Sprintf("%v", where["value"]))
		if errv == nil {
			return dbox.Gte(field, valueInt)
		} else {
			return dbox.Gte(field, value)
		}
	} else if key == "In" {
		valueArray := []interface{}{}
		for _, e := range strings.Split(value, ",") {
			valueArray = append(valueArray, strings.Trim(e, ""))
		}
		return dbox.In(field, valueArray...)
	} else if key == "Nin" {
		valueArray := []interface{}{}
		for _, e := range strings.Split(value, ",") {
			valueArray = append(valueArray, strings.Trim(e, ""))
		}
		return dbox.Nin(field, valueArray...)
	} else if key == "Contains" {
		return dbox.Contains(field, value)
	} else if key == "Or" {
		subs := where.Get("value", []interface{}{}).([]interface{})
		filtersToMerge := []*dbox.Filter{}
		for _, eachSub := range subs {
			eachWhere, _ := toolkit.ToM(eachSub)
			filtersToMerge = append(filtersToMerge, d.filterParse(eachWhere))
		}
		return dbox.Or(filtersToMerge...)
	} else if key == "And" {
		subs := where.Get("value", []interface{}{}).([]interface{})
		filtersToMerge := []*dbox.Filter{}
		for _, eachSub := range subs {
			eachWhere, _ := toolkit.ToM(eachSub)
			filtersToMerge = append(filtersToMerge, d.filterParse(eachWhere))
		}
		return dbox.And(filtersToMerge...)
	}

	return nil
}

func (d *DataSourceController) parseQuery(query dbox.IQuery, queryInfo toolkit.M) (dbox.IQuery, MetaSave) {
	metaSave := MetaSave{}

	if qFrom := queryInfo.Get("from", "").(string); qFrom != "" {
		query = query.From(qFrom)
	}
	if qSelect := queryInfo.Get("select", "").(string); qSelect != "" {
		if qSelect != "*" {
			query = query.Select(strings.Split(qSelect, ",")...)
		}
	}
	if qTakeRaw, qTakeOK := queryInfo["take"]; qTakeOK {
		if qTake, ok := qTakeRaw.(float64); ok {
			query = query.Take(int(qTake))
		}
		if qTake, ok := qTakeRaw.(int); ok {
			query = query.Take(qTake)
		}
	}
	if qSkipRaw, qSkipOK := queryInfo["skip"]; qSkipOK {
		if qSkip, ok := qSkipRaw.(float64); ok {
			query = query.Take(int(qSkip))
		}
		if qSkip, ok := qSkipRaw.(int); ok {
			query = query.Take(qSkip)
		}
	}
	if qOrder := queryInfo.Get("order", "").(string); qOrder != "" {
		orderAll := map[string]string{}
		err := json.Unmarshal([]byte(qOrder), &orderAll)
		if err == nil {
			orderString := []string{}
			for key, val := range orderAll {
				orderString = append(orderString, key)
				orderString = append(orderString, val)
			}
			query = query.Order(orderString...)
		}
	}

	if qInsert := queryInfo.Get("insert", "").(string); qInsert != "" {
		if qInsert != "" {
			metaSave.keyword = "insert"
			metaSave.data = qInsert
			query = query.Insert()
		}
	}
	if qUpdate := queryInfo.Get("update", "").(string); qUpdate != "" {
		if qUpdate != "" {
			metaSave.keyword = "update"
			metaSave.data = qUpdate
			query = query.Update()
		}
	}
	if _, qDeleteOK := queryInfo["delete"]; qDeleteOK {
		metaSave.keyword = "delete"
		query = query.Delete()
	}
	if qCommand := queryInfo.Get("command", "").(string); qCommand != "" {
		command := map[string]interface{}{}
		err := json.Unmarshal([]byte(qCommand), &command)
		if err == nil {
			for key, value := range command {
				query = query.Command(key, value)
				break
			}
		}
	}

	if qWhere := queryInfo.Get("where", "").(string); qWhere != "" {
		whereAll := []map[string]interface{}{}
		err := json.Unmarshal([]byte(qWhere), &whereAll)
		if err == nil {
			allFilter := []*dbox.Filter{}

			for _, each := range whereAll {
				where, _ := toolkit.ToM(each)
				filter := d.filterParse(where)
				if filter != nil {
					allFilter = append(allFilter, filter)
				}
			}

			query = query.Where(allFilter...)
		}
	}

	return query, metaSave
}

/** CONNECTION LIST */

func (d *DataSourceController) SaveConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.Connection)
	o.ID = payload["_id"].(string)
	o.Driver = payload["Driver"].(string)
	o.Host = payload["Host"].(string)
	o.Database = payload["Database"].(string)
	o.UserName = payload["UserName"].(string)
	o.Password = payload["Password"].(string)
	o.Settings = d.parseSettings(payload["Settings"], map[string]interface{}{}).(map[string]interface{})

	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if o.Driver == "weblink" {
		fileType := helper.GetFileExtension(o.Host)
		fileLocation := fmt.Sprintf("%s.%s", filepath.Join(AppBasePath, "config", "etc", o.ID), fileType)
		file, err := os.Create(fileLocation)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer file.Close()

		resp, err := http.Get(o.Host)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer resp.Body.Close()

		_, err = io.Copy(file, resp.Body)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
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
	err := r.GetPayload(&payload)
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

func (d *DataSourceController) FindConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	//~ payload := map[string]string{"inputText":"tes","inputDrop":""}
	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	text := payload["inputText"].(string)
	pilih := payload["inputDrop"].(string)

	textLow := strings.ToLower(text)

	// == try useing Contains for support autocomplite
	var query *dbox.Filter
	if text != "" {
		query = dbox.Or(dbox.Contains("_id", text), dbox.Contains("_id", textLow), dbox.Contains("Database", text), dbox.Contains("Database", textLow), dbox.Contains("Driver", text), dbox.Contains("Driver", textLow), dbox.Contains("Host", text), dbox.Contains("Host", textLow), dbox.Contains("UserName", text), dbox.Contains("UserName", textLow), dbox.Contains("Password", text), dbox.Contains("Password", textLow))
	}

	if pilih != "" {
		query = dbox.And(query, dbox.Eq("Driver", pilih))
	}

	data := []colonycore.Connection{}
	cursor, err := colonycore.Find(new(colonycore.Connection), query)
	cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) SelectConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
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
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	ds := new(colonycore.DataSource)
	cursor, err := colonycore.Find(ds, dbox.Eq("ConnectionID", id))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	if cursor.Count() > 0 {
		return helper.CreateResult(false, nil, "Cannot delete connection because used on data source")
	}

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
	err := r.GetPayload(&payload)
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

	fakeDataConn := &colonycore.Connection{
		Database: database,
		Driver:   driver,
		Host:     host,
		UserName: username,
		Password: password,
		Settings: settings,
	}
	err = helper.ConnectUsingDataConn(fakeDataConn).CheckIfConnected()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

/** DATA SOURCE */

func (d *DataSourceController) FetchDataSourceMetaData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	connectionID := payload["connectionID"].(string)
	from := payload["from"].(string)

	if connectionID == "" {
		return helper.CreateResult(true, []toolkit.M{}, "")
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, connectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var conn dbox.IConnection
	conn, err = helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer conn.Close()

	var query = conn.NewQuery().Take(1)

	if dataConn.Driver != "weblink" {
		query = query.From(from)
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	data := toolkit.M{}
	if dataConn.Driver != "weblink" {
		err = cursor.Fetch(&data, 1, false)
	} else {
		dataAll := []toolkit.M{}
		err = cursor.Fetch(&dataAll, 1, false)
		if len(dataAll) > 0 {
			data = dataAll[0]
		}
	}

	metadata := d.parseMetadata(data)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, metadata, "")
}

func (d *DataSourceController) parseMetadata(data toolkit.M) []*colonycore.FieldInfo {
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

		switch toolkit.TypeName(val) {
		case "toolkit.M":
			meta.Type = "object"

			meta.Sub = d.parseMetadata(val.(toolkit.M))
		case "[]interface {}":
			meta.Type = "array"

			valArray := val.([]interface{})
			if len(valArray) > 0 {
				if toolkit.TypeName(valArray[0]) == "toolkit.M" {
					meta.Type = "array-objects"
					meta.Sub = d.parseMetadata(valArray[0].(toolkit.M))
				} else {
					switch target := toolkit.TypeName(valArray[0]); {
					case strings.Contains(target, "interface"):
					case strings.Contains(target, "string"):
						meta.Type = "array-string"
					case strings.Contains(target, "int"):
						meta.Type = "array-int"
					case strings.Contains(target, "float"):
					case strings.Contains(target, "double"):
						meta.Type = "array-double"
					default:
						meta.Type = "array-string"
					}
				}
			}
		}

		metadata = append(metadata, meta)
	}

	return metadata
}

func (d *DataSourceController) RunDataSourceQuery(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	_id := payload["_id"].(string)

	dataDS, _, conn, query, metaSave, err := d.ConnectToDataSource(_id)
	if len(dataDS.QueryInfo) == 0 {
		result := toolkit.M{"metadata": dataDS.MetaData, "data": []toolkit.M{}}
		return helper.CreateResult(true, result, "")
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer conn.Close()

	if metaSave.keyword != "" {
		if metaSave.data != "" {
			dataToSave := map[string]interface{}{}
			err = json.Unmarshal([]byte(metaSave.data), &dataToSave)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			err = query.Exec(toolkit.M{"data": dataToSave})
		} else {
			err = query.Exec(nil)
		}

		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		result := toolkit.M{"metadata": dataDS.MetaData, "data": []toolkit.M{}}
		return helper.CreateResult(true, result, "")
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

	result := toolkit.M{"metadata": dataDS.MetaData, "data": data}
	return helper.CreateResult(true, result, "")
}

func (d *DataSourceController) FetchDataSourceLookupData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	_id := payload["_id"].(string)
	lookupID := payload["lookupID"].(string)
	lookupData := payload["lookupData"].(string)

	dataDS := new(colonycore.DataSource)
	err = colonycore.Get(dataDS, _id)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, meta := range dataDS.MetaData {
		if meta.ID == lookupID {
			dataLookupDS, _, lookupConn, lookupQuery, metaSave, err := d.ConnectToDataSource(meta.Lookup.DataSourceID)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
			defer lookupConn.Close()

			_ = dataLookupDS
			_ = metaSave
			// if _, isTakeOK := dataLookupDS.QueryInfo["take"]; !isTakeOK {
			// 	lookupQuery = lookupQuery.Take(15)
			// }

			lookupCursor, err := lookupQuery.Cursor(nil)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
			defer lookupCursor.Close()

			lookupResultDataRaw := []toolkit.M{}
			err = lookupCursor.Fetch(&lookupResultDataRaw, 0, false)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			lookupResultData := []toolkit.M{}
			for _, each := range lookupResultDataRaw {
				if fmt.Sprintf("%v", each[meta.Lookup.IDField]) == lookupData {
					eachResult := toolkit.M{}

					if len(meta.Lookup.LookupFields) == 0 {
						valueDisplayField := helper.ForceAsString(each, meta.Lookup.DisplayField)
						eachResult.Set(meta.Lookup.DisplayField, valueDisplayField)
					} else {
						for _, lookupField := range meta.Lookup.LookupFields {
							valueDisplayField := helper.ForceAsString(each, lookupField)
							eachResult.Set(lookupField, valueDisplayField)
						}
					}

					lookupResultData = append(lookupResultData, eachResult)
				}
			}

			lookupResultColumns := []string{meta.Lookup.DisplayField}
			if len(meta.Lookup.LookupFields) > 0 {
				lookupResultColumns = meta.Lookup.LookupFields
			}

			result := toolkit.M{"data": lookupResultData, "columns": lookupResultColumns}
			return helper.CreateResult(true, result, "")
		}
	}

	result := toolkit.M{"data": []toolkit.M{}, "columns": []toolkit.M{}}
	return helper.CreateResult(true, result, "")
}

func (d *DataSourceController) SaveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
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
	o.ConnectionID = payload["ConnectionID"].(string)
	o.QueryInfo = queryInfo
	o.MetaData = []*colonycore.FieldInfo{}

	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if payload["MetaData"] != nil {
		metadataString := payload["MetaData"].(string)

		if metadataString != "" {
			metadata := []*colonycore.FieldInfo{}
			json.Unmarshal([]byte(metadataString), &metadata)

			o.MetaData = metadata
		}
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, o, "")
}

func (d *DataSourceController) GetDataSources(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
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
	err := r.GetPayload(&payload)
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

func (d *DataSourceController) FindDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	text := payload["inputText"].(string)
	textLow := strings.ToLower(text)

	// == try useing Contains for support autocomplite
	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", text), dbox.Contains("_id", textLow), dbox.Contains("ConnectionID", text), dbox.Contains("ConnectionID", textLow))

	data := []colonycore.DataSource{}
	cursor, err := colonycore.Find(new(colonycore.DataSource), query)
	cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// == bug, i dont know what i can to do if find by database name.==
	//~ if data == nil {
	//~ query = dbox.Eq("Database",text)
	//~ data := []colonycore.Connection{}
	//~ cursor, err := colonycore.Find(new(colonycore.Connection), query)
	//~ cursor.Fetch(&data, 0, false)
	//~ if err != nil {
	//~ return helper.CreateResult(false, nil, err.Error())
	//~ }
	//~ fmt.Printf("========asdasd=======%#v",data)
	//~ }

	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (d *DataSourceController) RemoveDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["_id"].(string)

	dg := new(colonycore.DataGrabber)
	filter := dbox.Or(dbox.Eq("DataSourceOrigin", id), dbox.Eq("DataSourceDestination", id))
	cursor, err := colonycore.Find(dg, filter)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	if cursor.Count() > 0 {
		return helper.CreateResult(false, nil, "Cannot delete data source because used on data grabber")
	}

	o := new(colonycore.DataSource)
	o.ID = id
	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataSourceController) RemoveMultipleDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		dg := new(colonycore.DataGrabber)
		filter := dbox.Or(dbox.Eq("DataSourceOrigin", id.(string)), dbox.Eq("DataSourceDestination", id.(string)))
		cursor, err := colonycore.Find(dg, filter)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer cursor.Close()

		if cursor.Count() > 0 {
			return helper.CreateResult(false, nil, "Cannot delete data source because used on data grabber")
		}

		o := new(colonycore.DataSource)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataSourceController) RemoveMultipleConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		ds := new(colonycore.DataSource)
		cursor, err := colonycore.Find(ds, dbox.Eq("ConnectionID", id.(string)))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer cursor.Close()

		if cursor.Count() > 0 {
			return helper.CreateResult(false, nil, "Cannot delete connection because used on data source")
		}

		o := new(colonycore.Connection)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataSourceController) GetDataSourceCollections(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	connectionID := payload["connectionID"].(string)
	if connectionID == "" {
		return helper.CreateResult(true, []string{}, "")
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, connectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if dataConn.Driver == "weblink" {
		return helper.CreateResult(true, []string{"weblink"}, "")
	}

	var conn dbox.IConnection
	conn, err = helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer conn.Close()

	collections := conn.ObjectNames(dbox.ObjTypeAll)
	return helper.CreateResult(true, collections, "")
}
