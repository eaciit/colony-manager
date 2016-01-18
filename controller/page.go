package controller

import (
	"encoding/json"
	"fmt"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"strings"
)

type PageController struct {
	AppViewsPath string
}

func (t *PageController) GetRoutes(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	routes := []map[string]interface{}{}

	for _, eachRaw := range dataSource.Data {
		each := eachRaw.(map[string]interface{})
		submenu := each["submenu"].([]interface{})

		routes = append(routes, map[string]interface{}{
			"_id":       each["_id"],
			"title":     each["title"],
			"href":      each["href"],
			"has_child": len(submenu) > 0,
		})

		for _, subRaw := range submenu {
			sub := subRaw.(map[string]interface{})
			submenu2 := sub["submenu"].([]interface{})

			routes = append(routes, map[string]interface{}{
				"_id":       fmt.Sprintf("%v|%v", each["_id"], sub["_id"]),
				"title":     fmt.Sprintf("%v|%v", each["title"], sub["title"]),
				"href":      sub["href"],
				"has_child": len(submenu2) > 0,
			})

			for _, subRaw2 := range submenu2 {
				sub2 := subRaw2.(map[string]interface{})
				submenu2 := sub2["submenu"].([]interface{})

				routes = append(routes, map[string]interface{}{
					"_id":       fmt.Sprintf("%v|%v|%v", each["_id"], sub["_id"], sub2["_id"]),
					"title":     fmt.Sprintf("%v|%v|%v", each["title"], sub["title"], sub2["title"]),
					"href":      sub["href"],
					"has_child": len(submenu2) > 0,
				})
			}
		}
	}

	return routes
}

func (t *PageController) SaveRoute(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	err := r.GetForms(&payload)
	helper.HandleError(err)
	_ids := strings.Split(payload["_id"], "|")
	parentIDs := strings.Split(payload["parentID"], "|")

	newData := toolkit.M{
		"_id":     helper.RandomIDWithPrefix("r"),
		"title":   payload["title"],
		"href":    payload["href"],
		"submenu": []interface{}{},
	}

	if payload["_id"] == "" {
		if payload["parentID"] == "" {
			// fresh row

			connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
			helper.HandleError(err)
			defer connection.Close()
			err = connection.NewQuery().Insert().Exec(toolkit.M{"data": newData})
			helper.HandleError(err)
		} else {
			// update previous row

			connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
			helper.HandleError(err)
			defer connection.Close()
			cursor, err := connection.NewQuery().Select("*").Cursor(nil)
			helper.HandleError(err)
			defer cursor.Close()
			dataSource, err := cursor.Fetch(nil, 0, false)
			helper.HandleError(err)
			rawRoutes := dataSource.Data

		outer:
			for h, top := range rawRoutes {
				if top.(map[string]interface{})["_id"] == parentIDs[0] {
					if len(parentIDs) == 1 {
						rawRoutes[h].(map[string]interface{})["submenu"] = append(rawRoutes[h].(map[string]interface{})["submenu"].([]interface{}), newData)
						break outer
					} else {
						for i, each := range rawRoutes[h].(map[string]interface{})["submenu"].([]interface{}) {
							if each.(map[string]interface{})["_id"].(string) == parentIDs[1] {
								rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["submenu"] = append(rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["submenu"].([]interface{}), newData)
								break outer
							}
						}
					}
				}
			}

			bytes, err := json.Marshal(rawRoutes)
			helper.HandleError(err)
			ioutil.WriteFile(t.AppViewsPath+"config/routes.json", bytes, 0644)
		}
	} else {
		// update existing row

		connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
		helper.HandleError(err)
		defer connection.Close()
		cursor, err := connection.NewQuery().Select("*").Cursor(nil)
		helper.HandleError(err)
		defer cursor.Close()
		dataSource, err := cursor.Fetch(nil, 0, false)
		helper.HandleError(err)
		rawRoutes := dataSource.Data

	outer2:
		for h, top := range rawRoutes {
			if len(_ids) == 1 {
				if top.(map[string]interface{})["_id"].(string) == _ids[0] {
					rawRoutes[h].(map[string]interface{})["title"] = payload["title"]
					rawRoutes[h].(map[string]interface{})["href"] = payload["href"]
					break outer2
				}
			} else if len(_ids) == 2 {
				submenu := top.(map[string]interface{})["submenu"].([]interface{})

				for i, each := range submenu {
					if each.(map[string]interface{})["_id"].(string) == _ids[1] {
						rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["title"] = payload["title"]
						rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["href"] = payload["href"]
						break outer2
					}
				}
			} else {
				submenu := top.(map[string]interface{})["submenu"].([]interface{})

				for i, each := range submenu {
					if each.(map[string]interface{})["_id"].(string) == _ids[1] {
						submenu2 := each.(map[string]interface{})["submenu"].([]interface{})

						for j, each2 := range submenu2 {
							if each2.(map[string]interface{})["_id"].(string) == _ids[2] {
								rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["submenu"].([]interface{})[j].(map[string]interface{})["title"] = payload["title"]
								rawRoutes[h].(map[string]interface{})["submenu"].([]interface{})[i].(map[string]interface{})["submenu"].([]interface{})[j].(map[string]interface{})["href"] = payload["href"]
								break outer2
							}
						}
					}
				}
			}
		}

		bytes, err := json.Marshal(rawRoutes)
		helper.HandleError(err)
		ioutil.WriteFile(t.AppViewsPath+"config/routes.json", bytes, 0644)
	}

	return true
}

