package controller

import (
	"archive/zip"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/toolkit"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

var dest = fmt.Sprintf("%s", filepath.Join(AppBasePath, "..", "colony-app", "apps"))

type ApplicationController struct {
	App
}

func CreateApplicationController(s *knot.Server) *ApplicationController {
	var controller = new(ApplicationController)
	controller.Server = s
	return controller
}

func deleteDirectory(scanDir string, delDir string, dirName string) error {
	dirList, err := ioutil.ReadDir(scanDir)
	if err != nil {
		fmt.Println("Error : ", err)
		return err
	}

	for _, f := range dirList {
		if f.Name() == dirName { /* check if there's already a folder name*/
			err = os.RemoveAll(delDir)
			if err != nil {
				fmt.Println("Error : ", err)
				return err
			}
		}
	}
	return nil
}

func Unzip(src string, newDirName string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	/*defer func() {
		if err := r.Close(); err != nil {
			fmt.Println("Error 56: ", err)
			return
		}
	}()*/

	os.MkdirAll(dest, 0755)
	var basePath string

	extractAndWriteFile := func(i int, f *zip.File) error {
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer func() {
			if err := rc.Close(); err != nil {
				fmt.Println("Error : ", err)
				return
			}
		}()

		path := filepath.Join(dest, f.Name)

		if f.FileInfo().IsDir() {
			os.MkdirAll(path, f.Mode())
		} else {
			f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return err
			}
			defer func() {
				if err := f.Close(); err != nil {
					fmt.Println("Error : ", err)
					return
				}
			}()

			_, err = io.Copy(f, rc)
			if err != nil {
				return err
			}
		}

		if i == 0 {
			basePath = path
		}
		return nil
	}

	for i, f := range r.File {
		err := extractAndWriteFile(i, f)
		if err != nil {
			return err
		}
	}

	base := filepath.Base(basePath)
	newname := filepath.Join(dest, strings.Replace(base, base, newDirName, 1))

	err = deleteDirectory(dest, newname, newDirName)
	if err != nil {
		return err
	}

	err = os.Rename(basePath, newname)
	if err != nil {
		return err
	}

	if _, err := os.Stat(src); !os.IsNotExist(err) {
		err = r.Close()
		if err != nil {
			return err
		}

		err = os.Remove(src)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *ApplicationController) SaveApps(r *knot.WebContext) interface{} {
	// upload handler
	err, fileName := helper.UploadHandler(r, "userfile", dest)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.Application)
	o.ID = r.Request.FormValue("id")
	enable, err := strconv.ParseBool(r.Request.FormValue("Enable"))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	o.Enable = enable
	o.AppsName = r.Request.FormValue("AppsName")

	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = Unzip(dest+"\\"+fileName, o.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, nil, "")
}

func (a *ApplicationController) GetApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursor, err := colonycore.Find(new(colonycore.Application), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.Application{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (a *ApplicationController) SelectApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Application)
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

func (a *ApplicationController) DeleteApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := new(colonycore.Application)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Delete(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	delPath := filepath.Join(dest, payload.ID)
	err = deleteDirectory(dest, delPath, payload.ID)
	if err != nil {
		fmt.Println("Error : ", err)
		return err
	}

	return helper.CreateResult(true, nil, "")
}

func (a *ApplicationController) GetDirApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	filepath.Walk(dest+"\\a", VisitFile)
	/*files, _ := ioutil.ReadDir(dest + "\\a")
	for _, f := range files {
		if f.IsDir() {

		}
		toolkit.Printf("filepath.Walk() returned %v\n", f.IsDir())
	}*/

	// fileList := []string{}
	// filepath.Walk(dest, func(path string, f os.FileInfo, err error) error {
	// 	toolkit.Printf("filepath.Walk() returned %v\n", path)
	// 	fileList = append(fileList, path)
	// 	return nil
	// })
	// toolkit.Printf("filepath.Walk() returned %v\n", fileList)

	return helper.CreateResult(true, nil, "")
}

func VisitFile(fp string, fi os.FileInfo, err error) error {
	if err != nil {
		fmt.Println(err) // can't walk here,
		return nil       // but continue walking elsewhere
	}
	if fi.IsDir() {
		fmt.Println("iki folder", fi.Name())
		//return nil // not a file.  ignore.
	}
	matched, err := filepath.Match("*.*", fi.Name())
	if err != nil {
		fmt.Println(err) // malformed pattern
		return err       // this is fatal.
	}
	if matched {
		fmt.Println(fp)
		fmt.Println(fi.Name())
	}
	return nil
}
