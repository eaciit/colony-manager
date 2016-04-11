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
	"strconv"
)

type UserController struct {
	App
}

func CreateUserController(s *knot.Server) *UserController {
	var controller = new(UserController)
	controller.Server = s
	return controller
}

func (a *UserController) GetUser(r *knot.WebContext) interface{} {
	var filter *dbox.Filter
	r.Config.OutputType = knot.OutputJson
	_ = a.InitialSetDatabase()

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if strings.Contains(toolkit.TypeName(payload["find"]), "float") {
		payload["find"] = toolkit.ToInt(payload["find"], toolkit.RoundingAuto)
	}

	tUser := new(acl.User)
	if find := toolkit.ToString(payload["find"]); find != "" {
		filter = new(dbox.Filter)
		filter = dbox.Or(dbox.Contains("id", find),
			dbox.Contains("fullname", find),
			dbox.Contains("email", find))
	}
	take := toolkit.ToInt(payload["take"], toolkit.RoundingAuto)
	skip := toolkit.ToInt(payload["skip"], toolkit.RoundingAuto)

	c, err := acl.Find(tUser, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	data := toolkit.M{}
	arrm := make([]toolkit.M, 0, 0)
	err = c.Fetch(&arrm, 0, false)
	c.Close()

	c, err = acl.Find(tUser, filter, nil)

	data.Set("Datas", arrm)
	data.Set("total", c.Count())

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, data, "")
	}
}
func (a *UserController) FindUser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tUser := new(acl.User)
	err = acl.FindByID(tUser, payload["_id"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, tUser, "")
	}

}

func (a *UserController) GetUserLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tUser := new(acl.User)
	err = acl.FindByID(tUser, payload["_id"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, tUser, "")
	}

}

func (a *UserController) Search(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	find := payload["search"].(string)
	bfind, err := strconv.ParseBool(find)
	tUser := new(acl.User)
	arrm := make([]toolkit.M, 0, 0)
	filter := dbox.Or(dbox.Contains("_id", find), dbox.Contains("id", find), dbox.Contains("loginid", find),
		dbox.Contains("fullname", find), dbox.Contains("email", find), dbox.Eq("enable", bfind))
	c, e := acl.Find(tUser, filter, toolkit.M{}.Set("take", 0))
	if e == nil {
		e = c.Fetch(&arrm, 0, false)
	}

	if e != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, arrm, "")
	}
}

func (a *UserController) DeleteUser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	tUser := new(acl.User)
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	err = acl.FindByID(tUser, payload["_id"].(string))

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	err = acl.Delete(tUser)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "success")
}
func (a *UserController) GetAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tUser := new(acl.User)
	err = acl.FindByID(tUser, payload["id"].(string)) //
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	var AccessGrants = []interface{}{}
	for _, v := range tUser.Grants {
		var access = toolkit.M{}
		access.Set("AccessID", v.AccessID)
		access.Set("AccessValue", acl.Splitinttogrant(int(v.AccessValue)))
		AccessGrants = append(AccessGrants, access)
	}
	fmt.Println(AccessGrants)
	return helper.CreateResult(true, AccessGrants, "")
}
func (a *UserController) SaveUser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	user := payload["user"].(map[string]interface{})
	config := payload["userConfig"].(map[string]interface{})

	delete(config, "Username")
	delete(config, "Password")

	groups := user["Groups"]
	var group []string
	for _, v := range groups.([]interface{}) {
		group = append(group, v.(string))
	}
	fmt.Println(user["_id"].(string))
	initUser := new(acl.User)
	id := toolkit.RandomString(32)
	if user["_id"].(string) == "" {
		initUser.ID = id
	} else {
		initUser.ID = user["_id"].(string)
	}
	initUser.LoginID = user["LoginID"].(string)
	initUser.FullName = user["FullName"].(string)
	initUser.Email = user["Email"].(string)
	initUser.Password = user["Password"].(string)
	initUser.Enable = user["Enable"].(bool)
	initUser.Groups = group
	initUser.LoginConf = config

	if user["LoginType"].(string) == "1" {
		initUser.LoginType = acl.LogTypeLdap
	} else if user["LoginType"].(string) == "0" {
		initUser.LoginType = acl.LogTypeBasic
	}
	fmt.Println(user["LoginType"].(string))
	fmt.Println(initUser.LoginType)
	err = acl.Save(initUser)

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	if user["_id"].(string) == "" {
		err = acl.ChangePassword(initUser.ID, user["Password"].(string))
		if err != nil {
			return helper.CreateResult(true, nil, err.Error())
		}
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
				initUser.Grant(AccessID, acl.AccessCreate)
			case "AccessRead":
				initUser.Grant(AccessID, acl.AccessRead)
			case "AccessUpdate":
				initUser.Grant(AccessID, acl.AccessUpdate)
			case "AccessDelete":
				initUser.Grant(AccessID, acl.AccessDelete)
			case "AccessSpecial1":
				initUser.Grant(AccessID, acl.AccessSpecial1)
			case "AccessSpecial2":
				initUser.Grant(AccessID, acl.AccessSpecial2)
			case "AccessSpecial3":
				initUser.Grant(AccessID, acl.AccessSpecial3)
			case "AccessSpecial4":
				initUser.Grant(AccessID, acl.AccessSpecial4)
			}
		}
	}
	err = acl.Save(initUser)

	return helper.CreateResult(true, nil, "sukses")
}

func (a *UserController) ChangePass(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	user := payload["user"].(map[string]interface{})
	err = acl.ChangePassword(user["_id"].(string), payload["pass"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	return helper.CreateResult(true, nil, "sukses")
}

func (a *UserController) prepareconnection() (conn dbox.IConnection, err error) {
	conn, err = dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		return
	}
	err = conn.Connect()
	return
}

func (a *UserController) InitialSetDatabase() error {
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

func (a *UserController) TestFindUserLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	addr := toolkit.ToString(payload["Address"])  //192.168.0.200:389
	basedn := toolkit.ToString(payload["BaseDN"]) //DC=eaciit,DC=local
	filter := toolkit.ToString(payload["Filter"]) //(&(objectclass=person)(objectclass=organizationalPerson)(cn=*))
	var attr []string

	err = toolkit.Serde(payload["Attribute"], &attr, "json")
	if err != nil {
		return helper.CreateResult(true, err, "error")
	}

	param := toolkit.M{}

	param.Set("username", toolkit.ToString(payload["Username"])) //Alip Sidik
	param.Set("password", toolkit.ToString(payload["Password"])) //Password.1
	// param.Set("attributes", []string{"cn", "givenName"})
	param.Set("attributes", attr)

	arrtkm, err := acl.FindDataLdap(addr, basedn, filter, param)
	if err != nil {
		return helper.CreateResult(true, err, "error")
	}
	return helper.CreateResult(true, arrtkm, "sukses")
}

func (a *UserController) SaveConfigLdap(r *knot.WebContext) interface{} {
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
	o.FilterUser = payload["Filter"].(string)
	o.Username = payload["Username"].(string)
	// o.Password = payload["Password"].(string)
	err = toolkit.Serde(payload["Attribute"], &o.AttributesUser, "json")
	if err != nil {
		return helper.CreateResult(false, err.Error(), "error")
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, o, err.Error())
	}

	return helper.CreateResult(true, o, "")
}

func (a *UserController) GetConfigLdap(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	filters := []*dbox.Filter{}

	var query *dbox.Filter
	if len(filters) > 0 {
		query = dbox.And(filters...)
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
