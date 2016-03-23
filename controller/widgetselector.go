package controller

import (
	// "encoding/json"
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"path/filepath"
	// "io/ioutil"
	"os"
)

type WidgetSelectorController struct {
	App
}

func CreateWidgetSelectorController(s *knot.Server) *WidgetSelectorController {
	var controller = new(WidgetSelectorController)
	controller.Server = s
	return controller
}

/*func (ws *WidgetSelectorController) RemoveSelectorConfig(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	err := r.GetForms(&payload)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	connection, err := helper.LoadConfig(t.AppViewsPath + "data/selector.json")
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	err = connection.NewQuery().Delete().Where(dbox.Eq("ID", payload["ID"])).Exec(nil)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}*/

func (ws *WidgetSelectorController) GetSelectorConfigs(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	configFilepath := filepath.Join(colonycore.ConfigPath, "widget", "selector.json")

	if _, err := os.Stat(configFilepath); err != nil {
		if os.IsNotExist(err) {
			os.Create(configFilepath)
		} else {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	connection, err := helper.LoadConfig(configFilepath)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	// res := []toolkit.M{}
	res := []colonycore.Selector{}
	err = cursor.Fetch(&res, 0, false)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	if len(res) > 0 {
		return helper.CreateResult(true, res, "")
	}

	return helper.CreateResult(true, []interface{}{}, "")
}

func (ws *WidgetSelectorController) SaveSelector(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	// payload := map[string]string{}
	payload := new(colonycore.Selector)
	err := r.GetForms(&payload)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	_id := payload.ID
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	if _id == "" {
		_id = helper.RandomIDWithPrefix("sl")
		payload.ID = _id
		connection, err := helper.LoadConfig(filepath.Join(colonycore.ConfigPath, "widget", "selector.json"))
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer connection.Close()

		// newData := toolkit.M{"ID": _id, "title": payload["title"], "fields": payload["fields"], "masterDataSource": payload["masterDataSource"]}
		err = connection.NewQuery().Insert().Exec(toolkit.M{"data": payload})
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	} else {
		connection, err := helper.LoadConfig(filepath.Join(colonycore.ConfigPath, "widget", "selector.json"))
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer connection.Close()

		// newData := toolkit.M{"ID": _id, "title": payload["title"], "fields": payload["fields"], "masterDataSource": payload["masterDataSource"]}
		err = connection.NewQuery().Update().Where(dbox.Eq("_id", _id)).Exec(toolkit.M{"data": payload})
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, _id, "")
}
