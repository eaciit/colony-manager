package controller

import (
	//"bufio"
	"fmt"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	//"github.com/eaciit/dbox"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type PageController struct {
	App
}

func CreatePageController(s *knot.Server) *PageController {
	var controller = new(PageController)
	controller.Server = s
	return controller
}

func (p *PageController) PageView(r *knot.WebContext) interface{} {
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

func (p *PageController) ReadingPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	data, err := ioutil.ReadFile("D:/GoW/src/github.com/eaciit/colony-app/data-root/widget/widget1/index.html")
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(data))
	u := string(data)
	return helper.CreateResult(true, nil, u)
}

func (p *PageController) LoadWidgetPageContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		ID       string `json:"_id"`
		PageID   string `json:"pageID"`
		WidgetID string `json:"widgetID"`
	}{}

	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	pageData := new(colonycore.PageDetail)
	pageData.ID = payload.PageID
	pageData, err := pageData.Get()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	indexPath := ""
	widgetpath := filepath.Join(EC_DATA_PATH, "widget", payload.WidgetID)
	err = filepath.Walk(widgetpath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if info.Name() == "index.html" {
			indexPath = path
		}

		return nil
	})
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if indexPath == "" {
		return helper.CreateResult(false, nil, "windgets contains no index.html")
	}

	byts, err := ioutil.ReadFile(indexPath)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	widgetData := new(colonycore.Widget)
	widgetData.ID = payload.WidgetID
	if err := colonycore.Get(widgetData, widgetData.ID); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	widgetPageData := new(colonycore.WidgetPage)
	for _, widget := range pageData.Widgets {
		if widget.ID == payload.ID {
			widgetPageData = widget
			break
		}
	}

	data := struct {
		PageData       *colonycore.PageDetail
		WidgetData     *colonycore.Widget
		WidgetPageData *colonycore.WidgetPage
		Content        string
	}{
		pageData,
		widgetData,
		widgetPageData,
		string(byts),
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) LoadWidgetPageData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := []toolkit.M{}

	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	result := toolkit.M{}

	for _, each := range payload {
		filter := each.GetString("filter")
		namespace := each.GetString("namespace")
		fields := each.Get("fields").([]string)
		dsID := each.GetString("value")

		opt := toolkit.M{"fields": fields, "value": filter}
		data, err := helper.FetchDataFromDSWithFilter(dsID, 0, opt)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		result.Set(namespace, data)
	}

	return helper.CreateResult(true, result, "")
}

// func (p *PageController) RunWidget(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := map[string]interface{}{}
// 	err := r.GetPayload(&payload)

// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	_id := payload["_id"].(string)

//dataDS, _, _conn, query, _metaSave, err := new(DataSourceController).ConnectToDataSource(_id)
// 	fmt.Println("-------- ", metaSave)
// 	fmt.Println("-------- ", conn)
// 	if len(dataDS.QueryInfo) == 0 {
// 		result := toolkit.M{"metadata": dataDS.MetaData, "data": []toolkit.M{}}
// 		return helper.CreateResult(true, result, "")
// 	}

// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	cursor, err := query.Cursor(nil)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	defer cursor.Close()

// 	data := []toolkit.M{}
// 	err = cursor.Fetch(&data, 0, false)
// 	if err != nil {
// 		cursor.ResetFetch()
// 		err = cursor.Fetch(&data, 0, false)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}
// 	}

// 	result := toolkit.M{"metadata": dataDS.MetaData, "data": data}
// 	return helper.CreateResult(true, result, "")
// }
