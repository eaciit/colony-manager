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

var (
	sorter       string
	querypattern = []string{"*", "!", ".."}
	ds_rdbms     = []string{"mysql", "mssql", "oracle", "postgres"}
	ds_flatfile  = []string{"csv", "csvs", "json", "jsons", "xlsx"}
)

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

		value := each["value"].(string)
		if temp := strings.TrimSpace(strings.ToLower(each["value"].(string))); temp == "false" || temp == "true" {
			settings[each["key"].(string)], _ = strconv.ParseBool(temp)
		} else {
			if number, err := strconv.Atoi(temp); err == nil {
				settings[each["key"].(string)] = number
			} else {
				settings[each["key"].(string)] = value
			}
		}
	}

	return settings
}

func (d *DataSourceController) checkIfDriverIsSupported(driver string) error {
	supportedDrivers := "mongo mysql json csv jsons csvs hive"

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

func (d *DataSourceController) ConnectToDataSourceDB(payload toolkit.M) (int, []toolkit.M, *colonycore.DataBrowser, error) {
	var hasLookup bool
	toolkit.Println("payload : ", payload)
	if payload.Has("haslookup") {
		hasLookup = payload.Get("haslookup").(bool)
	}
	_id := toolkit.ToString(payload.Get("browserid", ""))
	sort := payload.Get("sort")
	search := payload.Get("search")
	_ = search
	take := toolkit.ToInt(payload.Get("take", ""), toolkit.RoundingAuto)
	skip := toolkit.ToInt(payload.Get("skip", ""), toolkit.RoundingAuto)

	TblName := toolkit.M{}
	payload.Unset("browserid")
	//sorter = ""
	if sort != nil {
		tmsort, _ := toolkit.ToM(sort.([]interface{})[0])
		fmt.Printf("====== sort %#v\n", tmsort["dir"])
		if tmsort["dir"] == "asc" {
			sorter = tmsort["field"].(string)
		} else if tmsort["dir"] == "desc" {
			sorter = "-" + tmsort["field"].(string)
		} else if tmsort["dir"] == nil {
			sorter = " "
		}
	} else {
		sorter = " "
	}

	dataDS := new(colonycore.DataBrowser)
	err := colonycore.Get(dataDS, _id)
	if err != nil {
		return 0, nil, nil, err
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, dataDS.ConnectionID)
	if err != nil {
		return 0, nil, nil, err
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return 0, nil, nil, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return 0, nil, nil, err
	}

	if dataDS.QueryType == "" {
		TblName.Set("from", dataDS.TableNames)
		payload.Set("from", dataDS.TableNames)
	} else if dataDS.QueryType == "Dbox" {
		getTableName := toolkit.M{}
		toolkit.UnjsonFromString(dataDS.QueryText, &getTableName)
		payload.Set("from", getTableName.Get("from").(string))

		if qSelect := getTableName.Get("select", "").(string); qSelect != "" {
			payload.Set("select", getTableName.Get("select").(string))
		}
	} else if dataDS.QueryType == "SQL" {
		var QueryString string
		if dataConn.Driver == "mysql" || dataConn.Driver == "hive" {
			QueryString = " LIMIT " + toolkit.ToString(take) + " OFFSET " + toolkit.ToString(skip)
		} else if dataConn.Driver == "mssql" {
			QueryString = " OFFSET " + toolkit.ToString(skip) + " ROWS FETCH NEXT " +
				toolkit.ToString(take) + " ROWS ONLY "

		} else if dataConn.Driver == "postgres" {
			QueryString = " LIMIT " + toolkit.ToString(take) +
				" OFFSET " + toolkit.ToString(skip)
		}
		stringQuery := toolkit.Sprintf("%s %s", dataDS.QueryText, QueryString)
		payload.Set("freetext", stringQuery)
		// toolkit.Println(stringQuery)
	}

	qcount, _ := d.parseQuery(connection.NewQuery(), TblName)
	query, _ := d.parseQuery(connection.NewQuery() /*.Skip(skip).Take(take) .Order(sorter)*/, payload)

	var selectfield string
	for _, metadata := range dataDS.MetaData {
		tField := metadata.Field
		if payload.Has(tField) {
			selectfield = toolkit.ToString(tField)
			if toolkit.IsSlice(payload[tField]) {
				query = query.Where(dbox.In(tField, payload[tField].([]interface{})...))
				qcount = qcount.Where(dbox.In(tField, payload[tField].([]interface{})...))
			} else if !toolkit.IsNilOrEmpty(payload[tField]) {
				var hasPattern bool
				for _, val := range querypattern {
					if strings.Contains(toolkit.ToString(payload[tField]), val) {
						hasPattern = true
					}
				}
				if hasPattern {
					query = query.Where(dbox.ParseFilter(toolkit.ToString(tField), toolkit.ToString(payload[tField]),
						toolkit.ToString(metadata.DataType), ""))
					qcount = qcount.Where(dbox.ParseFilter(toolkit.ToString(tField), toolkit.ToString(payload[tField]),
						toolkit.ToString(metadata.DataType), ""))
				} else {
					switch toolkit.ToString(metadata.DataType) {
					case "int":
						query = query.Where(dbox.Eq(tField, toolkit.ToInt(payload[tField], toolkit.RoundingAuto)))
						qcount = qcount.Where(dbox.Eq(tField, toolkit.ToInt(payload[tField], toolkit.RoundingAuto)))
					case "float32":
						query = query.Where(dbox.Eq(tField, toolkit.ToFloat32(payload[tField], 2, toolkit.RoundingAuto)))
						qcount = qcount.Where(dbox.Eq(tField, toolkit.ToFloat32(payload[tField], 2, toolkit.RoundingAuto)))
					case "float64":
						query = query.Where(dbox.Eq(tField, toolkit.ToFloat64(payload[tField], 2, toolkit.RoundingAuto)))
						qcount = qcount.Where(dbox.Eq(tField, toolkit.ToFloat64(payload[tField], 2, toolkit.RoundingAuto)))
					default:
						query = query.Where(dbox.Contains(tField, toolkit.ToString(payload[tField])))
						qcount = qcount.Where(dbox.Contains(tField, toolkit.ToString(payload[tField])))
					}
				}
			}
		}
	}

	if hasLookup && selectfield != "" {
		if toolkit.HasMember(ds_flatfile, dataConn.Driver) {
			query = query.Select(selectfield)
			qcount = qcount.Select(selectfield)
		} else {
			query = query.Select(selectfield).Group(selectfield)
			qcount = qcount.Select(selectfield).Group(selectfield)
		}

	}

	ccount, err := qcount.Cursor(nil)
	if err != nil {
		return 0, nil, nil, err
	}
	defer ccount.Close()

	dcount := ccount.Count()

	cursor, err := query.Cursor(nil)
	if err != nil {
		return 0, nil, nil, err
	}
	defer cursor.Close()

	data := []toolkit.M{}
	cursor.Fetch(&data, 0, false)

	if err != nil {
		return 0, nil, nil, err
	}

	if hasLookup && selectfield != "" && !toolkit.HasMember(ds_rdbms, dataConn.Driver) &&
		!toolkit.HasMember(ds_flatfile, dataConn.Driver) {
		dataMongo := []toolkit.M{}
		for _, val := range data {
			mVal, _ := toolkit.ToM(val.Get("_id"))
			dataMongo = append(dataMongo, mVal)
		}
		data = dataMongo
	} else if hasLookup && selectfield != "" && toolkit.HasMember(ds_flatfile, dataConn.Driver) {
		/*distinct value for flat file*/
		dataFlat := []toolkit.M{}
		var existingVal = []string{""}
		for _, val := range data {
			valString := toolkit.ToString(val.Get(selectfield))
			if !toolkit.HasMember(existingVal, valString) {
				dataFlat = append(dataFlat, val)
				existingVal = append(existingVal, valString)
			}
		}
		data = dataFlat
	}

	return dcount, data, dataDS, nil
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
			query = query.Skip(int(qSkip))
		}
		if qSkip, ok := qSkipRaw.(int); ok {
			query = query.Skip(qSkip)
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

	if freeText := queryInfo.Get("freetext", "").(string); freeText != "" {
		query = query.Command("freequery", toolkit.M{}.
			Set("syntax", freeText))
		toolkit.Println(freeText)
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

	if toolkit.HasMember([]string{"csv", "json"}, o.Driver) {
		if strings.HasPrefix(o.Host, "http") {
			fileType := helper.GetFileExtension(o.Host)
			o.FileLocation = fmt.Sprintf("%s.%s", filepath.Join(EC_DATA_PATH, "datasource", "upload", o.ID), fileType)

			file, err := os.Create(o.FileLocation)
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
		} else {
			o.FileLocation = o.Host
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

	search := ""
	if payload["search"] != nil{
		search = payload["search"].(string)
	}

	driver := ""
	if payload["driver"] != nil{
		search = payload["driver"].(string)
	}

	// search := payload["search"]
	// driver := payload["driver"]

	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", search), dbox.Contains("Driver", search), dbox.Contains("Host", search), dbox.Contains("Database", search), dbox.Contains("UserName", search))

	if driver != "" {
		query = dbox.And(query, dbox.Eq("Driver", driver))
	}

	data := []colonycore.Connection{}
	cursor, err := colonycore.Find(new(colonycore.Connection), query)
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

	if driver == "json" || driver == "csv" {
		if strings.HasPrefix(host, "http") {
			fileTempID := helper.RandomIDWithPrefix("f")
			fileType := helper.GetFileExtension(host)
			fakeDataConn.FileLocation = fmt.Sprintf("%s.%s", filepath.Join(EC_DATA_PATH, "datasource", "upload", fileTempID), fileType)

			file, err := os.Create(fakeDataConn.FileLocation)
			if err != nil {
				os.Remove(fakeDataConn.FileLocation)
				return helper.CreateResult(false, nil, err.Error())
			}
			defer file.Close()

			resp, err := http.Get(host)
			if err != nil {
				os.Remove(fakeDataConn.FileLocation)
				return helper.CreateResult(false, nil, err.Error())
			}
			defer resp.Body.Close()

			_, err = io.Copy(file, resp.Body)
			if err != nil {
				os.Remove(fakeDataConn.FileLocation)
				return helper.CreateResult(false, nil, err.Error())
			}
		} else {
			fakeDataConn.FileLocation = host
		}
	}

	err = helper.ConnectUsingDataConn(fakeDataConn).CheckIfConnected()

	if fakeDataConn.FileLocation != "" && strings.HasPrefix(host, "http") {
		os.Remove(fakeDataConn.FileLocation)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

/** DATA SOURCE */

func (d *DataSourceController) DoFetchDataSourceMetaData(dataConn *colonycore.Connection, from string) (bool, []*colonycore.FieldInfo, error) {
	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return false, nil, err
	}

	var conn dbox.IConnection
	conn, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return false, nil, err
	}
	defer conn.Close()

	var query = conn.NewQuery().Take(1)

	if !toolkit.HasMember([]string{"csv", "json"}, dataConn.Driver) {
		query = query.From(from)
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return false, nil, err
	}
	defer cursor.Close()

	data := toolkit.M{}

	if !toolkit.HasMember([]string{"json", "mysql"}, dataConn.Driver) {
		err = cursor.Fetch(&data, 1, false)
	} else {
		dataAll := []toolkit.M{}
		err = cursor.Fetch(&dataAll, 1, false)
		if err != nil {
			return false, []*colonycore.FieldInfo{}, errors.New("No data found")
		}

		if len(dataAll) > 0 {
			data = dataAll[0]
		}
	}

	metadata := d.parseMetadata(data)

	if err != nil {
		return false, nil, err
	}

	return true, metadata, nil
}

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

	res, data, err := d.DoFetchDataSourceMetaData(dataConn, from)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(res, data, "")
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
		meta.Type = "string"

		if val != nil {
			if toolkit.TypeName(val) == "map[string]interface {}" {
				val, _ = toolkit.ToM(val)
			}

			switch toolkit.TypeName(val) {
			case "toolkit.M":
				meta.Type = "object"

				meta.Sub = d.parseMetadata(val.(toolkit.M))
			case "[]interface {}":
				meta.Type = "array"

				valArray := val.([]interface{})

				if len(valArray) > 0 {
					if toolkit.TypeName(valArray[0]) == "map[string]interface {}" {
						valArray[0], _ = toolkit.ToM(valArray[0])
					}

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

	take := 10
	if totalData := cursor.Count(); totalData < take && totalData > 0 {
		take = totalData
	}
	if dataDS.QueryInfo.Has("take") {
		take = 0
	}

	data := []toolkit.M{}
	err = cursor.Fetch(&data, take, false)
	if err != nil {
		cursor.ResetFetch()
		err = cursor.Fetch(&data, 0, false)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
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

func (d *DataSourceController) FetchDataSourceSubData(r *knot.WebContext) interface{} {
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
			dataLookupDS, _, lookupConn, lookupQuery, metaSave, err := d.ConnectToDataSource(_id)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
			defer lookupConn.Close()

			_ = dataLookupDS
			_ = metaSave

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
				if fmt.Sprintf("%v", each["_id"]) == lookupData {
					datas := toolkit.M{"data": each[lookupID]}
					return helper.CreateResult(true, datas, "")
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

	search := payload["search"].(string)

	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", search), dbox.Contains("ConnectionID", search))

	cursor, err := colonycore.Find(new(colonycore.DataSource), query)
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

	if toolkit.HasMember([]string{"csv", "json"}, dataConn.Driver) {
		return helper.CreateResult(true, []string{dataConn.Driver}, "")
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
