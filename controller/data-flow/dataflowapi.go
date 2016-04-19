package dataflow

import (
	"fmt"
	"io/ioutil"
	"strconv"
	//"math/rand"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/dbox"
	//"github.com/eaciit/dbox"
	"github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/hdc/hive"
	//"github.com/eaciit/sshclient"
	"encoding/csv"
	"encoding/json"
	"strings"
	"time"

	"github.com/eaciit/toolkit"
)

const (
	ACTION_TYPE_HIVE     = "HIVE"
	ACTION_TYPE_HDFS     = "HDFS"
	ACTION_TYPE_SPARK    = "SPARK"
	ACTION_TYPE_DECISION = "DECISION"
	ACTION_TYPE_SSH      = "SSH"
	ACTION_TYPE_KAFKA    = "KAFKA"

	ACTION_TYPE_MAP_REDUCE = "MR"
	ACTION_TYPE_EMAIL      = "EMAIL"
	ACTION_TYPE_STOP       = "STOP"
	ACTION_TYPE_FORK       = "FORK"
	ACTION_TYPE_JAVA       = "JAVA"

	FORK_TYPE_ALL       = "ALL"
	FORK_TYPE_ONE       = "ONE"
	FORK_TYPE_MANDATORY = "MANDATORY"

	SSH_OPERATION_MKDIR = "MKDIR"
	// SSH_OPERATION_* please define

	ACT_RESULT_PATH      = "/usr/eaciit/dataflow/result/"
	CMD_SPARK            = "spark-submit %v"
	CMD_MAP_REDUCE       = "hadoop jar %v -input %v -output %v -mapper %v -reducer %v"
	CMD_JAVA             = "java -jar %v"
	GLOBAL_PARAM_KEYWORD = "global."
)

//var CurrentAction colonycore.FlowAction
var hivex *hive.Hive
var hdfsx *hdfs.WebHdfs
var act_result_path string
var globalParam toolkit.M

// Start, to start the flow process
func Start(flow colonycore.DataFlow, user string, globalParam toolkit.M) (processID string, e error) {
	var steps []colonycore.FlowAction
	// steps = append(steps, flow.Actions[0].(colonycore.FlowAction))

	process := colonycore.DataFlowProcess{
		Id:          generateProcessID(flow.ID),
		Flow:        flow,
		StartDate:   time.Now(),
		StartedBy:   user,
		Steps:       steps,
		GlobalParam: globalParam,
	}

	// save the DataFlowProcess
	e = colonycore.Save(&process)
	if e != nil {
		return
	}

	processID = process.Id

	// run the watcher and run the process, please update regardingly
	go watch(flow)

	return
}

// need to define is the process can be stop or not
/*func Stop(processID string) (e error) {

	return
}*/

// runProcess, process the flow
func runProcess(process colonycore.DataFlow, action colonycore.FlowAction, actionBefore []colonycore.FlowAction) (e error) {
	var res []toolkit.M
	arguments := setCommandArgument(action)
	switch action.Type {
	case ACTION_TYPE_HIVE:
		res, e = runHive(process, action, arguments)
		break
	case ACTION_TYPE_HDFS:
		res, e = runHDFS(process, action, arguments)
		break
	case ACTION_TYPE_SPARK:
		res, e = runSpark(process, action, arguments)
		break
	case ACTION_TYPE_SSH:
		res, e = runSSH(process, action, arguments)
		break
	case ACTION_TYPE_EMAIL:
		// res, e = runSSH(process, action)
		break
	case ACTION_TYPE_MAP_REDUCE:
		res, e = runMapReduce(process, action, arguments)
		break
	case ACTION_TYPE_JAVA:
		res, e = runJava(process, action, arguments)
		break
	}
	fmt.Println(res)
	var msg string
	if e != nil {
		msg = "status : NOK \n Error : " + e.Error()
	} else {
		msg = "status : OK \n Error : "
	}
	writeActionResultStatus(process, action, msg)
	return e
}

func runHive(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	action_hive := action.Action.(colonycore.ActionHive)
	hivex = hive.HiveConfig(action.Server.Host, "", "Username", "Password", "Path")

	e = hivex.Populate(action_hive.ScriptPath, &res)

	return res, e
}

