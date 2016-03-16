package controller

import (
	// "archive/zip"
	// "encoding/json"
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
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	tUser := new(acl.User)

	arrm := make([]toolkit.M, 0, 0)
	c, err := acl.Find(tUser, nil, toolkit.M{}.Set("take", 0))
	if err == nil {
		err = c.Fetch(&arrm, 0, false)
	}

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	} else {
		return helper.CreateResult(true, arrm, "")
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

func (a *UserController) SaveUser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	a.InitialSetDatabase()
	payload := struct {
		LoginID  string
		FullName string
		Email    string
		Password string
		Enable   bool
		Groups   []string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	fmt.Println(payload.Groups)
	initUser := new(acl.User)
	id := toolkit.RandomString(32)
	initUser.ID = id
	initUser.LoginID = payload.LoginID
	initUser.FullName = payload.FullName
	initUser.Email = payload.Email
	initUser.Password = payload.Password
	initUser.Enable = payload.Enable
	initUser.Groups = payload.Groups

	err = acl.Save(initUser)

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	err = acl.ChangePassword(initUser.ID, id)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	return helper.CreateResult(true, initUser, "sukses")
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
