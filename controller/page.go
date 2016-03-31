package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"path/filepath"
	// "strings"
)

type PageController struct {
	App
}

func CreatePageController(s *knot.Server) *PageController {
	var controller = new(PageController)
	controller.Server = s
	return controller
}

func (p *PageController) GetDataSource(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data, err := helper.GetDataSourceQuery()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) GetPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	search := payload["search"].(string)
	data, err := new(colonycore.Page).Get(search)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	return helper.CreateResult(true, data, "")
}

func (p *PageController) SavePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	// compressedSource := filepath.Join(EC_DATA_PATH, "page")

	page := new(colonycore.Page)
	payload := map[string]interface{}{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	page.ID = payload["_id"].(string)
	page.ParentMenu = payload["parentMenu"].(string)
	page.PanelID = payload["panelId"].([]*colonycore.PanelID)
	page.Title = payload["title"].(string)
	page.URL = payload["url"].(string)

	p.SendFiles(page.PanelID)

	if err := page.Save(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, page, "")
}

func (p *PageController) EditPage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := colonycore.Page{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	if err := data.GetById(); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, data, "")
}

func (p *PageController) RemovePage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	payload := map[string]interface{}{}
	if err := r.GetPayload(&payload); !helper.HandleError(err) {
		return helper.CreateResult(false, nil, err.Error())
	}

	idArray := payload["_id"].([]interface{})

	for _, id := range idArray {
		o := new(colonycore.Page)
		o.ID = id.(string)
		if err := o.Delete(); err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
	}

	return helper.CreateResult(true, nil, "")
}

func (p *PageController) PreviewExample(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	data := toolkit.M{}
	if err := r.GetPayload(&data); err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	widgetSource := filepath.Join(EC_DATA_PATH, "widget")
	widgetPath := filepath.Join(widgetSource, data.Get("_id", "").(string), "index.html")

	contentstring := ""
	content, err := ioutil.ReadFile(widgetPath)
	if err != nil {
		toolkit.Println("Error : ", err)
		contentstring = ""
	} else {
		contentstring = string(content)
	}
	// toolkit.Println(contentstring)
	return helper.CreateResult(true, contentstring, "")
}

func (p *PageController) GetServerPathSeparator(server *colonycore.Server) string {
	if server.ServerType == "windows" {
		return "\\\\"
	}

	return `/`
}

// func defineCommand(server.CmdExtract string, destinationZipPathOutput string) (string,string, err) {

// }

