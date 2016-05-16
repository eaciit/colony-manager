package controller

import (
	"errors"
	"fmt"
	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	// _ "github.com/eaciit/dbox/dbc/csv"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"gopkg.in/gomail.v2"
	_ "reflect"
	_ "time"
)

type LoginController struct {
	App
}

func CreateLoginController(l *knot.Server) *LoginController {
	var controller = new(LoginController)
	controller.Server = l
	return controller
}

func (l *LoginController) prepareconnection() (conn dbox.IConnection, err error) {
	driver, ci := new(colonycore.Login).GetACLConnectionInfo()
	conn, err = dbox.NewConnection(driver, ci)
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

func (l *LoginController) GetSession(r *knot.WebContext) interface{} {

	r.Config.OutputType = knot.OutputJson
	sessionId := r.Session("sessionid", "")

	return helper.CreateResult(true, toolkit.M{}.Set("sessionid", sessionId), "")

}

func (l *LoginController) GetUserName(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	tUser, err := GetUser(r)

	if err != nil {
		return helper.CreateResult(true, "", "Get username failed")
	}

	return helper.CreateResult(true, toolkit.M{}.Set("username", tUser.LoginID), "")
}

func GetUser(r *knot.WebContext) (tUser acl.User, err error) {
	sessionId := r.Session("sessionid", "")

	if toolkit.ToString(sessionId) == "" {
		err = error(errors.New("Sessionid is not found"))
		return
	}

	userid, err := acl.FindUserBySessionID(toolkit.ToString(sessionId))
	if err != nil {
		return
	}

	err = acl.FindByID(&tUser, userid)
	if err != nil {
		return
	}

	return
}

// func GetAccess(r *knot.WebContext) interface{} {
// 	sessionId := GetSession(r)
// 	menu := []colonycore.Menu{}
// 	cursor, err := colonycore.Find(new(colonycore.Menu), nil)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}
// 	cursor.Fetch(&menu, 0, false)
// 	defer cursor.Close()
// 	results := make([]toolkit.M, 0, 0)
// 	if cursor.Count() > 0 {
// 		result := toolkit.M{}
// 		for _, m := range menu {
// 			acces := acl.HasAccess(sessionId, acl.IDTypeSession, m.AccessId, acl.AccessRead)
// 			if acces == true {
// 				result, err = toolkit.ToM(m)
// 				if err != nil {
// 					return helper.CreateResult(false, nil, err.Error())
// 				}
// 				result.Set("detail", 7)
// 				results = append(results, result)
// 			}
// 		}
// 	}
// 	return results
// }

func (l *LoginController) GetAccessMenu(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	sessionId := r.Session("sessionid", "")

	cursor, err := colonycore.Find(new(colonycore.Menu), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	menus := []colonycore.Menu{}
	results := make([]toolkit.M, 0, 0)

	cursor.Fetch(&menus, 0, false)

	if IsDevMode {
		for _, m := range menus {
			result, _ := toolkit.ToM(m)
			results = append(results, result)
		}
		return helper.CreateResult(true, results, "devmode")
	}

	if toolkit.ToString(sessionId) == "" {
		return helper.CreateResult(true, nil, "Session Not Found")
	}

	stat := acl.IsSessionIDActive(toolkit.ToString(sessionId))
	if !stat {
		return helper.CreateResult(false, nil, "Session Expired")
	}

	if cursor.Count() > 0 {
		for _, m := range menus {
			result := toolkit.M{}

			acc := acl.HasAccess(toolkit.ToString(sessionId), acl.IDTypeSession, m.AccessId, acl.AccessRead)
			result, err = toolkit.ToM(m)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			// if toolkit.ToString(sessionId) != "" {
			userid, err := acl.FindUserBySessionID(toolkit.ToString(sessionId))
			if err != nil {
				return helper.CreateResult(false, "", "Get username failed")
			}
			tUser := new(acl.User)
			err = acl.FindByID(tUser, userid)
			if err != nil {
				return helper.CreateResult(false, "", "Get username failed")
			}

			result.Set("detail", 7)

			if tUser.LoginID == "eaciit" {
				results = append(results, result)
			} else {
				if acc {
					result.Set("childrens", "")
					if len(m.Childrens) > 0 {
						childs := GetChildMenu(r, m.Childrens)
						result.Set("childrens", childs)
					}
					results = append(results, result)
				}
			}
			// }
		}
	}

	return helper.CreateResult(true, results, "Success")
}

func GetChildMenu(r *knot.WebContext, childMenu []colonycore.Menu) interface{} {
	sessionId := r.Session("sessionid", "")
	results := make([]toolkit.M, 0, 0)
	for _, m := range childMenu {
		result := toolkit.M{}
		acc := acl.HasAccess(toolkit.ToString(sessionId), acl.IDTypeSession, m.AccessId, acl.AccessRead)
		result, err := toolkit.ToM(m)
		if err != nil {
			fmt.Println(err)
		}
		if acc {
			if len(m.Childrens) > 0 {
				childs := GetChildMenu(r, m.Childrens)
				result.Set("childrens", childs)
			}
			result.Set("detail", 7)
			results = append(results, result)
		}
	}
	return results
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
	return helper.CreateResult(true, toolkit.M{}.Set("status", true), "Login Success")

}

func (l *LoginController) Logout(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	sessionId := toolkit.ToString(r.Session("sessionid", ""))
	if toolkit.ToString(sessionId) == "" {
		return helper.CreateResult(true, nil, "Active sessionid not found")
	}

	err := acl.Logout(sessionId)
	if err != nil && (err.Error() == "Session id not found" || err.Error() == "Session id is expired") {
		return helper.CreateResult(true, nil, "Active sessionid not found")
	} else if err != nil {
		return helper.CreateResult(true, nil, toolkit.Sprintf("Error found : %v", err.Error()))
	}

	r.SetSession("sessionid", "")

	return helper.CreateResult(true, nil, "Logout success")
}

func (l *LoginController) ResetPassword(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	fmt.Println(payload.Has("email"))
	fmt.Println(payload.Has("baseurl"))
	if !payload.Has("email") || !payload.Has("baseurl") {
		return helper.CreateResult(false, nil, "Data is not complete")
	}

	uname, tokenid, err := acl.ResetPassword(toolkit.ToString(payload["email"]))
	fmt.Printf("%v, %v, %v \n\n", uname, tokenid, err)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	linkstr := fmt.Sprintf("<a href='%v/web/confirmreset?1=%v&2=%v'>Click</a>", toolkit.ToString(payload["baseurl"]), uname, tokenid)

	mailmsg := fmt.Sprintf("Hi, <br/><br/> We received a request to reset your password, <br/><br/>")
	mailmsg = fmt.Sprintf("%vFollow the link below to set a new password : <br/><br/> %v <br/><br/>", mailmsg, linkstr)
	mailmsg = fmt.Sprintf("%vIf you don't want to change your password, you can ignore this email <br/><br/> Thanks,</body></html>", mailmsg)

	m := gomail.NewMessage()

	m.SetHeader("From", "admin.support@eaciit.com")
	m.SetHeader("To", toolkit.ToString(payload["email"]))

	m.SetHeader("Subject", "[no-reply] Self password reset")
	m.SetBody("text/html", mailmsg)

	d := gomail.NewPlainDialer("smtp.office365.com", 587, "admin.support@eaciit.com", "******")
	err = d.DialAndSend(m)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "reset password success")
}

func (l *LoginController) SavePassword(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if !payload.Has("newpassword") || !payload.Has("userid") {
		return helper.CreateResult(false, nil, "Data is not complete")
	}

	switch {
	case payload.Has("tokenid"):
		err = acl.ChangePasswordToken(toolkit.ToString(payload["userid"]), toolkit.ToString(payload["newpassword"]), toolkit.ToString(payload["tokenid"]))
	default:
		// check sessionid first
		savedsessionid := "" //change with get session
		//=======================
		userid, err := acl.FindUserBySessionID(savedsessionid)
		if err == nil && userid == toolkit.ToString(payload["userid"]) {
			err = acl.ChangePassword(toolkit.ToString(payload["userid"]), toolkit.ToString(payload["newpassword"]))
		} else if err == nil {
			err = errors.New("Userid is not match")
		}
	}

	return helper.CreateResult(true, nil, "save password success")
}

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

	found := acl.HasAccess(toolkit.ToString(payload["sessionid"]),
		acl.IDTypeSession,
		toolkit.ToString(payload["accessid"]),
		iaccenum)

	if found {
		result.Set("hasaccess", found)
	}

	return helper.CreateResult(true, result, "")
}

func (l *LoginController) PrepareDefaultUser() (err error) {
	username := colonycore.GetConfig("default_username", "").(string)
	password := colonycore.GetConfig("default_password", "").(string)

	user := new(acl.User)
	filter := dbox.Contains("loginid", username)
	c, err := acl.Find(user, filter, nil)

	if err != nil {
		return
	}

	if c.Count() == 0 {
		user.ID = toolkit.RandomString(32)
		user.LoginID = username
		user.FullName = username
		user.Password = password
		user.Enable = true

		err = acl.Save(user)
		if err != nil {
			return
		}
		err = acl.ChangePassword(user.ID, password)
		if err != nil {
			return
		}

		fmt.Printf(`Default user "%s" with standard password has been created%s`, username, "\n")
	}

	return
}
