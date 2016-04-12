package dataflow

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/hdc/hive"
	"github.com/eaciit/colony-manager/controller"	
	"github.com/eaciit/toolkit"
	"io/ioutil"
	//"math/rand"
	"os"
	"reflect"
	"strings"
	"time"
	"os/exec"
	"bufio"
)

const (
	ACTION_TYPE_HIVE     = "HIVE"
	ACTION_TYPE_HDFS     = "HDFS"
	ACTION_TYPE_SPARK    = "SPARK"
	ACTION_TYPE_DECISION = "DECISION"
	ACTION_TYPE_SSH      = "SSH"
	ACTION_TYPE_KAFKA    = "KAFKA"

	FORK_TYPE_ALL       = "ALL"
	FORK_TYPE_ONE       = "ONE"
	FORK_TYPE_MANDATORY = "MANDATORY"

	SSH_OPERATION_MKDIR = "MKDIR"
	// SSH_OPERATION_* please define
)

var CurrentAction colonycore.FlowAction
var hivex *hive.Hive
var hdfsx *hdfs.WebHdfs

func Start(flow colonycore.DataFlow, user string) (processID string, e error) {
	//var steps []colonycore.FlowAction
	// steps = append(steps, flow.Actions[0].(colonycore.FlowAction))

	/*process := colonycore.DataFlowProcess{
		Id:          generateProcessID(),
		Flow:        flow,
		StartDate:   time.Now(),
		UserStarted: user,
		Steps:       steps,
	}*/

	// run the watcher and run the process, please update regardingly
	go watch(flow)

	return
}

// need to define is the process can be stop or not
/*func Stop(processID string) (e error) {

	return
}*/

// runProcess process the flow
func runProcess(process colonycore.DataFlow, action colonycore.FlowAction, actionBefore []colonycore.FlowAction) (e error) {

	for _, act := range actionBefore {
		action.Context = append(action.Context, act.Context)
	}

	var res []toolkit.M
	switch action.Type {
		case ACTION_TYPE_HIVE:
			res, e = runHive(process, action)
			break
		case ACTION_TYPE_HDFS:
			res, e = runHDFS(process, action)
			break
		case ACTION_TYPE_SPARK:
			res, e = runSpark(process, action)
			break
		case ACTION_TYPE_SSH:
			res, e = runSSH(process, action)
			break
	}
	fmt.Println(res)
	return e
}

func runHive(process colonycore.DataFlow, action colonycore.FlowAction) (res []toolkit.M, e error) {
	var action_hive colonycore.ActionHive
	action_hive = action.Action.(colonycore.ActionHive)

	hivex = hive.HiveConfig(action.Server.Host, "", "Username", "Password", "Path")

	e = hivex.Populate(action_hive.ScriptPath, &res)

	return res, e
}

func runHDFS(process colonycore.DataFlow, action colonycore.FlowAction) (res []toolkit.M, e error) {
	hdfsx, e = hdfs.NewWebHdfs(hdfs.NewHdfsConfig("http://192.168.0.223:50070", "hdfs"))
	var action_hdfs colonycore.ActionHDFS
	var server *colonycore.Server
	action_hdfs = action.Action.(colonycore.ActionHDFS)

	switch action_hdfs.Operation {
		case "GetDir":
			listdir, e := hdfsx.List(action_hdfs.Path)
			if e != nil { return nil, e; break }

			for _, files := range listdir.FileStatuses.FileStatus {

				var v reflect.Type
				v = reflect.TypeOf(files).Elem()
				var xxx toolkit.M

				for i := 0; i < v.NumField(); i++ {
					xxx.Set(v.Field(i).Name, reflect.ValueOf(files).Elem().Field(i).String())
				}

				res = append(res, xxx)
			}
			break
		case "NewFile":
			tempPath := strings.Replace(controller.GetHomeDir()+"/", "//", "/", -1)
			FileName := strings.Split(action_hdfs.Path, "/")[len(strings.Split(action_hdfs.Path, "/"))-1]
			file, e := os.Create(tempPath + FileName)
			if e != nil { return nil, e; break }
			defer file.Close()

			e = hdfsx.Put(tempPath+FileName, action_hdfs.NewPath, "", nil, server)
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "NewFolder":
			e = hdfsx.MakeDir(action_hdfs.Path, "")
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "Permission":
			permission, e := helper.ConstructPermission(action_hdfs.Permission)
			e = hdfsx.SetPermission(action_hdfs.Path, permission)
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "Delete":
			err := hdfsx.Delete(true, action_hdfs.Path)
			if err != nil {
				if len(err) > 0 {
					for _, e = range err {
						return nil, e
					}
				}
				break
			}

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "Rename":
			e = hdfsx.Rename(action_hdfs.Path, action_hdfs.NewPath)
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "Download":
			e = hdfsx.GetToLocal(action_hdfs.Path, action_hdfs.NewPath, action_hdfs.Permission, server)
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		case "Upload":
			e = hdfsx.Put(action_hdfs.Path, action_hdfs.NewPath, action_hdfs.Permission, nil, server)
			if e != nil { return nil, e; break }

			var tk toolkit.M
			tk.Set("result", "OK")
			res = append(res, tk)
			break
		default:
			break
	}

	return res, e
}

