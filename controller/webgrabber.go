package controller

import (
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/sedotan/sedotan.v1"
	"github.com/eaciit/sedotan/sedotan.v1/webapps/modules"
	"github.com/eaciit/toolkit"
	"path"
	f "path/filepath"
	"reflect"
	"strings"
	// "strconv"
	// "time"
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
	modules.HistoryPath = AppBasePath + toolkit.PathSeparator + f.Join("config", "webgrabber", "history") + toolkit.PathSeparator
	modules.HistoryRecPath = AppBasePath + toolkit.PathSeparator + f.Join("config", "webgrabber", "historyrec") + toolkit.PathSeparator
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

	module := modules.NewHistory(payload.ID)
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
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var data []toolkit.M

	if payload.Driver == "csv" {
		config := toolkit.M{"useheader": true, "delimiter": ","}
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

func (w *WebGrabberController) InsertSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	wg := new(colonycore.WebGrabber)
	wg.CallType = "POST"
	wg.DataSettings = []*colonycore.DataSetting{
		&colonycore.DataSetting{
			ColumnSettings: []*colonycore.ColumnSetting{
				&colonycore.ColumnSetting{Alias: "Contract", Index: 0, Selector: "td:nth-child(1)"},
				&colonycore.ColumnSetting{Alias: "Open", Index: 0, Selector: "td:nth-child(2)"},
				&colonycore.ColumnSetting{Alias: "High", Index: 0, Selector: "td:nth-child(3)"},
				&colonycore.ColumnSetting{Alias: "Low", Index: 0, Selector: "td:nth-child(4)"},
				&colonycore.ColumnSetting{Alias: "Close", Index: 0, Selector: "td:nth-child(5)"},
				&colonycore.ColumnSetting{Alias: "Prev Settle", Index: 0, Selector: "td:nth-child(6)"},
				&colonycore.ColumnSetting{Alias: "Prev Settle", Index: 0, Selector: "td:nth-child(7)"},
				&colonycore.ColumnSetting{Alias: "Settle", Index: 0, Selector: "td:nth-child(8)"},
				&colonycore.ColumnSetting{Alias: "Chg", Index: 0, Selector: "td:nth-child(9)"},
				&colonycore.ColumnSetting{Alias: "Volume", Index: 0, Selector: "td:nth-child(10)"},
				&colonycore.ColumnSetting{Alias: "OI", Index: 0, Selector: "td:nth-child(11)"},
				&colonycore.ColumnSetting{Alias: "OI Chg", Index: 0, Selector: "td:nth-child(12)"},
				&colonycore.ColumnSetting{Alias: "Turnover", Index: 0, Selector: "td:nth-child(13)"},
			},
			ConnectionInfo: &colonycore.ConnectionInfo{
				Collection: "irondcecom",
				Database:   "valegrab",
				Host:       "localhost:27017",
			},
			DestinationType: "mongo",
			Name:            "GoldTab01",
			RowSelector:     "table .table tbody tr",
			RowDeleteCondition: toolkit.M{
				"$or": []toolkit.M{
					toolkit.M{"Contract": "Contract"},
					toolkit.M{"Contract": "Iron Ore Subtotal"},
					toolkit.M{"Contract": "Total"},
				},
			},
		},
	}
	wg.GrabConfiguration = toolkit.M{
		"data": toolkit.M{
			"Pu00231_Input.trade_date": 2.0151214e+07,
			"Pu00231_Input.trade_type": 0,
			"Pu00231_Input.variety":    "i",
			"Submit":                   "Go",
			"action":                   "Pu00231_result",
		},
	}
	wg.GrabInterval = 20
	wg.IntervalType = "seconds"
	wg.LogConfiguration = &colonycore.LogConfiguration{
		FileName:    "LOG-GRABDCE",
		FilePattern: "20060102",
		LogPath:     path.Join(AppBasePath, "config", "webgrabber", "log"),
	}
	wg.ID = "irondcecomcn"
	wg.IDBackup = "irondcecomcn"
	wg.SourceType = "SourceType_Http"
	wg.TimeoutInterval = 5
	wg.URL = "http://www.dce.com.cn/PublicWeb/MainServlet"

	colonycore.Save(wg)

	return helper.CreateResult(true, wg, "")
}
