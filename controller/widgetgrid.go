package controller

import (
	"encoding/json"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io"
	"os"
	"path/filepath"
	"strconv"
)

type WidgetGridController struct {
	App
}

func CreateWidgetGridController(s *knot.Server) *WidgetGridController {
	var controller = new(WidgetGridController)
	controller.Server = s
	return controller
}

func (wg *WidgetGridController) GetGridData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	connection, err := helper.LoadConfig(filepath.Join(colonycore.ConfigPath, "widget", "grid.json"))
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	cursor, err := connection.NewQuery().Select("ID", "data").Cursor(nil)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	res := []toolkit.M{}
	err = cursor.Fetch(&res, 0, false)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	if len(res) == 0 {
		return helper.CreateResult(false, nil, "No data found")
	}

	return helper.CreateResult(true, res, "")
}

func (wg *WidgetGridController) SaveGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	filename := filepath.Join(colonycore.ConfigPath, "widget", "grid.json")
	toolkit.Println("filename : ", filename)

	// filename := t.AppViewsPath + "data/mapgrid.json"
	f, err := os.Open(filename)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	// mapgrid := []m.MapGrid{}
	mapgrid := []colonycore.MapGrid{}
	jsonParser := json.NewDecoder(f)
	if err = jsonParser.Decode(&mapgrid); err != nil {
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}
	// datagrid := m.Grid{}
	datagrid := new(colonycore.Grid)
	r.GetPayload(&datagrid)

	// datamapgrid := m.DataMapGrid{}
	// datamapgrid := new(colonycore.DataMapGrid)
	datamapgrid := colonycore.DataMapGrid{}
	datamapgrid.Name = datagrid.Title
	if datagrid.ID == "" {
		mapgrid[0].ID = mapgrid[0].ID + 1
		datagrid.ID = "grid" + strconv.Itoa(mapgrid[0].ID)
		datamapgrid.Value = "grid" + strconv.Itoa(mapgrid[0].ID) + ".json"
		datamapgrid.ID = "grid" + strconv.Itoa(mapgrid[0].ID)
		mapgrid[0].Data = append(mapgrid[0].Data, datamapgrid)
	} else {
		// newGrid := []m.DataMapGrid{}
		newGrid := []colonycore.DataMapGrid{}
		for _, eachRaw := range mapgrid[0].Data {
			if eachRaw.Value == datagrid.ID+".json" {
				eachRaw.Name = datamapgrid.Name
			}
			newGrid = append(newGrid, eachRaw)
		}
		mapgrid[0].Data = newGrid
	}

	b, err := json.Marshal(mapgrid)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	f, err = os.Create(filename)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	_, err = io.WriteString(f, string(b))
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	f, err = os.Create(filepath.Join(colonycore.ConfigPath, "widget", "grid", datagrid.ID+".json"))
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	b, err = json.Marshal(datagrid)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	_, err = io.WriteString(f, "["+string(b)+"]")
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	defer f.Close()

	return helper.CreateResult(true, datagrid, "")
}

/*func (t *WidgetGridController) DeleteGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]string{}
	err := r.GetForms(&payload)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	filename := t.AppViewsPath + "data/mapgrid.json"
	f, err := os.Open(filename)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	mapgrid := []m.MapGrid{}
	jsonParser := json.NewDecoder(f)
	if err = jsonParser.Decode(&mapgrid); err != nil {
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	newGrid := []m.DataMapGrid{}
	for _, eachRaw := range mapgrid[0].Data {
		if eachRaw.Value != payload["recordid"] {
			newGrid = append(newGrid, eachRaw)
		}
	}
	mapgrid[0].Data = newGrid
	b, err := json.Marshal(mapgrid)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	f, err = os.Create(filename)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	io.WriteString(f, string(b))
	err = os.Remove(t.AppViewsPath + "data/grid/" + payload["recordid"])
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	defer f.Close()

	return helper.CreateResult(true, payload["recordid"], "")
}

func (t *WidgetGridController) GetDetailGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]string{}
	err := r.GetForms(&payload)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	connection, err := helper.LoadConfig(t.AppViewsPath + "data/grid/" + payload["recordid"])
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer connection.Close()

	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	res := []toolkit.M{}
	err = cursor.Fetch(&res, 0, false)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}
	if len(res) == 0 {
		return helper.CreateResult(false, nil, "No data found")
	}

	return helper.CreateResult(true, res, "")
}*/
