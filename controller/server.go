package controller

/** NOTE

#### Linux/OSX
 - make nested directory						mkdir -p "path/to/file"
 - remove directory & it's content				rm -rf "path/to/file"
 - move directory								mv "path/to/file" "path/to/destination"
 - change permission							chmod 755 "path/to/file"
 - set path	(append to .bashrc)					sed -i '/export EC_APP_PATH/d' ~/.bashrc
 													&& echo 'export EC_APP_PATH="path/to/file"' >> ~/.bashrc"
 - show sub dir									ls

#### Windows
 - make nested directory						mkdir "path\to\file"
 - remove directory & it's content				rmdir /S /Q "path\to\file"
 - move directory								move "path\to\file" "path\to\destination"
 - change permission							cacls "path\to\file" /g everyone:f 755
 - set path (min: windows 7)					setx EC_APP_PATH "path\to\file"
 - show sub dir									dir

*/

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/live"
	"github.com/eaciit/toolkit"
)

type ServerController struct {
	App
}

func CreateServerController(s *knot.Server) *ServerController {
	var controller = new(ServerController)
	controller.Server = s
	return controller
}

func (s *ServerController) GetServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		Search   string `json:"search"`
		ServerOS string `json:"serverOS"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	filters := []*dbox.Filter{}
	if payload.Search != "" {
		filters = append(filters, dbox.Or(
			dbox.Contains("_id", payload.Search),
			dbox.Contains("os", payload.Search),
			dbox.Contains("host", payload.Search),
		))
	}
	if payload.ServerOS != "" {
		filters = append(filters, dbox.Eq("os", payload.ServerOS))
	}

	var query *dbox.Filter
	if len(filters) > 0 {
		query = dbox.And(filters...)
	}

	cursor, err := colonycore.Find(new(colonycore.Server), query)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	data := []colonycore.Server{}
	err = cursor.Fetch(&data, 0, false)
	if err == nil {
		defer cursor.Close()
	}

	return helper.CreateResult(true, data, "")
}

func (s *ServerController) SaveServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	r.Request.ParseMultipartForm(32 << 20)
	r.Request.ParseForm()

	path := filepath.Join(EC_DATA_PATH, "server", "log")
	log, _ := toolkit.NewLog(false, true, path, "log-%s", "20060102-1504")

	data := new(colonycore.Server)
	if r.Request.FormValue("serviceSSH[type]") == "File" {
		log.AddLog("Get forms", "INFO")
		dataRaw := map[string]interface{}{}
		err := r.GetForms(&dataRaw)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}

		log.AddLog("Serding data", "INFO")
		err = toolkit.Serde(dataRaw, &data, "json")
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}
	} else {
		log.AddLog("Get payload", "INFO")
		err := r.GetPayload(&data)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	if data.ServiceSSH.Type == "File" {
		log.AddLog("Fetching public key", "INFO")
		reqFileName := "privatekey"
		file, _, err := r.Request.FormFile(reqFileName)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}

		if file != nil {
			log.AddLog("Saving public key", "INFO")
			data.ServiceSSH.File = filepath.Join(EC_DATA_PATH, "server", "privatekeys", data.ID)
			_, _, err = helper.FetchThenSaveFile(r.Request, reqFileName, data.ServiceSSH.File)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	}

	if data.IsAccessValid("node") {
		if data.OS == "linux" {
			if err := data.InstallColonyOnLinux(log); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else {
			if err := data.InstallColonyOnWindows(log); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}

		data.DetectInstalledLang()
		data.DetectService()

		log.AddLog("Restart sedotand", "INFO")
		if _, err := data.ToggleSedotanService("start stop", data.ID); err != nil {
			log.AddLog(err.Error(), "ERROR")
		}
	}

	if data.IsAccessValid("hdfs") {
		log.AddLog(fmt.Sprintf("SSH Connect %v", data), "INFO")
		hdfsConfig := hdfs.NewHdfsConfig(data.ServiceHDFS.Host, data.ServiceHDFS.User)
		hdfsConfig.Password = data.ServiceHDFS.Pass

		hadeepes, err := hdfs.NewWebHdfs(hdfsConfig)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}

		_, err = hadeepes.List("/")
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		hadeepes.Config.TimeOut = 5 * time.Millisecond
		hadeepes.Config.PoolSize = 100
	}

	log.AddLog(fmt.Sprintf("Saving data ID: %s", data.ID), "INFO")
	err := colonycore.Save(data)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (s *ServerController) PingServer(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Server)
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	prefixStatus := []string{}
	isNodeOK := true
	isHDFSOK := true

	(func() {
		if _, err := payload.Ping("node"); err != nil {
			isNodeOK = false
			prefixStatus = append(prefixStatus, fmt.Sprintf("Error on node server: %s", err.Error()))
		}
	}())

	(func() {
		if _, err := payload.Ping("hdfs"); err != nil {
			isNodeOK = false
			prefixStatus = append(prefixStatus, fmt.Sprintf("Error on node server: %s", err.Error()))
		}
	}())

	isSuccess := (isNodeOK || isHDFSOK)
	message := strings.Join(prefixStatus, ". ")
	return helper.CreateResult(isSuccess, nil, message)
}

func (s *ServerController) SelectServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Server)
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

func (s *ServerController) DeleteServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Server)
	var data []string
	err := r.GetPayload(&data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, val := range data {
		if val != "" {
			payload.ID = val
			err = colonycore.Delete(payload)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	}

	return helper.CreateResult(true, data, "")
}

func (s *ServerController) CheckPing(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		IP string `json:"ip"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	p := new(live.Ping)
	p.Type = live.PingType_Network
	p.Host = payload.IP

	if err := p.Check(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, p.LastStatus, "")
}
