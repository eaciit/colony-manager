package controller

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	// "github.com/eaciit/cast"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	. "github.com/eaciit/sshclient"
	"github.com/eaciit/toolkit"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

var unzipDest = AppBasePath + toolkit.PathSeparator + filepath.Join("..", "colony-app", "apps")
var zipSource = AppBasePath + toolkit.PathSeparator + filepath.Join("config", "applications")
var parents = make(map[string]*TreeSource)
var basePath string
var newDirName string

type ApplicationController struct {
	App
}

type TreeSource struct {
	ID             int           `json:"_id",bson:"_id"`
	Text           string        `json:"text",bson:"text"`
	Expanded       bool          `json:"expanded",bson:"expanded"`
	SpriteCssClass string        `json:"spriteCssClass",bson:"spriteCssClass"`
	Items          []*TreeSource `json:"items",bson:"items"`
}

type TreeSourceModel struct {
	Text      string            `json:"text"`
	Type      string            `json:"type"`
	Expanded  bool              `json:"expanded"`
	Iconclass string            `json:"iconclass"`
	Ext       string            `json:"ext"`
	Path      string            `json:"path"`
	Items     []TreeSourceModel `json:"items"`
	// Content   string            `json:"content"`
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

func createJson(object *TreeSource) {
	jsonData, err := json.MarshalIndent(object, "", "	")

	if err != nil {
		fmt.Println(err.Error())
	}
	jsonString := string(jsonData)

	filename := fmt.Sprintf("%s", filepath.Join(unzipDest, newDirName, "DirectoryTree.json"))

	fmt.Println("writing: " + filename)
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

	parents[path] = &TreeSource{
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

func Unzip(src string) (result *TreeSource, err error) {
	r, err := zip.OpenReader(src)
	// if err != nil {
	// 	return nil, err
	// }
	/*defer func() {
		if err := r.Close(); err != nil {
			fmt.Println("Error 56: ", err)
			return
		}
	}()*/
	os.MkdirAll(unzipDest, 0755)

	for i, f := range r.File {
		err := extractAndWriteFile(i, f)
		if err != nil {
			return nil, err
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
		fmt.Println("error : ", err)
	}

	err = os.Rename(basePath, newname) /*rename unzip file to appID*/
	if err != nil {
		fmt.Println("error : ", err)
	}

	if _, err := os.Stat(src); !os.IsNotExist(err) { /*delete zip file after extracting*/
		err = r.Close()
		if err != nil {
			fmt.Println("error : ", err)
			return nil, err
		}

		err = os.Remove(src)
		if err != nil {
			fmt.Println("error : ", err)
			return nil, err
		}
	}

	return
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
		directoryTree, _ := Unzip(zipFile)
		createJson(directoryTree)
	}
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

func (a *ApplicationController) AppsFilter(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}

	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	text := payload["inputText"].(string)
	var query *dbox.Filter

	if text != "" {
		query = dbox.Or(dbox.Contains("_id", text),
			dbox.Contains("AppsName", text))
	}

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

func (a *ApplicationController) SendFile(host string, user string, pass string, filepath string, destination string, pem string) interface{} {
	//r.Config.OutputType = knot.OutputJson

	var SshClient SshSetting
	SshClient.SSHAuthType = SSHAuthType_Password
	SshClient.SSHHost = host //"192.168.56.102:22" //r.Request.FormValue("SSHHost")
	if pem == "" {
		SshClient.SSHUser = user     //"eaciit1" //r.Request.FormValue("SSHUser")
		SshClient.SSHPassword = pass //"12345" //r.Request.FormValue("SSHPassword")
	} else {
		SshClient.SSHKeyLocation = pem
	}
	// filepath := "E:\\a.jpg"  //r.Request.FormValue("filepath")
	// destination := "/home/eaciit1"  //r.Request.FormValue("destination")

	e := SshClient.CopyFileSsh(filepath, destination)
	if e != nil {
		return helper.CreateResult(true, e, "")
	} else {
		return helper.CreateResult(true, "sukses", "")
	}
}

func SubMenu(path string, pathdir string) []TreeSourceModel {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		fmt.Println("Error : ", err)
	}
	var arrDir []TreeSourceModel

	for _, f := range files {
		var treeModel TreeSourceModel
		if filepath.Ext(f.Name()) != "" {
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
			arrDir = append(arrDir, treeModel)
		} else {
			treeModel.Text = f.Name()
			treeModel.Type = "folder"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-folder-open"
			treeModel.Path = pathdir + f.Name()
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			treeModel.Items = SubMenu(path+toolkit.PathSeparator+f.Name(), pathdir+f.Name()+toolkit.PathSeparator)
			arrDir = append(arrDir, treeModel)
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

	var arrDir []TreeSourceModel
	urlDir := filepath.Join(unzipDest, namefolder)
	files, err := ioutil.ReadDir(urlDir)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	for _, f := range files {
		var treeModel TreeSourceModel
		if filepath.Ext(f.Name()) != "" {
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
			arrDir = append(arrDir, treeModel)
		} else {
			treeModel.Text = f.Name()
			treeModel.Type = "folder"
			treeModel.Expanded = false
			treeModel.Iconclass = "glyphicon glyphicon-folder-open"
			treeModel.Ext = strings.ToLower(filepath.Ext(f.Name()))
			treeModel.Path = f.Name()
			treeModel.Items = SubMenu(urlDir+toolkit.PathSeparator+f.Name(), f.Name()+toolkit.PathSeparator)
			arrDir = append(arrDir, treeModel)
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

func (a *ApplicationController) CreateNewDirectory(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	err := os.Mkdir("."+string(filepath.Separator)+"TestDir", 0777)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, err, "")
}
