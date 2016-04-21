package controller

import (
	//"bufio"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
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
	data, err := ioutil.ReadFile("D:/GoW/src/github.com/eaciit/colony-app/data-root/widget/widget1/index.html")
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(data))
	u := string(data)
	return u
}
