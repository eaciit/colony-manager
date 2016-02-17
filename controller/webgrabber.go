package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/sedotan/sedotan.v1"
	"github.com/eaciit/sedotan/sedotan.v1/webapps/modules"
	"github.com/eaciit/toolkit"
	// "os"
	"path"
	f "path/filepath"
	"reflect"
	"strconv"
	"strings"
	// "time"
)

type WebGrabberController struct {
	App
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	fmt.Println("")
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
	if err := r.GetPayload(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	payload.LogConfiguration.FileName = "LOG-" + payload.ID
	payload.LogConfiguration.LogPath = f.Join(AppBasePath, "config", "webgrabber", "log") + toolkit.PathSeparator
	payload.LogConfiguration.FilePattern = "20060102"

	for i, each := range payload.DataSettings {
		if each.DestinationType == "csv" {
			payload.DataSettings[i].ConnectionInfo.Host = path.Join(AppBasePath, "config", "webgrabber", "output", each.ConnectionInfo.FileName)
			payload.DataSettings[i].ConnectionInfo.Settings = toolkit.M{
				"delimiter": each.ConnectionInfo.Delimiter,
				"useheader": each.ConnectionInfo.UseHeader,
				"newfile":   true,
			}
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

func (w *WebGrabberController) InsertSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := []*colonycore.WebGrabber{}

	func() {
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
			LogPath:     path.Join(AppBasePath, "config", "webgrabber", "log") + toolkit.PathSeparator,
		}
		wg.ID = "irondcecomcn"
		wg.IDBackup = "irondcecomcn"
		wg.SourceType = "SourceType_Http"
		wg.TimeoutInterval = 5
		wg.URL = "http://www.dce.com.cn/PublicWeb/MainServlet"

		colonycore.Save(wg)
		data = append(data, wg)
	}()

	func() {
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
					FileName:  "GoldTab01.csv",
					Delimiter: ",",
					UseHeader: true,
					Host:      path.Join(AppBasePath, "config", "webgrabber", "output", "GoldTab01.csv"),
					Settings: toolkit.M{
						"delimiter": ",",
						"useheader": true,
						"newfile":   true,
					},
				},
				DestinationType: "csv",
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
			FileName:    "LOG-testCSV",
			FilePattern: "20060102",
			LogPath:     path.Join(AppBasePath, "config", "webgrabber", "log") + toolkit.PathSeparator,
		}
		wg.ID = "testCSV"
		wg.IDBackup = "testCSV"
		wg.SourceType = "SourceType_Http"
		wg.TimeoutInterval = 5
		wg.URL = "http://www.dce.com.cn/PublicWeb/MainServlet"

		colonycore.Save(wg)
		data = append(data, wg)
	}()

	return helper.CreateResult(true, data, "")
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
