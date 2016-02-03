package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/dbox"
	"fmt"
	"strings"
	"errors"
	//~ "encoding/jsson"
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

func (d *DataGrabberController) RunDataGrabber(r *knot.WebContext) interface{} {
	//~ dataInput := json.Marshal(`{"data":{"_id":"adsfasdf","DataSourceOrigin":"ds1453549917327","DataSourceDestination":"ds1453549868712","IgnoreFieldsOrigin":[],"IgnoreFieldsDestination":["UARigSequenceId"],"Map":[{"FieldOrigin":"_id","FieldDestination":"UARigSequenceId"},{"FieldOrigin":"_id","FieldDestination":"AssignTOOps"}]},"message":"","success":true}`)
	//~ r.Config.OutputType = knot.OutputJson

	payload := map[string]string{"_id":"adsfasdf",}
	_id := payload["_id"]
	dg := new(colonycore.DataGrabber)
	colonycore.Get(dg, _id)

	dso := new(colonycore.DataSource)
	idDataSourceOrigin := dg.DataSourceOrigin
	colonycore.Get(dso, idDataSourceOrigin)

	dsd := new(colonycore.DataSource)
	idDataSourceDestination := dg.DataSourceDestination
	colonycore.Get(dsd, idDataSourceDestination)

	//~ conn := new(colonycore.Connection)
	//~ idDataSourceDestination := dg.DataSourceDestination
	//~ colonycore.Get(dsd, idDataSourceDestination)

	dataDS, _, conn, query, metaSave, err := d.connectingDataSource(idDataSourceOrigin)

	//~ DataSourceController{}.GetConnections()


	fmt.Printf("\n========================\n")
	//~ fmt.Printf("%v",r.Config.OutputType)
	//~ fmt.Printf("\n========================\n")
	//~ fmt.Printf("%v",x)
	//~ fmt.Printf("\n========================\n")
	fmt.Printf("%v",dso)
	fmt.Printf("\n========================\n")
	fmt.Printf("%v",dsd)
	fmt.Printf("\n========================\n")

	return helper.CreateResult(true, payload, "")
}

func (d *DataSourceController) checkIfDriverIsSupported(driver string) error {
	supportedDrivers := "mongo mysql weblink"

	if !strings.Contains(supportedDrivers, driver) {
		drivers := strings.Replace(supportedDrivers, " ", ", ", -1)
		return errors.New("Currently tested driver is only " + drivers)
	}

	return nil
}

func (d *DataGrabberController) connectingDataSource(_id string) (*colonycore.DataSource, *colonycore.Connection, dbox.IConnection, dbox.IQuery, MetaSave, error) {
	dataDS := new(colonycore.DataSource)
	err := colonycore.Get(dataDS, _id)
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	dataConn := new(colonycore.Connection)
	err = colonycore.Get(dataConn, dataDS.ConnectionID)
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	if err := d.checkIfDriverIsSupported(dataConn.Driver); err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, nil, nil, nil, MetaSave{}, err
	}

	query, metaSave := d.parseQuery(connection.NewQuery(), dataDS.QueryInfo)
	return dataDS, dataConn, connection, query, metaSave, nil
}
