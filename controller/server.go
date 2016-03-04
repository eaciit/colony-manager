package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/live"
	"github.com/eaciit/sshclient"
	"github.com/eaciit/toolkit"
	"golang.org/x/crypto/ssh"
	"path/filepath"
	// "strings"

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

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)

	query := dbox.Or(dbox.Contains("_id", search), dbox.Contains("os", search), dbox.Contains("host", search), dbox.Contains("sshtype", search))

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

	data := new(colonycore.Server)
	if r.Request.FormValue("sshtype") == "File" {
		dataRaw := map[string]interface{}{}
		err := r.GetForms(&dataRaw)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		err = toolkit.Serde(dataRaw, &data, "json")
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	} else {
		err := r.GetPayload(&data)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	if data.SSHType == "File" {
		reqFileName := "privatekey"
		file, _, err := r.Request.FormFile(reqFileName)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		if file != nil {
			data.SSHFile = filepath.Join(EC_DATA_PATH, "server", "privatekeys", data.ID)
			_, _, err = helper.FetchThenSaveFile(r.Request, reqFileName, data.SSHFile)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	}
	oldData := new(colonycore.Server)

	cursor, err := colonycore.Find(new(colonycore.Server), dbox.Eq("_id", data.ID))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	oldDataAll := []colonycore.Server{}
	err = cursor.Fetch(&oldDataAll, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	
	defer cursor.Close()

	if len(oldDataAll) > 0 {
		oldData = &oldDataAll[0]
	}

	err = colonycore.Delete(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	sshSetting, client, err := s.SSHConnect(data)
	// output,err := sshclient.Search(sshSetting,data.AppPath,false,"panjang")
	output, err := sshSetting.GetOutputCommandSsh("ls")
	// // find , err sshclient.Search("/ho")
	fmt.Println(output)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer client.Close()

	if data.OS == "linux" {
		setEnvPath := func() interface{} {
			sshSetting.GetOutputCommandSsh(`sed -i '/export EC_APP_PATH/d' ~/.bashrc`)
			sshSetting.GetOutputCommandSsh(`sed -i '/export EC_DATA_PATH/d' ~/.bashrc`)
			sshSetting.GetOutputCommandSsh("echo 'export EC_APP_PATH=" + data.AppPath + "' >> ~/.bashrc")
			sshSetting.GetOutputCommandSsh("echo 'export EC_DATA_PATH=" + data.DataPath + "' >> ~/.bashrc")

			return nil
		}

		if oldData.AppPath == "" || oldData.DataPath == "" {
			_, err := sshSetting.RunCommandSsh(
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
			)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			if res := setEnvPath(); res != nil {
				return res
			}
		} else if oldData.AppPath != data.AppPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.AppPath, data.AppPath)
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			if res := setEnvPath(); res != nil {
				return res
			}
		} else if oldData.DataPath != data.DataPath {
			moveDir := fmt.Sprintf(`mv %s %s`, oldData.DataPath, data.DataPath)
			_, err := sshSetting.GetOutputCommandSsh(moveDir)
			if err != nil {
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

// func (s *ServerController) CheckPath(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := struct {
// 		Path   string `json:"Path"`
// 		Server string
// 	}{}
// 	err := r.GetPayload(&payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
 
// 	Path := payload.Path
// 	// res, errr := sshSetting.GetOutputCommandSsh("find "+Path)
// 	// if errr != nil {
// 	// 	return helper.CreateResult(false, nil, errr.Error())
// 	// }
// 	// if !strings.Contains(string(res), "No such file or directory") {
// 	// 	return helper.CreateResult(true, nil, "Ok")
// 	// }else{
// 	// 	return helper.CreateResult(true, nil, "Nok")
// 	// }

// 	server := new(colonycore.Server)
// 	err = colonycore.Get(server, payload.Server)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	sshSetting, _, err := new(ServerController).SSHConnect(server)


	
	 
// }

// func (s *ServerController) CheckPath(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := new(colonycore.Server)
// 	err := r.GetPayload(&payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	err = colonycore.Get(payload, payload.ID)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	sshSetting, b, err := s.SSHConnect(payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	if output, err := sshSetting.RunCommandSsh("find "+Path); err != nil || strings.Contains(output, "No such file or directory") {
// 		return helper.CreateResult(false, nil, "Path is not exists")


// 	}else{
// 		return helper.CreateResult(false, nil, "ok")
// 	}

// 	defer b.Close()
// }