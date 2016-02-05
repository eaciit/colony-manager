package controller

import (
	"encoding/json"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"github.com/robfig/cron"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	serviceHolder       = map[string]*cron.Cron{}
	logPath             = filepath.Join(AppBasePath, "config", "datagrabber", "log")
	transformedDataPath = filepath.Join(AppBasePath, "config", "datagrabber", "data")
	logAt               = ""
	logFileName         = ""
)

type DataGrabberController struct {
	App
}

func CreateDataGrabberController(s *knot.Server) *DataGrabberController {
	var controller = new(DataGrabberController)
	controller.Server = s
	return controller
}

func (d *DataGrabberController) getLogger(dataGrabber *colonycore.DataGrabber) (*toolkit.LogEngine, error) {
	logFileName := fmt.Sprintf("%s-%s", dataGrabber.ID, logFileName)
	logFilePattern := ""

	logConf, err := toolkit.NewLog(false, true, logPath, logFileName, logFilePattern)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return nil, err
	}

	currentDataGrabber := new(colonycore.DataGrabber)
	err = colonycore.Get(currentDataGrabber, dataGrabber.ID)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return nil, err
	}
	if currentDataGrabber.RunAt == nil {
		currentDataGrabber.RunAt = []string{}
	}
	if !toolkit.HasMember(currentDataGrabber.RunAt, logAt) {
		currentDataGrabber.RunAt = append(currentDataGrabber.RunAt, logAt)
	}

	err = colonycore.Delete(currentDataGrabber)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return nil, err
	}

	err = colonycore.Save(currentDataGrabber)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return nil, err
	}

	return logConf, nil
}

func (d *DataGrabberController) SaveDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	before := new(colonycore.DataGrabber)
	err = colonycore.Get(before, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	payload.RunAt = before.RunAt
	err = colonycore.Save(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataGrabberController) FindDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]string{"inputText":"GRAB_TEST"}

	text := payload["inputText"]

	// == bug, cant find if autocomplite, just full text can be get result
	var query *dbox.Filter
	query = dbox.Or(dbox.Eq("_id",text),dbox.Eq("DataSourceOrigin",text),dbox.Eq("DataSourceDestination",text),dbox.Eq("IntervalType",text),dbox.Eq("GrabInterval",text),dbox.Eq("TimeoutInterval",text))

	data := []colonycore.DataGrabber{}
	cursor, err := colonycore.Find(new(colonycore.DataGrabber), query)
	cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (d *DataGrabberController) SelectDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataGrabberController) GetLogs(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		ID   string `json:"_id",bson:"_id"`
		Date string
	}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	logFileName := fmt.Sprintf("%s-%s", payload.ID, strings.Split(payload.Date, "-")[0])
	filepath := filepath.Join(AppBasePath, "config", "datagrabber", "log", logFileName)
	bytes, err := ioutil.ReadFile(filepath)
	if err != nil {
		panic(err)
	}
	logs := string(bytes)

	return helper.CreateResult(true, logs, "")
}

func (d *DataGrabberController) GetTransformedData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		ID   string `json:"_id",bson:"_id"`
		Date string
	}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	filepath := filepath.Join(AppBasePath, "config", "datagrabber", "data", fmt.Sprintf("%s.json", payload.Date))
	bytes, err := ioutil.ReadFile(filepath)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	transformedData := []toolkit.M{}
	err = json.Unmarshal(bytes, &transformedData)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, transformedData, "")
}

func (d *DataGrabberController) GetDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := []colonycore.DataGrabber{}
	cursor, err := colonycore.Find(new(colonycore.DataGrabber), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (d *DataGrabberController) RemoveDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataGrabberController) StartTransformation(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	dataGrabber := new(colonycore.DataGrabber)
	err := r.GetPayload(dataGrabber)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(dataGrabber, dataGrabber.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	logAt = time.Now().Format("20060102-150405")
	logFileName = strings.Split(logAt, "-")[0]

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		process := serviceHolder[dataGrabber.ID]
		process.Stop()
		delete(serviceHolder, dataGrabber.ID)

		message := fmt.Sprintf("===> Transformation stopped! %s -> %s", dataGrabber.DataSourceOrigin, dataGrabber.DataSourceDestination)
		fmt.Println(message)

		logConf, err := d.getLogger(dataGrabber)
		if err != nil {
			logConf.AddLog(err.Error(), "ERROR")
			defer logConf.Close()
		}

		logConf.AddLog(message, "SUCCESS")
	} else {
		message := fmt.Sprintf("===> Starting transform! %s -> %s", dataGrabber.DataSourceOrigin, dataGrabber.DataSourceDestination)
		fmt.Println(message)

		logConf, err := d.getLogger(dataGrabber)
		if err != nil {
			logConf.AddLog(err.Error(), "ERROR")
			defer logConf.Close()
		}

		logConf.AddLog(message, "SUCCESS")
	}

	yo := func() {
		logConfTransformation, err := d.getLogger(dataGrabber)
		if err != nil {
			logConfTransformation.AddLog(err.Error(), "ERROR")
			defer logConfTransformation.Close()
		}

		success, data, message := d.Transform(dataGrabber)
		_, _, _ = success, data, message
		// timeout not yet implemented

		dataPath := filepath.Join(transformedDataPath, fmt.Sprintf("%s.json", logAt))
		if toolkit.IsFileExist(dataPath) {
			if err = os.Remove(dataPath); err != nil {
				logConfTransformation.AddLog(err.Error(), "ERROR")
			}
		}

		if _, err = os.Create(dataPath); err != nil {
			logConfTransformation.AddLog(err.Error(), "ERROR")
		} else {
			if bytes, err := json.Marshal(data); err != nil {
				logConfTransformation.AddLog(err.Error(), "ERROR")
			} else {
				if err = ioutil.WriteFile(dataPath, bytes, 0666); err != nil {
					logConfTransformation.AddLog(err.Error(), "ERROR")
				}
			}
		}
	}
	yo()

	process := cron.New()
	serviceHolder[dataGrabber.ID] = process
	duration := fmt.Sprintf("%d%s", dataGrabber.GrabInterval, string(dataGrabber.IntervalType[0]))
	process.AddFunc("@every "+duration, yo)
	process.Start()

	return helper.CreateResult(true, nil, "")
}

