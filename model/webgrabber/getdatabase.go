package webgrabber

import (
	// "bytes"
	// "fmt"
	// "github.com/eaciit/cast"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/csv"
	_ "github.com/eaciit/dbox/dbc/json"
	_ "github.com/eaciit/dbox/dbc/mongo"
	_ "github.com/eaciit/dbox/dbc/xlsx"
	"github.com/eaciit/toolkit"
	"reflect"
	// "regexp"
	"errors"
	// "strings"
	"time"
)

// type ViewColumn struct {
// 	Alias    string
// 	Selector string
// 	// ValueType string //-- Text, Attr, InnerHtml, OuterHtml
// 	// AttrName  string
// }

type CollectionSetting struct {
	Collection   string
	SelectColumn []*GrabColumn
	FilterCond   toolkit.M
	filterDbox   *dbox.Filter
}

type GetDatabase struct {
	dbox.ConnectionInfo
	desttype           string
	CollectionSettings map[string]*CollectionSetting

	LastExecuted time.Time

	Response []toolkit.M
}

func NewGetDatabase(host string, desttype string, connInfo *dbox.ConnectionInfo) (*GetDatabase, error) {
	g := new(GetDatabase)
	if connInfo != nil {
		g.ConnectionInfo = *connInfo
	}

	if desttype != "" {
		g.desttype = desttype
	}

	if host != "" {
		g.Host = host
	}

	if g.Host == "" || g.desttype == "" {
		return nil, errors.New("Host or Type cannot blank")
	}

	return g, nil
}

func (ds *CollectionSetting) Column(i int, column *GrabColumn) *GrabColumn {
	if i == 0 {
		ds.SelectColumn = append(ds.SelectColumn, column)
	} else if i <= len(ds.SelectColumn) {
		ds.SelectColumn[i-1] = column
	} else {
		return nil
	}
	return column
}

// func (ds *CollectionSetting) SetFilterCond(filter toolkit.M) {
// 	ds.FilterCond = filter
// 	ds.filterDbox =
// }

func (g *GetDatabase) ResultFromDatabase(dataSettingId string, out interface{}) error {

	c, e := dbox.NewConnection(g.desttype, &g.ConnectionInfo)
	if e != nil {
		return e
	}

	e = c.Connect()
	if e != nil {
		return e
	}

	defer c.Close()

	iQ := c.NewQuery()
	if g.CollectionSettings[dataSettingId].Collection != "" {
		iQ.From(g.CollectionSettings[dataSettingId].Collection)
	}

	for _, val := range g.CollectionSettings[dataSettingId].SelectColumn {
		iQ.Select(val.Selector)
	}

	if len(g.CollectionSettings[dataSettingId].FilterCond) > 0 {
		iQ.Where(g.CollectionSettings[dataSettingId].filterDbox)
	}

	csr, e := iQ.Cursor(nil)

	if e != nil {
		return e
	}
	if csr == nil {
		return e
	}
	defer csr.Close()

	results := make([]toolkit.M, 0)
	e = csr.Fetch(&results, 0, false)
	if e != nil {
		return e
	}

	ms := []toolkit.M{}
	for _, val := range results {
		m := toolkit.M{}
		for _, column := range g.CollectionSettings[dataSettingId].SelectColumn {
			m.Set(column.Alias, "")
			if val.Has(column.Selector) {
				m.Set(column.Alias, val[column.Selector])
			}
		}
		ms = append(ms, m)
	}

	if edecode := toolkit.Unjson(toolkit.Jsonify(ms), out); edecode != nil {
		return edecode
	}
	return nil
}

func (ds *CollectionSetting) SetFilterCond(filter toolkit.M) {
	if filter == nil {
		ds.FilterCond = toolkit.M{}
	} else {
		ds.FilterCond = filter
	}

	if len(ds.FilterCond) > 0 {
		ds.filterDbox = filterCondition(ds.FilterCond)
	}
}

func filterCondition(cond toolkit.M) *dbox.Filter {
	fb := new(dbox.Filter)

	for key, val := range cond {
		if key == "$and" || key == "$or" {
			afb := []*dbox.Filter{}
			for _, sVal := range val.([]interface{}) {
				rVal := sVal.(map[string]interface{})
				mVal := toolkit.M{}
				for rKey, mapVal := range rVal {
					mVal.Set(rKey, mapVal)
				}

				afb = append(afb, filterCondition(mVal))
			}

			if key == "$and" {
				fb = dbox.And(afb...)
			} else {
				fb = dbox.Or(afb...)
			}

		} else {
			if reflect.ValueOf(val).Kind() == reflect.Map {
				mVal := val.(map[string]interface{})
				tomVal, _ := toolkit.ToM(mVal)
				switch {
				case tomVal.Has("$eq"):
					fb = dbox.Eq(key, tomVal["$eq"].(string))
				case tomVal.Has("$ne"):
					fb = dbox.Ne(key, tomVal["$ne"].(string))
				case tomVal.Has("$regex"):
					fb = dbox.Contains(key, tomVal["$regex"].(string))
				case tomVal.Has("$gt"):
					fb = dbox.Gt(key, tomVal["$gt"].(string))
				case tomVal.Has("$gte"):
					fb = dbox.Gte(key, tomVal["$gte"].(string))
				case tomVal.Has("$lt"):
					fb = dbox.Lt(key, tomVal["$lt"].(string))
				case tomVal.Has("$lte"):
					fb = dbox.Lte(key, tomVal["$lte"].(string))
				}
			} else {
				fb = dbox.Eq(key, val)
			}
		}
	}

	return fb
}
