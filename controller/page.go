package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"path/filepath"
)

type PageController struct {
	App
}

func CreatePageController(s *knot.Server) *PageController {
	var controller = new(PageController)
	controller.Server = s
	return controller
}

func (p *PageController) GetFieldsFromDS(_id string) ([]string, error) {
	dataFetch, err := new(WidgetController).FetchDataFromDS(_id, 1)
	if err != nil {
		return nil, err
	}

	var fields []string
	for _, val := range dataFetch {
		for field, _ := range val {
			fields = append(fields, field)
		}
	}
	return fields, nil
}

func (p *PageController) FetchDataSource(ids []string) (toolkit.Ms, error) {
	widgetData := toolkit.Ms{}
	for _, _id := range ids {
		data, err := new(WidgetController).FetchDataFromDS(_id, 0)
		if err != nil {
			return nil, err
		}
		datasourcewidget := toolkit.M{}
		datasourcewidget.Set("Data", data)
		widgetData = append(widgetData, datasourcewidget)
	}

	return widgetData, nil
}

func (p *PageController) GetAllFields(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	var err error

	type DSMap struct {
		ID     string   `json:"_id"`
		Fields []string `json:"fields"`
	}
	payload := []map[string]string{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	var data = []DSMap{}
	var _data = DSMap{}
	for _, ds := range payload {
		_data.ID = ds["dsWidget"]
		_data.Fields, err = p.GetFieldsFromDS(ds["dsColony"])
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		data = append(data, _data)
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) GetDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data, err := helper.GetDataSourceQuery()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) GetPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	data, err := new(colonycore.MapPage).Get(payload["search"])
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, data, "")
}

func (p *PageController) SavePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := new(colonycore.MapPage).Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (p *PageController) EditPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.MapPage{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := data.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) RemovePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		o := new(colonycore.MapPage)
		o.ID = id.(string)
		if err := o.Delete(filepath.Join(EC_APP_PATH, "config", "pages")); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (p *PageController) SaveDesigner(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := new(colonycore.Page).Save(payload, true); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (p *PageController) PreviewExample(r *knot.WebContext) interface{} {
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
	return helper.CreateResult(true, contentstring, "")
}
