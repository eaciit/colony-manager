package controller

import (
	"encoding/json"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

var (
	serviceHolder = map[string]bool{}
	dgLogPath     = filepath.Join(EC_DATA_PATH, "datagrabber", "log")
	dgOutputPath  = filepath.Join(EC_DATA_PATH, "datagrabber", "output")
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
	logAt := time.Now().Format("20060102-150405")
	logFileName := strings.Split(logAt, "-")[0]
	logFileNameParsed := fmt.Sprintf("%s-%s", dataGrabber.ID, logFileName)
	logFilePattern := ""

	logConf, err := toolkit.NewLog(false, true, dgLogPath, logFileNameParsed, logFilePattern)
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

	//~ payload := map[string]string{"inputText":"test"}
	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	text := payload["inputText"].(string)
	textLow := strings.ToLower(text)

	var query *dbox.Filter
	valueInt, errv := strconv.Atoi(text)
	fmt.Printf("", valueInt)
	fmt.Printf("", errv)
	if errv == nil {
		// == try useing Eq for support integer
		query = dbox.Or(dbox.Eq("GrabInterval", valueInt), dbox.Eq("TimeoutInterval", valueInt))
	} else {
		// == try useing Contains for support autocomplite
		query = dbox.Or(dbox.Contains("_id", text), dbox.Contains("_id", textLow), dbox.Contains("DataSourceOrigin", text), dbox.Contains("DataSourceOrigin", textLow), dbox.Contains("DataSourceDestination", text), dbox.Contains("DataSourceDestination", textLow), dbox.Contains("IntervalType", text), dbox.Contains("IntervalType", textLow))
	}

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
	filepath := filepath.Join(dgLogPath, logFileName)
	bytes, err := ioutil.ReadFile(filepath)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
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

	filepath := filepath.Join(dgOutputPath, fmt.Sprintf("%s.json", payload.Date))
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

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)

	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", search), dbox.Contains("DataSourceOrigin", search), dbox.Contains("DataSourceDestination", search), dbox.Contains("IntervalType", search))

	data := []colonycore.DataGrabber{}
	cursor, err := colonycore.Find(new(colonycore.DataGrabber), query)

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

func (d *DataGrabberController) RemoveMultipleDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		o := new(colonycore.DataGrabber)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
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

	logAt := time.Now().Format("20060102-150405")

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		serviceHolder[dataGrabber.ID] = false
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

		dataPath := filepath.Join(dgOutputPath, fmt.Sprintf("%s.json", logAt))
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

	if !dataGrabber.UseInterval {
		return helper.CreateResult(true, nil, "")
	}

	serviceHolder[dataGrabber.ID] = true

	go func(dg *colonycore.DataGrabber) {
		for true {
			if flag, _ := serviceHolder[dg.ID]; !flag {
				break
			}

			var interval time.Duration
			switch dataGrabber.IntervalType {
			case "seconds":
				interval = time.Duration(dataGrabber.GrabInterval) * time.Second
			case "minutes":
				interval = time.Duration(dataGrabber.GrabInterval) * time.Minute
			case "hours":
				interval = time.Duration(dataGrabber.GrabInterval) * time.Hour
			}

			time.Sleep(interval)
			yo()
		}
	}(dataGrabber)

	return helper.CreateResult(true, nil, "")
}

