package controller

import (
	"bufio"
	"bytes"
	"errors"
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
	"runtime"
	"strconv"
	"strings"
	// "syscall"
	"time"
	// "encoding/json"
	// "reflect"
)

var (
	wgLogPath        string = f.Join(EC_DATA_PATH, "webgrabber", "log") + toolkit.PathSeparator
	wgHistoryPath    string = f.Join(EC_DATA_PATH, "webgrabber", "history") + toolkit.PathSeparator
	wgHistoryRecPath string = f.Join(EC_DATA_PATH, "webgrabber", "historyrec") + toolkit.PathSeparator
	wgOutputPath     string = f.Join(EC_DATA_PATH, "webgrabber", "output") + toolkit.PathSeparator
	wgSnapShotPath   string = f.Join(EC_DATA_PATH, "daemon") + toolkit.PathSeparator
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

func GetDirSnapshot(nameid string) *WebGrabberController {
	w := new(WebGrabberController)
	path := wgSnapShotPath + nameid + ".csv"
	w.filepathName = path
	w.nameid = nameid
	return w
}

// function for check sedotand.exe
func GetSedotandWindows() bool {
	cmd := exec.Command("cmd", "/C", "tasklist", "/fo", "csv", "/nh")
	// cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()

	if err != nil {
		fmt.Println(err.Error())
	}
	return strings.Contains(out.String(), "sedotand.exe")
}

func CreateWebGrabberController(s *knot.Server) *WebGrabberController {
	var controller = new(WebGrabberController)
	controller.Server = s
	return controller
}

func (w *WebGrabberController) OpenHistory() ([]interface{}, error) {
	var history = []interface{}{} //toolkit.M{}
	var config = map[string]interface{}{"useheader": true, "delimiter": ",", "dateformat": "MM-dd-YYYY"}
	ci := &dbox.ConnectionInfo{w.filepathName, "", "", "", config}

	c, err := dbox.NewConnection("csv", ci)
	if err != nil {
		return history, err
	}

	err = c.Connect()
	if err != nil {
		return history, err
	}
	defer c.Close()

	csr, err := c.NewQuery().Select("*").Cursor(nil)
	if err != nil {
		return history, err
	}
	if csr == nil {
		return history, errors.New("Cursor not initialized")
	}
	defer csr.Close()
	ds := []toolkit.M{}
	err = csr.Fetch(&ds, 0, false)
	if err != nil {
		return history, err
	}

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
	return history, nil
}

func (w *WebGrabberController) OpenSnapShot(Nameid string) ([]interface{}, error) {
	var snapShot = []interface{}{} //toolkit.M{}
	var config = map[string]interface{}{"useheader": true, "delimiter": ",", "dateformat": "MM-dd-YYYY"}
	ci := &dbox.ConnectionInfo{w.filepathName, "", "", "", config}
	c, err := dbox.NewConnection("csv", ci)
	if err != nil {
		return snapShot, err
	}

	err = c.Connect()
	if err != nil {
		return snapShot, err
	}
	defer c.Close()

	csr, err := c.NewQuery().Select("*").Where(dbox.Eq("Id", Nameid)).Cursor(nil)
	if err != nil {
		return snapShot, err
	}
	if csr == nil {
		return snapShot, errors.New("Cursor not initialized")
	}
	defer csr.Close()
	ds := []toolkit.M{}
	err = csr.Fetch(&ds, 0, false)
	if err != nil {
		return snapShot, err
	}
	for _, v := range ds {
		var addToMap = toolkit.M{}
		addToMap.Set("id", v.Get("Id"))
		addToMap.Set("starttime", v.Get("Starttime"))
		addToMap.Set("endtime", v.Get("Endtime"))
		addToMap.Set("grabcount", v.Get("Grabcount"))
		addToMap.Set("rowgrabbed", v.Get("Rowgrabbed"))
		addToMap.Set("errorfound", v.Get("Errorfound"))
		addToMap.Set("lastgrabstatus", v.Get("Lastgrabstatus"))
		addToMap.Set("grabstatus", v.Get("Grabstatus"))
		addToMap.Set("note", v.Get("Note"))

		snapShot = append(snapShot, addToMap)
	}
	return snapShot, nil
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

	if sourcetype == "" {
		//default sourcetype == "SourceType_HttpHtml"
		query = dbox.And(query, dbox.Eq("sourcetype", "SourceType_HttpHtml"))
	} else {
		query = dbox.And(query, dbox.Eq("sourcetype", sourcetype))
	}

	if requesttype != "" {
		query = dbox.And(query, dbox.Eq("grabconf.calltype", requesttype))
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

	if payload.GrabConf["username"] == "" {
		delete(payload.GrabConf, "username")
	}

	if payload.GrabConf["password"] == "" {
		delete(payload.GrabConf, "password")
	}

	castStartTime, _ := time.Parse(time.RFC3339, payload.IntervalConf.StartTime)
	castExpTime, _ := time.Parse(time.RFC3339, payload.IntervalConf.ExpiredTime)

	payload.IntervalConf.StartTime = cast.Date2String(castStartTime, "YYYY-MM-dd HH:mm:ss")
	payload.IntervalConf.ExpiredTime = cast.Date2String(castExpTime, "YYYY-MM-dd HH:mm:ss")

	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := w.SyncConfig(); err != nil {
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

	if err := w.SyncConfig(); err != nil {
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

	if err := w.SyncConfig(); err != nil {
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

	if runtime.GOOS == "windows" {
		sedotandExist := GetSedotandWindows()
		if sedotandExist == false {
			return helper.CreateResult(true, false, "")
		}

		return helper.CreateResult(true, true, "")

	} else {
		filters := dbox.And(dbox.Eq("serverType", "node"), dbox.Eq("os", "linux"))
		cursor, err := colonycore.Find(new(colonycore.Server), filters)
		if err != nil {
			return helper.CreateResult(false, false, err.Error())
		}

		all := []colonycore.Server{}
		err = cursor.Fetch(&all, 0, true)
		if err != nil {
			return helper.CreateResult(false, false, err.Error())
		}

		if len(all) == 0 {
			return helper.CreateResult(false, false, "No server registered")
		}

		serverC := &ServerController{}
		var howManyOn = 0
		for _, server := range all {
			isOn, _ := serverC.ToggleSedotanService("stat", server.ID)
			if isOn {
				howManyOn = howManyOn + 1
			}
		}

		if howManyOn > 0 {
			return helper.CreateResult(true, true, "")
		}

		return helper.CreateResult(false, false, "")
	}

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

		if payload.OP == "off" {
			// cek tasklist -> sedotand.exe
			sedotandExist := GetSedotandWindows()

			if sedotandExist == false {
				return helper.CreateResult(false, false, "")
			}

			err := exec.Command("taskkill", "/IM", "sedotand.exe", "/F").Start()

			if err != nil {
				return helper.CreateResult(false, false, err.Error())
			}
			return helper.CreateResult(true, false, "")
		} else {
			sedotanPath := f.Join(EC_APP_PATH, "cli", "sedotand.exe")
			sedotanConfigPath := f.Join(EC_APP_PATH, "config", "webgrabbers.json")
			sedotanConfigArg := fmt.Sprintf(`-config="%s"`, sedotanConfigPath)
			sedotanLogPath := f.Join(EC_DATA_PATH, "daemon")
			sedotanLogArg := fmt.Sprintf(`-logpath="%s"`, sedotanLogPath)

			fmt.Println("===> ", sedotanPath, sedotanConfigArg, sedotanLogArg, "&")

			err := exec.Command(sedotanPath, sedotanConfigArg, sedotanLogArg, "&").Start()
			//syscal.exec
			/*
				binary, lookErr := exec.LookPath("cmd")
				if lookErr != nil {
					panic(lookErr)
				}
				err := syscall.Exec(binary, []string{"cmd", "-c", sedotanPath}, os.Environ())
			*/
			if err != nil {
				return helper.CreateResult(false, false, err.Error())
			}
			return helper.CreateResult(true, true, "")
		}
	} else {
		if err := w.SyncConfig(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		filters := dbox.And(dbox.Eq("serverType", "node"), dbox.Eq("os", "linux"))
		cursor, err := colonycore.Find(new(colonycore.Server), filters)
		if err != nil {
			return helper.CreateResult(false, false, err.Error())
		}

		all := []colonycore.Server{}
		err = cursor.Fetch(&all, 0, true)
		if err != nil {
			return helper.CreateResult(false, false, err.Error())
		}

		if len(all) == 0 {
			return helper.CreateResult(false, false, "No server registered")
		}

		serverC := &ServerController{}

		if payload.OP == "off" {
			var howManyErrors = 0
			for _, server := range all {
				_, err = serverC.ToggleSedotanService("stop", server.ID)
				if err != nil {
					howManyErrors = howManyErrors + 1
				}
			}

			if howManyErrors == 0 {
				return helper.CreateResult(true, nil, "")
			}

			return helper.CreateResult(false, nil, "Sedotan won't start on some servers")
		} else {
			var howManyErrors = 0
			for _, server := range all {
				_, err = serverC.ToggleSedotanService("start stop", server.ID)
				if err != nil {
					howManyErrors = howManyErrors + 1
				}
			}

			if howManyErrors == 0 {
				return helper.CreateResult(true, nil, "")
			}

			return helper.CreateResult(false, nil, "Sedotan won't start on some servers")
		}
	}

	return helper.CreateResult(false, false, "Internal server error")
}

func (w *WebGrabberController) GetHistory(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	var history = toolkit.M{}
	arrcmd := make([]string, 0, 0)
	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// module := NewHistory(payload.HistConf.FileName)
	// history, err := module.OpenHistory()

	dateNow := cast.Date2String(time.Now(), "YYYYMMdd") //time.Now()
	arrcmd = append(arrcmd, EC_APP_PATH+`\bin\sedotanread.exe`)
	arrcmd = append(arrcmd, `-readtype=history`)
	arrcmd = append(arrcmd, `-pathfile=`+EC_DATA_PATH+`\webgrabber\history\`+payload.HistConf.FileName+`-`+dateNow+`.csv`)

	if runtime.GOOS == "windows" {
		historystring, _ := toolkit.RunCommand(arrcmd[0], arrcmd[1], arrcmd[2])
		err = toolkit.UnjsonFromString(historystring, &history)
	} else {
		// cmd = exec.Command("sudo", "../daemon/sedotandaemon", `-config="`+tbasepath+`\config-daemon.json"`, `-logpath="`+tbasepath+`\log"`)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, history["DATA"], "")
}

func (w *WebGrabberController) GetSnapshot(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	SnapShot := ""
	arrcmd := make([]string, 0, 0)
	result := toolkit.M{}
	payload := struct {
		Nameid string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	// module := GetDirSnapshot("daemonsnapshot")

	// SnapShot, err := module.OpenSnapShot(payload.Nameid)

	arrcmd = append(arrcmd, EC_APP_PATH+`\bin\sedotanread.exe`)
	arrcmd = append(arrcmd, `-readtype=snapshot`)
	arrcmd = append(arrcmd, `-pathfile=`+EC_DATA_PATH+`\daemon\daemonsnapshot.csv`)
	arrcmd = append(arrcmd, `-nameid=`+payload.Nameid)

	if runtime.GOOS == "windows" {
		SnapShot, err = toolkit.RunCommand(arrcmd[0], arrcmd[1], arrcmd[2], arrcmd[3])
		err = toolkit.UnjsonFromString(SnapShot, &result)
	} else {
		// cmd = exec.Command("sudo", "../daemon/sedotandaemon", `-config="`+tbasepath+`\config-daemon.json"`, `-logpath="`+tbasepath+`\log"`)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
}

func (w *WebGrabberController) GetFetchedData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	rechistory := ""
	arrcmd := make([]string, 0, 0)
	result := toolkit.M{}
	payload := struct {
		RecFile string `json:"recfile"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// var data []toolkit.M

	// config := toolkit.M{"useheader": true, "delimiter": ","}
	// query := helper.Query("csv", payload.RecFile, "", "", "", config)

	// data, err = query.SelectAll("")

	arrcmd = append(arrcmd, EC_APP_PATH+`\bin\sedotanread.exe`)
	arrcmd = append(arrcmd, `-readtype=rechistory`)
	arrcmd = append(arrcmd, `-recfile=`+payload.RecFile)

	if runtime.GOOS == "windows" {
		rechistory, err = toolkit.RunCommand(arrcmd[0], arrcmd[1], arrcmd[2])
		err = toolkit.UnjsonFromString(rechistory, &result)
	} else {
		// cmd = exec.Command("sudo", "../daemon/sedotandaemon", `-config="`+tbasepath+`\config-daemon.json"`, `-logpath="`+tbasepath+`\log"`)
	}

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
}

func (w *WebGrabberController) GetLog(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	
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
	// arrcmd := make([]string, 0, 0)
	// SnapShot := ""
	// logs := toolkit.M{}
	// arrcmd = append(arrcmd, EC_APP_PATH+`\bin\sedotanread.exe`)
	// arrcmd = append(arrcmd, `-readtype=logfile`)
	// arrcmd = append(arrcmd, `-datetime=`+payload.Date)
	// arrcmd = append(arrcmd, `-nameid=`+payload.ID)
	// arrcmd = append(arrcmd, `-datas=`+toolkit.JsonString(o))

	// if runtime.GOOS == "windows" {
	// 	SnapShot, err = toolkit.RunCommand(arrcmd[0], arrcmd[1], arrcmd[2], arrcmd[3], arrcmd[4])
	// 	fmt.Println(SnapShot)
	// 	err = toolkit.UnjsonFromString(SnapShot, &logs)
	// } else {
	// 	// cmd = exec.Command("sudo", "../daemon/sedotandaemon", `-config="`+tbasepath+`\config-daemon.json"`, `-logpath="`+tbasepath+`\log"`)
	// }
	// // fmt.Println(logs)
	return helper.CreateResult(true, logs, "")
}

func (w *WebGrabberController) RemoveGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.WebGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := w.SyncConfig(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (w *WebGrabberController) RemoveMultipleWebGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

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

	if err := w.SyncConfig(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (d *WebGrabberController) SyncConfig() error {
	all := []colonycore.Server{}
	serverC := &ServerController{}
	configName := fmt.Sprintf("%s.json", new(colonycore.WebGrabber).TableName())
	src := f.Join(EC_APP_PATH, "config", configName)

	filters := dbox.And(dbox.Eq("serverType", "node"), dbox.Eq("os", "linux"))
	cursor, err := colonycore.Find(new(colonycore.Server), filters)
	if err != nil {
		return err
	}

	err = cursor.Fetch(&all, 0, true)
	if err != nil {
		return err
	}

	errs := []error{}

	for _, each := range all {
		setting, _, err := serverC.SSHConnect(&each)
		if err != nil {
			errs = append(errs, err)
			continue
		}

		dst := f.Join(each.AppPath, "config", configName)
		err = setting.SshCopyByPath(src, dst)
		if err != nil {
			errs = append(errs, err)
			continue
		}
	}

	if len(errs) == len(all) && len(errs) > 0 {
		return errs[0]
	}

	fmt.Println(configName, "synced w/ errors", errs)

	return nil
}
