package controller

import (
	// "github.com/eaciit/controller/data-flow"
	"fmt"
	"strings"
	"time"

	"github.com/eaciit/cast"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/controller/data-flow"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	tk "github.com/eaciit/toolkit"
)

type DataFlowController struct {
	App
}

func CreateDataFlowController(s *knot.Server) *DataFlowController {
	var controller = new(DataFlowController)
	controller.Server = s
	return controller
}

func (a *DataFlowController) Start(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataFlowId := tk.ToString(payload["dataFlowId"])
	globalParam := tk.M{}

	for _, val := range payload["globalParam"].([]interface{}) {
		tmp := val.(map[string]interface{})
		globalParam.Set(tk.ToString(tmp["key"]), tk.ToString(tmp["value"]))
	}

	dataDs := []colonycore.DataFlow{}
	cursor, err := colonycore.Find(new(colonycore.DataFlow), dbox.Eq("_id", dataFlowId))
	if cursor != nil {
		cursor.Fetch(&dataDs, 0, false)
		defer cursor.Close()
	}
	if err != nil && cursor != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if len(dataDs) > 0 {
		dataflow.Start(dataDs[0], "user test", globalParam)
	} else {
		return helper.CreateResult(false, nil, "Flow Not Found")
	}

	return helper.CreateResult(true, nil, "success")
}

func (a *DataFlowController) Save(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataShapes := payload["DataShapes"].(map[string]interface{})
	actions := payload["Actions"].([]interface{})

	currentDataFlow := new(colonycore.DataFlow)
	currentDataFlow.DataShapes = dataShapes
	currentDataFlow.Actions = constructActions(actions)
	currentDataFlow.Name = tk.ToString(payload["Name"])
	currentDataFlow.Description = tk.ToString(payload["Description"])
	currentDataFlow.ID = tk.ToString(payload["ID"])
	currentDataFlow.GlobalParam = tk.M{}

	for _, val := range payload["GlobalParam"].([]interface{}) {
		tmp := val.(map[string]interface{})
		currentDataFlow.GlobalParam.Set(tk.ToString(tmp["key"]), tk.ToString(tmp["value"]))
	}

	dataDs := []colonycore.DataFlow{}
	cursor, err := colonycore.Find(new(colonycore.DataFlow), dbox.Eq("_id", currentDataFlow.ID))
	if cursor != nil {
		cursor.Fetch(&dataDs, 0, false)
		defer cursor.Close()
	}
	if err != nil && cursor != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

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
	return helper.CreateResult(true, currentDataFlow, "success")
}

