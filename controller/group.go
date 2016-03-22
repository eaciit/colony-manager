package controller

import (
	// "archive/zip"
	"encoding/json"
	"fmt"
	// "github.com/eaciit/colony-core/v0"
	"github.com/eaciit/acl"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	// _ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "io"
	// "io/ioutil"
	// "os"
	// "path/filepath"
	// "strings"
	// "time"
	// "reflect"
	"strconv"
)

type GroupController struct {
	App
}

func CreateGroupController(s *knot.Server) *GroupController {
	var controller = new(GroupController)
	controller.Server = s
	return controller
}

func (a *GroupController) GetGroup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	tGroup := new(acl.Group)

	arrm := make([]toolkit.M, 0, 0)
	c, err := acl.Find(tGroup, nil, toolkit.M{}.Set("take", 0))
	if err == nil {
		err = c.Fetch(&arrm, 0, false)
	}

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, arrm, "")
	}

}
func (a *GroupController) FindGroup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tGroup := new(acl.Group)
	err = acl.FindByID(tGroup, payload["_id"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, tGroup, "")
	}

}

func (a *GroupController) Search(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	find := payload["search"].(string)
	bfind, err := strconv.ParseBool(find)
	tGroup := new(acl.Group)
	arrm := make([]toolkit.M, 0, 0)
	filter := dbox.Or(dbox.Contains("_id", find), dbox.Contains("id", find), dbox.Contains("title", find),
		dbox.Contains("owner", find), dbox.Eq("enable", bfind))
	c, e := acl.Find(tGroup, filter, toolkit.M{}.Set("take", 0))
	if e == nil {
		e = c.Fetch(&arrm, 0, false)
	}

	if e != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, arrm, "")
	}
}

func (a *GroupController) GetAccessGroup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tGroup := new(acl.Group)
	err = acl.FindByID(tGroup, payload["idGroup"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	var AccessGrants = []interface{}{}
	for _, v := range tGroup.Grants {
		var access = toolkit.M{}
		access.Set("AccessID", v.AccessID)
		access.Set("AccessValue", acl.Splitinttogrant(int(v.AccessValue)))
		AccessGrants = append(AccessGrants, access)
	}
	fmt.Println(AccessGrants)
	return helper.CreateResult(true, AccessGrants, "")
}
func (a *GroupController) DeleteGroup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	tGroup := new(acl.Group)
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	err = acl.FindByID(tGroup, payload["_id"].(string))

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	err = acl.Delete(tGroup)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "success")
}

func (a *GroupController) SaveGroup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	g := payload["group"].(map[string]interface{})

	initGroup := new(acl.Group)
	initGroup.ID = g["_id"].(string)
	initGroup.Title = g["Title"].(string)
	initGroup.Owner = g["Owner"].(string)
	initGroup.Enable = g["Enable"].(bool)
	err = acl.Save(initGroup)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	var grant map[string]interface{}
	for _, p := range payload["grants"].([]interface{}) {
		dat := []byte(p.(string))
		if err = json.Unmarshal(dat, &grant); err != nil {
			return helper.CreateResult(true, nil, err.Error())
		}
		AccessID := grant["AccessID"].(string)
		Accessvalue := grant["AccessValue"]
		for _, v := range Accessvalue.([]interface{}) {
			switch v {
			case "AccessCreate":
				initGroup.Grant(AccessID, acl.AccessCreate)
			case "AccessRead":
				initGroup.Grant(AccessID, acl.AccessRead)
			case "AccessUpdate":
				initGroup.Grant(AccessID, acl.AccessUpdate)
			case "AccessDelete":
				initGroup.Grant(AccessID, acl.AccessDelete)
			case "AccessSpecial1":
				initGroup.Grant(AccessID, acl.AccessSpecial1)
			case "AccessSpecial2":
				initGroup.Grant(AccessID, acl.AccessSpecial2)
			case "AccessSpecial3":
				initGroup.Grant(AccessID, acl.AccessSpecial3)
			case "AccessSpecial4":
				initGroup.Grant(AccessID, acl.AccessSpecial4)
			}
		}
	}
	err = acl.Save(initGroup)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	return helper.CreateResult(true, nil, "sukses")
}

func (a *GroupController) prepareconnection() (conn dbox.IConnection, err error) {
	conn, err = dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		return
	}
	err = conn.Connect()
	return
}

func (a *GroupController) InitialSetDatabase() error {
	conn, err := a.prepareconnection()

	if err != nil {
		return err
	}

	err = acl.SetDb(conn)
	if err != nil {
		return err
	}
	return nil
}
