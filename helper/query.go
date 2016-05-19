package helper

import (
	"errors"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/json"
	_ "github.com/eaciit/dbox/dbc/jsons"
	_ "github.com/eaciit/dbox/dbc/mongo"
	// _ "github.com/eaciit/dbox/dbc/mssql"
	"github.com/eaciit/colony-core/v0"
	_ "github.com/eaciit/dbox/dbc/csv"
	_ "github.com/eaciit/dbox/dbc/csvs"
	_ "github.com/eaciit/dbox/dbc/hive"
	_ "github.com/eaciit/dbox/dbc/jdbc"
	_ "github.com/eaciit/dbox/dbc/mysql"
	// _ "github.com/eaciit/dbox/dbc/odbc"
	"io"
	"net/http"
	"os"
	"path/filepath"
	// _ "github.com/eaciit/dbox/dbc/oracle"
	// _ "github.com/eaciit/dbox/dbc/postgres"
	"encoding/json"
	"fmt"
	"github.com/eaciit/toolkit"
	"strconv"
	"strings"
)

type queryWrapper struct {
	ci         *dbox.ConnectionInfo
	connection dbox.IConnection
	err        error
}

type MetaSave struct {
	keyword string
	data    string
}

func Query(driver string, host string, other ...interface{}) *queryWrapper {
	var driverSett string
	if driver == "mysql" && !strings.Contains(host, ":") {
		host = fmt.Sprintf("%s:3306", host)
	}

	wrapper := queryWrapper{}
	wrapper.ci = &dbox.ConnectionInfo{host, "", "", "", nil}

	if len(other) > 0 {
		wrapper.ci.Database = other[0].(string)
	}
	if len(other) > 1 {
		wrapper.ci.UserName = other[1].(string)
	}
	if len(other) > 2 {
		wrapper.ci.Password = other[2].(string)
	}
	if len(other) > 3 {
		wrapper.ci.Settings = other[3].(toolkit.M)
	}

	if driver == "odbc" {
		driverSett = wrapper.ci.Settings.GetString("connector")
	} else if driver == "jdbc" {
		driverSett = strings.Split(wrapper.ci.Settings.GetString("connector"), ":")[0]
	} else {
		driverSett = driver
	}

	wrapper.connection, wrapper.err = dbox.NewConnection(driverSett, wrapper.ci)
	if wrapper.err != nil {
		return &wrapper
	}

	wrapper.err = wrapper.connection.Connect()
	if wrapper.err != nil {
		return &wrapper
	}

	return &wrapper
}

func (c *queryWrapper) CheckIfConnected() error {
	return c.err
}

func (c *queryWrapper) Connect() (dbox.IConnection, error) {
	if c.err != nil {
		return nil, c.err
	}

	return c.connection, nil
}

func (c *queryWrapper) SelectOne(tableName string, clause ...*dbox.Filter) (toolkit.M, error) {
	if c.err != nil {
		return nil, c.err
	}

	connection := c.connection
	defer connection.Close()

	query := connection.NewQuery().Select().Take(1)
	if tableName != "" {
		query = query.From(tableName)
	}
	if len(clause) > 0 {
		query = query.Where(clause[0])
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, errors.New("No data found")
	}

	return data[0], nil
}

func (c *queryWrapper) Delete(tableName string, clause *dbox.Filter) error {
	if c.err != nil {
		return c.err
	}

	connection := c.connection
	defer connection.Close()

	query := connection.NewQuery().Delete()
	if tableName != "" {
		query = query.From(tableName)
	}

	err := query.Where(clause).Exec(nil)
	if err != nil {
		return err
	}

	return nil
}

