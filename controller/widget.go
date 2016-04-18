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

func (w *WidgetController) FetchDataSources(ids string) (toolkit.Ms, error) {
	widgetData := toolkit.Ms{}
	_ids := strings.Split(ids, ",")
	for _, _id := range _ids {
		data, err := helper.FetchDataFromDS(_id, 0)
		if err != nil {
			return nil, err
		}
		datasourcewidget := toolkit.M{}
		datasourcewidget.Set("Data", data)
		widgetData = append(widgetData, datasourcewidget)
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

	widget.DataSourceId = strings.Split(datasource, ",")

	widgetConfig := toolkit.Ms{}
	if fileName != "" {
		widget.URL = w.Server.Address
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
		widget.URL = data.URL
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
	widgetSource := filepath.Join(EC_DATA_PATH, "widget", data.Get("_id", "").(string))

	getFileIndex, err := colonycore.GetWidgetPath(widgetSource)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	widgetPath := filepath.Join(getFileIndex, "index.html")

	content, err := ioutil.ReadFile(widgetPath)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	contentstring := string(content)

	var datasource []string
	for _, val := range data.Get("dataSource").([]interface{}) {
		datasource = append(datasource, val.(string))
	}

	dataSourceArry := strings.Join(datasource, ",")
	widgetData, err := w.FetchDataSources(dataSourceArry)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	widget := new(colonycore.Widget)
	widget.ID = data.GetString("_id")
	if err := widget.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	previewData := toolkit.M{}
	previewData.Set("container", contentstring)
	previewData.Set("dataSource", widgetData)
	previewData.Set("widgetBasePath", strings.Replace(getFileIndex, EC_DATA_PATH+toolkit.PathSeparator+"widget", "", -1))
	previewData.Set("settings", widget.Config)

	if data.Get("mode", "").(string) == "save" {
		dataWidget := colonycore.Widget{}
		dataWidget.ID = data.Get("_id", "").(string)
		if err := dataWidget.GetById(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		dataWidget.DataSourceId = datasource

		configs := toolkit.Ms{}
		for _, val := range data.Get("config", "").([]interface{}) {
			configs = append(configs, val.(map[string]interface{}))
		}
		dataWidget.Config = configs
		// dataWidget.URL = w.Server.Address

		if err := dataWidget.Save(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, previewData, "")
}

func (p *WidgetController) GetWidgetSetting(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		PageID   string `json:"pageID"`
		WidgetID string `json:"widgetID"`
	}{}

	widget := new(colonycore.Widget)
	widget.ID = payload.WidgetID

	if err := colonycore.Get(widget, widget.ID); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	res, err := widget.GetConfigWidget()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, res, "")
}