func (t *PageController) GetRoute(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	err := r.GetForms(&payload)
	helper.HandleError(err)
	_ids := strings.Split(payload["_id"], "|")

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	rawRoutes := dataSource.Data

	for _, eachRaw := range rawRoutes {
		each := eachRaw.(map[string]interface{})
		submenu := each["submenu"].([]interface{})

		if len(_ids) == 1 {
			if _ids[0] == each["_id"].(string) {
				return toolkit.M{
					"_id":      each["_id"],
					"title":    each["title"],
					"href":     each["href"],
					"parentID": "",
				}
			}
		}

		for _, subRaw := range submenu {
			sub := subRaw.(map[string]interface{})
			submenu2 := sub["submenu"].([]interface{})

			if len(_ids) == 2 {
				if _ids[0] == each["_id"].(string) && _ids[1] == sub["_id"].(string) {
					return toolkit.M{
						"_id":      fmt.Sprintf("%s|%s", each["_id"], sub["_id"]),
						"title":    sub["title"],
						"href":     sub["href"],
						"parentID": each["_id"],
					}
				}
			}

			for _, subRaw2 := range submenu2 {
				sub2 := subRaw2.(map[string]interface{})

				if len(_ids) == 3 {
					if _ids[0] == each["_id"].(string) && _ids[1] == sub["_id"].(string) && _ids[2] == sub2["_id"].(string) {
						return toolkit.M{
							"_id":      fmt.Sprintf("%s|%s|%s", each["_id"], sub["_id"], sub2["_id"]),
							"title":    sub2["title"],
							"href":     sub2["href"],
							"parentID": sub["_id"],
						}
					}
				}
			}
		}
	}

	return toolkit.M{}
}

func (t *PageController) DeleteRoute(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	err := r.GetForms(&payload)
	helper.HandleError(err)
	_ids := strings.Split(payload["_id"], "|")

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	rawRoutes := dataSource.Data

	// someday, someone would fix these codes, I hope
	// --------- suffering start here
outer:
	for i, eachRaw := range rawRoutes {
		each := eachRaw.(map[string]interface{})
		submenu := each["submenu"].([]interface{})

		if len(_ids) == 1 {
			if _ids[0] == each["_id"].(string) {
				rawRoutes = append(rawRoutes[:i], rawRoutes[i+1:]...)
				break outer
			}
		}

		for j, subRaw := range submenu {
			sub := subRaw.(map[string]interface{})
			submenu2 := sub["submenu"].([]interface{})

			if len(_ids) == 2 {
				if _ids[0] == each["_id"].(string) && _ids[1] == sub["_id"].(string) {
					rawRoutes[i].(map[string]interface{})["submenu"] = append(submenu[:j], submenu[j+1:]...)
					break outer
				}
			}

			for k, subRaw2 := range submenu2 {
				sub2 := subRaw2.(map[string]interface{})

				if len(_ids) == 3 {
					if _ids[0] == each["_id"].(string) && _ids[1] == sub["_id"].(string) && _ids[2] == sub2["_id"].(string) {
						rawRoutes[i].(map[string]interface{})["submenu"].([]interface{})[j].(map[string]interface{})["submenu"] = append(submenu2[:k], submenu2[k+1:]...)
						break outer
					}
				}
			}
		}
	}
	// --------- suffering end here

	bytes, err := json.Marshal(rawRoutes)
	helper.HandleError(err)
	ioutil.WriteFile(t.AppViewsPath+"config/routes.json", bytes, 0644)

	return true
}