func (p *PageController) SendFiles(data []*colonycore.PanelID) error {
	return nil
	// path := filepath.Join(EC_DATA_PATH, "widget", "log")
	// log, _ := toolkit.NewLog(false, true, path, "sendfile-%s", "20060102-1504")

	// for _, pvalue := range data {
	// 	for _, wvalue := range pvalue.WidgetID {

	// 	}
	// }
	// log.AddLog("Get widget with ID: "+payload.ID, "INFO")
	// app := new(colonycore.Widget)
	// err = colonycore.Get(app, payload.ID)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")
	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// log.AddLog("Get server with ID: "+payload.Server, "INFO")
	// server := new(colonycore.Server)
	// err = colonycore.Get(server, payload.Server)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")
	// 	return err
	// }

	// serverPathSeparator := p.GetServerPathSeparator(server)

	// log.AddLog(fmt.Sprintf("Connect to server %v", server), "INFO")
	// sshSetting, sshClient, err := new(ServerController).SSHConnect(server)
	// defer sshClient.Close()

	// if server.OS == "windows" {
	// 	sourcePath := filepath.Join(EC_DATA_PATH, "src", app.ID)
	// 	/*\data-root\widget*/
	// 	destinationPath := strings.Join([]string{server.AppPath, "widget"}, serverPathSeparator)
	// 	/*/src/widget*/
	// 	destinationZipPathOutput := strings.Join([]string{destinationPath, app.ID}, serverPathSeparator)
	// 	/*/src/widget/widget1*/
	// 	var sourceZipPath string
	// 	var unzipCmd string
	// 	var destinationZipPath string

	// 	if strings.Contains(server.CmdExtract, "7z") || strings.Contains(server.CmdExtract, "zip") {

	// 		sourceZipPath = filepath.Join(EC_DATA_PATH, "src", fmt.Sprintf("%s.zip", app.ID))
	// 		/*\data-root\src\widget.zip*/
	// 		destinationZipPath = fmt.Sprintf("%s.zip", destinationZipPathOutput)
	// 		/*/src/widget.zip*/
	// 		// cmd /C 7z e -o %s -y %s
	// 		unzipCmd = fmt.Sprintf("cmd /C %s", server.CmdExtract)
	// 		unzipCmd = strings.Replace(unzipCmd, `%1`, destinationZipPathOutput, -1)
	// 		unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPath, -1)

	// 		log.AddLog(unzipCmd, "INFO")
	// 		err = toolkit.ZipCompress(sourcePath, sourceZipPath)
	// 		if err != nil {
	// 			log.AddLog(err.Error(), "ERROR")

	// 			return helper.CreateResult(false, nil, err.Error())
	// 		}
	// 	} else {
	// 		message := "currently only zip/7z command which is supported"
	// 		log.AddLog(message, "ERROR")

	// 		return helper.CreateResult(false, nil, message)
	// 	}

	// 	rmCmdZip := fmt.Sprintf("rm -rf %s", destinationZipPath)
	// 	log.AddLog(rmCmdZip, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(rmCmdZip)
	// 	/*delete zip file on dest path before copy file /src/widget.zip*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	err = sshSetting.SshCopyByPath(sourceZipPath, destinationPath)
	// 	/*copy zip file from colonny manager to server*/
	// 	log.AddLog(fmt.Sprintf("scp from %s to %s", sourceZipPath, destinationPath), "INFO")

	// 	rmCmdZipOutput := fmt.Sprintf("rm -rf %s", destinationZipPathOutput)
	// 	log.AddLog(rmCmdZipOutput, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(rmCmdZipOutput)
	// 	/*delete folder before extract zip file on server /src/widget1*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	mkdirDestCmd := fmt.Sprintf("%s %s%s%s", server.CmdMkDir, destinationZipPathOutput)
	// 	log.AddLog(mkdirDestCmd, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(mkdirDestCmd)
	// 	/*make new destination folder on server for folder extraction /src/widget*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	chmodDestCmd := fmt.Sprintf("chmod -R 755 %s%s%s", destinationZipPathOutput)
	// 	log.AddLog(chmodDestCmd, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(chmodDestCmd)
	// 	/*set chmod on new folder extraction src/widget/widget1*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	log.AddLog(unzipCmd, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(unzipCmd)
	// 	/*extract zip file /src/widget/widget1*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	err = os.Remove(sourceZipPath)
	// 	/*remove zip file from local colony manager*/
	// 	log.AddLog(fmt.Sprintf("remove %s", sourceZipPath), "INFO")
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}

	// 	log.AddLog(rmCmdZip, "INFO")
	// 	_, err = sshSetting.GetOutputCommandSsh(rmCmdZip)
	// 	/*delete zip file after folder extraction /src/widget/widget.zip*/
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}
	// 	changeDeploymentStatus(true)
	// 	return helper.CreateResult(true, nil, "")
	// }

	// sourcePath := filepath.Join(EC_APP_PATH, "src", app.ID)
	// destinationPath := strings.Join([]string{server.AppPath, "src"}, serverPathSeparator)
	// destinationZipPathOutput := strings.Join([]string{destinationPath, app.ID}, serverPathSeparator)
	// var sourceZipPath string
	// var unzipCmd string
	// var destinationZipPath string

	// if strings.Contains(server.CmdExtract, "tar") {
	// 	sourceZipPath = filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.tar", app.ID))
	// 	destinationZipPath = fmt.Sprintf("%s.tar", destinationZipPathOutput)

	// 	// tar -xvf %s -C %s
	// 	unzipCmd = strings.Replace(server.CmdExtract, `%1`, destinationZipPath, -1)
	// 	unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPathOutput, -1)

	// 	log.AddLog(unzipCmd, "INFO")
	// 	err = toolkit.TarCompress(sourcePath, sourceZipPath)
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}
	// } else if strings.Contains(server.CmdExtract, "zip") {
	// 	sourceZipPath = filepath.Join(EC_APP_PATH, "src", fmt.Sprintf("%s.zip", app.ID))
	// 	destinationZipPath = fmt.Sprintf("%s.zip", destinationZipPathOutput)

	// 	// unzip %s -d %s
	// 	unzipCmd = strings.Replace(server.CmdExtract, `%1`, destinationZipPath, -1)
	// 	unzipCmd = strings.Replace(unzipCmd, `%2`, destinationZipPathOutput, -1)

	// 	log.AddLog(unzipCmd, "INFO")
	// 	err = toolkit.ZipCompress(sourcePath, sourceZipPath)
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")

	// 		return helper.CreateResult(false, nil, err.Error())
	// 	}
	// } else {
	// 	message := "currently only zip/tar command which is supported"
	// 	log.AddLog(message, "ERROR")

	// 	return helper.CreateResult(false, nil, message)
	// }

	// rmCmdZip := fmt.Sprintf("rm -rf %s", destinationZipPath)
	// log.AddLog(rmCmdZip, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(rmCmdZip)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// err = sshSetting.SshCopyByPath(sourceZipPath, destinationPath)
	// log.AddLog(fmt.Sprintf("scp from %s to %s", sourceZipPath, destinationPath), "INFO")

	// rmCmdZipOutput := fmt.Sprintf("rm -rf %s", destinationZipPathOutput)
	// log.AddLog(rmCmdZipOutput, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(rmCmdZipOutput)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// mkdirDestCmd := fmt.Sprintf("%s %s%s%s", server.CmdMkDir, destinationPath, serverPathSeparator, app.ID)
	// log.AddLog(mkdirDestCmd, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(mkdirDestCmd)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// chmodDestCmd := fmt.Sprintf("chmod -R 777 %s%s%s", destinationPath, serverPathSeparator, app.ID)
	// log.AddLog(chmodDestCmd, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(chmodDestCmd)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// log.AddLog(unzipCmd, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(unzipCmd)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// err = os.Remove(sourceZipPath)
	// log.AddLog(fmt.Sprintf("remove %s", sourceZipPath), "INFO")
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// findCommand := fmt.Sprintf(`find %s -name "*install.sh"`, destinationZipPathOutput)
	// log.AddLog(findCommand, "INFO")
	// installerPath, err := sshSetting.GetOutputCommandSsh(findCommand)
	// installerPath = strings.TrimSpace(installerPath)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// if installerPath == "" {
	// 	errString := "installer not found"
	// 	log.AddLog(errString, "ERROR")

	// 	return helper.CreateResult(false, nil, errString)
	// }

	// chmodCommand := fmt.Sprintf("chmod 755 %s", installerPath)
	// log.AddLog(chmodCommand, "INFO")
	// _, err = sshSetting.GetOutputCommandSsh(chmodCommand)
	// if err != nil {
	// 	log.AddLog(err.Error(), "ERROR")

	// 	return helper.CreateResult(false, nil, err.Error())
	// }

	// installerBasePath, installerFile := func(path string) (string, string) {
	// 	comps := strings.Split(path, serverPathSeparator)
	// 	ibp := strings.Join(comps[:len(comps)-1], serverPathSeparator)
	// 	ilf := comps[len(comps)-1]

	// 	return ibp, ilf
	// }(installerPath)

	// cRunCommand := make(chan string, 1)
	// go func() {
	// 	runCommand := fmt.Sprintf("cd %s && ./%s &", installerBasePath, installerFile)
	// 	log.AddLog(runCommand, "INFO")
	// 	_, err = sshSetting.RunCommandSsh(runCommand)
	// 	if err != nil {
	// 		log.AddLog(err.Error(), "ERROR")
	// 		cRunCommand <- err.Error()
	// 	} else {
	// 		cRunCommand <- ""
	// 	}
	// }()

	// errorMessage := ""
	// select {
	// case receiveRunCommandOutput := <-cRunCommand:
	// 	errorMessage = receiveRunCommandOutput
	// case <-time.After(time.Second * 3):
	// 	errorMessage = ""
	// }

	// if errorMessage != "" {
	// 	log.AddLog(errorMessage, "ERROR")

	// 	return helper.CreateResult(false, nil, errorMessage)
	// }

	// if app.DeployedTo == nil {
	// 	app.DeployedTo = []string{}
	// }

	// return helper.CreateResult(true, nil, "")
}
