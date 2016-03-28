package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type WidgetGridController struct {
	App
}

func CreateWidgetGridController(s *knot.Server) *WidgetGridController {
	var controller = new(WidgetGridController)
	controller.Server = s
	return controller
}

func getMapGrid(search string) ([]colonycore.MapGrid, error) {
	var query *dbox.Filter

	if search != "" {
		query = dbox.Contains("ID", search)
	}

	mapgrid := []colonycore.MapGrid{}
	cursor, err := colonycore.Find(new(colonycore.MapGrid), query)
	if err != nil {
		return mapgrid, err
	}

	err = cursor.Fetch(&mapgrid, 0, false)
	if err != nil {
		return mapgrid, err
	}
	defer cursor.Close()

	return mapgrid, nil
}

func (wg *WidgetGridController) GetQueryDataSource(r *knot.WebContext) interface{} {
	data, err := helper.GetDataSourceQuery()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (wg *WidgetGridController) GetGridData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	var search string
	// search = payload["search"].(string)

	// var query *dbox.Filter

	// if search != "" {
	// 	query = dbox.Contains("ID", search)
	// }
	// data := []colonycore.MapGrid{}
	// cursor, err := colonycore.Find(new(colonycore.MapGrid), query)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// err = cursor.Fetch(&data, 0, false)
	// if err != nil {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// defer cursor.Close()

	data, err := getMapGrid(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")

	// r.Config.OutputType = knot.OutputJson

	// connection, err := helper.LoadConfig(filepath.Join(colonycore.ConfigPath, "widget", "grid.json"))
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// defer connection.Close()

	// cursor, err := connection.NewQuery().Select("ID", "data").Cursor(nil)
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// defer cursor.Close()

	// res := []toolkit.M{}
	// err = cursor.Fetch(&res, 0, false)
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// if len(res) == 0 {
	// 	return helper.CreateResult(false, nil, "No data found")
	// }

	// return helper.CreateResult(true, res, "")
}

func (t *WidgetGridController) GetDetailGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	var query *dbox.Filter
	data := []colonycore.Grid{}
	filename := new(colonycore.Grid)
	if payload["_id"] != nil {
		filename.ID = payload["_id"].(string)
	}
	cursor, err := colonycore.Find(filename, query)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
	// r.Config.OutputType = knot.OutputJson
	// payload := map[string]string{}
	// err := r.GetForms(&payload)
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// connection, err := helper.LoadConfig(t.AppViewsPath + "data/grid/" + payload["recordid"])
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// defer connection.Close()

	// cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// defer cursor.Close()

	// res := []toolkit.M{}
	// err = cursor.Fetch(&res, 0, false)
	// if !helper.HandleError(err) {
	// 	return helper.CreateResult(false, nil, err.Error())
	// }
	// if len(res) == 0 {
	// 	return helper.CreateResult(false, nil, "No data found")
	// }

	// return helper.CreateResult(true, res, "")
}

func (wg *WidgetGridController) SaveGrid(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	mapgrid, err := getMapGrid("")
	// oldmapgrid := mapgrid
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	datagrid := new(colonycore.Grid)
	toolkit.Println("datagrid data : ", datagrid)
	err = r.GetPayload(&datagrid)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var isUpdate bool
	newGrid := colonycore.MapGrid{}
	// datamapgrid := colonycore.DataMapGrid{}
	for _, eachRaw := range mapgrid {
		if eachRaw.FileName == datagrid.ID+".json" {
			eachRaw.GridName = datagrid.Title
			isUpdate = true
			newGrid = eachRaw
		}
	}

	if !isUpdate {
		newGrid.ID = datagrid.ID
		newGrid.FileName = datagrid.ID + ".json"
		newGrid.GridName = datagrid.Title
	}

	// if !isUpdate {
	// 	if err := colonycore.Delete(oldmapgrid); err != nil {
	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}
	// }

	if err := colonycore.Save(&newGrid); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if err := colonycore.Save(datagrid); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, newGrid, "")
	/*r.Config.OutputType = knot.OutputJson

	filename := filepath.Join(colonycore.ConfigPath, "widget", "grid.json")
	toolkit.Println("filename : ", filename)

	f, err := os.Open(filename)
	if !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	mapgrid := []colonycore.MapGrid{}
	jsonParser := json.NewDecoder(f)
	if err = jsonParser.Decode(&mapgrid); err != nil {
		if !helper.HandleError(err) {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	datagrid := new(colonycore.Grid)
	r.GetPayload(&datagrid)

	datamapgrid := colonycore.DataMapGrid{}
	datamapgrid.Name = datagrid.Title
	if datagrid.ID == "" {
		mapgrid[0].ID = mapgrid[0].ID + 1
		datagrid.ID = "grid" + strconv.Itoa(mapgrid[0].ID)
		datamapgrid.Value = "grid" + strconv.Itoa(mapgrid[0].ID) + ".json"
		datamapgrid.ID = "grid" + strconv.Itoa(mapgrid[0].ID)
		mapgrid[0].Data = append(mapgrid[0].Data, datamapgrid)
	} else {
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

	return helper.CreateResult(true, datagrid, "")*/
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
}*/
