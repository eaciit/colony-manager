package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	. "github.com/eaciit/toolkit"
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
	// r.Config.OutputType = knot.OutputJson

	// payload := map[string]interface{}{}
	// err := r.GetPayload(&payload)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	data := new(colonycore.Server)
	data.ID = "192.168.0.200"
	data.Type = "local"
	data.Folder = "/data"
	data.OS = "linux"
	data.Enable = true
	data.SSHType = "DDL: Credential"
	data.SSHFile = "knot-server"
	data.SSHUser = "knot"
	data.SSHPass = "knotpass"

	err := colonycore.Delete(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	// Printf("data:%v\n", data)

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
