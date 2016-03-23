package controller

import (
	// "archive/zip"
	// "encoding/json"
	// "fmt"
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
	"strconv"
	"strings"
)

type AdministrationController struct {
	App
}

func CreateAdminisrationController(s *knot.Server) *AdministrationController {
	var controller = new(AdministrationController)
	controller.Server = s
	return controller
}

func (a *AdministrationController) GetAccess(r *knot.WebContext) interface{} {
	var filter *dbox.Filter
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()

	payload := map[string]interface{}{}
	err := r.GetForms(&payload)

	if strings.Contains(toolkit.TypeName(payload["find"]), "float") {
		payload["find"] = toolkit.ToInt(payload["find"], toolkit.RoundingAuto)
	}

	tAccess := new(acl.Access)
	if find := toolkit.ToString(payload["find"]); find != "" {
		filter = new(dbox.Filter)
		filter = dbox.Or(dbox.Contains("id", find),
			dbox.Contains("title", find),
			dbox.Contains("group1", find),
			dbox.Contains("group2", find),
			dbox.Contains("group3", find),
			dbox.Contains("specialaccess1", find),
			dbox.Contains("specialaccess2", find),
			dbox.Contains("specialaccess3", find),
			dbox.Contains("specialaccess4", find))
	}

	data := toolkit.M{}
	arrm := make([]toolkit.M, 0, 0)

	take := toolkit.ToInt(payload["take"], toolkit.RoundingAuto)
	skip := toolkit.ToInt(payload["skip"], toolkit.RoundingAuto)

	c, err := acl.Find(tAccess, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
	if err == nil {
		err = c.Fetch(&arrm, 0, false)
	}
	c.Close()

	c, err = acl.Find(tAccess, filter, nil)
	data.Set("Datas", arrm)
	data.Set("total", c.Count())

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, data, "")
	}

}

func (a *AdministrationController) FindAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	tAccess := new(acl.Access)
	err = acl.FindByID(tAccess, payload["_id"].(string))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, tAccess, "")
	}
}

func (a *AdministrationController) Search(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	find := payload["search"].(string)
	bfind, err := strconv.ParseBool(find)
	tAccess := new(acl.Access)
	arrm := make([]toolkit.M, 0, 0)
	filter := dbox.Or(dbox.Contains("_id", find), dbox.Contains("id", find), dbox.Contains("title", find), dbox.Contains("group1", find),
		dbox.Contains("group2", find), dbox.Contains("group3", find), dbox.Contains("specialaccess1", find), dbox.Contains("specialaccess2", find),
		dbox.Contains("specialaccess3", find), dbox.Contains("specialaccess4", find), dbox.Eq("enable", bfind))
	c, e := acl.Find(tAccess, filter, toolkit.M{}.Set("take", 0))
	if e == nil {
		e = c.Fetch(&arrm, 0, false)
	}

	if e != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, arrm, "")
	}
}

func (a *AdministrationController) DeleteAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	tAccess := new(acl.Access)
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	err = acl.FindByID(tAccess, payload["_id"].(string))

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	err = acl.Delete(tAccess)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "success")
}

func (a *AdministrationController) SaveAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	initAccess := new(acl.Access)
	initAccess.ID = payload["_id"].(string)
	initAccess.Title = payload["Title"].(string)
	initAccess.Group1 = payload["Group1"].(string)
	initAccess.Group2 = payload["Group2"].(string)
	initAccess.Group3 = payload["Group3"].(string)
	initAccess.Enable = payload["Enable"].(bool)
	initAccess.SpecialAccess1 = payload["SpecialAccess1"].(string)
	initAccess.SpecialAccess2 = payload["SpecialAccess2"].(string)
	initAccess.SpecialAccess3 = payload["SpecialAccess3"].(string)
	initAccess.SpecialAccess4 = payload["SpecialAccess4"].(string)
	err = acl.Save(initAccess)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	return helper.CreateResult(true, initAccess, "sukses")
}

func (a *AdministrationController) prepareconnection() (conn dbox.IConnection, err error) {
	conn, err = dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		return
	}
	err = conn.Connect()
	return
}

func (a *AdministrationController) InitialSetDatabase() error {
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