func (d *DataGrabberController) StopTransformation(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	dataGrabber := new(colonycore.DataGrabber)
	err := r.GetPayload(dataGrabber)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	logFileName = dataGrabber.ID
	logFilePattern := ""
	logConf, err := toolkit.NewLog(false, true, logPath, logFileName, logFilePattern)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
	}

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		process := serviceHolder[dataGrabber.ID]
		process.Stop()
		delete(serviceHolder, dataGrabber.ID)

		message := fmt.Sprintf("===> Transformation stopped! %s -> %s", dataGrabber.DataSourceOrigin, dataGrabber.DataSourceDestination)
		logConf.AddLog(message, "SUCCESS")
		fmt.Println(message)
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataGrabberController) Stat(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	dataGrabber := new(colonycore.DataGrabber)
	err := r.GetPayload(dataGrabber)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	_, ok := serviceHolder[dataGrabber.ID]
	return helper.CreateResult(true, ok, "")
}

func (d *DataGrabberController) Transform(dataGrabber *colonycore.DataGrabber) (bool, []toolkit.M, string) {
	logConf, err := d.getLogger(dataGrabber)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		defer logConf.Close()
	}

	message := fmt.Sprintf("===> Transformation started! %s -> %s interval %d %s", dataGrabber.DataSourceOrigin, dataGrabber.DataSourceDestination, dataGrabber.GrabInterval, dataGrabber.IntervalType)
	logConf.AddLog(message, "SUCCESS")
	fmt.Println(message)

	dsOrigin := new(colonycore.DataSource)
	err = colonycore.Get(dsOrigin, dataGrabber.DataSourceOrigin)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}

	dsDestination := new(colonycore.DataSource)
	err = colonycore.Get(dsDestination, dataGrabber.DataSourceDestination)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}

	dataDS, _, conn, query, metaSave, err := new(DataSourceController).
		ConnectToDataSource(dataGrabber.DataSourceOrigin)
	if len(dataDS.QueryInfo) == 0 {
		message := "Data source origin has invalid query"
		logConf.AddLog(message, "ERROR")
		return false, nil, message
	}
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}
	defer conn.Close()

	if metaSave.keyword != "" {
		message := `Data source origin query is not "Select"`
		logConf.AddLog(message, "ERROR")
		return false, nil, message
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}
	defer cursor.Close()

	data := []toolkit.M{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}

	arrayContains := func(slice []string, key string) bool {
		for _, each := range slice {
			if each == key {
				return true
			}
		}

		return false
	}

	connDesc := new(colonycore.Connection)
	err = colonycore.Get(connDesc, dsDestination.ConnectionID)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}

	transformedData := []toolkit.M{}

	for _, each := range data {
		eachTransformedData := toolkit.M{}

		for _, eachMeta := range dsDestination.MetaData {
			if arrayContains(dataGrabber.IgnoreFieldsDestination, eachMeta.ID) {
				continue
			}

			fieldFrom := eachMeta.ID
		checkMap:
			for _, eachMap := range dataGrabber.Map {
				if eachMap.FieldDestination == eachMeta.ID {
					fieldFrom = eachMap.FieldOrigin
					break checkMap
				}
			}

			eachTransformedData.Set(eachMeta.ID, each.Get(fieldFrom))
		}

		transformedData = append(transformedData, eachTransformedData)

		tableName := dsDestination.QueryInfo.GetString("from")

		queryWrapper := helper.Query(connDesc.Driver, connDesc.Host, connDesc.Database, connDesc.UserName, connDesc.Password, connDesc.Settings)
		err = queryWrapper.Delete(tableName, dbox.Eq("_id", eachTransformedData.GetString("_id")))

		queryWrapper = helper.Query(connDesc.Driver, connDesc.Host, connDesc.Database, connDesc.UserName, connDesc.Password, connDesc.Settings)
		err = queryWrapper.Save(tableName, eachTransformedData)
		if err != nil {
			logConf.AddLog(err.Error(), "ERROR")
			return false, nil, err.Error()
		}
	}

	message = fmt.Sprintf("===> Success transforming %v data", len(transformedData))
	logConf.AddLog(message, "SUCCESS")
	fmt.Println(message)

	return true, transformedData, ""
}