func (c *queryWrapper) SelectAll(tableName string, clause ...*dbox.Filter) ([]toolkit.M, error) {
	if c.err != nil {
		return nil, c.err
	}

	connection := c.connection
	defer connection.Close()

	query := connection.NewQuery().Select()
	if tableName != "" {
		query = query.From(tableName)
	}
	if len(clause) > 0 {
		query = query.Where(clause[0])
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close()

	data := make([]toolkit.M, 0)
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (c *queryWrapper) Save(tableName string, payload map[string]interface{}, clause ...*dbox.Filter) error {
	if c.err != nil {
		return c.err
	}

	connection := c.connection
	defer connection.Close()

	query := connection.NewQuery()
	if tableName != "" {
		query = query.From(tableName)
	}

	if len(clause) == 0 {
		err := query.Insert().Exec(toolkit.M{"data": payload})
		if err != nil {
			return err
		}

		return nil
	} else {
		err := query.Update().Where(clause[0]).Exec(toolkit.M{"data": payload})
		if err != nil {
			return err
		}

		return nil
	}

	return errors.New("nothing changes")
}

func ConnectUsingDataConn(dataConn *colonycore.Connection) *queryWrapper {
	if toolkit.HasMember([]string{"json", "jsons", "csv", "csvs"}, dataConn.Driver) && strings.HasPrefix(dataConn.Host, "http") {

		if toolkit.IsFileExist(dataConn.FileLocation) || dataConn.FileLocation == "" {
			fileTempID := RandomIDWithPrefix("f")
			fileType := GetFileExtension(dataConn.Host)
			dataConn.FileLocation = fmt.Sprintf("%s.%s", filepath.Join(os.Getenv("EC_DATA_PATH"), "datasource", "upload", fileTempID), fileType)

			file, err := os.Create(dataConn.FileLocation)
			if err != nil {
				os.Remove(dataConn.FileLocation)
			} else {
				defer file.Close()
			}

			resp, err := http.Get(dataConn.Host)
			if err != nil {
				os.Remove(dataConn.FileLocation)
			} else {
				defer resp.Body.Close()
			}

			_, err = io.Copy(file, resp.Body)
			if err != nil {
				os.Remove(dataConn.FileLocation)
			}

			colonycore.Save(dataConn)
		}

		return Query(dataConn.Driver, dataConn.FileLocation, "", "", "", dataConn.Settings)
	}

	return Query(dataConn.Driver, dataConn.Host, dataConn.Database, dataConn.UserName, dataConn.Password, dataConn.Settings)
}

func GetDataSourceQuery() ([]colonycore.DataSource, error) {
	var query *dbox.Filter
	cursor, err := colonycore.Find(new(colonycore.DataSource), query)
	if err != nil {
		return nil, err
	}

	data := []colonycore.DataSource{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return nil, err
	}
	newdata := []colonycore.DataSource{}
	for _, val := range data {
		if val.QueryInfo.Has("select") {
			newdata = append(newdata, val)
		}
	}
	defer cursor.Close()

	return newdata, nil
}

func checkIfDriverIsSupported(driver string) error {
	supportedDrivers := "mongo mysql json csv jsons csvs hive odbc jdbc"

	if !strings.Contains(supportedDrivers, driver) {
		drivers := strings.Replace(supportedDrivers, " ", ", ", -1)
		return errors.New("Currently tested driver is only " + drivers)
	}

	return nil
}

func ConnectToDataSource(_id string) (*colonycore.DataSource, *colonycore.Connection, dbox.IConnection, dbox.IQuery, MetaSave, error) {
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

	if err := checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	connection, err := ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	query, metaSave := ParseQuery(connection.NewQuery(), dataDS.QueryInfo)
	return dataDS, dataConn, connection, query, metaSave, nil
}

func FetchDataFromDS(_id string, fetch int) (toolkit.Ms, error) {
	return FetchDataFromDSWithFilter(_id, fetch, nil)
}

func FetchDataFromDSWithFilter(_id string, fetch int, filter toolkit.M) (toolkit.Ms, error) {
	dataDS, _, _, query, _, err := ConnectToDataSource(_id)
	if err != nil {
		return nil, err
	}
	if len(dataDS.QueryInfo) == 0 {
		return nil, errors.New("data source has no query info")
	}

	if filter != nil {
		whereQuery := []toolkit.M{}

		if dataDS.QueryInfo.GetString("where") != "" {
			where := []toolkit.M{}
			err = json.Unmarshal([]byte(dataDS.QueryInfo.GetString("where")), &where)
			if err != nil {
				return nil, err
			}

			for _, eachWhere := range where {
				isFound := false
				for _, each := range filter.Get("fields").([]string) {
					if each == eachWhere.GetString("field") && !isFound {
						isFound = true
					}
				}
				if !isFound {
					whereQuery = append(whereQuery, eachWhere)
				}
			}
		}

		for _, each := range filter.Get("fields").([]string) {
			whereQuery = append(whereQuery, toolkit.M{
				"key":   "Contains",
				"field": each,
				"value": filter.Get("value"),
			})
		}

		bts, err := json.Marshal(whereQuery)
		if err != nil {
			return nil, err
		}
		whereString := string(bts)

		dataDS.QueryInfo.Set("where", whereString)
		query, _ = ParseQuery(query, dataDS.QueryInfo)
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close()

	data := toolkit.Ms{}
	if err := cursor.Fetch(&data, fetch, false); err != nil {
		return nil, err
	}
	return data, nil
}

func GetFieldsFromDS(_id string) ([]string, error) {
	dataFetch, err := FetchDataFromDS(_id, 1)
	if err != nil {
		return nil, err
	}

	var fields []string
	for i, val := range dataFetch {
		if i > 0 {
			break
		}
		for field := range val {
			fields = append(fields, field)
		}
	}
	return fields, nil
}

func ParseQuery(query dbox.IQuery, queryInfo toolkit.M) (dbox.IQuery, MetaSave) {
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
				filter := FilterParse(where)
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

func FilterParse(where toolkit.M) *dbox.Filter {
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
			filtersToMerge = append(filtersToMerge, FilterParse(eachWhere))
		}
		return dbox.Or(filtersToMerge...)
	} else if key == "And" {
		subs := where.Get("value", []interface{}{}).([]interface{})
		filtersToMerge := []*dbox.Filter{}
		for _, eachSub := range subs {
			eachWhere, _ := toolkit.ToM(eachSub)
			filtersToMerge = append(filtersToMerge, FilterParse(eachWhere))
		}
		return dbox.And(filtersToMerge...)
	}

	return nil
}
