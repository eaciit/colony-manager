package controller

import (
	"github.com/eaciit/acl"
	// "github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type AclController struct {
	App
}

// func init() {
// 	driver, ci := new(colonycore.Login).GetACLConnectionInfo()
// 	conn, err := dbox.NewConnection(driver, ci)

// 	// conn, err := dbox.NewConnection("mongo",
// 	// 	&dbox.ConnectionInfo{"localhost:27017", "valegrab", "", "", toolkit.M{}.Set("timeout", 3)})
// 	if err != nil {
// 		return
// 	}
// 	err = conn.Connect()
// 	if err != nil {
// 		return
// 	}

// 	err = acl.SetDb(conn)
// 	if err != nil {
// 		return
// 	}
// }

func CreateAclController(s *knot.Server) *AclController {
	var controller = new(AclController)
	controller.Server = s
	return controller
}

func (a *AclController) Login(r *knot.WebContext) interface{} {
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

	return helper.CreateResult(true, toolkit.M{}.Set("sessionid", sessid), "")
}

func (a *AclController) Logout(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	sessionid := ""
	switch {
	case err != nil:
		return helper.CreateResult(false, nil, err.Error())
	case !payload.Has("username") && !payload.Has("sessionid"):
		return helper.CreateResult(false, nil, "username or session not found")
	case payload.Has("sessionid"):
		sessionid = toolkit.ToString(payload["sessionid"])
	case payload.Has("username"):
		tUser := new(acl.User)
		err = acl.FindUserByLoginID(tUser, toolkit.ToString(payload["username"]))
		if err != nil {
			return helper.CreateResult(false, nil, "fail to get userid")
		}

		tSession := new(acl.Session)
		err = acl.FindActiveSessionByUser(tSession, tUser.ID)
		if err != nil {
			return helper.CreateResult(false, nil, "fail to get sessionid")
		}
		sessionid = tSession.ID
	}

	if sessionid == "" {
		return helper.CreateResult(true, nil, "Active sessionid not found")
	}

	err = acl.Logout(sessionid)
	if err != nil && (err.Error() == "Session id not found" || err.Error() == "Session id is expired") {
		return helper.CreateResult(true, nil, "Active sessionid not found")
	} else if err != nil {
		return helper.CreateResult(true, nil, toolkit.Sprintf("Error found : %v", err.Error()))
	}

	return helper.CreateResult(true, nil, "Logout success")
}

/* ==========================================
var payload = {
sessionid:"t7AuS0YIE9w8gOWY22HPJaj1pSxEjBNU",
accesscheck:[""],
accessid:""
};

app.ajaxPost("/acl/authenticate", payload)

=============================================
var payload = {
accesscheck:["create","read","create"],
accessid:"COLONY.DASHBOARD"
};

var payload = {
accesscheck:7,
accessid:"COLONY.DASHBOARD"
};

var payload = {
accesscheck:[1,2,4],
accessid:"COLONY.DASHBOARD"
};

app.ajaxPost("/acl/authenticate", payload)
============================================= */
func (a *AclController) Authenticate(r *knot.WebContext) interface{} {
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
	toolkit.Printf("Nilai enum : %v \n", iaccenum)
	found := acl.HasAccess(toolkit.ToString(payload["sessionid"]),
		acl.IDTypeSession,
		toolkit.ToString(payload["accessid"]),
		iaccenum)

	if found {
		result.Set("hasaccess", found)
	}

	return helper.CreateResult(true, result, "")
}
