package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"path/filepath"
	"strings"
)

type WidgetController struct {
	App
}

func CreateWidgetController(s *knot.Server) *WidgetController {
	var controller = new(WidgetController)
	controller.Server = s
	return controller
}

func (w *WidgetController) GetDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data, err := helper.GetDataSourceQuery()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (w *WidgetController) GetWidget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	data, err := new(colonycore.Widget).Get(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, data, "")
}

func (w *WidgetController) FetchDataSource(ids string) error {
	toolkit.Println("payload : ", ids)
	_ids := strings.Split(ids, ",")
	for _, _id := range _ids {
		getFunc := DataSourceController{}
		dataDS, _, _, query, _, err := getFunc.ConnectToDataSource(_id)
		if err != nil {
			return err
		}
		if len(dataDS.QueryInfo) == 0 {
			continue
		}

		cursor, err := query.Cursor(nil)
		if err != nil {
			return err
		}
		defer cursor.Close()

		data := []toolkit.M{}

		err = cursor.Fetch(&data, 0, false)
		if err != nil {
			return err
		}
		toolkit.Println(data)
	}

	return nil
}

func (w *WidgetController) SaveWidget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	compressedSource := filepath.Join(EC_DATA_PATH, "widget")

	err, fileName := helper.UploadHandler(r, "userfile", compressedSource)

	if r.Request.FormValue("mode") != "editor" {
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	widget := new(colonycore.Widget)
	widget.ID = r.Request.FormValue("_id")
	widget.Title = r.Request.FormValue("title")
	datasource := r.Request.FormValue("dataSourceId")
	// widget.DataSourceID = strings.Split(datasource, ",")
	widget.Description = r.Request.FormValue("description")

	if err := w.FetchDataSource(datasource); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := widget.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := widget.ExtractFile(compressedSource, fileName); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, widget, "")
}

func (w *WidgetController) EditWidget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.Widget{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := data.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (w *WidgetController) RemoveWidget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		o := new(colonycore.Widget)
		o.ID = id.(string)
		if err := o.Delete(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}
