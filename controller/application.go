package controller

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/eaciit/acl"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
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

	filename := fmt.Sprintf("%s", filepath.Join(unzipDest, newDirName, "directory-tree.json"))

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
	contentList := strings.Split(path, toolkit.PathSeparator)
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
		return result, "", err
	}

	err = os.Rename(basePath, newname) /*rename unzip file to appID*/
	if err != nil {
		return result, "", err
	}

	if _, err := os.Stat(src); !os.IsNotExist(err) {
		err = r.Close()
		if err != nil {
			return result, "", err
		}
	}

	newNameParsed := func() string {
		comps := strings.Split(src, ".")[:]
		subComps := strings.Split(newname, toolkit.PathSeparator)
		subComps = append(subComps[:len(subComps)-1], fmt.Sprintf("source-%s", subComps[len(subComps)-1]))
		newname = strings.Join(subComps, toolkit.PathSeparator)
		fullpath := fmt.Sprintf("%s.%s", newname, comps[len(comps)-1])

		basePath := strings.Split(src, toolkit.PathSeparator)

		comps = strings.Split(fullpath, toolkit.PathSeparator)
		return fmt.Sprintf("%s%s%s", strings.Join(basePath[:len(basePath)-1], toolkit.PathSeparator), toolkit.PathSeparator, comps[len(comps)-1])
	}()

	err = os.Rename(src, newNameParsed)
	if err != nil {
		return result, newNameParsed, err
	}

	return result, newNameParsed, nil
}

func (a *ApplicationController) GetServerPathSeparator(server *colonycore.Server) string {
	if server.OS == "windows" {
		return `\\`
	}

	return `/`
}

