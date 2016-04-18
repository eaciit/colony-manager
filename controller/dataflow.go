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
	actions := payload["Actions"].([]interface{})

	currentDataFlow := new(colonycore.DataFlow)
	currentDataFlow.DataShapes = dataShapes
	currentDataFlow.Actions = constructActions(actions)
	currentDataFlow.Name = tk.ToString(payload["Name"])
	currentDataFlow.Description = tk.ToString(payload["Description"])
	currentDataFlow.ID = tk.ToString(payload["ID"])
	// currentDataFlow.GlobalParam = nil

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
	return helper.CreateResult(true, nil, "success")
}

func constructActions(list []interface{}) (flows []colonycore.FlowAction) {
	for _, act := range list {
		flowAction := act.(map[string]interface{})
		server := colonycore.Server{}
		if flowAction["server"] != nil {
			dsServer := []colonycore.Server{}
			cursor, err := colonycore.Find(new(colonycore.Server), dbox.Eq("_id", flowAction["server"].(string)))

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
			outputType = flowAction["outputtype"].(string)
		}

		for _, out := range flowAction["outputparam"].([]interface{}) {
			outputParam.Set("", out)
		}

		OK := []string{}
		KO := []string{}

		for _, str := range flowAction["OK"].([]interface{}) {
			OK = append(OK, str.(string))
		}

		for _, str := range flowAction["KO"].([]interface{}) {
			KO = append(KO, str.(string))
		}

		actionType := flowAction["type"].(string)

		flow := colonycore.FlowAction{
			Id:          flowAction["id"].(string),
			Name:        flowAction["name"].(string) + "-" + flowAction["id"].(string),
			Description: flowAction["description"].(string),
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
				Master:    dataAction["master"].(string),
				Mode:      dataAction["mode"].(string),
				File:      dataAction["appfiles"].(string),
				MainClass: dataAction["mainclass"].(string),
				// Args:      dataAction["args"].(string),
			}
			flow.Action = spark
			break
		case dataflow.ACTION_TYPE_HIVE:
			hive := colonycore.ActionHive{
				ScriptPath: dataAction["scriptpath"].(string),
				// Params:     ,
			}
			flow.Action = hive
			break
		case dataflow.ACTION_TYPE_SSH:
			ssh := colonycore.ActionSSH{
				Command: dataAction["script"].(string),
			}
			flow.Action = ssh
			break
		case dataflow.ACTION_TYPE_HDFS:
			hdfs := colonycore.ActionHDFS{
			// Command: dataAction["script"].(string),
			}
			flow.Action = hdfs
			break
		case dataflow.ACTION_TYPE_JAVA:
			java := colonycore.ActionJavaApp{
				Jar: dataAction["jar"].(string),
			}
			flow.Action = java
			break
		case dataflow.ACTION_TYPE_MAP_REDUCE:
			mr := colonycore.ActionHadoopStreaming{
				// Jar: ,
				Mapper:  dataAction["mapper"].(string),
				Reducer: dataAction["reducer"].(string),
				Input:   dataAction["input"].(string),
				Output:  dataAction["output"].(string),
			}
			flow.Action = mr
			break
		case dataflow.ACTION_TYPE_KAFKA:
			kafka := colonycore.ActionKafka{}
			flow.Action = kafka
			break
		case dataflow.ACTION_TYPE_EMAIL:
			email := colonycore.ActionEmail{
			// To:,
			//   CC:,
			//   Subject:,
			//   Body:,
			}
			flow.Action = email
			break
		// case "Fork":
		// 	fork := colonycore.ActionFork{}
		// 	action.Action = fork
		// 	action.Type = dataflow.ACTION_TYPE_FORK
		// 	break
		case dataflow.ACTION_TYPE_DECISION:
			decision := colonycore.ActionDecision{}
			flow.Action = decision
			break
		case dataflow.ACTION_TYPE_STOP:
			stop := colonycore.ActionStop{}
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
