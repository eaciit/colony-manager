package controller

import (
	// "encoding/json"
	"errors"
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "gopkg.in/mgo.v2/bson"
	// "reflect"
	// "io"
	// "net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	"strings"
)

type DataBrowserController struct {
	App
}

var rdbms = []string{"mysql", "mssql", "oracle", "postgres"}

func CreateDataBrowserController(s *knot.Server) *DataBrowserController {
	var controller = new(DataBrowserController)
	controller.Server = s
	return controller
}

func (d *DataBrowserController) GetBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	search := payload["search"].(string)
	// search = ""

	var query *dbox.Filter

	if search != "" {
		query = dbox.Contains("BrowserName", search)
	}

	data := []colonycore.DataBrowser{}
	cursor, err := colonycore.Find(new(colonycore.DataBrowser), query)
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

func (d *DataBrowserController) SaveBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataBrowser)
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataBrowserController) DeleteBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		ds := new(colonycore.DataBrowser)
		cursor, err := colonycore.Find(ds, dbox.Eq("ID", id.(string)))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer cursor.Close()

		if cursor.Count() > 0 {
			return helper.CreateResult(false, nil, "Cannot delete DataBrowser because used on data source")
		}

		o := new(colonycore.DataBrowser)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataBrowserController) GetDesignView(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataBrowser)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, payload, "")
}

func (d *DataBrowserController) TestQuery(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.DataBrowser{} //map[string]interface{}{}
	err := r.GetPayload(&data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	conn, datacon, err := d.connToDatabase(data.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	query, err := d.parseQuery(conn, data, datacon)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	dataFetch := []toolkit.M{}
	if datacon.Driver == "mongo" {
		result := toolkit.M{}
		err = cursor.Fetch(&result, 1, false)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		dataFetch = append(dataFetch, result)
	} else {
		err = cursor.Fetch(&dataFetch, 1, false)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	metadata := []*colonycore.StructInfo{}
	// var dt string
	for i, dataFields := range dataFetch {
		if i > 0 {
			break
		}

		j := 1
		for keyField, dataField := range dataFields {
			if strings.Contains(keyField, "id") && !strings.Contains(data.QueryText, "id") {
				continue
			}
			sInfo := &colonycore.StructInfo{}
			sInfo.Field = keyField
			sInfo.Label = keyField

			rf := "string"

			if dataField != nil {
				rf = toolkit.TypeName(dataField)

				if rf == "time.Time" {
					rf = "date"
				}
			}
			// toolkit.Println(dataField, ">", rf)
			// if rf == "bson.ObjectId" {
			// 	dt = dataField.(bson.ObjectId).Hex()
			// }
			sInfo.DataType = rf

			sInfo.Format = ""
			sInfo.Align = "Left"
			sInfo.ShowIndex = toolkit.ToInt(j, toolkit.RoundingAuto)
			sInfo.Sortable = false
			sInfo.SimpleFilter = false
			sInfo.AdvanceFilter = false
			sInfo.Aggregate = ""
			metadata = append(metadata, sInfo)
			j++
		}
	}

	data.MetaData = metadata

	return helper.CreateResult(true, data, "")
}

func (d *DataBrowserController) connToDatabase(_id string) (dbox.IConnection, *colonycore.Connection, error) {
	dataConn := new(colonycore.Connection)
	err := colonycore.Get(dataConn, _id)
	if err != nil {
		return nil, nil, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, nil, err
	}

	return connection, dataConn, nil
}

func (d *DataBrowserController) parseQuery(conn dbox.IConnection, dbrowser colonycore.DataBrowser, datacon *colonycore.Connection) (dbox.IQuery, error) {
	var dataQuery dbox.IQuery

	// result := toolkit.M{}
	// toolkit.UnjsonFromString(dbrowser.QueryText, &result)
	if dbrowser.QueryType == "nonQueryText" {
		dataQuery = conn.NewQuery().From(dbrowser.TableNames)
	} else if dbrowser.QueryType == "SQL" {
		if toolkit.HasMember(rdbms, datacon.Driver) {
			dataQuery = conn.NewQuery().Command("freequery", toolkit.M{}.
				Set("syntax", dbrowser.QueryText))
		} else {
			return nil, errors.New("Free Text Query with SQL only for RDBMS, please use Dbox")
		}
	} else if dbrowser.QueryType == "Dbox" {
		queryInfo := toolkit.M{}
		toolkit.UnjsonFromString(dbrowser.QueryText, &queryInfo)
		toolkit.Println("queryinfo", queryInfo)

		if qFrom := queryInfo.Get("from", "").(string); qFrom != "" {
			dataQuery = conn.NewQuery()
			dataQuery = dataQuery.From(qFrom)
		}
		if qSelect := queryInfo.Get("select", "").(string); qSelect != "" {
			if qSelect != "*" {
				dataQuery = dataQuery.Select(strings.Split(qSelect, ",")...)
			}
		}
	}
	return dataQuery, nil
}

func (d *DataBrowserController) DetailDB(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	result := toolkit.M{}

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	getFunc := DataSourceController{}
	count, data, dataDS, err := getFunc.ConnectToDataSourceDB(payload)

	result.Set("DataCount", count)
	result.Set("DataValue", data)
	result.Set("dataresult", dataDS)
	toolkit.Printf("result:%v\n", toolkit.JsonString(result))
	return helper.CreateResult(true, result, "")
}
