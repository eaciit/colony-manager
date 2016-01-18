package controller

import (
	"fmt"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
)

type TemplateController struct {
	AppViewsPath string
	Server       *knot.Server
	LayoutFile   string
	IncludeFiles []string
}

func (t *TemplateController) GetRoutes(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/routes.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	if cursor == nil {
		fmt.Printf("Cursor not initialized")
	}
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	return dataSource.Data
}

func (t *TemplateController) GetMenuLeft(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/left-menu.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	if cursor == nil {
		fmt.Printf("Cursor not initialized")
	}
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	return dataSource.Data
}

func (t *TemplateController) GetHeader(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	connection, err := helper.LoadConfig(t.AppViewsPath + "config/header-app.json")
	helper.HandleError(err)
	defer connection.Close()
	cursor, err := connection.NewQuery().Select("*").Cursor(nil)
	helper.HandleError(err)
	if cursor == nil {
		fmt.Printf("Cursor not initialized")
	}
	defer cursor.Close()
	dataSource, err := cursor.Fetch(nil, 0, false)
	helper.HandleError(err)

	return dataSource.Data
}

func (t *TemplateController) GetBreadcrumb(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]string{}
	err := r.GetForms(&payload)
	helper.HandleError(err)

	if payload["href"] == "/" || payload["href"] == "/index" {
		return []map[string]interface{}{{"title": "Dashboard", "href": "/index"}}
	}

	routes := t.GetRoutes(helper.FakeWebContext()).([]interface{})
	breadcrumbs := []map[string]interface{}{}

	for _, level1 := range routes {
		var level1Each = level1.(map[string]interface{})
		var level1Title = level1Each["title"].(string)
		var level1Href = level1Each["href"].(string)
		var level1Submenu = level1Each["submenu"].([]interface{})

		if level1Title == payload["title"] && level1Href == payload["href"] {
			breadcrumbs = append(breadcrumbs, level1Each)
			return breadcrumbs
		}

		if len(level1Submenu) > 0 {
			for _, level2 := range level1Submenu {
				var level2Each = level2.(map[string]interface{})
				var level2Title = level2Each["title"].(string)
				var level2Href = level2Each["href"].(string)
				// var level2Submenu = level2Each["submenu"].([]interface{})

				if level2Title == payload["title"] && level2Href == payload["href"] {
					breadcrumbs = append(breadcrumbs, level1Each)
					breadcrumbs = append(breadcrumbs, level2Each)
					return breadcrumbs
				}
			}
		}
	}

	return breadcrumbs
}

func (t *TemplateController) RegisterRoutes() {
	routes := t.GetRoutes(helper.FakeWebContext()).([]interface{})

	helper.Recursiver(routes, func(each interface{}) []interface{} {
		return each.(map[string]interface{})["submenu"].([]interface{})
	}, func(each interface{}) {
		eachMap := each.(map[string]interface{})
		title := eachMap["title"].(string)
		href := eachMap["href"].(string)
		pageID := eachMap["_id"].(string)

		if href != "" && href != "#" && href != "/index" {
			t.Server.Route(href, func(r *knot.WebContext) interface{} {
				r.Config.LayoutTemplate = t.LayoutFile
				r.Config.IncludeFiles = t.IncludeFiles
				r.Config.ViewName = "views/dashboard.html"
				return toolkit.M{"title": title, "href": href, "pageID": pageID, "production": true}
			})
		}
	})

	// route the / and /index
	for _, route := range []string{"/", "/index"} {
		t.Server.Route(route, func(r *knot.WebContext) interface{} {
			r.Config.LayoutTemplate = t.LayoutFile
			r.Config.IncludeFiles = t.IncludeFiles
			r.Config.ViewName = "views/dashboard.html"
			return toolkit.M{"title": "Dashboard", "href": route, "pageID": "-1", "production": true}
		})
	}

}