func (a *ApplicationController) Deploy(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	path := filepath.Join(EC_DATA_PATH, "application", "log")
	log, _ := toolkit.NewLog(false, true, path, "log-%s", "20060102-1504")

	log.AddLog("Get payload", "INFO")
	payload := struct {
		ID     string `json:"_id",bson:"_id"`
		Server string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	log.AddLog("Get application with ID: "+payload.ID, "INFO")
	app := new(colonycore.Application)
	err = colonycore.Get(app, payload.ID)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	log.AddLog("Get server with ID: "+payload.Server, "INFO")
	server := new(colonycore.Server)
	err = colonycore.Get(server, payload.Server)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return helper.CreateResult(false, nil, err.Error())
	}

	serverPathSeparator := a.GetServerPathSeparator(server)

	changeDeploymentStatus := func(status bool) {
		deployedTo := []string{}
		for _, each := range app.DeployedTo {
			if each != server.ID {
				deployedTo = append(deployedTo, server.ID)
			}
		}

		if status {
			app.DeployedTo = append(deployedTo, server.ID)
		}
		colonycore.Save(app)
	}

	log.AddLog(fmt.Sprintf("Connect to server %v", server), "INFO")
	sshSetting, sshClient, err := server.Connect()
	defer sshClient.Close()

	if server.OS == "windows" {
		sourcePath := filepath.Join(EC_APP_PATH, "src", app.ID)
		destinationPath := strings.Join([]string{server.AppPath, "src"}, serverPathSeparator)
		destinationZipPathOutput := strings.Join([]string{destinationPath, app.ID}, serverPathSeparator)
		var sourceZipPath string
		var unzipCmd string
		var destinationZipPath string

		if strings.Contains(server.CmdExtract, "7z") || strings.Contains(server.CmdExtract, "zip") {
			sourceZipPath = filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.zip", app.ID))
			destinationZipPath = fmt.Sprintf("%s.zip", destinationZipPathOutput)
			deszip := fmt.Sprintf("%s%s%s", destinationPath, serverPathSeparator, app.ID)

			// cmd /C 7z e -o %s -y %s
			unzipCmd = fmt.Sprintf("cmd /C %s", server.CmdExtract)
			unzipCmd = strings.Replace(unzipCmd, `%1`, deszip, -1)
			unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPath, -1)

			log.AddLog(unzipCmd, "INFO")
			err = toolkit.ZipCompress(sourcePath, sourceZipPath)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				changeDeploymentStatus(false)
				return helper.CreateResult(false, nil, err.Error())
			}
		} else {
			message := "currently only zip/7z command which is supported"
			log.AddLog(message, "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, message)
		}

		rmCmdZip := fmt.Sprintf("rm -rf %s", destinationZipPath)
		log.AddLog(rmCmdZip, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(rmCmdZip)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		err = sshSetting.SshCopyByPath(sourceZipPath, destinationPath)
		log.AddLog(fmt.Sprintf("scp from %s to %s", sourceZipPath, destinationPath), "INFO")

		rmCmdZipOutput := fmt.Sprintf("rm -rf %s", destinationZipPathOutput)
		log.AddLog(rmCmdZipOutput, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(rmCmdZipOutput)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		mkdirDestCmd := fmt.Sprintf("%s %s%s%s", server.CmdMkDir, destinationPath, serverPathSeparator, app.ID)
		log.AddLog(mkdirDestCmd, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(mkdirDestCmd)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		chmodDestCmd := fmt.Sprintf("chmod -R 755 %s%s%s", destinationPath, serverPathSeparator, app.ID)
		log.AddLog(chmodDestCmd, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(chmodDestCmd)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		log.AddLog(unzipCmd, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(unzipCmd)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		err = os.Remove(sourceZipPath)
		log.AddLog(fmt.Sprintf("remove %s", sourceZipPath), "INFO")
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		findCommand := fmt.Sprintf(`find %s -name "*install.bat"`, destinationZipPathOutput)
		log.AddLog(findCommand, "INFO")
		installerPath, err := sshSetting.GetOutputCommandSsh(findCommand)
		installerPath = strings.TrimSpace(installerPath)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		if installerPath == "" {
			errString := "installer not found"
			log.AddLog(errString, "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, errString)
		}

		chmodCommand := fmt.Sprintf("chmod 755 %s%sinstall.bat", destinationZipPathOutput, serverPathSeparator)
		log.AddLog(chmodCommand, "INFO")
		_, err = sshSetting.GetOutputCommandSsh(chmodCommand)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}

		installerBasePath, _ := func(path string) (string, string) {
			comps := strings.Split(path, serverPathSeparator)
			ibp := strings.Join(comps[:len(comps)-1], serverPathSeparator)
			ilf := comps[len(comps)-1]

			return ibp, ilf
		}(installerPath)
		fmt.Println(installerBasePath)
		cRunCommand := make(chan string, 1)
		go func() {
			runCommand := fmt.Sprintf("cmd /C %s%sinstall.bat", destinationZipPathOutput, serverPathSeparator)
			log.AddLog(runCommand, "INFO")
			res, err := sshSetting.RunCommandSsh(runCommand)
			fmt.Println(res)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				cRunCommand <- err.Error()
			} else {
				cRunCommand <- ""
			}
		}()

		errorMessage := ""
		select {
		case receiveRunCommandOutput := <-cRunCommand:
			errorMessage = receiveRunCommandOutput
		case <-time.After(time.Second * 3):
			errorMessage = ""
		}

		if errorMessage != "" {
			log.AddLog(errorMessage, "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, errorMessage)
		}

		if app.DeployedTo == nil {
			app.DeployedTo = []string{}
		}

		changeDeploymentStatus(true)
		return helper.CreateResult(true, nil, "")
	}

	sourcePath := filepath.Join(EC_APP_PATH, "src", app.ID)
	destinationPath := strings.Join([]string{server.AppPath, "src"}, serverPathSeparator)
	destinationZipPathOutput := strings.Join([]string{destinationPath, app.ID}, serverPathSeparator)
	var sourceZipPath string
	var unzipCmd string
	var destinationZipPath string

	if strings.Contains(server.CmdExtract, "tar") {
		sourceZipPath = filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.tar", app.ID))
		destinationZipPath = fmt.Sprintf("%s.tar", destinationZipPathOutput)

		// tar -xvf %s -C %s
		unzipCmd = strings.Replace(server.CmdExtract, `%1`, destinationZipPath, -1)
		unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPathOutput, -1)

		log.AddLog(unzipCmd, "INFO")
		err = toolkit.TarCompress(sourcePath, sourceZipPath)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}
	} else if strings.Contains(server.CmdExtract, "zip") {
		sourceZipPath = filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.zip", app.ID))
		destinationZipPath = fmt.Sprintf("%s.zip", destinationZipPathOutput)

		// unzip %s -d %s
		unzipCmd = strings.Replace(server.CmdExtract, `%1`, destinationZipPath, -1)
		unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPathOutput, -1)

		log.AddLog(unzipCmd, "INFO")
		err = toolkit.ZipCompress(sourcePath, sourceZipPath)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			changeDeploymentStatus(false)
			return helper.CreateResult(false, nil, err.Error())
		}
	} else {
		message := "currently only zip/tar command which is supported"
		log.AddLog(message, "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, message)
	}

	rmCmdZip := fmt.Sprintf("rm -rf %s", destinationZipPath)
	log.AddLog(rmCmdZip, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(rmCmdZip)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	err = sshSetting.SshCopyByPath(sourceZipPath, destinationPath)
	log.AddLog(fmt.Sprintf("scp from %s to %s", sourceZipPath, destinationPath), "INFO")

	rmCmdZipOutput := fmt.Sprintf("rm -rf %s", destinationZipPathOutput)
	log.AddLog(rmCmdZipOutput, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(rmCmdZipOutput)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	mkdirDestCmd := fmt.Sprintf("%s %s%s%s", server.CmdMkDir, destinationPath, serverPathSeparator, app.ID)
	log.AddLog(mkdirDestCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(mkdirDestCmd)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	chmodDestCmd := fmt.Sprintf("chmod -R 777 %s%s%s", destinationPath, serverPathSeparator, app.ID)
	log.AddLog(chmodDestCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(chmodDestCmd)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	log.AddLog(unzipCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(unzipCmd)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	err = os.Remove(sourceZipPath)
	log.AddLog(fmt.Sprintf("remove %s", sourceZipPath), "INFO")
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	findCommand := fmt.Sprintf(`find %s -name "*install.sh"`, destinationZipPathOutput)
	log.AddLog(findCommand, "INFO")
	installerPath, err := sshSetting.GetOutputCommandSsh(findCommand)
	installerPath = strings.TrimSpace(installerPath)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	if installerPath == "" {
		errString := "installer not found"
		log.AddLog(errString, "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, errString)
	}

	chmodCommand := fmt.Sprintf("chmod 755 %s", installerPath)
	log.AddLog(chmodCommand, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(chmodCommand)
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, err.Error())
	}

	installerBasePath, installerFile := func(path string) (string, string) {
		comps := strings.Split(path, serverPathSeparator)
		ibp := strings.Join(comps[:len(comps)-1], serverPathSeparator)
		ilf := comps[len(comps)-1]

		return ibp, ilf
	}(installerPath)

	cRunCommand := make(chan string, 1)
	go func() {
		runCommand := fmt.Sprintf("cd %s && ./%s &", installerBasePath, installerFile)
		log.AddLog(runCommand, "INFO")
		_, err = sshSetting.RunCommandSsh(runCommand)
		if err != nil {
			log.AddLog(err.Error(), "ERROR")
			cRunCommand <- err.Error()
		} else {
			cRunCommand <- ""
		}
	}()

	errorMessage := ""
	select {
	case receiveRunCommandOutput := <-cRunCommand:
		errorMessage = receiveRunCommandOutput
	case <-time.After(time.Second * 3):
		errorMessage = ""
	}

	if errorMessage != "" {
		log.AddLog(errorMessage, "ERROR")
		changeDeploymentStatus(false)
		return helper.CreateResult(false, nil, errorMessage)
	}

	if app.DeployedTo == nil {
		app.DeployedTo = []string{}
	}

	changeDeploymentStatus(true)
	return helper.CreateResult(true, nil, "")
}

func (a *ApplicationController) SaveApps(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	o := new(colonycore.Application)
	o.ID = r.Request.FormValue("_id")

	cursor, err := colonycore.Find(new(colonycore.Application), dbox.Eq("_id", o.ID))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()
	if cursor.Count() > 0 {
		temp := []*colonycore.Application{}
		cursor.Fetch(&temp, 0, false)
		o = temp[0]
	}

	o.AppsName = r.Request.FormValue("AppsName")
	o.Type = r.Request.FormValue("Type")
	o.Port = r.Request.FormValue("Port")

	var Command, Variable interface{}
	err = json.Unmarshal([]byte(r.Request.FormValue("Command")), &Command)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	err = json.Unmarshal([]byte(r.Request.FormValue("Variable")), &Variable)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	o.Command = Command
	o.Variable = Variable

	err = colonycore.Delete(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cursor2, err := colonycore.Find(new(colonycore.Application), dbox.Eq("Port", o.Port))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor2.Close()
	if cursor2.Count() > 0 {
		return helper.CreateResult(false, nil, fmt.Sprintf("Port %s already in use", o.Port))
	}

	err = colonycore.Save(o)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	_, fileName := helper.UploadHandler(r, "userfile", zipSource)

	if isEdit, _ := strconv.ParseBool(r.Request.FormValue("IsEdit")); !isEdit && fileName == "" {
		return helper.CreateResult(false, nil, "Archive file cannot be empty")
	}

	if fileName != "" {
		fileExtract := strings.Join([]string{zipSource, fileName}, toolkit.PathSeparator)
		destinationExtract := strings.Join([]string{zipSource, o.ID}, toolkit.PathSeparator)

		if runtime.GOOS == "windows" {
			err = exec.Command("cmd", "-c", "rmdir", "/s", "/q", destinationExtract).Run()
			// if err != nil {
			// 	return helper.CreateResult(false, nil, err.Error())
			// }
		} else {
			err = exec.Command("rm", "-rf", destinationExtract).Run()
			// if err != nil {
			// 	return helper.CreateResult(false, nil, err.Error())
			// }
		}

		if strings.Contains(fileName, ".tar.gz") {
			err = toolkit.TarGzExtract(fileExtract, destinationExtract)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if strings.Contains(fileName, ".gz") {
			err = toolkit.GzExtract(fileExtract, destinationExtract)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if strings.Contains(fileName, ".tar") {
			err = toolkit.TarExtract(fileExtract, destinationExtract)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		} else if strings.Contains(fileName, ".zip") {
			err = toolkit.ZipExtract(fileExtract, destinationExtract)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}
		}

		os.Remove(filepath.Join(zipSource, fileName))
		zipFile := filepath.Join(zipSource, fileName)
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

	payload := struct {
		Search string `json:"search"`
		Type   string `json:"type"`
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	filters := []*dbox.Filter{}
	if payload.Search != "" {
		filters = append(filters, dbox.Or(
			dbox.Contains("_id", payload.Search),
			dbox.Contains("AppsName", payload.Search),
			dbox.Contains("Type", payload.Search),
			dbox.Contains("Port", payload.Search),
		))
	}
	if payload.Type != "" {
		filters = append(filters, dbox.Eq("Type", payload.Type))
	}

	var query *dbox.Filter
	if len(filters) > 0 {
		query = dbox.And(filters...)
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

	pathlist := strings.Split(filepath.Join(unzipDest, ID, pathfolder), toolkit.PathSeparator)
	pathlist = append(pathlist[:len(pathlist)-1])
	path := strings.Join(pathlist, toolkit.PathSeparator)

	err = os.Rename(filepath.Join(unzipDest, ID, pathfolder), filepath.Join(path, Filename))

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, err, "")
}

func (a *ApplicationController) SaveAccess(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	conn, err := a.ConnectToDataSource()

	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}

	err = acl.SetDb(conn)

	initUser := new(acl.User)

	initUser.LoginID = "alip"
	initUser.FullName = "alip sidik"
	initUser.Email = "aa.sidik@eaciit.com"
	initUser.Password = "12345"

	err = acl.Save(initUser)
	if err != nil {
		return helper.CreateResult(true, nil, err.Error())
	}
	return helper.CreateResult(true, conn, "aa")
}

func (a *ApplicationController) ConnectToDataSource() (dbox.IConnection, error) {
	dataConn := new(colonycore.Connection)
	fmt.Println(dataConn)

	connection, err := helper.ConnectUsingDataConn(dataConn).Connect()
	fmt.Println(connection)
	if err != nil {
		fmt.Println("error connection ", err)
		return nil, err
	}
	return connection, nil
}

func (a *ApplicationController) RunCommand(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := struct {
		AppID    string
		CMDName  string
		ServerID string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	app := new(colonycore.Application)
	err = colonycore.Get(app, payload.AppID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cmdString := ""

	for _, raw := range app.Command.([]interface{}) {
		each := raw.(map[string]interface{})
		if each["key"].(string) == payload.CMDName {
			cmdString = each["value"].(string)
			break
		}
	}

	for _, raw := range app.Variable.([]interface{}) {
		each := raw.(map[string]interface{})
		if strings.Contains(cmdString, each["key"].(string)) {
			cmdString = strings.Replace(cmdString, each["key"].(string), each["value"].(string), -1)
		}
	}

	if cmdString == "" {
		return helper.CreateResult(false, nil, "Empty command or not found")
	}

	server := new(colonycore.Server)
	err = colonycore.Get(server, payload.ServerID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	setting, _, err := server.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	output, err := setting.RunCommandSshAsMap(cmdString)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, output[0].Output, "")
}

func (a *ApplicationController) IsAppDeployed(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := struct {
		AppID    string
		ServerID string
	}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	app := new(colonycore.Application)
	err = colonycore.Get(app, payload.AppID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	server := new(colonycore.Server)
	err = colonycore.Get(server, payload.ServerID)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	setting, _, err := server.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	cmdDeployStatus := ""

	if app.IsInternalApp {
		_, cmdDeployStatus = app.GetCommand(colonycore.App_Command_DeployStatus)
	} else {
		cmdDeployStatus = fmt.Sprintf(`if [ -d "$EC_APP_PATH/src/%s" ]; then echo "OK"; else echo "NOPE"; fi`, app.ID)
	}

	res, err := setting.RunCommandSshAsMap(cmdDeployStatus)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	status := strings.TrimSpace(res[0].Output) == "OK"
	return helper.CreateResult(true, status, "")
}
func (a *ApplicationController) GetLanguageData(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursor, err := colonycore.Find(new(colonycore.LanguageEnviroment), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.LanguageEnviroment{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}
