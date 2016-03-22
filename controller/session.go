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
	"strings"
	"time"
	// "io"
	// "io/ioutil"
	// "os"
	// "path/filepath"
	// "strings"
	// "time"
	// "reflect"
)

type SessionController struct {
	App
}

// func init() {

// }

func CreateSessionController(s *knot.Server) *SessionController {
	var controller = new(SessionController)
	controller.Server = s
	return controller
}

func (a *SessionController) GetSession(r *knot.WebContext) interface{} {
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

	tSession := new(acl.Session)
	if find := toolkit.ToString(payload["find"]); find != "" {
		filter = new(dbox.Filter)
		filter = dbox.Contains("loginid", find)
	}
	take := toolkit.ToInt(payload["take"], toolkit.RoundingAuto)
	skip := toolkit.ToInt(payload["skip"], toolkit.RoundingAuto)

	// c, err := acl.Find(tAccess, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
	// c, err := acl.Find(tSession, nil, toolkit.M{}.Set("take", payload["take"].(int)).Set("skip", payload["skip"].(int)))
	c, err := acl.Find(tSession, filter, toolkit.M{}.Set("take", take).Set("skip", skip))
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	data := toolkit.M{}
	arrm := make([]toolkit.M, 0, 0)
	err = c.Fetch(&arrm, 0, false)
	for i, val := range arrm {
		arrm[i].Set("duration", time.Since(val["created"].(time.Time)).Hours())
		arrm[i].Set("status", "ACTIVE")
		if val["expired"].(time.Time).Before(time.Now().UTC()) {
			arrm[i].Set("duration", val["expired"].(time.Time).Sub(val["created"].(time.Time)).Hours())
			arrm[i].Set("status", "EXPIRED")
		}
	}
	c.Close()

	c, err = acl.Find(tSession, filter, nil)

	data.Set("Datas", arrm)
	data.Set("total", c.Count())

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, data, "")
	}

}

func (a *SessionController) SetExpired(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	tSession := new(acl.Session)
	err = acl.FindByID(tSession, payload["_id"].(string))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	tSession.Expired = time.Now().UTC()
	err = acl.Save(tSession)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "Set expired success")
}

// func (a *SessionController) FindSession(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson
// 	a.InitialSetDatabase()
// 	payload := map[string]interface{}{}
// 	err := r.GetPayload(&payload)
// 	tSession := new(acl.Session)
// 	err = acl.FindByID(tSession, payload["_id"].(string))
// 	if err != nil {
// 		return helper.CreateResult(true, nil, err.Error())
// 	} else {
// 		return helper.CreateResult(true, tSession, "")
// 	}

// }
// func (a *SessionController) DeleteSession(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson
// 	a.InitialSetDatabase()
// 	tSession := new(acl.Session)
// 	payload := map[string]interface{}{}
// 	err := r.GetPayload(&payload)
// 	err = acl.FindByID(tSession, payload["_id"].(string))

// 	if err != nil {
// 		return helper.CreateResult(true, nil, err.Error())
// 	}

// 	err = acl.Delete(tSession)
// 	if err != nil {
// 		return helper.CreateResult(true, nil, err.Error())
// 	}

// 	return helper.CreateResult(true, nil, "success")
// }

func (a *SessionController) prepareconnection() (conn dbox.IConnection, err error) {
	conn, err = dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		return
	}
	err = conn.Connect()
	return
}

func (a *SessionController) InitialSetDatabase() error {
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
