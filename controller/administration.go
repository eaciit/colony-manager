package controller

import (
	// "archive/zip"
	// "encoding/json"
	// "fmt"
	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/toolkit"
	// "io"
	// "io/ioutil"
	// "os"
	// "path/filepath"
	// "strings"
	// "time"
)

type AdministrationController struct {
	App
}

func CreateAdminisrationController(s *knot.Server) *AdministrationController {
	var controller = new(AdministrationController)
	controller.Server = s
	return controller
}

func (a *AdministrationController) ConnectToDataSource() (dbox.IConnection, error) {

	dataConn := new(colonycore.Connection)
	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, err
	}
	return connection, nil
}

func (a *AdministrationController) SaveAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	conn, err := a.ConnectToDataSource()

	err = acl.SetDb(conn)

	initUser := new(acl.User)

	initUser.LoginID = "alip"
	initUser.FullName = "alip sidik"
	initUser.Email = "aa.sidik@eaciit.com"
	initUser.Password = "12345"

	err = acl.Save(initUser)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	return helper.CreateResult(true, nil, "")
}
