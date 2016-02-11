package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	. "github.com/eaciit/toolkit"
	"strings"
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

func (a *ServerController) DeleteServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Server)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	ids := payload.ID

	if strings.Contains(ids, ",") { /*multi delete*/
		idList := strings.Split(ids, ",")
		for _, val := range idList {
			payload.ID = val
			err = colonycore.Delete(payload)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}
	} else {
		err = colonycore.Delete(payload)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (a *ServerController) ServersFilter(r *knot.WebContext) interface{} {
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
	fmt.Println("data pencarian : ", data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}
