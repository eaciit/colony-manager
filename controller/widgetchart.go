package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
)

type WidgetChartController struct {
	App
}

func CreateWidgetChartController(s *knot.Server) *WidgetChartController {
	var controller = new(WidgetChartController)
	controller.Server = s
	return controller
}

func (wc *WidgetChartController) GetChartData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	data, err := new(colonycore.MapChart).Get(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wc *WidgetChartController) GetDetailChart(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := new(colonycore.Chart)
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := data.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wc *WidgetChartController) SaveChart(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	datachart := new(colonycore.Chart)
	if err := r.GetPayload(&datachart); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := datachart.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, datachart, "")
}

func (wc *WidgetChartController) RemoveChart(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})
	for _, id := range idArray {
		mapchart := new(colonycore.MapChart)
		mapchart.ID = id.(string)
		if err := mapchart.Delete(); !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}

		filechart := new(colonycore.Chart)
		filechart.ID = id.(string)

		if err := filechart.Remove(); !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, payload["_id"], "")
}