func constructActions(list []interface{}) (flows []colonycore.FlowAction) {
	for _, act := range list {
		flowAction := act.(map[string]interface{})
		server := colonycore.Server{}
		if flowAction["server"] != nil {
			dsServer := []colonycore.Server{}
			cursor, err := colonycore.Find(new(colonycore.Server), dbox.Eq("_id", tk.ToString(flowAction["server"])))

			if err != nil {
				//
			} else {
				if cursor != nil {
					cursor.Fetch(&dsServer, 0, false)
					defer cursor.Close()
				}

				if len(dsServer) > 0 {
					server = dsServer[0]
				}
			}
		}

		inputParam := tk.M{}
		outputParam := tk.M{}
		outputType := ""

		for _, in := range flowAction["inputparam"].([]interface{}) {
			inputParam.Set("", in)
		}

		if flowAction["outputtype"] != nil {
			outputType = tk.ToString(flowAction["outputtype"])
		}

		for _, out := range flowAction["outputparam"].([]interface{}) {
			outputParam.Set("", out)
		}

		OK := []string{}
		KO := []string{}

		for _, str := range flowAction["OK"].([]interface{}) {
			OK = append(OK, tk.ToString(str))
		}

		for _, str := range flowAction["KO"].([]interface{}) {
			KO = append(KO, tk.ToString(str))
		}

		actionType := tk.ToString(flowAction["type"])

		flow := colonycore.FlowAction{
			Id:          tk.ToString(flowAction["id"]),
			Name:        tk.ToString(flowAction["name"]) + "-" + tk.ToString(flowAction["id"]),
			Description: tk.ToString(flowAction["description"]),
			Type:        actionType,
			Server:      server,
			OK:          OK,
			KO:          KO,
			Retry:       tk.ToInt(flowAction["Retry"], ""),
			Interval:    tk.ToInt(flowAction["Interval"], ""),
			FirstAction: flowAction["firstaction"].(bool),
			InputParam:  inputParam,
			OutputParam: outputParam,
			OutputType:  outputType,
			OutputPath:  "",
		}

		dataAction := flowAction["action"].(map[string]interface{})

		switch actionType {
		case dataflow.ACTION_TYPE_SPARK:
			spark := colonycore.ActionSpark{
				Master:    tk.ToString(dataAction["master"]),
				Mode:      tk.ToString(dataAction["mode"]),
				File:      tk.ToString(dataAction["appfiles"]),
				MainClass: tk.ToString(dataAction["mainclass"]),
				Args:      tk.ToString(dataAction["args"]),
			}
			flow.Action = spark
			break
		case dataflow.ACTION_TYPE_HIVE:
			hive := colonycore.ActionHive{
				ScriptPath: tk.ToString(dataAction),
				// Params:     ,
			}
			flow.Action = hive
			break
		case dataflow.ACTION_TYPE_SSH:
			ssh := colonycore.ActionSSH{
				Command: tk.ToString(dataAction["script"]),
			}
			flow.Action = ssh
			break
		case dataflow.ACTION_TYPE_HDFS:
			hdfs := colonycore.ActionHDFS{
				Command: tk.ToString(dataAction["script"]),
			}
			flow.Action = hdfs
			break
		case dataflow.ACTION_TYPE_JAVA:
			java := colonycore.ActionJavaApp{
				Jar: tk.ToString(dataAction["jar"]),
			}
			flow.Action = java
			break
		case dataflow.ACTION_TYPE_MAP_REDUCE:
			mr := colonycore.ActionHadoopStreaming{
				// Jar: ,
				Mapper:  tk.ToString(dataAction["mapper"]),
				Reducer: tk.ToString(dataAction["reducer"]),
				Input:   tk.ToString(dataAction["input"]),
				Output:  tk.ToString(dataAction["output"]),
				Params:  tk.ToString(dataAction["params"]),
			}
			flow.Action = mr
			break
		case dataflow.ACTION_TYPE_KAFKA:
			kafka := colonycore.ActionKafka{}
			flow.Action = kafka
			break
		case dataflow.ACTION_TYPE_EMAIL:
			email := colonycore.ActionEmail{
				To:      tk.ToString(dataAction["to"]),
				Cc:      tk.ToString(dataAction["cc"]),
				Subject: tk.ToString(dataAction["subject"]),
				Body:    tk.ToString(dataAction["body"]),
			}
			flow.Action = email
			break
		// case "Fork":
		// 	fork := colonycore.ActionFork{}
		// 	action.Action = fork
		// 	action.Type = dataflow.ACTION_TYPE_FORK
		// 	break
		case dataflow.ACTION_TYPE_DECISION:
			conditions := []colonycore.Condition{}

			/*for _, val := range dataAction["conditions"].([]interface{}) {
				condition := val.(colonycore.Condition)
				conditions = append(conditions, condition)
			}*/

			decision := colonycore.ActionDecision{
				Conditions: conditions,
				// IsFork:     dataAction["isfork"].(bool),
			}
			flow.Action = decision
			break
		case dataflow.ACTION_TYPE_STOP:
			stop := colonycore.ActionStop{
				Message: tk.ToString(dataAction["message"]),
			}
			flow.Action = stop
			break
		}

		flows = append(flows, flow)
	}

	return
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

	if cursor != nil {
		cursor.Fetch(&dataDs, 0, false)
		defer cursor.Close()
	}

	if err != nil && cursor != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

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

func (a *DataFlowController) GetDataMonitoring(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	e := r.GetPayload(&payload)
	if e != nil {
		return helper.CreateResult(false, nil, e.Error())
	}

	status := tk.ToString(payload["status"])

	var filter *dbox.Filter
	filter = new(dbox.Filter)

	if strings.ToLower(status) != "running" {
		filter = dbox.Ne("status", "Running")
	} else {
		filter = dbox.Eq("status", status)
	}

	take := tk.ToInt(payload["take"], tk.RoundingAuto)
	skip := tk.ToInt(payload["skip"], tk.RoundingAuto)

	dataDs := []colonycore.DataFlowProcess{}
	cursor, err := colonycore.Finds(new(colonycore.DataFlowProcess), tk.M{}.Set("where", filter).Set("take", take).Set("skip", skip).Set("order", []string{"-startdate"}))

	if cursor != nil {
		cursor.Fetch(&dataDs, 0, false)
		defer cursor.Close()
	}

	if err != nil && cursor != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	res := tk.M{}
	res.Set("data", dataDs)
	res.Set("total", cursor.Count())

	return helper.CreateResult(true, res, "success")
}
