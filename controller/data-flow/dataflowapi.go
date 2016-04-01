package dataflow

import (
	"math/rand"
	"time"

	"github.com/eaciit/colony-core/v0"
)

func Start(flow colonycore.DataFlow, user string) (processID string, e error) {
	var steps []FlowAction
	// steps = append(steps, flow.Actions[0].(colonycore.FlowAction))

	process := colonycore.DataFlowProcess{
		Id:          generateProcessID(),
		Flow:        flow,
		StartDate:   time.Now(),
		UserStarted: user,
		Steps:       steps,
	}

	// run the watcher and run the process, please update regardingly
	go watch(process)

	return
}

// need to define is the process can be stop or not
/*func Stop(processID string) (e error) {

	return
}*/

// runProcess process the flow
func runProcess(process colonycore.DataFlowProcess) (e error) {

	return
}

// watch watch the process and mantain the link between the action in the flow
func watch(process colonycore.DataFlowProcess) (e error) {

	// run the process
	go runProcess(process)

	return
}

//  generateProcessID generate the ID
func generateProcessID(flowID string) (processID string) {
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
}

// GetStatus get the status of running flow
func GetStatus(flowId string) (process DataFlowProcess, e error) {

	return
}
