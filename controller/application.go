package controller

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

var (
	unzipDest  = filepath.Join(EC_APP_PATH, "src")
	zipSource  = filepath.Join(EC_APP_PATH, "src")
	parents    = make(map[string]*colonycore.TreeSource)
	basePath   string
	newDirName string
)

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

func createJson(object *colonycore.TreeSource) {
	jsonData, err := json.MarshalIndent(object, "", "	")

	if err != nil {
		fmt.Println(err.Error())
	}
	jsonString := string(jsonData)

	filename := fmt.Sprintf("%s", filepath.Join(unzipDest, newDirName, ".directory-tree.json"))

	f, err := os.Create(filename)
	if err != nil {
		fmt.Println(err)
	}

	n, err := io.WriteString(f, jsonString)
	if err != nil {
		fmt.Println(n, err)
	}
	f.Close()
}

func createTree(i int, path string, isDir bool) error {
	contentList := strings.Split(path, string(filepath.Separator))
	content := contentList[len(contentList)-1]
	var sprite string
	var text string

	if isDir {
		if i == 1 {
			text = newDirName
		} else {
			text = contentList[len(contentList)-1]
		}
		sprite = "folder"
	} else {
		text = content
		extList := strings.Split(path, ".")
		extName := extList[len(extList)-1]
		if strings.Contains(extName, "png") {
			sprite = "image"
		} else {
			sprite = extName
		}
	}

	parents[path] = &colonycore.TreeSource{
		ID:             i,
		Expanded:       isDir,
		Text:           text,
		SpriteCssClass: sprite,
	}

	return nil
}

func extractAndWriteFile(i int, f *zip.File) error {
	var isDir bool
	rc, err := f.Open()
	if err != nil {
		fmt.Println("Error : ", err)
		return err
	}
	defer func() {
		if err := rc.Close(); err != nil {
			fmt.Println("Error : ", err)
			return
		}
	}()

	path := filepath.Join(unzipDest, f.Name)

	if f.FileInfo().IsDir() {
		os.MkdirAll(path, f.Mode())
		isDir = true
	} else {
		f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			fmt.Println("Error : ", err)
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
			fmt.Println("Error : ", err)
			return err
		}
	}

	if i == 0 {
		basePath = path
	}

	createTree(i+1, path, isDir)

	return nil
}

func unzip(src string) (result *colonycore.TreeSource, zipName string, err error) {
	r, err := zip.OpenReader(src)
	if err != nil {
		return nil, "", err
	}

	err = os.MkdirAll(unzipDest, 0755)
	if err != nil {
		return nil, "", err
	}

	for i, f := range r.File {
		err := extractAndWriteFile(i, f)
		if err != nil {
			return nil, "", err
		}
	}

	for path, node := range parents {
		parentPath := filepath.Dir(path)
		parent, exists := parents[parentPath]

		if !exists {
			result = node
		} else {
			parent.Items = append(parent.Items, node)
		}
	}

	newname := filepath.Join(unzipDest, newDirName)

	err = deleteDirectory(unzipDest, newname, newDirName) /*delete existing directory*/
	if err != nil {
		return nil, "", err
	}

	err = os.Rename(basePath, newname) /*rename unzip file to appID*/
	if err != nil {
		return nil, "", err
	}

	if _, err := os.Stat(src); !os.IsNotExist(err) {
		err = r.Close()
		if err != nil {
			return nil, "", err
		}
	}

	newNameParsed := func() string {
		comps := strings.Split(src, ".")[:]
		subComps := strings.Split(newname, toolkit.PathSeparator)
		subComps = append(subComps[:len(subComps)-1], fmt.Sprintf("source-%s", subComps[len(subComps)-1]))
		newname = strings.Join(subComps, toolkit.PathSeparator)
		return fmt.Sprintf("%s.%s", newname, comps[len(comps)-1])
	}()

	err = os.Rename(src, newNameParsed)
	if err != nil {
		return nil, newNameParsed, err
	}

	return nil, newNameParsed, nil
}

