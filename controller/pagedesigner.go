package controller

import (

	// "fmt"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "strings"
	// "regexp"
	// "io/ioutil"
	// "path/filepath"
)

type PageDesignerController struct {
	App
}

func CreatePageDesignerController(s *knot.Server) *PageDesignerController {
	var controller = new(PageDesignerController)
	controller.Server = s
	return controller
}

// func (p *PageDesignerController) FetchDataSource(ids []string) (toolkit.Ms, error) {
// 	widgetData := toolkit.Ms{}
// 	for _, _id := range ids {
// 		data, err := helper.FetchDataFromDS(_id, 0)
// 		if err != nil {
// 			return nil, err
// 		}
// 		datasourcewidget := toolkit.M{}
// 		datasourcewidget.Set("Data", data)
// 		widgetData = append(widgetData, datasourcewidget)
// 	}

// 	return widgetData, nil
// }

// func (p *PageDesignerController) GetAllFields(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson
// 	type DSMap struct {
// 		ID     string   `json:"_id"`
// 		Fields []string `json:"fields"`
// 	}
// 	payload := toolkit.M{}
// 	if err := r.GetPayload(&payload); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	var data = []DSMap{}
// 	var _data = DSMap{}
// 	for _, ds := range payload.Get("datasource", "").([]interface{}) {
// 		tm, err := toolkit.ToM(ds)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}
// 		_data.ID = tm.Get("dsWidget", "").(string)
// 		_data.Fields, err = helper.GetFieldsFromDS(tm.Get("dsColony", "").(string))
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}
// 		data = append(data, _data)
// 	}
// 	widgetSource := filepath.Join(EC_DATA_PATH, "widget", payload.Get("widgetId", "").(string))
// 	getFileIndex, err := colonycore.GetWidgetPath(widgetSource)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	widgetPath := filepath.Join(getFileIndex, "config-widget.html")
// 	content, err := ioutil.ReadFile(widgetPath)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	contentstring := string(content)
// 	/*get widget data*/
// 	dataWidget := new(colonycore.Widget)
// 	dataWidget.ID = payload.Get("widgetId", "").(string)
// 	err = dataWidget.GetById()
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	newData := toolkit.M{}
// 	newData.Set("fieldDs", data)
// 	newData.Set("container", contentstring)
// 	newData.Set("pageId", payload.Get("pageId", "").(string))
// 	newData.Set("url", dataWidget.URL)
// 	return helper.CreateResult(true, newData, "")
// }

// func (p *PageDesignerController) GetDataSource(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	data, err := helper.GetDataSourceQuery()
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, data, "")
// }

func (p *PageDesignerController) GetPages(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := new(colonycore.Page).GetPages(payload["search"])
	return helper.CreateResult(true, data, "")
}

func (p *PageDesignerController) SelectPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Page)
	if err := r.GetPayload(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	page := new(colonycore.Page)
	if err := colonycore.Get(page, payload.ID); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	pageDetail := new(colonycore.PageDetail)
	pageDetail.ID = payload.ID
	pageDetailRes, err := pageDetail.Get()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := toolkit.M{"page": page, "pageDetail": pageDetailRes}
	fmt.Println(pageDetailRes)
	return helper.CreateResult(true, data, "")
}

func (p *PageDesignerController) SavePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.PageDetail)
	if err := r.GetPayload(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := payload.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

// func (p *PageDesignerController) EditPage(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	data := colonycore.MapPage{}
// 	if err := r.GetPayload(&data); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	if err := data.GetById(); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, data, "")
// }

func (p *PageDesignerController) RemovePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		IDs []string `json:"ids"`
	}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, id := range payload.IDs {
		o := new(colonycore.PageDetail)
		o.ID = id

		if err := o.Remove(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (p *PageDesignerController) GetWidgetPageConfig(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		WidgetID    string    `json:"widgetId"`
		DataSources toolkit.M `json:"dataSource"`
	}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var windgetContent string
	widgetBasePath := filepath.Join(EC_DATA_PATH, "widget", payload.WidgetID)
	err := filepath.Walk(widgetBasePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if info.Name() == "config-widget.html" {
			bytes, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}

			windgetContent = string(bytes)
		}

		return nil
	})
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataSourceFieldsMap := toolkit.M{}
	for key, val := range payload.DataSources {
		dataSource := val.(string)
		fields, _ := helper.GetFieldsFromDS(dataSource)
		dataSourceFieldsMap[key] = toolkit.M{
			"dataSource": dataSource,
			"fields":     fields,
		}
	}

	result := toolkit.M{}
	result.Set("container", windgetContent)
	result.Set("widgetBasePath", fmt.Sprintf("/%s/", payload.WidgetID))
	result.Set("dataSourceFieldsMap", dataSourceFieldsMap)

	return helper.CreateResult(true, result, "")
}

// func (p *PageDesignerController) SaveConfigPage(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := toolkit.M{}
// 	err := r.GetPayload(&payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	if err := new(colonycore.Page).Save(payload, true, ""); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, payload, "")
// }

// func (p *PageDesignerController) SaveDesigner(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := toolkit.M{}
// 	err := r.GetPayload(&payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	payload.Set("mode", "save widget")
// 	if err := new(colonycore.Page).Save(payload, true, ""); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, payload, "")
// }

// func (p *PageDesignerController) EditPageDesigner(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := toolkit.M{}
// 	data := colonycore.Page{}
// 	if err := r.GetPayload(&payload); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	data.ID = payload.Get("_id", "").(string)

// 	if payload.Get("mode", "").(string) != "" {
// 		data.Save(payload, true, filepath.Join(EC_DATA_PATH, "widget"))
// 	}
// 	if err := data.GetById(); err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, data, "")
// }

/*func (p *PageDesignerController) PreviewExample(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := toolkit.M{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	widgetSource := filepath.Join(EC_DATA_PATH, "widget", data.Get("_id", "").(string))

	getFileIndex, err := colonycore.GetPath(widgetSource)
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
	widgetData, err := new(WidgetController).FetchDataSources(dataSourceArry)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	previewData := toolkit.M{}
	previewData.Set("container", contentstring)
	previewData.Set("dataSource", widgetData)

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

		if err := dataWidget.Save(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, previewData, "")
}*/

func (p *PageDesignerController) PageView(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	ID := payload["title"].(string)

	gv := new(colonycore.PageDetail)
	gv.ID = ID
	data, err := gv.Get()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "success")
}
func (p *PageDesignerController) ReadFileStyle(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	file, _, err := r.Request.FormFile("file")
	if err != nil {
		return helper.CreateResult(false, nil, "success")
	}

	var result string
	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	result = string(bytes)

	return helper.CreateResult(true, result, "success")
}