func runHDFS(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	server := action.Server
	setting, _, e := (&server).Connect()
	hdfs := action.Action.(colonycore.ActionHDFS)

	result, e := setting.GetOutputCommandSsh(hdfs.Command)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

func runSpark(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	spark := action.Action.(colonycore.ActionSpark)
	args := ""

	if spark.MainClass != "" {
		args = args + " --class " + spark.MainClass
	}

	if spark.Master != "" {
		args = args + " --master " + spark.Master
	}

	if spark.Mode != "" {
		args = args + " --deploy-mode " + spark.Mode
	}

	if spark.File != "" {
		args = args + " " + spark.File
	}

	if spark.Args != "" {
		args = args + " " + spark.Args
	}

	cmd := fmt.Sprintf(CMD_SPARK, args)

	server := action.Server
	setting, _, e := (&server).Connect()
	result, e := setting.GetOutputCommandSsh(cmd)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

func runSSH(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	server := action.Server
	setting, _, e := (&server).Connect()
	ssh := action.Action.(colonycore.ActionSSH)

	result, e := setting.GetOutputCommandSsh(ssh.Command)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

func runShell(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	server := action.Server
	setting, _, e := (&server).Connect()
	shell := action.Action.(colonycore.ActionShellScript)
	result, e := setting.GetOutputCommandSsh(shell.Script)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

func runMapReduce(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	server := action.Server
	setting, _, e := (&server).Connect()
	mr := action.Action.(colonycore.ActionHadoopStreaming)

	cmd := fmt.Sprintf(CMD_MAP_REDUCE, mr.Jar, mr.Input, mr.Output, mr.Mapper, mr.Reducer)

	for _, file := range mr.Files {
		if file != "" {
			cmd = cmd + " -file" + file
		}
	}

	/*for _, param := range mr.Params {
		if param != "" {
			cmd = cmd + param
		}
	}*/

	if mr.Params != "" {
		cmd = cmd + " " + mr.Params
	}

	result, e := setting.GetOutputCommandSsh(cmd)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

func runJava(process colonycore.DataFlow, action colonycore.FlowAction, arguments string) (res []toolkit.M, e error) {
	server := action.Server
	setting, _, e := (&server).Connect()
	java := action.Action.(colonycore.ActionJavaApp)
	cmd := fmt.Sprintf(CMD_JAVA, java.Jar)
	result, e := setting.GetOutputCommandSsh(cmd)

	if e != nil {
		return res, e
	}

	res = append(res, toolkit.M{}.Set("result_stdout", result))
	return
}

// watch, watch the process and mantain the link between the action in the flow
func watch(process colonycore.DataFlow) (e error) {
	act_result_path = ACT_RESULT_PATH + toolkit.Date2String(time.Now(), "dd/MM/yyyy - hh:mm:ss") + process.ID
	globalParam = process.GlobalParam

	var ListCurrentTierAction, ListLastTierAction, ListNextTierAction []colonycore.FlowAction

	//get initial current tier action
	for _, action := range process.Actions {
		if action.FirstAction {
			ListCurrentTierAction = append(ListCurrentTierAction, action)
		}
	}

	for len(ListCurrentTierAction) > 0 {
		nextIdx := []string{}
		for _, tier := range ListCurrentTierAction {
			CurrentAction := tier
			isFound := false
			var files []byte
			var filenames []string
			var ActionBefore []colonycore.FlowAction

			//check previous action result status file to make sure that previous action was complete
			for isFound == false {
				ActionBefore = getActionBefore(ListLastTierAction, CurrentAction)

				if ActionBefore != nil {
					for _, actx := range ActionBefore {
						files, e = getActionResultStatus(process, actx)
						if e != nil {
							return
							break
						}
						if files != nil {
							isFound = true
							filenames = append(filenames, getActionResultStatusPath(process, actx))
						} else {
							isFound = false
							filenames = []string{}
							break
						}
					}
					time.Sleep(time.Second * 5)
				} else {
					isFound = true
				}
			}

			//read previous action result status to get next process ID || get last tier action for next result check || run current action
			if len(filenames) > 0 {
				for _, fname := range filenames {
					files, e := ioutil.ReadFile(fname)

					if e != nil {
						return e
					}

					if strings.Contains(string(files), "OK") {
						for _, ok := range CurrentAction.OK {
							ListLastTierAction = append(ListLastTierAction, CurrentAction)
							nextIdx = append(nextIdx, GetAction(process, ok).Id)
						}
					} else {
						for _, nok := range CurrentAction.KO {
							ListLastTierAction = append(ListLastTierAction, CurrentAction)
							nextIdx = append(nextIdx, GetAction(process, nok).Id)
						}
					}

					go runProcess(process, CurrentAction, ActionBefore)

					//update globalParam
					if CurrentAction.OutputParam != nil {
						for key, val := range CurrentAction.OutputParam {
							if strings.Contains(strings.ToLower(key), GLOBAL_PARAM_KEYWORD) {
								globalParam.Set(key, val)
							}
						}
					}
				}
			}

			//get next tier action
			if len(nextIdx) > 0 {
				for _, idx := range nextIdx {
					ListNextTierAction = append(ListNextTierAction, GetAction(process, idx))
				}
			}
		}

		ListLastTierAction = []colonycore.FlowAction{}
		for _, curr := range ListCurrentTierAction {
			ListLastTierAction = append(ListLastTierAction, curr)
		}

		ListCurrentTierAction = []colonycore.FlowAction{}
		for _, next := range ListNextTierAction {
			ListCurrentTierAction = append(ListCurrentTierAction, next)
		}

		ListNextTierAction = []colonycore.FlowAction{}
	}

	return
}

//  generateProcessID generate the ID
func generateProcessID(flowID string) (processID string) {
	now := time.Now()
	y := strconv.Itoa(now.Year())
	m := strconv.Itoa(int(now.Month()))
	d := strconv.Itoa(now.Day())
	hh := strconv.Itoa(now.Hour())
	nm := strconv.Itoa(now.Minute())
	ns := strconv.Itoa(now.Second())
	processID = flowID + "-" + y + m + d + hh + nm + ns
	return
}

/*func generateProcessID(flowID string) (processID string) {
	processID = flowID + "-" + randString(10)
	return
}

func randString(n int) string {
	var src = rand.NewSource(time.Now().UnixNano())

	b := make([]byte, 30)
	// A src.Int63() generates 63 random bits, enough for letterIdxMax characters!
	for i, cache, remain := n-1, src.Int63(), letterIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = src.Int63(), letterIdxMax
		}
		if idx := int(cache & letterIdxMask); idx < len(letterBytes) {
			b[i] = letterBytes[idx]
			i--
		}
		cache >>= letterIdxBits
		remain--
	}

	return string(b)
}*/

// GetStatus get the status of running flow
func GetProcessedFlow(id string) (process colonycore.DataFlowProcess, e error) {
	dataDs := []colonycore.DataFlowProcess{}
	cursor, e := colonycore.Find(new(colonycore.DataFlowProcess), dbox.Eq("_id", id))
	if cursor != nil {
		cursor.Fetch(&dataDs, 0, false)
		defer cursor.Close()
	}

	if e != nil && cursor != nil {
		return
	}

	if len(dataDs) > 0 {
		process = dataDs[0]
	}

	return
}

func getActionResultStatusPath(flow colonycore.DataFlow, action colonycore.FlowAction) (dirName string) {
	return act_result_path + "/" + action.Id + "/act_status/res_Status.txt"
}

func GetAction(flow colonycore.DataFlow, actionId string) (action colonycore.FlowAction) {
	for _, act := range flow.Actions {
		if act.Id == actionId {
			action = act
			break
		}
	}
	return
}

func getActionBefore(ListActionBefore []colonycore.FlowAction, CurrentAction colonycore.FlowAction) (ActionBefore []colonycore.FlowAction) {
	for _, act := range ListActionBefore {
		for _, idx := range act.OK {
			if idx == CurrentAction.Id {
				ActionBefore = append(ActionBefore, act)
			}
		}

		for _, idx := range act.KO {
			if idx == CurrentAction.Id {
				ActionBefore = append(ActionBefore, act)
			}
		}
	}
	return
}

func setCommandArgument(action colonycore.FlowAction) (arguments string) {
	//decode action output file, convert to toolkit.M, then add into argument as its key
	res, _ := decodeOutputFile(action)
	resMap := res.(toolkit.M)

	for key, _ := range action.InputParam {
		if !strings.Contains(strings.ToLower(key), GLOBAL_PARAM_KEYWORD) {
			arguments += string(key) + "=" + resMap.GetString(key)
		} else {
			arguments += string(key) + "=" + globalParam.GetString(key)
		}
	}

	return
}

func writeActionResultStatus(flow colonycore.DataFlow, action colonycore.FlowAction, msg string) (err error) {
	filepath := act_result_path + "/" + action.Id + "/act_status/res_Status.txt"
	err = ioutil.WriteFile(filepath, []byte(msg), 0755)
	return
}

func getActionResultStatus(flow colonycore.DataFlow, action colonycore.FlowAction) (file []byte, err error) {
	temppath := act_result_path + "/" + action.Id + "/act_status/res_Status.txt"
	res, err := ioutil.ReadFile(temppath)
	return res, err
}

func decodeOutputFile(action colonycore.FlowAction) (output interface{}, e error) {
	outputPath := action.OutputPath

	file, e := ioutil.ReadFile(outputPath)
	if e != nil {
		return nil, e
	}

	switch action.OutputType {
	case "JSON":
		e = json.Unmarshal(file, &output)
	case "CSV":
		output, e = decodeCSV(file)
		break
	case "TSV":
		output, e = decodeTSV(file)
		break
	case "TEXT":
		output, e = decodeText(file)
		break
	default:
		break
	}

	return
}

func decodeCSV(file []byte) (retVal interface{}, e error) {
	reader := csv.NewReader(strings.NewReader(string(file)))
	records, e := reader.ReadAll()

	if e != nil {
		return
	}

	var list []interface{}

	for _, row := range records {
		line := toolkit.M{}
		for idx, val := range row {
			line.Set(toolkit.ToString(idx), val)
		}

		list = append(list, line)
	}

	if len(list) > 0 {
		retVal = list[0]
	}

	return
}

func decodeTSV(file []byte) (retVal interface{}, e error) {
	reader := csv.NewReader(strings.NewReader(string(file)))
	reader.Comma = '\t'
	records, e := reader.ReadAll()

	if e != nil {
		return
	}

	var list []interface{}

	for _, row := range records {
		line := toolkit.M{}
		for idx, val := range row {
			line.Set(toolkit.ToString(idx), val)
		}

		list = append(list, line)
	}

	if len(list) > 0 {
		retVal = list[0]
	}

	return
}

func decodeText(file []byte) (retVal interface{}, e error) {
	retVal = string(file)
	return
}
