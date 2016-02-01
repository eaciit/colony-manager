package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	modelWebgrabber "github.com/eaciit/colony-manager/model/webgrabber"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"path"
	"reflect"
	"strconv"
	"time"
)

var (
	historyPath    = path.Join(AppBasePath, "config", "webgrabber", "history")
	historyRecPath = path.Join(AppBasePath, "config", "webgrabber", "historyrec")
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
		grab, err = w.PrepareGrabConfigForHTML(o)
	} else if o.SourceType == "SourceType_DocExcel" {
		// GrabDocConfig
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err, isServerRunning := w.StartService(grab)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, []interface{}{o, grab, isServerRunning}, "")
}

func (w *WebGrabberController) StartService(grab *modelWebgrabber.GrabService) (error, bool) {
	err := grab.StartService()

	if err != nil {
		return err, grab.ServiceRunningStat
	} else if grab.ServiceRunningStat {
		ks := new(knot.Server)
		ks.Log().Info(fmt.Sprintf("==Start '%s' grab service==", grab.Name))
		knot.SharedObject().Set(grab.Name, grab)

		return nil, grab.ServiceRunningStat //s.(*StatService).status
	}

	err, isStopService := w.StopService(grab)
	if err != nil {
		return err, isStopService
	}

	return nil, grab.ServiceRunningStat
}

func (w *WebGrabberController) StopService(grab *modelWebgrabber.GrabService) (error, bool) {
	err := grab.StopService()
	if err != nil {
		return err, grab.ServiceRunningStat
	}

	ks := new(knot.Server)
	ks.Log().Info(fmt.Sprintf("==Stop '%s' grab service==", grab.Name))

	return nil, grab.ServiceRunningStat
}

func (w *WebGrabberController) PrepareGrabConfigForHTML(o *colonycore.WebGrabber) (*modelWebgrabber.GrabService, error) {
	gService := modelWebgrabber.NewGrabService()

	gService.Name = o.ID
	gService.Url = o.URL
	gService.SourceType = modelWebgrabber.SourceType_HttpHtml

	if o.IntervalType == "seconds" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Second
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Second
	} else if o.IntervalType == "minutes" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Minute
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Minute
	} else if o.IntervalType == "hours" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Hour
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Hour
	}

	gService.TimeOutIntervalInfo = fmt.Sprintf("%v %s", o.TimeoutInterval, o.IntervalType)
	gConfig := modelWebgrabber.Config{}

	if o.CallType == "POST" {
		dataURL := toolkit.M{}

		for _, eachConf := range o.GrabConfiguration {
			eachData, err := toolkit.ToM(eachConf)
			if err != nil {
				return nil, err
			}

			for key, subConf := range eachData {
				if reflect.ValueOf(subConf).Kind() == reflect.Float64 {
					dataURL.Set(key, strconv.Itoa(toolkit.ToInt(subConf, toolkit.RoundingAuto)))
				} else {
					dataURL.Set(key, subConf)
				}
			}
		}

		gConfig.SetFormValues(dataURL)
	}

	if o.GrabConfiguration.Has("authtype") {
		gConfig.AuthType = o.GrabConfiguration["authtype"].(string)
		gConfig.LoginUrl = o.GrabConfiguration["loginurl"].(string)
		gConfig.LogoutUrl = o.GrabConfiguration["logouturl"].(string)

		loginValues := o.GrabConfiguration["loginvalues"].(map[string]interface{})
		gConfig.LoginValues = toolkit.M{}.
			Set("name", loginValues["name"].(string)).
			Set("password", loginValues["password"].(string))
	}

	gService.ServGrabber = modelWebgrabber.NewGrabber(gService.Url, o.CallType, &gConfig)

	logPath := o.LogConfiguration.LogPath
	fileName := o.LogConfiguration.FileName
	filePattern := o.LogConfiguration.FilePattern

	logConf, err := toolkit.NewLog(false, true, logPath, fileName, filePattern)
	if err != nil {
		return nil, err
	}

	gService.Log = logConf
	gService.ServGrabber.DataSettings = make(map[string]*modelWebgrabber.DataSetting)
	gService.DestDbox = make(map[string]*modelWebgrabber.DestInfo)

	tempDataSetting := modelWebgrabber.DataSetting{}
	tempDestinationInfo := modelWebgrabber.DestInfo{}
	tempFilterCondition := toolkit.M{}

	fmt.Printf("====== %#v\n", o)

	tempDataSetting.RowSelector = o.DataSetting.RowSelector

	for _, columnSet := range o.DataSetting.ColumnSettings {
		i := toolkit.ToInt(columnSet.Index, toolkit.RoundingAuto)
		column := modelWebgrabber.GrabColumn{Alias: columnSet.Alias, Selector: columnSet.Selector}
		tempDataSetting.Column(i, &column)
	}

	if len(o.DataSetting.RowDeleteCondition) > 0 {
		tempFilterCondition, err = toolkit.ToM(o.DataSetting.RowDeleteCondition.Get("filtercond", nil))
		if err != nil {
			return nil, err
		}

		tempDataSetting.FilterCond = tempFilterCondition
	}

	if len(o.DataSetting.RowIncludeCondition) > 0 {
		tempFilterCondition, err = toolkit.ToM(o.DataSetting.RowIncludeCondition.Get("filtercond", nil))
		if err != nil {
			return nil, err
		}

		tempDataSetting.FilterCond = tempFilterCondition
	}

	gService.ServGrabber.DataSettings[o.DataSetting.Name] = &tempDataSetting
	tempDestinationInfo.Collection = o.DataSetting.ConnectionInfo.Collection
	tempDestinationInfo.Desttype = o.DataSetting.DestinationType

	conn, err := dbox.NewConnection(tempDestinationInfo.Desttype, &o.DataSetting.ConnectionInfo.ConnectionInfo)
	if err != nil {
		return nil, err
	}
	tempDestinationInfo.IConnection = conn

	gService.DestDbox[o.DataSetting.Name] = &tempDestinationInfo
	gService.HistoryPath = historyPath
	gService.HistoryRecPath = historyRecPath

	return gService, nil
}

