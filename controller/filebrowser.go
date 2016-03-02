package controller

import (
	// "encoding/json"
	// "errors"
	// "fmt"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/sshclient"
	"github.com/frezadev/sshclient"
	// "github.com/eaciit/colony-core/v0"
	"github.com/frezadev/colony-core/v0"
	// "github.com/eaciit/colony-manager/helper"
	"github.com/frezadev/colony-manager/helper"
	// "github.com/eaciit/toolkit"
	// "io"
	// "net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	// "strings"
)

type FileBrowserController struct {
	App
}

func CreateFileBrowserController(s *knot.Server) *FileBrowserController {
	var controller = new(FileBrowserController)
	controller.Server = s
	return controller
}

func (s *FileBrowserController) GetTree(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	// search := payload["search"].(string)

	query := dbox.Or(dbox.Contains("_id", "FREZA"))

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

	server := data[0]

	setting, err := sshConnect(&server)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.ServerType == "node" {
		list, err := sshclient.List(setting, server.DataPath, true)

		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		result, err := colonycore.ConstructFileInfo(list)

		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		return helper.CreateResult(true, result, "")
	}

	return helper.CreateResult(true, data, "")
}

func sshConnect(payload *colonycore.Server) (sshclient.SshSetting, error) {
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

	_, err := client.Connect()

	return client, err
}
