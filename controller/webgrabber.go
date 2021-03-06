package controller

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"os"
	"os/exec"
	f "path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/eaciit/cast"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/csv"
	"github.com/eaciit/knot/knot.v1"
	. "github.com/eaciit/sshclient"
	"github.com/eaciit/toolkit"
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

	if payload.GrabConf["authtype"] == "AuthType_Basic" {
		delete(payload.GrabConf, "loginurl")
		delete(payload.GrabConf, "logouturl")
	} else if payload.GrabConf["authtype"] == "" {
		delete(payload.GrabConf, "loginurl")
		delete(payload.GrabConf, "logouturl")
		delete(payload.GrabConf, "username")
		delete(payload.GrabConf, "password")
	}

	castStartTime, err := time.Parse(time.RFC3339, payload.IntervalConf.StartTime)
	if err == nil {
		payload.IntervalConf.StartTime = cast.Date2String(castStartTime, "YYYY-MM-dd HH:mm:ss")

	}

	castExpTime, err := time.Parse(time.RFC3339, payload.IntervalConf.ExpiredTime)
	if err == nil {
		payload.IntervalConf.ExpiredTime = cast.Date2String(castExpTime, "YYYY-MM-dd HH:mm:ss")
	}

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
		filters := dbox.And(dbox.Eq("os", "linux"))
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

		var howManyOn = 0
		for _, server := range all {
			isOn, _ := server.ToggleSedotanService("stat", server.ID)
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
			sedotanLogPath := f.Join(EC_APP_PATH, "daemon")
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

		all, err := new(colonycore.Server).GetServerSSH()
		if err != nil {
			return helper.CreateResult(false, false, err.Error())
		}

		if payload.OP == "off" {
			var howManyErrors = 0
			for _, server := range all {
				_, err = server.ToggleSedotanService("stop", server.ID)
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
				_, err = server.ToggleSedotanService("start stop", server.ID)
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

	var result = toolkit.M{}
	arrcmd := make([]string, 0, 0)
	payload := new(colonycore.WebGrabber)
	dateNow := cast.Date2String(time.Now(), "YYYYMMdd") //time.Now()
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

	client, server, err := w.ConnectToSedotanServer()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	SshClient := *client

	apppath := ""
	if server.OS == "linux" {
		apppath = server.AppPath + `/cli/sedotanread`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="history"`)
		arrcmd = append(arrcmd, `-pathfile="`+server.DataPath+`/webgrabber/history/`+payload.HistConf.FileName+`-`+dateNow+`.csv"`)
	} else {
		apppath = server.AppPath + `\bin\sedotanread.exe`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="history"`)
		arrcmd = append(arrcmd, `-pathfile="`+server.DataPath+`\webgrabber\history\`+payload.HistConf.FileName+`-`+dateNow+`.csv"`)
	}

	// apppath := ""
	// if runtime.GOOS == "windows" {
	// 	arrcmd = append(arrcmd, "cmd")
	// 	arrcmd = append(arrcmd, "/C")
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread.exe")
	// } else {
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread")
	// }

	// cmd := exec.Command(arrcmd[0], arrcmd[1:]...)
	// byteoutput, err := cmd.CombinedOutput()
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// err = toolkit.UnjsonFromString(string(byteoutput), &result)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// fmt.Println(strings.Join(append(arrcmd[:1],arrcmd[1:]...)," "))

	cmds := strings.Join(append(arrcmd[:1], arrcmd[1:]...), " ")
	fmt.Println("====>", cmds)
	output, err := SshClient.GetOutputCommandSsh(cmds)
	if err != nil {
		fmt.Println(err)
	}

	err = toolkit.UnjsonFromString(output, &result)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
}

func (w *WebGrabberController) GetSnapshot(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

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

	// ===================LOCALHOST TEST=================================
	// apppath := ""
	// if runtime.GOOS == "windows" {
	// 	arrcmd = append(arrcmd, "cmd")
	// 	arrcmd = append(arrcmd, "/C")
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread.exe")
	// } else {
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread")
	// }

	// arrcmd = append(arrcmd, apppath)
	// arrcmd = append(arrcmd, `-readtype=snapshot`)
	// arrcmd = append(arrcmd, `-pathfile=`+EC_DATA_PATH+`\daemon\daemonsnapshot.csv`)
	// arrcmd = append(arrcmd, `-nameid=`+payload.Nameid)

	// cmd := exec.Command(arrcmd[0], arrcmd[1:]...)
	// byteoutput, err := cmd.CombinedOutput()
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// err = toolkit.UnjsonFromString(string(byteoutput), &result)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// ===================END LOCALHOST TEST===============================

	client, server, err := w.ConnectToSedotanServer()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	SshClient := *client

	apppath := ""
	if server.OS == "linux" {
		apppath = server.AppPath + `/cli/sedotanread`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="snapshot"`)
		arrcmd = append(arrcmd, `-pathfile="`+server.DataPath+`/daemon/daemonsnapshot.csv"`)
		arrcmd = append(arrcmd, `-nameid="`+payload.Nameid+`"`)
	} else {
		apppath = server.AppPath + `\bin\sedotanread.exe`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="snapshot"`)
		arrcmd = append(arrcmd, `-pathfile="`+server.DataPath+`\daemon\daemonsnapshot.csv"`)
		arrcmd = append(arrcmd, `-nameid="`+payload.Nameid+`"`)
	}

	cmds := strings.Join(append(arrcmd[:1], arrcmd[1:]...), " ")
	fmt.Println("====>", cmds)
	output, err := SshClient.GetOutputCommandSsh(cmds)
	if err != nil {
		fmt.Println(err)
	}

	err = toolkit.UnjsonFromString(output, &result)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
}

func (w *WebGrabberController) GetFetchedData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

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

	// apppath := ""
	// if runtime.GOOS == "windows" {
	// 	arrcmd = append(arrcmd, "cmd")
	// 	arrcmd = append(arrcmd, "/C")
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread.exe")
	// } else {
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread")
	// }

	// arrcmd = append(arrcmd, apppath)
	// arrcmd = append(arrcmd, `-readtype=rechistory`)
	// arrcmd = append(arrcmd, `-pathfile=`+payload.RecFile)

	// cmd := exec.Command(arrcmd[0], arrcmd[1:]...)
	// byteoutput, err := cmd.CombinedOutput()
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	client, server, err := w.ConnectToSedotanServer()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	SshClient := *client

	payload.RecFile = strings.Replace(payload.RecFile, EC_DATA_PATH, server.DataPath, -1)

	apppath := ""
	if server.OS == "linux" {
		apppath = server.AppPath + `/cli/sedotanread`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="rechistory"`)
		arrcmd = append(arrcmd, `-pathfile="`+strings.Replace(payload.RecFile, `\`, `/`, -1)+`"`)
	} else {
		apppath = server.AppPath + `\bin\sedotanread.exe`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="rechistory"`)
		arrcmd = append(arrcmd, `-pathfile="`+payload.RecFile+`"`)
	}

	cmds := strings.Join(append(arrcmd[:1], arrcmd[1:]...), " ")
	fmt.Println("====>", cmds)
	output, err := SshClient.GetOutputCommandSsh(cmds)
	if err != nil {
		fmt.Println(err)
	}

	err = toolkit.UnjsonFromString(output, &result)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
}

