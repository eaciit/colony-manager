package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"path/filepath"
	"strings"
)

type WidgetController struct {
	App
}

var (
	compressedSource = filepath.Join(EC_DATA_PATH, "widget")
)

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

func (w *WidgetController) FetchDataSource(ids string) (*colonycore.Widget, error) {
	widgetData := &colonycore.Widget{}
	_ids := strings.Split(ids, ",")
	for _, _id := range _ids {
		getFunc := DataSourceController{}
		dataDS, _, _, query, _, err := getFunc.ConnectToDataSource(_id)
		if err != nil {
			return nil, err
		}
		if len(dataDS.QueryInfo) == 0 {
			continue
		}

		cursor, err := query.Cursor(nil)
		if err != nil {
			return nil, err
		}
		defer cursor.Close()

		data := []toolkit.M{}

		err = cursor.Fetch(&data, 0, false)
		if err != nil {
			return nil, err
		}
		datasourcewidget := &colonycore.DataSourceWidget{}
		datasourcewidget.ID = _id
		datasourcewidget.Data = data
		widgetData.DataSource = append(widgetData.DataSource, datasourcewidget)
	}

	return widgetData, nil
}

func (w *WidgetController) SaveWidget(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	err, fileName := helper.UploadHandler(r, "userfile", compressedSource)
	if r.Request.FormValue("mode") != "editor" {
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	widget := new(colonycore.Widget)
	widget.ID = r.Request.FormValue("_id")
	widget.Title = r.Request.FormValue("title")
	datasource := r.Request.FormValue("dataSourceId")
	widget.Description = r.Request.FormValue("description")

	widgetData, err := w.FetchDataSource(datasource)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	widget.DataSource = widgetData.DataSource

	widgetConfig := toolkit.Ms{}
	if fileName != "" {
		widgetConfig, err = widget.ExtractFile(compressedSource, fileName)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		widget.Config = widgetConfig
	}

	if r.Request.FormValue("mode") == "editor" && fileName == "" {
		data := colonycore.Widget{}
		data.ID = widget.ID
		data.GetById()
		widget.Config = data.Config
	}

	if err := widget.Save(); err != nil {
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
		if err := o.Delete(compressedSource); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (w *WidgetController) PreviewExample(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := toolkit.M{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	widgetSource := filepath.Join(EC_DATA_PATH, "widget")
	widgetPath := filepath.Join(widgetSource, data.Get("_id", "").(string), "index.html")

	contentstring := ""
	content, err := ioutil.ReadFile(widgetPath)
	if err != nil {
		toolkit.Println("Error : ", err)
		contentstring = ""
	} else {
		contentstring = string(content)
	}
	// toolkit.Println(contentstring)
	return helper.CreateResult(true, contentstring, "")
}