func (a *ApplicationController) Deploy(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := struct {
		ID      string `json:"_id",bson:"_id"`
		Servers []string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	app := new(colonycore.Application)
	err = colonycore.Get(app, payload.ID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, each := range payload.Servers {
		server := new(colonycore.Server)
		err = colonycore.Get(server, each)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		sshSetting, _, err := new(ServerController).SSHConnect(server)

		if output, err := sshSetting.RunCommandSsh("unzip"); err != nil || strings.Contains(output, "not installed") {
			return helper.CreateResult(false, nil, "Need to install unzip on the server!")
		}

		sourcePath := filepath.Join(EC_APP_PATH, "src", app.ID)
		sourceZipPath := filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.zip", app.ID))
		destinationPath := filepath.Join(server.AppPath, "src")
		destinationZipPath := filepath.Join(destinationPath, fmt.Sprintf("%s.zip", app.ID))

		installerFile := ""

		filepath.Walk(sourcePath, func(path string, f os.FileInfo, err error) error {
			if installerFile != "" {
				return nil
			}

			comps := strings.Split(path, toolkit.PathSeparator)
			filename := comps[len(comps)-1]
			if server.OS == "linux" {
				if strings.Contains(filename, ".sh") {
					installerFile = filename
				}
			} else if server.OS == "windows" {
				if strings.Contains(filename, ".bat") {
					installerFile = filename
				} else if strings.Contains(filename, ".exe") {
					installerFile = filename
				}
			}

			if installerFile != "" {
				installerFile = strings.Replace(installerFile, sourcePath+toolkit.PathSeparator, "", -1)
			}

			return nil
		})

		err = toolkit.ZipCompress(sourcePath, sourceZipPath)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		err = sshSetting.SshCopyByPath(sourceZipPath, destinationPath)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		err = os.Remove(sourceZipPath)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}

		_, err = sshSetting.GetOutputCommandSsh(fmt.Sprintf("unzip %s.zip", destinationZipPath))
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (a *ApplicationController) SaveApps(r *knot.WebContext) interface{} {
	// upload handler
	err, fileName := helper.UploadHandler(r, "userfile", zipSource)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o := new(colonycore.Application)
	o.ID = r.Request.FormValue("id")
	o.AppsName = r.Request.FormValue("AppsName")
	enable, err := strconv.ParseBool(r.Request.FormValue("Enable"))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	o.Enable = enable
	o.AppsName = r.Request.FormValue("AppsName")
	//a.SendFile(host,user,pass,filepath,destination,pem)
	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	var zipFile string
	if fileName != "" {
		zipFile = filepath.Join(zipSource, fileName)
	}

	if zipFile != "" && o.ID != "" {
		newDirName = o.ID
		directoryTree, zipName, _ := unzip(zipFile)
		createJson(directoryTree)

		o.ZipName = zipName
		err = colonycore.Save(o)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (a *ApplicationController) GetApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)

	var query *dbox.Filter
	query = dbox.Or(dbox.Contains("_id", search), dbox.Contains("AppsName", search))

	cursor, err := colonycore.Find(new(colonycore.Application), query)
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
	var data []string
	err := r.GetPayload(&data)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, val := range data {
		if val != "" {
			payload.ID = val
			err = colonycore.Delete(payload)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			delPath := filepath.Join(unzipDest, payload.ID)
			err = deleteDirectory(unzipDest, delPath, payload.ID)
			if err != nil {
				fmt.Println("Error : ", err)
				return err
			}
		}
	}

	return helper.CreateResult(true, data, "")
}

func subMenu(path string, pathdir string) []*colonycore.TreeSourceModel {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		fmt.Println("Error : ", err)
	}
	var arrDir []*colonycore.TreeSourceModel

	for _, f := range files {
		var treeModel colonycore.TreeSourceModel
		if info, err := os.Stat(path + toolkit.PathSeparator + f.Name()); err == nil && info.IsDir() {
			// if filepath.Ext(f.Name()) != "" {
			treeModel.Text = f.Name()
			treeModel.Type = "folder"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-folder-open"
			treeModel.Path = pathdir + f.Name()
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			treeModel.Items = subMenu(path+toolkit.PathSeparator+f.Name(), pathdir+f.Name()+toolkit.PathSeparator)
			arrDir = append(arrDir, &treeModel)
		} else {
			treeModel.Text = f.Name()
			treeModel.Type = "file"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-file"
			// content, err := ioutil.ReadFile(path + toolkit.PathSeparator + f.Name())
			// if err != nil {
			// 	fmt.Println("Error : ", err)
			// }
			// treeModel.Content = string(content)
			treeModel.Path = pathdir + f.Name()
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			arrDir = append(arrDir, &treeModel)
		}
	}
	return arrDir
}

func (a *ApplicationController) ReadDirectory(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	namefolder := payload["ID"].(string)

	var arrDir []*colonycore.TreeSourceModel
	urlDir := filepath.Join(unzipDest, namefolder)
	files, err := ioutil.ReadDir(urlDir)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	for _, f := range files {
		var treeModel colonycore.TreeSourceModel
		if info, err := os.Stat(urlDir + toolkit.PathSeparator + f.Name()); err == nil && info.IsDir() {
			// if filepath.Ext(f.Name()) != "" {
			treeModel.Text = f.Name()
			treeModel.Type = "folder"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-folder-open"
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			treeModel.Path = f.Name()
			treeModel.Items = subMenu(urlDir+toolkit.PathSeparator+f.Name(), f.Name()+toolkit.PathSeparator)
			arrDir = append(arrDir, &treeModel)
		} else {
			treeModel.Text = f.Name()
			treeModel.Type = "file"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-file"
			// content, err := ioutil.ReadFile(urlDir + toolkit.PathSeparator + f.Name())
			// if err != nil {
			// 	fmt.Println("Error : ", err)
			// }
			// treeModel.Content = string(content)
			treeModel.Path = f.Name()
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			arrDir = append(arrDir, &treeModel)
		}
	}
	return helper.CreateResult(true, arrDir, "")
}

func (a *ApplicationController) ReadContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	pathfolder := payload["Path"].(string)
	ID := payload["ID"].(string)
	urlDir := filepath.Join(unzipDest, ID, pathfolder)
	contentstring := ""
	content, err := ioutil.ReadFile(urlDir)
	if err != nil {
		fmt.Println("Error : ", err)
		contentstring = ""
	} else {
		contentstring = string(content)
	}
	return helper.CreateResult(true, contentstring, "")
}

func (a *ApplicationController) CreateNewFile(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	Type := payload["Type"].(string)
	Filename := payload["Filename"].(string)
	pathfolder := payload["Path"].(string)
	ID := payload["ID"].(string)
	if Type == "folder" {
		os.MkdirAll(filepath.Join(unzipDest, ID, pathfolder, Filename), 0755)
	} else {
		content := []byte("")
		if payload["Content"].(string) != "" {
			content = []byte(payload["Content"].(string))
		}
		err = ioutil.WriteFile(filepath.Join(unzipDest, ID, pathfolder, Filename), content, 0644)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, err, "")
}

func (a *ApplicationController) DeleteFileSelected(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	Filename := payload["Filename"].(string)
	pathfolder := payload["Path"].(string)
	ID := payload["ID"].(string)

	err = os.RemoveAll(filepath.Join(unzipDest, ID, pathfolder, Filename))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, err, "")
}

func (a *ApplicationController) RenameFileSelected(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	Filename := payload["Filename"].(string)
	pathfolder := payload["Path"].(string)
	ID := payload["ID"].(string)

	pathlist := strings.Split(filepath.Join(unzipDest, ID, pathfolder), string(filepath.Separator))
	pathlist = append(pathlist[:len(pathlist)-1])
	path := strings.Join(pathlist, string(filepath.Separator))

	err = os.Rename(filepath.Join(unzipDest, ID, pathfolder), filepath.Join(path, Filename))

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, err, "")
}
