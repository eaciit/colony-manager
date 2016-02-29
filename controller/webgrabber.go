package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sedotan/sedotan.v1/webapps/modules"
	"github.com/eaciit/sedotan/sedotan.v2"
	"github.com/eaciit/toolkit"
	f "path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"
)

var (
	wgLogPath        string = f.Join(EC_DATA_PATH, "webgrabber", "log") + toolkit.PathSeparator
	wgHistoryPath    string = f.Join(EC_DATA_PATH, "webgrabber", "history") + toolkit.PathSeparator
	wgHistoryRecPath string = f.Join(EC_DATA_PATH, "webgrabber", "historyrec") + toolkit.PathSeparator
	wgOutputPath     string = f.Join(EC_DATA_PATH, "webgrabber", "output") + toolkit.PathSeparator
)

type WebGrabberController struct {
	App
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	var controller = new(WebGrabberController)
	controller.Server = s
	return controller
}

func (w *WebGrabberController) PrepareHistoryPath() {
	modules.HistoryPath = wgHistoryPath
	modules.HistoryRecPath = wgHistoryRecPath
}

func (w *WebGrabberController) GetScrapperData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	requesttype := payload["requesttype"].(string)
	sourcetype := payload["sourcetype"].(string)

	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", search))

	if requesttype != "" {
		query = dbox.And(query, dbox.Eq("grabconf.calltype", requesttype))
	}

	if sourcetype != "" {
		query = dbox.And(query, dbox.Eq("sourcetype", sourcetype))
	}

	cursor, err := colonycore.Find(new(colonycore.WebGrabber), query)
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

func (w *WebGrabberController) SelectScrapperData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (w *WebGrabberController) SaveScrapperData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	payload.LogConf.FileName = "LOG-" + payload.ID
	payload.LogConf.LogPath = wgLogPath
	payload.LogConf.FilePattern = sedotan.DateToString(time.Now())

	payload.HistConf.FileName = "HIST-" + payload.ID
	payload.HistConf.Histpath = wgHistoryPath
	payload.HistConf.RecPath = wgHistoryRecPath

	for i, each := range payload.DataSettings {
		if each.DestType == "csv" {
			payload.DataSettings[i].ConnectionInfo.Host = f.Join(wgOutputPath, payload.ID)
		}
	}

	if err := colonycore.Delete(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (w *WebGrabberController) FetchContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		URL      string
		Method   string
		Payloads toolkit.M
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	res, err := toolkit.HttpCall(payload.URL, payload.Method, nil, payload.Payloads)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := toolkit.HttpContentString(res)
	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) StartService(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o, err := toolkit.ToM(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err, isRun := modules.Process([]interface{}{o})
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(isRun, nil, "")
}

func (w *WebGrabberController) StopService(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o, err := toolkit.ToM(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err, isRun := modules.StopProcess([]interface{}{o})
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(isRun, nil, "")
}

func (w *WebGrabberController) Stat(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o, err := toolkit.ToM(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	grabStatus := modules.NewGrabService().CheckStat([]interface{}{o})
	return helper.CreateResult(true, grabStatus, "")
}

func (w *WebGrabberController) GetHistory(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	module := modules.NewHistory(payload.HistConf.FileName)
	history := module.OpenHistory()
	if reflect.ValueOf(history).Kind() == reflect.String {
		if strings.Contains(history.(string), "Cannot Open File") {
			return helper.CreateResult(false, nil, "Cannot Open File")
		}
	}

	return helper.CreateResult(true, history, "")
}

func (w *WebGrabberController) GetFetchedData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := struct {
		Driver     string
		Host       string
		Database   string
		Collection string
		Username   string
		Password   string

		FileName  string
		UseHeader bool
		Delimiter string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var data []toolkit.M

	if payload.Driver == "csv" {
		config := toolkit.M{"useheader": payload.UseHeader, "delimiter": payload.Delimiter}
		query := helper.Query("csv", payload.Host, "", "", "", config)
		data, err = query.SelectAll("")
	} else {
		query := helper.Query("mongo", payload.Host, payload.Database, payload.Username, payload.Password)
		data, err = query.SelectAll(payload.Collection)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (w *WebGrabberController) GetLog(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := struct {
		ID   string `json:"_id"`
		Date string `json:"date"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	wg := new(colonycore.WebGrabber)
	err = colonycore.Get(wg, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o, err := toolkit.ToM(wg)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	history := modules.NewHistory(payload.ID)
	logs := history.GetLog([]interface{}{o}, payload.Date)

	return helper.CreateResult(true, logs, "")
}

func (w *WebGrabberController) RemoveGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (w *WebGrabberController) RemoveMultipleWebGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	w.PrepareHistoryPath()

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		o := new(colonycore.WebGrabber)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (d *WebGrabberController) FindWebGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	//~ payload := map[string]string{"inputText": "GRAB_TEST", "inputRequest": "", "inputType": ""}
	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	text := payload["inputText"].(string)
	req := payload["inputRequest"].(string)
	tipe := payload["inputType"].(string)

	textLow := strings.ToLower(text)

	// == bug, cant find if autocomplite, just full text can be get result
	var query *dbox.Filter
	if text != "" {
		valueInt, errv := strconv.Atoi(text)
		if errv == nil {
			// == try useing Eq for support integer
			query = dbox.Or(dbox.Eq("GrabInterval", valueInt), dbox.Eq("TimeoutInterval", valueInt))
		} else {
			// == try useing Contains for support autocomplite
			query = dbox.Or(dbox.Contains("_id", text), dbox.Contains("_id", textLow), dbox.Contains("Calltype", text), dbox.Contains("Calltype", textLow), dbox.Contains("SourceType", text), dbox.Contains("SourceType", textLow), dbox.Contains("IntervalType", text), dbox.Contains("IntervalType", textLow))
		}
	}

	if req != "" {
		query = dbox.And(query, dbox.Eq("Calltype", req))
	}

	if tipe != "" {
		query = dbox.And(query, dbox.Eq("SourceType", tipe))
	}

	data := []colonycore.WebGrabber{}
	cursor, err := colonycore.Find(new(colonycore.WebGrabber), query)
	cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, payload, "")
}

func (d *WebGrabberController) GetConnections(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := []colonycore.Connection{}
	cursor, err := colonycore.Find(new(colonycore.Connection), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}
