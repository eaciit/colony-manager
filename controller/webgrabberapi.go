package controller

// import (
// 	"github.com/eaciit/colony-manager/helper"
// 	"github.com/eaciit/knot/knot.v1"
// 	"time"
// )

// type WebGrabberApiController struct {
// 	App
// }

// type Payload struct {
// 	User  string `json:"username"`
// 	Pass  string `json:"password"`
// 	Token string `json:"token"`
// }

// func CreateWebApiGrabberController(s *knot.Server) *WebGrabberApiController {
// 	var controller = new(WebGrabberApiController)
// 	controller.Server = s
// 	return controller
// }

// func (w *WebGrabberApiController) GenerateToken(r *knot.WebContext) string {
// 	if _, ok := r.Cookie(payload.User, ""); ok {
// 		token := w.GenerateToken()
// 		r.SetCookie(payload.User, token, 30*24*time.Hour)
// 	}

// 	if cookie, ok := r.Cookie(payload.User, ""); ok {
// 		return cookie.Value
// 	}

// 	return ""
// }

// func (w *WebGrabberApiController) IsTokenMatch(r *knot.WebContext, payload Payload) bool {
// 	if cookie, ok := r.Cookie(payload.User, ""); ok {
// 		return cookie.Value == payload.Token
// 	}

// 	return false
// }

// func (w *WebGrabberApiController) Login(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson

// 	payload := Payload{}
// 	err := r.GetPayload(&payload)
// 	if err != nil {
// 		return helper.CreateResult(false, nil, err.Error())
// 	}

// 	w.GenerateToken()

// 	return helper.CreateResult(true, nil, "")
// }

// func (w *WebGrabberApiController) Find(r *knot.WebContext) interface{} {

// }
