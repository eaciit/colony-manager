package controller

import (
	//"bufio"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
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

func (p *PageController) LoadWidgetIndex(r *knot.WebContext) interface{} {
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
	pageInfo, err := pageData.Get()
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

	widgetData := new(colonycore.WidgetPage)

	for _, widget := range pageInfo.Widgets {
		if widget.ID == payload.ID {
			widgetData = widget
			break
		}
	}

	data := struct {
		PageData   *colonycore.PageDetail
		WidgetData *colonycore.WidgetPage
		IndexFile  string
	}{pageInfo, widgetData, string(byts)}

	return helper.CreateResult(false, data, "")
}
