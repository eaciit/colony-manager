package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	. "github.com/eaciit/sshclient"
	. "github.com/eaciit/toolkit"
	// "strings"
)

type ServerController struct {
	App
}

func CreateServerController(s *knot.Server) *ServerController {
	var controller = new(ServerController)
	controller.Server = s
	return controller
}

func SshCopyFile(data *colonycore.Server) {
	// t.Skip("Skip : Comment this line to do test")
	var SshClient SshSetting

	SshClient.SSHHost = data.ID
	SshClient.SSHUser = data.SSHUser

	if data.SSHType == "Credentials" {
		SshClient.SSHAuthType = SSHAuthType_Password
		SshClient.SSHPassword = data.SSHPass
	} else {
		SshClient.SSHAuthType = SSHAuthType_Certificate
		SshClient.SSHKeyLocation = data.SSHFile
	}
	fmt.Println("data ssh : ", data)
	fmt.Println("SshClient : ", SshClient)

	filepath := "C:\\projects\\go\\src\\github.com\\eaciit\\colony-app\\apps\\colony-manager.zip"
	destination := data.Folder

	e := SshClient.CopyFileSsh(filepath, destination)
	if e != nil {
		fmt.Println("error : ", e)
	} else {
		fmt.Println("Copy File Success")
	}
}

func commandSSH(data *colonycore.Server, cmdType string, command []string) {
	var SshClient SshSetting

	SshClient.SSHHost = data.ID
	SshClient.SSHUser = data.SSHUser

	if data.SSHType == "Credentials" {
		SshClient.SSHAuthType = SSHAuthType_Password
		SshClient.SSHPassword = data.SSHPass
	} else {
		SshClient.SSHAuthType = SSHAuthType_Certificate
		SshClient.SSHKeyLocation = data.SSHFile
	}

	var commands []string

	if cmdType == "extract" {
		commands = append(commands, data.CmdExtract)
	} else if cmdType == "newfile" {
		commands = append(commands, data.CmdNewFile)
	} else if cmdType == "copy" {
		commands = append(commands, data.CmdCopy)
	} else if cmdType == "newdir" {
		commands = append(commands, data.CmdDirectory)
	} else {
		commands = command
	}

	res, e := SshClient.RunCommandSsh(commands...)

	if e != nil {
		fmt.Println("Error : ", e)
	} else {
		fmt.Println("RUN, ", res)
	}
}

func (s *ServerController) GetServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursor, err := colonycore.Find(new(colonycore.Server), nil)
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

	// payload := map[string]interface{}{}
	// err := r.GetPayload(&payload)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	data := new(colonycore.Server)
	err := r.GetPayload(&data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	// data.ID = "192.168.0.200"
	// data.Type = "local"
	// data.Folder = "/data"
	// data.OS = "linux"
	// data.Enable = true
	// data.SSHType = "DDL: Credential"
	// data.SSHFile = "knot-server"
	// data.SSHUser = "knot"
	// data.SSHPass = "knotpass"
	fmt.Println("data server : ", data)
	err = colonycore.Delete(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	// Printf("data:%v\n", data)

	// data := new(colonycore.Server)
	// data.ID = "192.168.56.101:22"
	// data.Type = "remote"
	// data.Folder = "/etc/apps"
	// data.OS = "linux"
	// data.Enable = true
	// data.SSHType = "Credentials"
	// data.SSHFile = "/home/b/.ssh/id_rsa"
	// data.SSHUser = "ubuntu"
	// data.SSHPass = "ubuntu"
	// data.CmdExtract = "unzip "
	// data.CmdNewFile = "nano "
	// data.CmdCopy = "cp "
	// data.CmdDirectory = "mkdir "

	// SshCopyFile(data)
	// // commandSSH(data, "extract", "/etc/apps/colony-manager.zip")
	// cmd := []string{"/etc/apps/newssh"}
	// commandSSH(data, "newdir", cmd)

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
	Printf("data:%v\n", payload)
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

func (s *ServerController) ServersFilter(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	text := payload["inputText"].(string)
	var query *dbox.Filter

	if text != "" {
		query = dbox.Or(dbox.Contains("_id", text),
			dbox.Contains("type", text),
			dbox.Contains("os", text),
			dbox.Contains("folder", text))
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
