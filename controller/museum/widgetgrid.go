package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
)

type WidgetGridController struct {
	App
}

func CreateWidgetGridController(s *knot.Server) *WidgetGridController {
	var controller = new(WidgetGridController)
	controller.Server = s
	return controller
}

func (wg *WidgetGridController) GetQueryDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data, err := helper.GetDataSourceQuery()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wg *WidgetGridController) GetGridData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	data, err := new(colonycore.MapGrid).Get(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wg *WidgetGridController) GetDetailGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := new(colonycore.Grid)
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := data.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wg *WidgetGridController) SaveGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	datagrid := new(colonycore.Grid)
	if err := r.GetPayload(&datagrid); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := datagrid.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, datagrid, "")
}

func (wg *WidgetGridController) RemoveGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})
	for _, id := range idArray {
		mapgrid := new(colonycore.MapGrid)
		mapgrid.ID = id.(string)
		if err := mapgrid.Delete(); !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}

		filegrid := new(colonycore.Grid)
		filegrid.ID = id.(string)

		if err := filegrid.Remove(); !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, payload["_id"], "")
}