func (d *DataGrabberController) StopTransformation(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	dataGrabber := new(colonycore.DataGrabber)
	err := r.GetPayload(dataGrabber)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	logFileName := dataGrabber.ID
	logFilePattern := ""
	logConf, err := toolkit.NewLog(false, true, dgLogPath, logFileName, logFilePattern)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
	}

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		serviceHolder[dataGrabber.ID] = false
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

	connDesc := new(colonycore.Connection)
	err = colonycore.Get(connDesc, dsDestination.ConnectionID)
	if err != nil {
		logConf.AddLog(err.Error(), "ERROR")
		return false, nil, err.Error()
	}

	const FLAG_ARG_DATA string = `%1`
	transformedData := []toolkit.M{}

	for _, each := range data {
		eachTransformedData := toolkit.M{}

		for _, eachMap := range dataGrabber.Maps {
			var valueEachSourceField interface{}

			// ============================================ SOURCE
			if !strings.Contains(eachMap.Source, "|") {
				// source could be: field, object, array
				valueEachSourceField = each.Get(eachMap.Source)
			} else {
				// source could be: field of object, field of array-objects
				prev := strings.Split(eachMap.Source, "|")[0]
				next := strings.Split(eachMap.Source, "|")[1]

				var fieldInfoDes *colonycore.FieldInfo = nil
				for _, eds := range dsOrigin.MetaData {
					if eds.ID == prev {
						fieldInfoDes = eds
						break
					}
				}

				if fieldInfoDes != nil {
					// source is field of array-objects
					if fieldInfoDes.Type == "array-objects" {
						valueObjects := []interface{}{}
						if temp, _ := each.Get(prev, nil).([]interface{}); temp != nil {
							valueObjects = make([]interface{}, len(temp))
							for i, each := range temp {
								if tempSub, _ := toolkit.ToM(each); tempSub != nil {
									valueObjects[i] = tempSub.Get(next)
								}
							}
						}
						valueEachSourceField = valueObjects
					} else {
						// source is field of object
						valueObject := toolkit.M{}
						if valueObject, _ = toolkit.ToM(each.Get(prev)); valueObject != nil {
							valueEachSourceField = valueObject.Get(next)
						}
					}
				}
			}

			// ============================================ DESTINATION
			if !strings.Contains(eachMap.Destination, "|") {
				if eachMap.SourceType == "object" {
					sourceObject, _ := toolkit.ToM(valueEachSourceField)
					if sourceObject == nil {
						sourceObject = toolkit.M{}
					}

					valueObject := toolkit.M{}
					for _, desMeta := range dsDestination.MetaData {
						if desMeta.ID == eachMap.Destination {
							for _, eachMetaSub := range desMeta.Sub {
								// valueObject.Set(eachMetaSub.ID, sourceObject.Get(eachMetaSub.ID))
								valueObject.Set(eachMetaSub.ID, d.convertTo(sourceObject.Get(eachMetaSub.ID), eachMap.DestinationType))
							}
							break
						}
					}

					eachTransformedData.Set(eachMap.Destination, valueObject)
				} else if eachMap.SourceType == "array-objects" {
					sourceObjects, _ := valueEachSourceField.([]interface{})
					if sourceObjects == nil {
						sourceObjects = []interface{}{}
					}

					valueObjects := []interface{}{}
					for _, sourceObjectRaw := range sourceObjects {
						sourceObject, _ := toolkit.ToM(sourceObjectRaw)
						if sourceObject == nil {
							sourceObject = toolkit.M{}
						}

						valueObject := toolkit.M{}
						for _, desMeta := range dsDestination.MetaData {
							if desMeta.ID == eachMap.Destination {
								for _, eachMetaSub := range desMeta.Sub {
									// valueObject.Set(eachMetaSub.ID, sourceObject.Get(eachMetaSub.ID))
									valueObject.Set(eachMetaSub.ID, d.convertTo(sourceObject.Get(eachMetaSub.ID), eachMap.DestinationType))
								}
								break
							}
						}

						valueObjects = append(valueObjects, valueObject)
					}

					eachTransformedData.Set(eachMap.Destination, valueObjects)
				} else {
					// eachTransformedData.Set(eachMap.Destination, convertDataType(eachMap.DestinationType, eachMap.Source, each))
					eachTransformedData.Set(eachMap.Destination, d.convertTo(each.Get(eachMap.Source), eachMap.DestinationType))
				}
			} else {
				prev := strings.Split(eachMap.Destination, "|")[0]
				next := strings.Split(eachMap.Destination, "|")[1]

				var fieldInfoDes *colonycore.FieldInfo = nil
				for _, eds := range dsDestination.MetaData {
					if eds.ID == prev {
						fieldInfoDes = eds
						break
					}
				}

				if fieldInfoDes != nil {
					if fieldInfoDes.Type == "array-objects" {
						valueObjects := []interface{}{}
						if temp := eachTransformedData.Get(prev, nil); temp == nil {
							valueObjects = []interface{}{}
						} else {
							valueObjects, _ = temp.([]interface{})
							if valueObjects == nil {
								valueObjects = []interface{}{}
							}
						}

						if temp, _ := valueEachSourceField.([]interface{}); temp != nil {
							for i, eachVal := range temp {
								valueObject := toolkit.M{}
								if len(valueObjects) > i {
									if temp2, _ := toolkit.ToM(valueObjects[i]); temp2 != nil {
										valueObject = temp2
										// valueObject.Set(next, eachVal)
										valueObject.Set(next, d.convertTo(eachVal, eachMap.DestinationType))
									}

									valueObjects[i] = valueObject
								} else {
									if fieldInfoDes.Sub != nil {
										for _, subMeta := range fieldInfoDes.Sub {
											valueObject.Set(subMeta.ID, nil)
										}
									}

									// valueObject.Set(next, eachVal)
									valueObject.Set(next, d.convertTo(eachVal, eachMap.DestinationType))
									valueObjects = append(valueObjects, valueObject)
								}
							}
						}

						eachTransformedData.Set(prev, valueObjects)
					} else {
						valueObject, _ := toolkit.ToM(eachTransformedData.Get(prev))
						if valueObject == nil {
							valueObject = toolkit.M{}
						}

						//tambahan
						prevSource := strings.Split(eachMap.Source, "|")[0]
						nextSource := strings.Split(eachMap.Source, "|")[1]
						mval, _ := toolkit.ToM(each.Get(prevSource, nil))

						//=========
						valueObject.Set(next, d.convertTo(mval.Get(nextSource), eachMap.DestinationType))
						// valueObject.Set(next, convertDataType(eachMap.DestinationType, nextSource, mval))
						eachTransformedData.Set(prev, valueObject)
					}
				}
			}
		}

		transformedData = append(transformedData, eachTransformedData)
		dataToSave := eachTransformedData

		// ================ pre transfer command
		if dataGrabber.PreTransferCommand != "" {
			// jsonTranformedDataBytes, err := json.Marshal(each)
			jsonTranformedDataBytes, err := json.Marshal(eachTransformedData)
			if err != nil {
				return false, nil, err.Error()
			}
			jsonTranformedData := string(jsonTranformedDataBytes)

			var preCommand = dataGrabber.PreTransferCommand
			if strings.Contains(dataGrabber.PreTransferCommand, FLAG_ARG_DATA) {
				preCommand = strings.TrimSpace(strings.Replace(dataGrabber.PreTransferCommand, FLAG_ARG_DATA, "", -1))
			}

			dataToSave = toolkit.M{}

			output, err := toolkit.RunCommand(preCommand, jsonTranformedData)
			fmt.Printf("===> Pre Transfer Command Result\n  COMMAND -> %s %s\n  OUTPUT  -> %s\n", preCommand, jsonTranformedData, output)
			if err == nil {
				postData := toolkit.M{}
				if err := json.Unmarshal([]byte(output), &postData); err == nil {
					dataToSave = postData
				}
			}
		}
		// ================

		if len(dataToSave) == 0 {
			continue
		}

		tableName := dsDestination.QueryInfo.GetString("from")
		queryWrapper := helper.Query(connDesc.Driver, connDesc.Host, connDesc.Database, connDesc.UserName, connDesc.Password, connDesc.Settings)
		err = queryWrapper.Delete(tableName, dbox.Eq("_id", eachTransformedData.GetString("_id")))

		queryWrapper = helper.Query(connDesc.Driver, connDesc.Host, connDesc.Database, connDesc.UserName, connDesc.Password, connDesc.Settings)

		err = queryWrapper.Save(tableName, dataToSave)
		if err != nil {
			logConf.AddLog(err.Error(), "ERROR")
			return false, nil, err.Error()
		}

		// ================ post transfer command
		if dataGrabber.PostTransferCommand != "" {
			eachTransformedData = dataToSave
			jsonTranformedDataBytes, err := json.Marshal(eachTransformedData)
			if err != nil {
				return false, nil, err.Error()
			}
			jsonTranformedData := string(jsonTranformedDataBytes)

			var postCommand = dataGrabber.PostTransferCommand
			if strings.Contains(dataGrabber.PostTransferCommand, FLAG_ARG_DATA) {
				postCommand = strings.TrimSpace(strings.Replace(dataGrabber.PostTransferCommand, FLAG_ARG_DATA, "", -1))
			}

			output, err := toolkit.RunCommand(postCommand, jsonTranformedData)
			fmt.Printf("===> Post Transfer Command Result\n  COMMAND -> %s %s\n  OUTPUT  -> %s\n", postCommand, jsonTranformedData, output)
		}
	}

	message = fmt.Sprintf("===> Success transforming %v data", len(transformedData))
	logConf.AddLog(message, "SUCCESS")
	fmt.Println(message)

	return true, transformedData, ""
}