func runSpark(process colonycore.DataFlow, action colonycore.FlowAction) (res []toolkit.M, e error) {
	var action_spark colonycore.ActionSpark
	action_spark = action.Action.(colonycore.ActionSpark)

	arg := append([]string{"-c"}, action_spark.Application.Command.(string))
	cmd := exec.Command("spark-submit", arg...)
	Stdout, e := cmd.StdoutPipe()

	if  e != nil { return nil, e }

	var result toolkit.M
	result.Set("Result", bufio.NewReader(Stdout) )

	e = cmd.Start()

	return res, e
}

func runSSH(process colonycore.DataFlow, action colonycore.FlowAction) (res []toolkit.M, e error){
	var action_ssh colonycore.ActionSSH
	action_ssh = action.Action.(colonycore.ActionSSH)

	cmd := exec.Command("sh", "-c", action_ssh.Operation)
	//stdin, e := cmd.StdinPipe()
	//if e!= nil {return nil, e}
	stdout, e := cmd.StdoutPipe()
	if e!= nil {return nil, e}
	e = cmd.Start()
	if e!= nil {return nil, e}

	var result toolkit.M
	//result.Set("result_stdin", bufio.NewReader(stdin))
	result.Set("result_stdout", bufio.NewReader(stdout))
	res = append(res, result)
	return
}

// watch watch the process and mantain the link between the action in the flow
func watch(process colonycore.DataFlow) (e error) {

	var firstAction colonycore.FlowAction
	var ListCurrentTierAction, ListLastTierAction []colonycore.FlowAction
	var nextIdx []string
	isLastAction := false
	idx := 1

	for _, action := range process.Actions {
		if action.FirstAction {
			firstAction = action
			break
		}
	}

	if CurrentAction.Action == nil {CurrentAction = firstAction	}

	for isLastAction == false {
		if len(nextIdx) == 0{ isLastAction = true }

		nextIdx := []string{}

		for _, Tier := range ListCurrentTierAction {
			CurrentAction = Tier
			isFound := false
			var files []byte
			var filenames []string
			var ActionBefore []colonycore.FlowAction
			for isFound {
				ActionBefore = GetActionBefore(ListLastTierAction, CurrentAction)

				for _,actx := range ActionBefore{
					files, e = ioutil.ReadFile(formatActionOutputFile(process, actx))
					if e!= nil { return e; break}
					if files != nil {isFound = true; filenames = append(filenames,formatActionOutputFile(process, actx))} else {isFound = false; filenames = []string{}; break}
				}

				time.Sleep(time.Second * 5)
			}

			if len(filenames) > 0 {
				for _, fname := range filenames{
					files, e = ioutil.ReadFile(fname)	

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
				}
				go runProcess(process, CurrentAction, ActionBefore)
			}

			if idx == len(ListCurrentTierAction){ ListLastTierAction = []colonycore.FlowAction{} }
			idx++
		}
	}

	return e
}

//  generateProcessID generate the ID
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
func GetStatus(flowId string) (process colonycore.DataFlow, e error) {

	return
}

func formatActionOutputFile(flow colonycore.DataFlow, action colonycore.FlowAction) (dirName string) {
	return flow.Name + action.Id
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

func GetActionBefore(ListActionBefore []colonycore.FlowAction, CurrentAction colonycore.FlowAction)(ActionBefore []colonycore.FlowAction){
	for _, act := range ListActionBefore{
		for _, idx := range act.OK {
			if idx == CurrentAction.Id {ActionBefore = append(ActionBefore, act)}
		}

		for _, idx := range act.KO {
			if idx == CurrentAction.Id {ActionBefore = append(ActionBefore, act)}
		}
	}
	return
}
