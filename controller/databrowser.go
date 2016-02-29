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
	tk "github.com/eaciit/toolkit"
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

func (d *DataBrowserController) DetailDB(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	result := tk.M{}

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

