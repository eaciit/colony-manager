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

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	data, err := new(colonycore.Page).Get(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, data, "")
}

func (p *PageController) SavePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	page := new(colonycore.Page)
	err := r.GetPayload(&page)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := page.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, page, "")
}

func (p *PageController) SaveDesigner(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	page := new(colonycore.Page)
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	page.ID = payload["_id"].(string)
	page.DataSources = payload["dataSources"].([]string)
	page.ParentMenu = payload["parentMenu"].(string)
	page.Widget = payload["widget"].([]*colonycore.WidgetPage)
	page.Title = payload["title"].(string)
	page.URL = payload["url"].(string)
	page.ThemeColor = payload["themeColor"].(string)

	page.SendFiles(EC_DATA_PATH, payload["serverId"].(string))

	if err := page.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, page, "")
}

func (p *PageController) EditPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.Page{}
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
		o := new(colonycore.Page)
		o.ID = id.(string)
		if err := o.Delete(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
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
