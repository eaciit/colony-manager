package controller

import (
	// "github.com/eaciit/controller/data-flow"
	"fmt"
	"github.com/eaciit/cast"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
	"strings"
	"time"
)

type DataFlowController struct {
	App
}

func CreateDataFlowController(s *knot.Server) *DataFlowController {
	var controller = new(DataFlowController)
	controller.Server = s
	return controller
}

func Start(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	// dataf.Start("test")

	return helper.CreateResult(true, nil, "")
}

func (a *DataFlowController) Save(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataShapes := payload["DataShapes"].(map[string]interface{})

	currentDataFlow := new(colonycore.DataFlow)
	currentDataFlow.DataShapes = dataShapes
	currentDataFlow.Name = tk.ToString(payload["Name"])
	currentDataFlow.Description = tk.ToString(payload["Description"])
	currentDataFlow.ID = tk.ToString(payload["ID"])

	dataDs := []colonycore.DataFlow{}
	cursor, err := colonycore.Find(new(colonycore.DataFlow), dbox.Eq("_id", currentDataFlow.ID))
	cursor.Fetch(&dataDs, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	if len(dataDs) == 0 {
		currentDataFlow.CreatedDate = time.Now()
		currentDataFlow.CreatedBy = "Test User"
		currentDataFlow.ID = strings.Replace(currentDataFlow.Name, " ", "", -1) + cast.Date2String(time.Now(), "YYYYMMddHHmm")
	} else {
		currentDataFlow.CreatedDate = dataDs[0].CreatedDate
		currentDataFlow.CreatedBy = dataDs[0].CreatedBy
	}

	currentDataFlow.LastModified = time.Now()

	err = colonycore.Save(currentDataFlow)
	fmt.Println("")
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, nil, "success")
}

func (a *DataFlowController) GetListData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	search := tk.ToString(payload["search"])
	var query *dbox.Filter
	if search != "" {
		query = dbox.Or(dbox.Contains("name", search), dbox.Contains("description", search), dbox.Contains("createdby", search))
	}

	cursor, err := colonycore.Find(new(colonycore.DataFlow), query)

	dataDs := []colonycore.DataFlow{}
	cursor.Fetch(&dataDs, 0, false)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, dataDs, "success")
}

func (a *DataFlowController) Delete(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	ID := tk.ToString(payload["ID"])

	currentDF := new(colonycore.DataFlow)
	err = colonycore.Get(currentDF, ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(currentDF)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "success")
}