func (d *DataGrabberController) convertTo(value interface{}, tipe string) interface{} {
	switch tipe {
	case "int":
		return toolkit.M{}.Set("k", value).GetInt("k")
	case "double":
		return toolkit.M{}.Set("k", value).GetFloat64("k")
	case "bool":
		res, _ := strconv.ParseBool(fmt.Sprintf("%v", value))
		return res
	case "string":
		return fmt.Sprintf("%v", value)
	}

	return fmt.Sprintf("%v", value)
}

func (d *DataGrabberController) GetSampleDataForAddWizard() toolkit.M {
	s := `{ "ConnectionSource": "200_eccolmag", "ConnectionDestination": "200_eccolmag", "Transformations": [ { "TableSource": "source", "TableDestination": "destination" }, { "TableSource": "students", "TableDestination": "users" } ] }`

	r := colonycore.DataGrabberWizardPayload{}
	json.Unmarshal([]byte(), &r)

	return r
}

func convertDataType(typedt string, dtget string, toolmap toolkit.M) interface{} {
	var resValueEachSF interface{}
	switch typedt {
	case "string":
		resValueEachSF = fmt.Sprintf("%v", toolmap.Get(dtget))
	case "int":
		var resDefault int
		resDefault = toolmap.GetInt(dtget)
		resValueEachSF = resDefault
	case "double":
		var resDefault float32
		resDefault = toolmap.GetFloat32(dtget)
		resValueEachSF = resDefault
	case "bool":
		var resDefault bool
		resDefault, _ = strconv.ParseBool(toolmap.GetString(dtget))
		resValueEachSF = resDefault
	}

	return resValueEachSF
}
