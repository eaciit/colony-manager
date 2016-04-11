package controller

import (
	// "archive/zip"
	"encoding/json"
	"fmt"
	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	// _ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "io"
	// "io/ioutil"
	// "os"
	// "path/filepath"
	"strings"
	// "time"
	// "reflect"
	//"strconv"
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
	var filter *dbox.Filter
	r.Config.OutputType = knot.OutputJson
	_ = a.InitialSetDatabase()

	payload := map[string]interface{}{}

	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if strings.Contains(toolkit.TypeName(payload["search"]), "float") {
		payload["search"] = toolkit.ToInt(payload["search"], toolkit.RoundingAuto)
	}

	tGroup := new(acl.Group)
	if search := toolkit.ToString(payload["search"]); search != "" {
		filter = new(dbox.Filter)
		filter = dbox.Or(dbox.Contains("_id", search), dbox.Contains("title", search), dbox.Contains("owner", search))

	}
	fmt.Println(filter)
	take := toolkit.ToInt(payload["take"], toolkit.RoundingAuto)
	skip := toolkit.ToInt(payload["skip"], toolkit.RoundingAuto)

	c, err := acl.Find(tGroup, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	data := toolkit.M{}
	arrm := make([]toolkit.M, 0, 0)
	err = c.Fetch(&arrm, 0, false)

	data.Set("Datas", arrm)
	data.Set("total", c.Count())

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")

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
	config := payload["groupConfig"].(map[string]interface{})

	delete(config, "Password")

	initGroup := new(acl.Group)
	initGroup.ID = g["_id"].(string)
	initGroup.Title = g["Title"].(string)
	initGroup.Owner = g["Owner"].(string)
	initGroup.Enable = g["Enable"].(bool)
	initGroup.GroupConf = config

	if g["GroupType"].(string) == "1" {
		// initGroup.GroupType = acl.GroupTypeLdap
	} else if g["GroupType"].(string) == "0" {
		// initGroup.GroupType = acl.GroupTypeBasic
	}
	//fmt.Println(acl.GroupTypeLdap)
	err = acl.Save(initGroup)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	fmt.Println(payload["groupConfig"].(map[string]interface{}))
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

func (a *GroupController) GetLdapdataAddress(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	autoFilters := []*dbox.Filter{}

	var query *dbox.Filter

	if len(autoFilters) > 0 {
		query = dbox.And(autoFilters...)
	}

	cursor, err := colonycore.Find(new(colonycore.Ldap), query)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.Ldap{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}
func (a *GroupController) SaveGroupConfigLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.Ldap)
	o.ID = payload["Address"].(string)
	o.Address = payload["Address"].(string)
	o.BaseDN = payload["BaseDN"].(string)
	o.FilterGroup = payload["Filter"].(string)
	o.Username = payload["Username"].(string)

	//o.Password = payload["Password"].(string)
	err = toolkit.Serde(payload["Attribute"], &o.AttributesGroup, "json")
	if err != nil {
		return helper.CreateResult(false, err.Error(), "error")
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, o, err.Error())
	}

	return helper.CreateResult(true, o, "")
}
func (a *GroupController) FindUserLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	addr := payload["Address"].(string)
	basedn := payload["BaseDN"].(string)
	filter := payload["Filter"].(string)
	username := payload["Username"].(string)
	password := payload["Password"].(string)
	var attr []string

	err = toolkit.Serde(payload["Attribute"], &attr, "json")
	if err != nil {
		return helper.CreateResult(false, err, "error")
	}

	param := toolkit.M{}

	param.Set("username", username)
	param.Set("password", password)
	param.Set("attributes", attr)

	arrm, err := acl.FindDataLdap(addr, basedn, filter, param)
	if err != nil {
		return helper.CreateResult(false, err, "error")
	}

	return helper.CreateResult(true, arrm, "success")
}
func (a *GroupController) RefreshGroupLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	return helper.CreateResult(true, "", "success")
}
