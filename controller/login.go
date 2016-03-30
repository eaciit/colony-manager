package controller

import (
	_ "crypto/sha1"
	"fmt"
	"github.com/eaciit/acl"
	_ "github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/csv"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	//"gopkg.in/gomail.v2"
	_ "time"
)

type LoginController struct {
	App
	SenderEmail   string
	HostEmail     string
	PortEmail     int
	UserEmail     string
	PasswordEmail string
}

func init() {
	conn, err := dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		fmt.Println(err.Error())
	}
	err = conn.Connect()
	if err != nil {
		fmt.Println(err.Error())
	}

	err = acl.SetDb(conn)
	if err != nil {
		fmt.Println(err.Error())
	}
}
func (l *LoginController) ProcessLogin(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)

	switch {
	case err != nil:
		return helper.CreateResult(false, nil, err.Error())
	case !payload.Has("username") || !payload.Has("password"):
		return helper.CreateResult(false, nil, "username or password not found")
	case payload.Has("username") && len(toolkit.ToString(payload["username"])) == 0:
		return helper.CreateResult(false, nil, "username cannot empty")
	case payload.Has("password") && len(toolkit.ToString(payload["password"])) == 0:
		return helper.CreateResult(false, nil, "password cannot empty")
	}

	sessid, err := acl.Login(toolkit.ToString(payload["username"]), toolkit.ToString(payload["password"]))
	if err != nil {
		return helper.CreateResult(true, "", err.Error())
	}
	r.SetSession("sessionid", sessid)
	return helper.CreateResult(true, toolkit.M{}.Set("sessionid", sessid), "")

}
func (l *LoginController) ResetPassword(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		fmt.Println(err.Error())
	}
	email := payload.Has("email")
	bashUrl := payload.Has("bashUrl")
	fmt.Println(email)
	fmt.Println(bashUrl)

	/*
		l.SenderEmail = "admin.support@eaciit.com"
		l.HostEmail = "smtp.office365.com"
		l.PortEmail = 587
		l.UserEmail = "admin.support@eaciit.com"
		l.PasswordEmail = "******"

		m := gomail.NewMessage()

		m.SetHeader("From", l.SenderEmail)
		m.SetHeader("To", email)

		m.SetHeader("Subject", "subject")
		m.SetBody("text/html", "message")

		d := gomail.NewPlainDialer(l.HostEmail, l.PortEmail, l.UserEmail, l.PasswordEmail)

		err := d.DialAndSend(m)

		if err != "" {
			return helper.CreateResult(false, nil, err.Error())
		}

	*/
	return helper.CreateResult(false, nil, "ac")
}

/* ==========================================
var payload = {
sessionid:"t7AuS0YIE9w8gOWY22HPJaj1pSxEjBNU",
accesscheck:[""],
accessid:""
};

app.ajaxPost("/acl/authenticate", payload)
============================================= */

func (l *LoginController) Authenticate(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	var iaccenum acl.AccessTypeEnum

	payload := toolkit.M{}
	result := toolkit.M{}
	result.Set("hasaccess", false)

	err := r.GetPayload(&payload)
	switch {
	case err != nil:
		return helper.CreateResult(false, nil, err.Error())
	}

	switch toolkit.TypeName(payload["accesscheck"]) {
	case "[]interface {}":
		for _, val := range payload["accesscheck"].([]interface{}) {
			tacc := acl.GetAccessEnum(toolkit.ToString(val))
			if !acl.Matchaccess(int(tacc), int(iaccenum)) {
				iaccenum += tacc
			}
		}
	default:
		iaccenum = acl.GetAccessEnum(toolkit.ToString(payload["accesscheck"]))
	}
	// toolkit.Println("Type name : ", toolkit.TypeName(payload["accesscheck"]))

	found := acl.HasAccess(toolkit.ToString(payload["sessionid"]),
		acl.IDTypeSession,
		toolkit.ToString(payload["accessid"]),
		iaccenum)

	if found {
		result.Set("hasaccess", found)
	}

	return helper.CreateResult(true, result, "")
}
func CreateLoginController(l *knot.Server) *LoginController {
	var controller = new(LoginController)
	controller.Server = l
	return controller
}
