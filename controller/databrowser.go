package controller

import (
	// "encoding/json"
	// "errors"
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "io"
	// "net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	// "strings"
)

type DataBrowserController struct {
	App
}

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

	if err := colonycore.Delete(payload); err != nil {
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

	conn, err := d.connToDatabase(data.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	query := d.parseQuery(conn, data)

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	dataFetch := toolkit.M{}
	err = cursor.Fetch(&dataFetch, 1, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	metadata := []*colonycore.StructInfo{}
	x := 1
	for keyField, _ := range dataFetch {
		sInfo := &colonycore.StructInfo{}
		sInfo.Field = keyField
		sInfo.Label = keyField
		sInfo.Format = ""
		sInfo.Align = "Left"
		sInfo.ShowIndex = int32(toolkit.ToInt(x, toolkit.RoundingAuto))
		sInfo.Sortable = false
		sInfo.SimpleFilter = false
		sInfo.AdvanceFilter = false
		sInfo.Aggregate = ""
		metadata = append(metadata, sInfo)
		x++
	}
	// toolkit.Printf("metadata:%v\n", toolkit.JsonString(metadata))
	data.MetaData = metadata
	return helper.CreateResult(true, data, "")
}

func (d *DataBrowserController) connToDatabase(_id string) (dbox.IConnection, error) {
	// var query dbox.IQuery

	dataConn := new(colonycore.Connection)
	err := colonycore.Get(dataConn, _id)
	if err != nil {
		return nil, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, err
	}

	return connection, nil
}

func (d *DataBrowserController) parseQuery(conn dbox.IConnection, dbrowser colonycore.DataBrowser) dbox.IQuery {
	var dataQuery dbox.IQuery
	if dbrowser.QueryType == "nonQueryText" {
		result := toolkit.M{}
		toolkit.UnjsonFromString(dbrowser.QueryText, &result)
		if qFrom := result.Get("from", "").(string); qFrom != "" {
			dataQuery = conn.NewQuery().From(qFrom)
		}
	}
	return dataQuery
}

func (d *DataBrowserController) DetailDB(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	result := toolkit.M{}

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	id := payload["id"].(string)

	getFunc := DataSourceController{}
	data, dataDS, err := getFunc.ConnectToDataSourceDB(id)

	result.Set("DataValue", data)
	result.Set("dataresult", dataDS)

	return helper.CreateResult(true, result, "")
}
