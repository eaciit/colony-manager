package controller

import (
	"bufio"
	"fmt"
	"github.com/eaciit/cast"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/csv"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"os"
	"os/exec"
	f "path/filepath"
	"reflect"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

var (
	wgLogPath        string = f.Join(EC_DATA_PATH, "webgrabber", "log") + toolkit.PathSeparator
	wgHistoryPath    string = f.Join(EC_DATA_PATH, "webgrabber", "history") + toolkit.PathSeparator
	wgHistoryRecPath string = f.Join(EC_DATA_PATH, "webgrabber", "historyrec") + toolkit.PathSeparator
	wgOutputPath     string = f.Join(EC_DATA_PATH, "webgrabber", "output") + toolkit.PathSeparator
	dateformat       string = "YYYYMM"
)

type WebGrabberController struct {
	App
	filepathName, nameid, logPath string
	humanDate                     string
	rowgrabbed, rowsaved          float64
}

func DateToString(tm time.Time) string {
	return toolkit.Date2String(tm, dateformat)
}

func NewHistory(nameid string) *WebGrabberController {
	w := new(WebGrabberController)

	dateNow := cast.Date2String(time.Now(), "YYYYMMdd") //time.Now()
	path := wgHistoryPath + nameid + "-" + dateNow + ".csv"
	w.filepathName = path
	w.nameid = nameid
	return w
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	var controller = new(WebGrabberController)
	controller.Server = s
	return controller
}

func (w *WebGrabberController) PrepareHistoryPath() {
}

func (w *WebGrabberController) OpenHistory() interface{} {
	var config = map[string]interface{}{"useheader": true, "delimiter": ",", "dateformat": "MM-dd-YYYY"}

	ci := &dbox.ConnectionInfo{w.filepathName, "", "", "", config}
	c, err := dbox.NewConnection("csv", ci)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = c.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer c.Close()

	csr, err := c.NewQuery().Select("*").Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if csr == nil {
		return helper.CreateResult(false, nil, "Cursor not initialized")
	}
	defer csr.Close()
	ds := []toolkit.M{}
	err = csr.Fetch(&ds, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var history = []interface{}{} //toolkit.M{}
	for i, v := range ds {
		castDate, _ := time.Parse(time.RFC3339, v.Get("grabdate").(string))
		w.humanDate = cast.Date2String(castDate, "YYYY/MM/dd HH:mm:ss")
		w.rowgrabbed, _ = strconv.ParseFloat(fmt.Sprintf("%v", v.Get("rowgrabbed")), 64)
		w.rowsaved, _ = strconv.ParseFloat(fmt.Sprintf("%v", v.Get("rowgrabbed")), 64)

		var addToMap = toolkit.M{}
		addToMap.Set("id", i+1)
		addToMap.Set("datasettingname", v.Get("datasettingname"))
		addToMap.Set("grabdate", w.humanDate)
		addToMap.Set("grabstatus", v.Get("grabstatus"))
		addToMap.Set("rowgrabbed", w.rowgrabbed)
		addToMap.Set("rowsaved", w.rowsaved)
		addToMap.Set("notehistory", v.Get("note"))
		addToMap.Set("recfile", v.Get("recfile"))
		addToMap.Set("nameid", w.nameid)

		history = append(history, addToMap)
	}
	return history
}

func (w *WebGrabberController) GetLogHistory(datas []interface{}, date string) interface{} {

	for _, v := range datas {
		vMap, _ := toolkit.ToM(v)

		logConf := vMap["logconf"].(map[string]interface{})
		dateNowFormat := logConf["filepattern"].(string)
		theDate := cast.String2Date(date, "YYYY/MM/dd HH:mm:ss")
		theDateString := cast.Date2String(theDate, dateNowFormat)
		fileName := fmt.Sprintf("%s-%s", logConf["filename"], theDateString)
		w.logPath = f.Join(EC_DATA_PATH, "webgrabber", "log", fileName)
	}

	file, err := os.Open(w.logPath)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer file.Close()
	addMinute := toolkit.String2Date(date, "YYYY/MM/dd HH:mm:ss").Add(1 * time.Minute)
	dateAddMinute := toolkit.Date2String(addMinute, "YYYY/MM/dd HH:mm:ss")
	getHours := strings.Split(date, ":")
	getAddMinute := strings.Split(dateAddMinute, ":")
	containString := getHours[0] + ":" + getHours[1]
	containString2 := getAddMinute[0] + ":" + getAddMinute[1]
	scanner := bufio.NewScanner(file)
	lines := 0
	containLines := 0
	logsseparator := ""

	add7Hours := func(s string) string {
		t, _ := time.Parse("2006/01/02 15:04", s)
		t = t.Add(time.Hour * 7)
		return t.Format("2006/01/02 15:04")
	}

	containString = add7Hours(containString)
	containString2 = add7Hours(containString2)

	var logs []interface{}
	for scanner.Scan() {
		lines++
		contains := strings.Contains(scanner.Text(), containString)
		contains2 := strings.Contains(scanner.Text(), containString2)

		if contains {
			containLines = lines
			logsseparator = containString
		}

		if contains2 {
			containLines = lines
			logsseparator = containString2
		}
		result := toolkit.M{}
		if lines == containLines {
			arrlogs := strings.Split(scanner.Text(), logsseparator)
			result.Set("Type", arrlogs[0])
			result.Set("Date", logsseparator+":"+arrlogs[1][1:3])
			result.Set("Desc", arrlogs[1][4:len(arrlogs[1])])
			logs = append(logs, result)
		}
	}

	if err := scanner.Err(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var addSlice = toolkit.M{}
	addSlice.Set("logs", logs)
	return addSlice
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
	payload.LogConf.FilePattern = DateToString(time.Now())

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

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	payload.Running = true

	if err := colonycore.Delete(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload.Running, "")
}

func (w *WebGrabberController) StopService(r *knot.WebContext) interface{} {
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
	payload.Running = false

	if err := colonycore.Delete(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload.Running, "")
}

func (w *WebGrabberController) Stat(r *knot.WebContext) interface{} {
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

	return helper.CreateResult(true, payload.Running, "")
}

func (w *WebGrabberController) DaemonStat(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	byts, _ := exec.Command("pgrep", "sedotand").Output()
	if string(byts) == "" {
		return helper.CreateResult(true, false, "")
	}

	return helper.CreateResult(true, true, "")
}

func (w *WebGrabberController) DaemonToggle(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		OP string `json:"op"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if runtime.GOOS == "windows" {
		return helper.CreateResult(false, false, "Not yet supported for windows")
	} else {
		if payload.OP == "off" {
			byts, err := exec.Command("pgrep", "sedotand").Output()
			if err != nil {
				return helper.CreateResult(false, false, err.Error())
			}

			if pidOfSedotanD := strings.TrimSpace(string(byts)); pidOfSedotanD != "" {
				pid := toolkit.ToInt(pidOfSedotanD, toolkit.RoundingAuto)
				err := syscall.Kill(pid, 15)
				if err != nil {
					return helper.CreateResult(false, false, err.Error())
				}

				return helper.CreateResult(true, true, "")
			}
		} else {
			sedotanPath := f.Join(EC_APP_PATH, "daemon", "sedotand")
			sedotanConfigPath := f.Join(EC_APP_PATH, "config", "webgrabbers.json")
			sedotanConfigArg := fmt.Sprintf(`-config="%s"`, sedotanConfigPath)
			sedotanLogPath := f.Join(EC_DATA_PATH, "daemon")
			sedotanLogArg := fmt.Sprintf(`-logpath="%s"`, sedotanLogPath)

			fmt.Println("===> ", sedotanPath, sedotanConfigArg, sedotanLogArg, "&")
			err := exec.Command(sedotanPath, sedotanConfigArg, sedotanLogArg, "&").Start()
			if err != nil {
				return helper.CreateResult(false, false, err.Error())
			}

			return helper.CreateResult(true, true, "")
		}
	}

	return helper.CreateResult(false, false, "Internal server error")
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

	module := NewHistory(payload.HistConf.FileName)
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

	history := NewHistory(payload.ID)
	logs := history.GetLogHistory([]interface{}{o}, payload.Date)
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
