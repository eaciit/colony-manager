package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/live"
	"github.com/eaciit/sshclient"
	"github.com/eaciit/toolkit"
	"golang.org/x/crypto/ssh"
	"path/filepath"
	"strings"
	"time"
)

type ServerController struct {
	App
}

func CreateServerController(s *knot.Server) *ServerController {
	fmt.Sprintln("test")
	var controller = new(ServerController)
	controller.Server = s
	return controller
}

func (s *ServerController) GetServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		Search     string `json:"search"`
		ServerOS   string `json:"serverOS"`
		ServerType string `json:"serverType"`
		SSHType    string `json:"sshType"`
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
			dbox.Contains("serverType", payload.Search),
			dbox.Contains("sshtype", payload.Search),
		))
	}
	if payload.ServerOS != "" {
		filters = append(filters, dbox.Eq("os", payload.ServerOS))
	}
	if payload.ServerType != "" {
		filters = append(filters, dbox.Eq("serverType", payload.ServerType))
	}
	if payload.SSHType != "" {
		filters = append(filters, dbox.Eq("sshtype", payload.SSHType))
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
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (s *ServerController) SaveServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	r.Request.ParseMultipartForm(32 << 20)
	r.Request.ParseForm()

	path := filepath.Join(EC_DATA_PATH, "server", "log")
	log, _ := toolkit.NewLog(false, true, path, "log-%s", "20060102-1504")

	data := new(colonycore.Server)
	if r.Request.FormValue("sshtype") == "File" {
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

	if data.SSHType == "File" {
		log.AddLog("Fetching public key", "INFO")
		reqFileName := "privatekey"
		file, _, err := r.Request.FormFile(reqFileName)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			return helper.CreateResult(false, nil, err.Error())
		}

		if file != nil {
			log.AddLog("Saving public key", "INFO")
			data.SSHFile = filepath.Join(EC_DATA_PATH, "server", "privatekeys", data.ID)
			_, _, err = helper.FetchThenSaveFile(r.Request, reqFileName, data.SSHFile)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	}
	oldData := new(colonycore.Server)

	log.AddLog(fmt.Sprintf("Find server ID: %s", data.ID), "INFO")
	cursor, err := colonycore.Find(new(colonycore.Server), dbox.Eq("_id", data.ID))
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}
	oldDataAll := []colonycore.Server{}
	err = cursor.Fetch(&oldDataAll, 0, false)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	if len(oldDataAll) > 0 {
		oldData = &oldDataAll[0]
	}

	log.AddLog(fmt.Sprintf("Delete data ID: %s", data.ID), "INFO")
	err = colonycore.Delete(data)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	log.AddLog(fmt.Sprintf("Saving data ID: %s", data.ID), "INFO")
	err = colonycore.Save(data)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	if data.ServerType == "hdfs" {
		log.AddLog(fmt.Sprintf("SSH Connect %v", data), "INFO")
		hadeepes, err := hdfs.NewWebHdfs(hdfs.NewHdfsConfig(data.Host, data.SSHUser))
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

		return helper.CreateResult(true, nil, "")
	}

	log.AddLog(fmt.Sprintf("SSH Connect %v", data), "INFO")
	sshSetting, client, err := s.SSHConnect(data)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}
	defer client.Close()

	if data.OS == "linux" {
		setEnvPath := func() interface{} {
			cmd1 := `sed -i '/export EC_APP_PATH/d' ~/.bashrc`
			log.AddLog(cmd1, "INFO")
			sshSetting.GetOutputCommandSsh(cmd1)

			cmd2 := `sed -i '/export EC_DATA_PATH/d' ~/.bashrc`
			log.AddLog(cmd2, "INFO")
			sshSetting.GetOutputCommandSsh(cmd2)

			cmd3 := "echo 'export EC_APP_PATH=" + data.AppPath + "' >> ~/.bashrc"
			log.AddLog(cmd3, "INFO")
			sshSetting.GetOutputCommandSsh(cmd3)

			cmd4 := "echo 'export EC_DATA_PATH=" + data.DataPath + "' >> ~/.bashrc"
			log.AddLog(cmd4, "INFO")
			sshSetting.GetOutputCommandSsh(cmd4)
			return nil
		}

		if oldData.AppPath == "" || oldData.DataPath == "" {
			cmdRmAppPath := fmt.Sprintf("rm -rf %s", data.AppPath)
			log.AddLog(cmdRmAppPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmAppPath)

			cmdRmDataPath := fmt.Sprintf("rm -rf %s", data.DataPath)
			log.AddLog(cmdRmDataPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmDataPath)

			cmds := []string{
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "bin")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "cli")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "config")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "daemon")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "src")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.AppPath, "web", "share")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "datagrabber", "log")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "datagrabber", "output")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "datasource", "upload")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "server", "privatekeys")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "webgrabber", "history")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "webgrabber", "historyrec")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "webgrabber", "log")),
				fmt.Sprintf(`mkdir -p "%s"`, filepath.Join(data.DataPath, "webgrabber", "output")),
			}
			for _, each := range cmds {
				log.AddLog(each, "INFO")
				_, err := sshSetting.GetOutputCommandSsh(each)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())	
				}
			}
			
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			checkPathCmd := fmt.Sprintf("ls %s", data.AppPath)
			isPathCreated, err := sshSetting.GetOutputCommandSsh(checkPathCmd)
			log.AddLog(checkPathCmd, "INFO")
			if err != nil || strings.TrimSpace(isPathCreated) == "" {
				errString := fmt.Sprintf("Invalid path. %s", err.Error())
				log.AddLog(errString, "ERROR")
				return helper.CreateResult(false, nil, errString)
			}

			if res := setEnvPath(); res != nil {
				return res
			}
		} else if oldData.AppPath != data.AppPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.AppPath, data.AppPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if res := setEnvPath(); res != nil {
				return res
			}
		} else if oldData.DataPath != data.DataPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.DataPath, data.DataPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if res := setEnvPath(); res != nil {
				return res
			}
		}
	} else {
		// windows
	}

	return helper.CreateResult(true, nil, "")
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

			// delPath := filepath.Join(unzipDest, payload.ID)
			// err = deleteDirectory(unzipDest, delPath, payload.ID)
			// if err != nil {
			// 	fmt.Println("Error : ", err)
			// 	return err
			// }
		}
	}

	return helper.CreateResult(true, data, "")
}

func (s *ServerController) SSHConnect(payload *colonycore.Server) (sshclient.SshSetting, *ssh.Client, error) {
	client := sshclient.SshSetting{}
	client.SSHHost = payload.Host

	if payload.SSHType == "File" {
		client.SSHAuthType = sshclient.SSHAuthType_Certificate
		client.SSHKeyLocation = payload.SSHFile
	} else {
		client.SSHAuthType = sshclient.SSHAuthType_Password
		client.SSHUser = payload.SSHUser
		client.SSHPassword = payload.SSHPass
	}

	theClient, err := client.Connect()

	return client, theClient, err
}

func (s *ServerController) TestConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Server)
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if payload.ServerType == "hdfs" {
		hadeepes, err := hdfs.NewWebHdfs(hdfs.NewHdfsConfig(payload.Host, payload.SSHPass))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		_, err = hadeepes.List("/")
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, payload, "")
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	a, b, err := s.SSHConnect(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer b.Close()

	c, err := a.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer c.Close()

	return helper.CreateResult(true, payload, "")
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
