package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	modelWebgrabber "github.com/eaciit/colony-manager/model/webgrabber"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type WebGrabberController struct {
	App
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	var controller = new(WebGrabberController)
	controller.Server = s
	return controller
}

func (w *WebGrabberController) GetScrapperData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursor, err := colonycore.Find(new(colonycore.WebGrabber), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.WebGrabber{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) FetchContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	param := toolkit.M{} //.Set("formvalues", payload.Parameter)
	res, err := toolkit.HttpCall(payload.URL, payload.CallType, nil, param)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := toolkit.HttpContentString(res)
	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) StartStopScrapper(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.WebGrabber)
	err = colonycore.Get(o, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var grab *modelWebgrabber.GrabService

	if o.SourceType == "SourceType_Http" {
		grab, err = modelWebgrabber.PrepareGrabConfigForHTML(o)
	} else if o.SourceType == "SourceType_DocExcel" {
		grab, err = modelWebgrabber.PrepareGrabConfigForDoc(o)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err, isServerRunning := modelWebgrabber.StartService(grab)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, []interface{}{o, grab, isServerRunning}, "")
}

// func (w *WebGrabberController) Stat(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := new(colonycore.WebGrabber)
// 	err := r.GetPayload(payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	o := new(colonycore.WebGrabber)
// 	err = colonycore.Get(o, payload.ID)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	// grabService := module.NewGrabService()
// 	// grabStatus := grab.CheckStat(ds)

// 	return helper.CreateResult(true, grabStatus, "")
// }

func (w *WebGrabberController) InsertSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	wg := modelWebgrabber.InsertGrabberSampleData()
	return helper.CreateResult(true, wg, "")
}