func (w *WebGrabberController) GetLog(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	arrcmd := make([]string, 0, 0)
	result := toolkit.M{}
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

	// history := NewHistory(payload.ID)
	// logs := history.GetLogHistory([]interface{}{o}, payload.Date)
	// apppath := ""
	// if runtime.GOOS == "windows" {
	// 	arrcmd = append(arrcmd, "cmd")
	// 	arrcmd = append(arrcmd, "/C")
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread.exe")
	// } else {
	// 	apppath = filepath.Join(EC_APP_PATH, "bin", "sedotanread")
	// }

	// arrcmd = append(arrcmd, apppath)
	// arrcmd = append(arrcmd, `-readtype=logfile`)
	// arrcmd = append(arrcmd, `-datetime=`+payload.Date)
	// arrcmd = append(arrcmd, `-nameid=`+payload.ID)
	// arrcmd = append(arrcmd, `-datas=`+toolkit.JsonString([]interface{}{o}))

	// cmd := exec.Command(arrcmd[0], arrcmd[1:]...)
	// byteoutput, err := cmd.CombinedOutput()
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	logPath := ""
	for _, v := range []interface{}{o} {
		vMap, _ := toolkit.ToM(v)

		logConf := vMap["logconf"].(map[string]interface{})
		dateNowFormat := logConf["filepattern"].(string)
		logpathconfig := logConf["logpath"].(string)
		theDate := cast.String2Date(payload.Date, "YYYY/MM/dd HH:mm:ss")
		theDateString := cast.Date2String(theDate, dateNowFormat)
		fileName := fmt.Sprintf("%s-%s", logConf["filename"], theDateString)
		logPath = logpathconfig + fileName
	}

	client, server, err := w.ConnectToSedotanServer()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	SshClient := *client

	apppath := ""
	if server.OS == "linux" {
		apppath = server.AppPath + `/cli/sedotanread`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="logfile"`)
		arrcmd = append(arrcmd, `-nameid="`+payload.ID+`"`)
		arrcmd = append(arrcmd, `-pathfile="`+logPath+`"`)
		arrcmd = append(arrcmd, `-datetime="`+payload.Date+`"`)
	} else {
		apppath = server.AppPath + `\bin\sedotanread.exe`
		arrcmd = append(arrcmd, apppath)
		arrcmd = append(arrcmd, `-readtype="logfile"`)
		arrcmd = append(arrcmd, `-nameid=`+payload.ID+`"`)
		arrcmd = append(arrcmd, `-pathfile=`+logPath+`"`)
		arrcmd = append(arrcmd, `-datetime="`+payload.Date+`"`)
	}

	cmds := strings.Join(append(arrcmd[:1], arrcmd[1:]...), " ")
	fmt.Println("====>", cmds)
	output, err := SshClient.GetOutputCommandSsh(cmds)
	if err != nil {
		fmt.Println(err)
	}

	err = toolkit.UnjsonFromString(output, &result)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, result["DATA"], "")
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
	configName := fmt.Sprintf("%s.json", new(colonycore.WebGrabber).TableName())
	srcOriginal := f.Join(EC_APP_PATH, "config", configName)

	bytes, err := ioutil.ReadFile(srcOriginal)
	if err != nil {
		return err
	}

	ifaces, _ := net.Interfaces()
	addr, _ := ifaces[len(ifaces)-1].Addrs()
	ip := addr[len(addr)-1].(*net.IPNet).IP.String()

	srcString := string(bytes)
	for _, keyword := range []string{`host":"localhost`, `host":"http://localhost`, `host":"https://localhost`} {
		if strings.Contains(srcString, keyword) {
			newKeyword := strings.Replace(keyword, "localhost", ip, -1)
			srcString = strings.Replace(srcString, keyword, newKeyword, -1)
		}
	}

	src := f.Join(EC_APP_PATH, "config", "tmp"+configName)
	os.Create(src)
	err = ioutil.WriteFile(src, []byte(srcString), 755)
	if err != nil {
		return err
	}

	filters := dbox.Eq("os", "linux")
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
		setting, _, err := (&each).Connect()
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

	os.Remove(src)

	if len(errs) == len(all) && len(errs) > 0 {
		return errs[0]
	}

	fmt.Println(configName, "synced w/ errors", errs)

	return nil
}

func (w *WebGrabberController) ConnectToSedotanServer() (*SshSetting, *colonycore.Server, error) {
	filter := dbox.Eq("os", "linux")
	cursor, err := colonycore.Find(new(colonycore.Server), filter)
	if err != nil {
		return nil, nil, err
	}

	data := []colonycore.Server{}
	err = cursor.Fetch(&data, 0, true)
	if err != nil {
		return nil, nil, err
	}

	if len(data) == 0 {
		return nil, nil, errors.New("No sedotan server found")
	}

	server := data[0]

	var client SshSetting
	client.SSHHost = server.ServiceSSH.Host
	client.SSHAuthType = SSHAuthType_Password
	client.SSHUser = server.ServiceSSH.User
	client.SSHPassword = server.ServiceSSH.Pass

	return &client, &server, nil
}
