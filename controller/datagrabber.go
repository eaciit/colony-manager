package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"github.com/robfig/cron"
)

var (
	serviceHolder = map[string]*cron.Cron{}
)

type DataGrabberController struct {
	App
}

func CreateDataGrabberController(s *knot.Server) *DataGrabberController {
	var controller = new(DataGrabberController)
	controller.Server = s
	return controller
}

func (d *DataGrabberController) SaveDataGrabber(r *knot.WebContext) interface{} {
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

	err = colonycore.Save(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataGrabberController) SelectDataGrabber(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataGrabber)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Get(payload, payload.ID)

	return helper.CreateResult(true, payload, "")
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

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		process := serviceHolder[dataGrabber.ID]
		process.Stop()
		delete(serviceHolder, dataGrabber.ID)

		fmt.Println("===> Transformation stopped!", dataGrabber.DataSourceOrigin, "->", dataGrabber.DataSourceDestination)
	}

	yo := func() {
		success, data, message := d.Transform(dataGrabber)
		_, _, _ = success, data, message
		// timeout not yet implemented
		// also later, write the logs
	}
	yo()

	process := cron.New()
	serviceHolder[dataGrabber.ID] = process
	process.AddFunc("@every 20s", yo)
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

	if _, ok := serviceHolder[dataGrabber.ID]; ok {
		process := serviceHolder[dataGrabber.ID]
		process.Stop()
		delete(serviceHolder, dataGrabber.ID)

		fmt.Println("===> Transformation stopped!", dataGrabber.DataSourceOrigin, "->", dataGrabber.DataSourceDestination)
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

func (d *DataGrabberController) Transform(dataGrabber *colonycore.DataGrabber) (bool, interface{}, string) {
	fmt.Println("===> Transformation started!", dataGrabber.DataSourceOrigin, "->", dataGrabber.DataSourceDestination)

	dsOrigin := new(colonycore.DataSource)
	err := colonycore.Get(dsOrigin, dataGrabber.DataSourceOrigin)
	if err != nil {
		return false, nil, err.Error()
	}

	dsDestination := new(colonycore.DataSource)
	err = colonycore.Get(dsDestination, dataGrabber.DataSourceDestination)
	if err != nil {
		return false, nil, err.Error()
	}

	dataDS, _, conn, query, metaSave, err := new(DataSourceController).
		ConnectToDataSource(dataGrabber.DataSourceOrigin)
	if len(dataDS.QueryInfo) == 0 {
		return false, nil, "Data source origin has invalid query"
	}
	if err != nil {
		return false, nil, err.Error()
	}
	defer conn.Close()

	if metaSave.keyword != "" {
		return false, nil, `Data source origin query is not "Select"`
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return false, nil, err.Error()
	}
	defer cursor.Close()

	data := []toolkit.M{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
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
			return false, nil, err.Error()
		}
	}

	return true, len(transformedData), ""
}
