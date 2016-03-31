package controller

import (
	"fmt"
	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	// _ "github.com/eaciit/dbox/dbc/csv"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	//"gopkg.in/gomail.v2"
	_ "reflect"
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

func (l *LoginController) prepareconnection() (conn dbox.IConnection, err error) {
	conn, err = dbox.NewConnection("mongo",
		&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
	if err != nil {
		return
	}
	err = conn.Connect()
	return
}

func (l *LoginController) InitialSetDatabase() error {
	conn, err := l.prepareconnection()

	if err != nil {
		return err
	}

	err = acl.SetDb(conn)
	if err != nil {
		return err
	}
	return nil
}

func (l *LoginController) GetAccessMenu(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	sessionId := r.Session("sessionid", "")
	fmt.Println(sessionId)
	if sessionId != "" {

		sesssion := new(acl.Session)
		err := acl.FindByID(sesssion, sessionId)
		if err != nil {
			return helper.CreateResult(true, nil, err.Error())
		}

		user := new(acl.User)
		err = acl.FindByID(user, sesssion.UserID)
		if err != nil {
			return helper.CreateResult(true, nil, err.Error())
		}

		results := make([]toolkit.M, 0, 0)
		if len(user.Grants) > 0 {
			for _, v := range user.Grants {
				result := toolkit.M{}
				menu := GetMenu(v.AccessID)
				result.Set(v.AccessID, menu)

				results = append(results, result)
			}
			// fmt.Println(result)
			// return helper.CreateResult(true, result, "")
		}
		fmt.Println(results)
		return helper.CreateResult(true, results, "")
	}
	return helper.CreateResult(false, nil, "Please Login !")
}
func GetMenu(accesId string) interface{} {
	var query *dbox.Filter
	query = dbox.Contains("_id", accesId)
	cursor, err := colonycore.Find(new(colonycore.Menu), query)
	data := []colonycore.Menu{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return data
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
	return helper.CreateResult(true, toolkit.M{}.Set("sessionid", sessid), "Login Success")

}

func (l *LoginController) ResetPassword(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		fmt.Println(err.Error())
	}
	email := payload.Has("email")
	url := payload.Has("url")
	fmt.Println(email)
	fmt.Println(url)

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
func CreateLoginController(l *knot.Server) *LoginController {
	var controller = new(LoginController)
	controller.Server = l
	return controller
}