func (w *WebGrabberController) PrepareGrabConfigForDoc(o *colonycore.WebGrabber) (*modelWebgrabber.GrabService, error) {
	gService := modelWebgrabber.NewGrabService()

	gService.Name = o.ID
	gService.Url = o.URL
	gService.SourceType = modelWebgrabber.SourceType_HttpHtml

	if o.IntervalType == "seconds" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Second
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Second
	} else if o.IntervalType == "minutes" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Minute
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Minute
	} else if o.IntervalType == "hours" {
		gService.GrabInterval = time.Duration(o.GrabInterval) * time.Hour
		gService.TimeOutInterval = time.Duration(o.TimeoutInterval) * time.Hour
	}

	gService.TimeOutIntervalInfo = fmt.Sprintf("%v %s", o.TimeoutInterval, o.IntervalType)

	if o.GrabConfiguration.Has("doctype") {
		conn, err := toolkit.ToM(o.GrabConfiguration["connectioninfo"])

		ci := dbox.ConnectionInfo{}
		ci.Host = conn["host"].(string)
		ci.Settings = nil

		if o.GrabConfiguration.Has("settings") {
			connSettings, err := toolkit.ToM(conn["settings"])
			if err != nil {
				return nil, err
			}
			ci.Settings = connSettings
		}

		gService.ServGetData, err = modelWebgrabber.NewGetDatabase(ci.Host, o.GrabConfiguration["doctype"].(string), &ci)
		if err != nil {
			return nil, err
		}
	}

	logPath := o.LogConfiguration.LogPath
	fileName := o.LogConfiguration.FileName
	filePattern := o.LogConfiguration.FilePattern

	logConf, err := toolkit.NewLog(false, true, logPath, fileName, filePattern)
	if err != nil {
		return nil, err
	}

	gService.Log = logConf
	gService.ServGetData.CollectionSettings = make(map[string]*modelWebgrabber.CollectionSetting)
	gService.DestDbox = make(map[string]*modelWebgrabber.DestInfo)

	dataSettings := modelWebgrabber.CollectionSetting{}
	destinationInfo := modelWebgrabber.DestInfo{}

	dataSettings.Collection = o.DataSetting.RowSelector

	for _, columnSet := range o.DataSetting.ColumnSettings {
		dataSettings.SelectColumn = append(dataSettings.SelectColumn, &modelWebgrabber.GrabColumn{Alias: columnSet.Alias, Selector: columnSet.Selector})
	}

	gService.ServGetData.CollectionSettings[o.DataSetting.Name] = &dataSettings
	destinationInfo.Collection = o.DataSetting.ConnectionInfo.Collection
	destinationInfo.Desttype = o.DataSetting.DestinationType

	conn, err := dbox.NewConnection(destinationInfo.Desttype, &o.DataSetting.ConnectionInfo.ConnectionInfo)
	if err != nil {
		return nil, err
	}
	destinationInfo.IConnection = conn

	gService.DestDbox[o.DataSetting.Name] = &destinationInfo
	gService.HistoryPath = historyPath
	gService.HistoryRecPath = historyRecPath

	return new(modelWebgrabber.GrabService), nil
}

func (w *WebGrabberController) InsertSampleData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	wg := new(colonycore.WebGrabber)
	wg.CallType = "POST"
	wg.DataSetting = &colonycore.DataSetting{
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
			ConnectionInfo: dbox.ConnectionInfo{
				Database: "valegrab",
				Host:     "localhost:27017",
			},
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
	wg.SourceType = "SourceType_Http"
	wg.TimeoutInterval = 5
	wg.URL = "http://www.dce.com.cn/PublicWeb/MainServlet"

	colonycore.Save(wg)

	return helper.CreateResult(true, wg, "")
}
