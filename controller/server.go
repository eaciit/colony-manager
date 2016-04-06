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
	"errors"
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
	if err == nil {
		defer cursor.Close()
		if len(oldDataAll) > 0 {
			oldData = &oldDataAll[0]
		}
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
	sshSetting, client, err := data.Connect()
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}
	defer client.Close()

	if data.OS == "linux" {
		setEnvPath := func() error {
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
			cmdTestUnzip := "unzip"
			log.AddLog(cmdTestUnzip, "INFO")
			unzipRes, err := sshSetting.GetOutputCommandSsh(cmdTestUnzip)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}
			if strings.Contains(strings.ToLower(unzipRes), "not found") {
				log.AddLog("Need to install `unzip` on the server", "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			cmdRmAppPath := fmt.Sprintf("rm -rf %s", data.AppPath)
			log.AddLog(cmdRmAppPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmAppPath)

			cmdMkdirAppPath := fmt.Sprintf(`mkdir -p "%s"`, data.AppPath)
			log.AddLog(cmdMkdirAppPath, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(cmdMkdirAppPath)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			cmdRmDataPath := fmt.Sprintf("rm -rf %s", data.DataPath)
			log.AddLog(cmdRmDataPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmDataPath)

			cmdMkdirDataPath := fmt.Sprintf(`mkdir -p "%s"`, data.DataPath)
			log.AddLog(cmdMkdirDataPath, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(cmdMkdirDataPath)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			appDistSrc := filepath.Join(EC_DATA_PATH, "dist", "app-root.zip")
			err = sshSetting.SshCopyByPath(appDistSrc, data.AppPath)
			log.AddLog(fmt.Sprintf("scp from %s to %s", appDistSrc, data.AppPath), "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			appDistSrcDest := filepath.Join(data.AppPath, "app-root.zip")
			appDistSrcDest = strings.Replace(appDistSrcDest, "\\", "/", -1)
			unzipAppCmd := strings.Replace(strings.Replace(data.CmdExtract, "%1", appDistSrcDest, -1), "%2", data.AppPath, -1)
			log.AddLog(unzipAppCmd, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(unzipAppCmd)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			rmTempAppPath := fmt.Sprintf("rm -rf %s", appDistSrcDest)
			_, err = sshSetting.GetOutputCommandSsh(rmTempAppPath)
			log.AddLog(rmTempAppPath, "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			dataDistSrc := filepath.Join(EC_DATA_PATH, "dist", "data-root.zip")
			err = sshSetting.SshCopyByPath(dataDistSrc, data.DataPath)
			log.AddLog(fmt.Sprintf("scp from %s to %s", dataDistSrc, data.DataPath), "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			dataDistSrcDest := filepath.Join(data.DataPath, "data-root.zip")
			dataDistSrcDest = strings.Replace(dataDistSrcDest, "\\", "/", -1)
			unzipDataCmd := strings.Replace(strings.Replace(data.CmdExtract, "%1", dataDistSrcDest, -1), "%2", data.DataPath, -1)
			log.AddLog(unzipDataCmd, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(unzipDataCmd)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			rmTempDataPath := fmt.Sprintf("rm -rf %s", dataDistSrcDest)
			_, err = sshSetting.GetOutputCommandSsh(rmTempDataPath)
			log.AddLog(rmTempDataPath, "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			osArchCmd := "uname -m"
			log.AddLog(osArchCmd, "INFO")
			osArchRes, err := sshSetting.GetOutputCommandSsh(osArchCmd)
			osArchRes = strings.TrimSpace(osArchRes)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			for _, each := range []string{"sedotand", "sedotans", "sedotanw"} {
				src := filepath.Join(EC_APP_PATH, "cli", "dist", fmt.Sprintf("linux_%s", osArchRes), each)
				dst := filepath.Join(data.AppPath, "cli", each)

				rmSedotanCmd := fmt.Sprintf("rm -rf %s", dst)
				log.AddLog(rmSedotanCmd, "INFO")
				_, err := sshSetting.GetOutputCommandSsh(rmSedotanCmd)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}

				log.AddLog(fmt.Sprintf("scp %s to %s", src, dst), "INFO")
				err = sshSetting.SshCopyByPath(src, dst)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}

				chmodCliCmd := fmt.Sprintf("chmod 755 %s", dst)
				log.AddLog(chmodCliCmd, "INFO")
				_, err = sshSetting.GetOutputCommandSsh(chmodCliCmd)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}
			}

			checkPathCmd := fmt.Sprintf("ls %s", data.AppPath)
			isPathCreated, err := sshSetting.GetOutputCommandSsh(checkPathCmd)
			log.AddLog(checkPathCmd, "INFO")
			if err != nil || strings.TrimSpace(isPathCreated) == "" {
				errString := fmt.Sprintf("Invalid path. %s", err.Error())
				log.AddLog(errString, "ERROR")
				return helper.CreateResult(false, nil, errString)
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if oldData.AppPath != data.AppPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.AppPath, data.AppPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if oldData.DataPath != data.DataPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.DataPath, data.DataPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	} else {
		setEnvPath := func() error {
			cmd1 := fmt.Sprintf(`setx EC_APP_PATH "%s"`, data.AppPath)
			log.AddLog(cmd1, "INFO")
			sshSetting.GetOutputCommandSsh(cmd1)

			cmd2 := fmt.Sprintf(`setx EC_DATA_PATH "%s"`, data.DataPath)
			log.AddLog(cmd2, "INFO")
			sshSetting.GetOutputCommandSsh(cmd2)

			return nil
		}

		if oldData.AppPath == "" || oldData.DataPath == "" {
			cmdTestUnzip := "unzip"
			log.AddLog(cmdTestUnzip, "INFO")
			unzipRes, err := sshSetting.GetOutputCommandSsh(cmdTestUnzip)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}
			if strings.Contains(strings.ToLower(unzipRes), "not recognized") {
				log.AddLog("Need to install `unzip` on the server", "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			cmdRmAppPath := fmt.Sprintf("rmdir /S /Q %s", data.AppPath)
			log.AddLog(cmdRmAppPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmAppPath)

			cmdMkdirAppPath := fmt.Sprintf(`mkdir "%s"`, data.AppPath)
			log.AddLog(cmdMkdirAppPath, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(cmdMkdirAppPath)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			cmdRmDataPath := fmt.Sprintf("rmdir /S /Q %s", data.DataPath)
			log.AddLog(cmdRmDataPath, "INFO")
			sshSetting.GetOutputCommandSsh(cmdRmDataPath)

			cmdMkdirDataPath := fmt.Sprintf(`mkdir "%s"`, data.DataPath)
			log.AddLog(cmdMkdirDataPath, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(cmdMkdirDataPath)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			appDistSrc := filepath.Join(EC_DATA_PATH, "dist", "app-root.zip")
			err = sshSetting.SshCopyByPath(appDistSrc, data.AppPath)
			log.AddLog(fmt.Sprintf("scp from %s to %s", appDistSrc, data.AppPath), "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			appDistSrcDest := filepath.Join(data.AppPath, "app-root.zip")
			appDistSrcDest = strings.Replace(appDistSrcDest, "\\", "/", -1)
			unzipAppCmd := strings.Replace(strings.Replace(data.CmdExtract, "%1", appDistSrcDest, -1), "%2", data.AppPath, -1)
			log.AddLog(unzipAppCmd, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(unzipAppCmd)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			rmTempAppPath := fmt.Sprintf("rmdir /S /Q %s", appDistSrcDest)
			_, err = sshSetting.GetOutputCommandSsh(rmTempAppPath)
			log.AddLog(rmTempAppPath, "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			dataDistSrc := filepath.Join(EC_DATA_PATH, "dist", "data-root.zip")
			err = sshSetting.SshCopyByPath(dataDistSrc, data.DataPath)
			log.AddLog(fmt.Sprintf("scp from %s to %s", dataDistSrc, data.DataPath), "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			dataDistSrcDest := filepath.Join(data.DataPath, "data-root.zip")
			dataDistSrcDest = strings.Replace(dataDistSrcDest, "\\", "/", -1)
			unzipDataCmd := strings.Replace(strings.Replace(data.CmdExtract, "%1", dataDistSrcDest, -1), "%2", data.DataPath, -1)
			log.AddLog(unzipDataCmd, "INFO")
			_, err = sshSetting.GetOutputCommandSsh(unzipDataCmd)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			rmTempDataPath := fmt.Sprintf("rmdir /S /Q %s", dataDistSrcDest)
			_, err = sshSetting.GetOutputCommandSsh(rmTempDataPath)
			log.AddLog(rmTempDataPath, "INFO")
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			osArchCmd := "echo %PROCESSOR_ARCHITECTURE%"
			log.AddLog(osArchCmd, "INFO")
			osArchRes, err := sshSetting.GetOutputCommandSsh(osArchCmd)
			osArchRes = strings.TrimSpace(osArchRes)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}
			if osArchRes != "x86" {
				osArchRes = "x86_64"
			}

			for _, each := range []string{"sedotand", "sedotans", "sedotanw"} {
				src := filepath.Join(EC_APP_PATH, "cli", "dist", fmt.Sprintf("windows_%s", osArchRes), each)
				dst := filepath.Join(data.AppPath, "cli", each)

				rmSedotanCmd := fmt.Sprintf("rmdir /S /Q %s", dst)
				log.AddLog(rmSedotanCmd, "INFO")
				_, err := sshSetting.GetOutputCommandSsh(rmSedotanCmd)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}

				log.AddLog(fmt.Sprintf("scp %s to %s", src, dst), "INFO")
				err = sshSetting.SshCopyByPath(src, dst)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}

				chmodCliCmd := fmt.Sprintf("cacls %s /g everyone:f 755", dst)
				log.AddLog(chmodCliCmd, "INFO")
				_, err = sshSetting.GetOutputCommandSsh(chmodCliCmd)
				if err != nil {
					log.AddLog(err.Error(), "ERROR")
					return helper.CreateResult(false, nil, err.Error())
				}
			}

			checkPathCmd := fmt.Sprintf("dir %s", data.AppPath)
			isPathCreated, err := sshSetting.GetOutputCommandSsh(checkPathCmd)
			log.AddLog(checkPathCmd, "INFO")
			if err != nil || strings.TrimSpace(isPathCreated) == "" {
				errString := fmt.Sprintf("Invalid path. %s", err.Error())
				log.AddLog(errString, "ERROR")
				return helper.CreateResult(false, nil, errString)
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if oldData.AppPath != data.AppPath {
			moveDir := fmt.Sprintf(`move %s %s`, oldData.AppPath, data.AppPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if oldData.DataPath != data.DataPath {
			moveDir := fmt.Sprintf(`move %s %s`, oldData.DataPath, data.DataPath)
			log.AddLog(moveDir, "INFO")
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return helper.CreateResult(false, nil, err.Error())
			}

			if err := setEnvPath(); err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	}

	data.DetectInstalledLang()

	log.AddLog(fmt.Sprintf("Saving data ID: %s", data.ID), "INFO")
	err = colonycore.Save(data)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	log.AddLog("Restart sedotand", "INFO")
	_, err = s.ToggleSedotanService("start stop", data.ID)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
	}

	return helper.CreateResult(true, nil, "")
}

func (s *ServerController) ToggleSedotanService(op string, id string) (bool, error) {
	data := new(colonycore.Server)
	cursor, err := colonycore.Find(new(colonycore.Server), dbox.Eq("_id", id))
	if err != nil {
		return false, err
	}
	dataAll := []colonycore.Server{}
	err = cursor.Fetch(&dataAll, 0, false)
	if err != nil {
		return false, err
	}
	defer cursor.Close()

	if len(dataAll) == 0 {
		return false, errors.New("Server not found")
	}

	data = &dataAll[0]

	sshSetting, client, err := data.Connect()
	if err != nil {
		return false, err
	}
	defer client.Close()

	pgrepSedotanCmd, err := sshSetting.GetOutputCommandSsh("pgrep sedotand")
	if err != nil {
		// do something
	}
	isOn := false
	pid := strings.TrimSpace(pgrepSedotanCmd)
	if pid != "" {
		isOn = true
	}

	if strings.Contains(op, "stat") {
		return isOn, nil
	}

	if strings.Contains(op, "stop") {
		if pid != "" {
			killProcessCmd := fmt.Sprintf("kill -9 %s", pid)
			_, err = sshSetting.GetOutputCommandSsh(killProcessCmd)
			if err != nil {
				// do something
			}

			if !strings.Contains(op, "start") && err != nil {
				return isOn, err
			}
		}
	}

	if strings.Contains(op, "start") {
		sedotanConfigArg := fmt.Sprintf(`-config="%s"`, filepath.Join(data.AppPath, "config", "webgrabbers.json"))
		sedotanLogArg := fmt.Sprintf(`-logpath="%s"`, filepath.Join(data.DataPath, "daemon"))
		runSedotanCmd := fmt.Sprintf("cd %s && ./sedotand %s %s", filepath.Join(data.AppPath, "cli"), sedotanConfigArg, sedotanLogArg)
		err = helper.RunCommandWithTimeout(&sshSetting, runSedotanCmd, 5)
		if err != nil {
			return isOn, err
		}
	}

	return isOn, nil
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

	a, b, err := payload.Connect()
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
