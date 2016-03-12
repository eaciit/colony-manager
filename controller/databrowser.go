package controller

import (
	// "encoding/json"
	"errors"
	// "fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	// "gopkg.in/mgo.v2/bson"
	// "reflect"
	// "io"
	// "net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	"regexp"
	"strings"
)

type DataBrowserController struct {
	App
}

var rdbms = []string{"mysql", "mssql", "oracle", "postgres"}

func CreateDataBrowserController(s *knot.Server) *DataBrowserController {
	var controller = new(DataBrowserController)
	controller.Server = s
	return controller
}

func (d *DataBrowserController) GetBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	search := payload["search"].(string)
	// search = ""

	var query *dbox.Filter

	if search != "" {
		query = dbox.Contains("BrowserName", search)
	}

	data := []colonycore.DataBrowser{}
	cursor, err := colonycore.Find(new(colonycore.DataBrowser), query)
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

func (d *DataBrowserController) SaveBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataBrowser)
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	ctx, conn, err := d.connToDatabase(payload.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	payload, err = d.hasAggr(ctx, payload, conn)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	// toolkit.Println(toolkit.JsonString(payload))
	if err := colonycore.Save(payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}

func (d *DataBrowserController) hasAggr(ctx dbox.IConnection, data *colonycore.DataBrowser, conn *colonycore.Connection) (*colonycore.DataBrowser, error) {
	var fieldArr, aggrArr []string
	var indexAggr []map[int]string
	var query dbox.IQuery
	fieldAggr := toolkit.M{}

	for i, v := range data.MetaData {
		if v.Aggregate != "" {
			result := toolkit.M{}
			toolkit.UnjsonFromString(v.Aggregate, &result)
			cursor := []toolkit.M{}

			if data.QueryType == "" {
				aggregate, e := d.dboxAggr(data.TableNames, v.Field, ctx, query, result, fieldAggr, cursor, conn)
				if e != nil {
					return nil, e
				}
				v.Aggregate = toolkit.JsonString(aggregate)
			} else if data.QueryType == "SQL" {
				names := map[int]string{}
				fieldArr = append(fieldArr, v.Field)

				if _, sumOK := result["SUM"]; sumOK {
					aggrArr = append(aggrArr, "SUM("+v.Field+")")
					if len(result) > 1 {
						indexAggr = append(indexAggr, map[int]string{i: "sum"})
					} else {
						names[i] = "sum"
					}
				}
				if _, avgOK := result["AVG"]; avgOK {
					aggrArr = append(aggrArr, "AVG("+v.Field+")")
					if len(result) > 1 {
						indexAggr = append(indexAggr, map[int]string{i: "avg"})
					} else {
						names[i] = "avg"
					}
				}
				if _, maxOK := result["MAX"]; maxOK {
					aggrArr = append(aggrArr, "MAX("+v.Field+")")
					if len(result) > 1 {
						indexAggr = append(indexAggr, map[int]string{i: "max"})
					} else {
						names[i] = "max"
					}
				}
				if _, minOK := result["MIN"]; minOK {
					aggrArr = append(aggrArr, "MIN("+v.Field+")")
					if len(result) > 1 {
						indexAggr = append(indexAggr, map[int]string{i: "min"})
					} else {
						names[i] = "min"
					}
				}
				if _, minOK := result["COUNT"]; minOK {
					aggrArr = append(aggrArr, "COUNT("+v.Field+")")
					if len(result) > 1 {
						indexAggr = append(indexAggr, map[int]string{i: "count"})
					} else {
						names[i] = "count"
					}
				}

				if len(result) > 1 {
					fieldAggr.Set(v.Field, indexAggr)
				} else {
					fieldAggr.Set(v.Field, names)
				}
			} else if data.QueryType == "Dbox" {
				getQuery := toolkit.M{}
				toolkit.UnjsonFromString(data.QueryText, &getQuery)

				aggregate, e := d.dboxAggr(getQuery.Get("from").(string), v.Field, ctx, query, result, fieldAggr, cursor, conn)
				if e != nil {
					return nil, e
				}
				v.Aggregate = toolkit.JsonString(aggregate)
			}
		}
	}

	if data.QueryType == "SQL" {
		// fieldString := strings.Join(fieldArr, ", ")
		aggrString := strings.Join(aggrArr, ", ")
		var queryText string
		r := regexp.MustCompile(`(([Ff][Rr][Oo][Mm])) (?P<from>([a-zA-Z][_a-zA-Z]+[_a-zA-Z0-1].*))`)
		temparray := r.FindStringSubmatch(data.QueryText)
		sqlpart := toolkit.M{}

		for i, val := range r.SubexpNames() {
			if val != "" {
				sqlpart.Set(val, temparray[i])
			}
		}

		if fromOK := sqlpart.Get("from", "").(string); fromOK != "" {
			queryText = toolkit.Sprintf("select %s FROM %s", aggrString, sqlpart.Get("from", "").(string))
			// toolkit.Printf("queryString:%v\n", queryString)
		}

		query = ctx.NewQuery().Command("freequery", toolkit.M{}.
			Set("syntax", queryText))

		csr, e := query.Cursor(nil)
		if e != nil {
			return nil, e
		}
		defer csr.Close()

		cursor := []toolkit.M{}
		e = csr.Fetch(&cursor, 0, false)
		if e != nil {
			return nil, e
		}

		for f, m := range fieldAggr {
			aggrData := toolkit.M{}
			for _, aggs := range cursor {
				for k, agg := range aggs {
					if toolkit.SliceLen(m) > 0 {
						for _, vals := range m.([]map[int]string) {
							for key, val := range vals {
								if strings.Contains(k, f) && strings.Contains(k, data.MetaData[key].Field) && strings.Contains(k, val) {
									aggrData.Set(val, agg)
									data.MetaData[key].Aggregate = toolkit.JsonString(aggrData)
								}
							}
						}
					} else {
						for key, val := range m.(map[int]string) {
							if strings.Contains(k, f) && strings.Contains(k, data.MetaData[key].Field) && strings.Contains(k, val) {
								aggrData.Set(val, agg)
								data.MetaData[key].Aggregate = toolkit.JsonString(aggrData)
								// toolkit.Printf("k:%v f:%v key:%v val:%v agg:%v\n", k, f, key, val, data.MetaData[key].Aggregate)
							}
						}
					}
				}
			}

		}
	}

	return data, nil
}

func (d *DataBrowserController) dboxAggr(tblename string, field string, ctx dbox.IConnection, query dbox.IQuery, result, fieldAggr toolkit.M, cursor []toolkit.M, conn *colonycore.Connection) (toolkit.M, error) {
	aggregate := toolkit.M{}

	if conn.Driver == "mongo" {
		field = "$" + field
	}
	query = ctx.NewQuery().From(tblename)
	if result != nil {
		for k, _ := range result {
			if k == "SUM" {
				query = query.Aggr(dbox.AggrSum, field, "SUM")
			}
			if k == "AVG" {
				query = query.Aggr(dbox.AggrAvr, field, "AVG")
			}
			if k == "MAX" {
				query = query.Aggr(dbox.AggrMax, field, "MAX")
			}
			if k == "MIN" {
				query = query.Aggr(dbox.AggrMin, field, "MIN")
			}
			if conn.Driver == "mongo" {
				if k != "COUNT" {
					query = query.Group()
				}
			}

			csr, e := query.Cursor(nil)
			if e != nil {
				return nil, e
			}
			defer csr.Close()

			hasCount := []toolkit.M{}
			if k == "COUNT" {
				csr, e := query.Cursor(nil)
				if e != nil {
					return nil, e
				}
				defer csr.Close()
				count := csr.Count()
				hasCount = append(hasCount, aggregate.Set("count", count))
				aggregate.Set("count", count)
			} else {
				e = csr.Fetch(&cursor, 0, false)
				if e != nil {
					return nil, e
				}
			}

			if _, countOK := aggregate["count"]; countOK {
				cursor = append(cursor, hasCount...)
			}

			for _, agg := range cursor {
				aggregate = agg
				if conn.Driver == "mongo" {
					for f, _ := range aggregate {
						if f == "_id" {
							aggregate.Unset(f)
						}
					}
				}

				fieldAggr.Set(field, aggregate)
				// toolkit.Printf("k:%v fieldArr:%v cursor:%v\n", k, field, fieldAggr)
			}
		}
	}
	return aggregate, nil
}

func (d *DataBrowserController) DeleteBrowser(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		ds := new(colonycore.DataBrowser)
		cursor, err := colonycore.Find(ds, dbox.Eq("ID", id.(string)))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer cursor.Close()

		if cursor.Count() > 0 {
			return helper.CreateResult(false, nil, "Cannot delete DataBrowser because used on data source")
		}

		o := new(colonycore.DataBrowser)
		o.ID = id.(string)
		err = colonycore.Delete(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (d *DataBrowserController) CheckConnection(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataBrowser)
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	_, conn, err := d.connToDatabase(payload.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, conn.Driver, "")
}

func (d *DataBrowserController) GetDesignView(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.DataBrowser)
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

func (d *DataBrowserController) TestQuery(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.DataBrowser{} //map[string]interface{}{}
	err := r.GetPayload(&data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	conn, datacon, err := d.connToDatabase(data.ConnectionID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	query, err := d.parseQuery(conn, data, datacon)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cursor, err := query.Cursor(nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	dataFetch := []toolkit.M{}
	err = cursor.Fetch(&dataFetch, 1, false)
	if err != nil {
		cursor.ResetFetch()
		err = cursor.Fetch(&dataFetch, 0, false)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	metadata := []*colonycore.StructInfo{}
	// var dt string
	for i, dataFields := range dataFetch {
		if i > 0 {
			break
		}

		j := 1
		for keyField, dataField := range dataFields {
			if strings.Contains(keyField, "id") && !strings.Contains(data.QueryText, "id") &&
				!strings.Contains(data.QueryText, "*") && data.TableNames == "" {
				continue
			}
			sInfo := &colonycore.StructInfo{}
			sInfo.Field = keyField
			sInfo.Label = keyField

			rf := "string"
			if dataField != nil {
				rf = toolkit.TypeName(dataField)

				if rf == "time.Time" {
					rf = "date"
				}
			}
			sInfo.DataType = rf
			sInfo.Format = ""
			sInfo.Align = "Left"
			sInfo.ShowIndex = toolkit.ToInt(j, toolkit.RoundingAuto)
			sInfo.Sortable = false
			sInfo.SimpleFilter = false
			sInfo.AdvanceFilter = false
			sInfo.Aggregate = ""
			metadata = append(metadata, sInfo)
			j++
		}
	}

	data.MetaData = metadata

	return helper.CreateResult(true, data, "")
}

func (d *DataBrowserController) connToDatabase(_id string) (dbox.IConnection, *colonycore.Connection, error) {
	dataConn := new(colonycore.Connection)
	err := colonycore.Get(dataConn, _id)
	if err != nil {
		return nil, nil, err
	}

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	if err != nil {
		return nil, nil, err
	}

	return connection, dataConn, nil
}

func (d *DataBrowserController) parseQuery(conn dbox.IConnection, dbrowser colonycore.DataBrowser, datacon *colonycore.Connection) (dbox.IQuery, error) {
	var dataQuery dbox.IQuery

	if dbrowser.QueryType == "nonQueryText" {
		dataQuery = conn.NewQuery().From(dbrowser.TableNames)
	} else if dbrowser.QueryType == "SQL" {
		if toolkit.HasMember(rdbms, datacon.Driver) {
			dataQuery = conn.NewQuery().Command("freequery", toolkit.M{}.
				Set("syntax", dbrowser.QueryText))
		} else {
			return nil, errors.New("Free Text Query with SQL only for RDBMS, please use Dbox")
		}
	} else if dbrowser.QueryType == "Dbox" {
		queryInfo := toolkit.M{}
		toolkit.UnjsonFromString(dbrowser.QueryText, &queryInfo)
		toolkit.Println("queryinfo", queryInfo)

		if qFrom := queryInfo.Get("from", "").(string); qFrom != "" {
			dataQuery = conn.NewQuery()
			dataQuery = dataQuery.From(qFrom)
		}
		if qSelect := queryInfo.Get("select", "").(string); qSelect != "" {
			if qSelect != "*" {
				dataQuery = dataQuery.Select(strings.Split(qSelect, ",")...)
			}
		}
	}
	return dataQuery, nil
}

func (d *DataBrowserController) DetailDB(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	result := toolkit.M{}

	payload := toolkit.M{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	getFunc := DataSourceController{}
	count, data, dataDS, err := getFunc.ConnectToDataSourceDB(payload)

	result.Set("DataCount", count)
	result.Set("DataValue", data)
	result.Set("dataresult", dataDS)
	// toolkit.Printf("result:%v\n", toolkit.JsonString(result))
	return helper.CreateResult(true, result, "")
}
