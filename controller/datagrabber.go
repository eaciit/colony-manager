package controller

import (
	"encoding/json"
	"fmt"
	_ "github.com/eaciit/knot/knot.v1"
	_ "github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/toolkit"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/colony-core/v0"
)

type DataGrabberController struct {
	App
}

func CreateDataGrabberController(s *knot.Server) *DataGrabberController {
	var controller = new(DataGrabberController)
	controller.Server = s
	return controller
}

type Maps struct {
	fieldOrigin		string
	fieldDestination	string
}
type ResponseTest struct {
	_id		string
	DataSourceOrigin	string
	DataSourceDestination	string
	Map []*Maps
}
func main() {
}
func (d *DataSourceController) SaveDataGrabber(r *knot.WebContext) interface{} {

	str := `[{ "_id": "WG02", "DataSourceOrigin": "DS01", "DataSourceDestination": "DS02", "Map": [{ "fieldOrigin": "ID", "fieldDestination": "_id" }] }]`
	var maps []toolkit.M
	toolkit.UnjsonFromString(str, &maps)
	err := json.Unmarshal([]byte(str), &maps)

	if err != nil {
		fmt.Printf("someting error >_<  ",err )
		fmt.Printf("\n=================\n")
	}

	o := new(colonycore.DataGrabber)
	o.ID = maps[0].Get("_id").(string)
	o.DataSourceOrigin = maps[0].Get("DataSourceOrigin").(string)
	o.DataSourceDestination = maps[0].Get("DataSourceDestination").(string)
	o.Map = maps[0].Get("Map").([]*colonycore.Maps)

	err = colonycore.Save(o)
	if err != nil {
		fmt.Printf("someting error >_<  ",err )
		fmt.Printf("\n=================\n")
	}
}
