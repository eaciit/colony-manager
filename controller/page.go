package controller

import (
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/toolkit"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
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

	p.SendFiles(page.PanelID, payload["serverId"].(string))

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
	return helper.CreateResult(true, contentstring, "")
}

func (p *PageController) GetServerPathSeparator(server *colonycore.Server) string {
	if server.ServerType == "windows" {
		return "\\\\"
	}

	return `/`
}

func defineCommand(server *colonycore.Server, destZipPath string, appID string) (string, string, string, error) {
	var ext string
	if strings.Contains(server.CmdExtract, "7z") || strings.Contains(server.CmdExtract, "zip") {
		ext = ".zip"
	} else if strings.Contains(server.CmdExtract, "tar") {
		ext = ".tar"
	} else if strings.Contains(server.CmdExtract, "gz") {
		ext = ".gz"
	}
	sourceZipFile := filepath.Join(EC_DATA_PATH, "widget", toolkit.Sprintf("%s%s", appID, ext))
	destZipFile := toolkit.Sprintf("%s%s", destZipPath, ext)
	var unzipCmd string
	// cmd /C 7z e -o %s -y %s
	if server.ServerType == "windows" {
		unzipCmd = toolkit.Sprintf("cmd /C %s", server.CmdExtract)
		unzipCmd = strings.Replace(unzipCmd, `%1`, destZipPath, -1)
		unzipCmd = strings.Replace(unzipCmd, `%2`, destZipFile, -1)
	} else {
		unzipCmd = strings.Replace(server.CmdExtract, `%1`, destZipFile, -1)
		unzipCmd = strings.Replace(unzipCmd, `%2`, destZipPath, -1)
	}

	return unzipCmd, sourceZipFile, destZipFile, nil

}

func copyFileToServer(server *colonycore.Server, sourcePath string, destPath string, appID string, log *toolkit.LogEngine) error {
	var serverPathSeparator string
	if strings.Contains(destPath, "/") {
		serverPathSeparator = `/`
	} else {
		serverPathSeparator = "\\\\"
	}
	destZipPath := strings.Join([]string{destPath, appID}, serverPathSeparator)
	unzipCmd, sourceZipFile, destZipFile, err := defineCommand(server, destZipPath, appID)

	log.AddLog(toolkit.Sprintf("Connect to server %v", server), "INFO")
	sshSetting, sshClient, err := new(ServerController).SSHConnect(server)
	defer sshClient.Close()

	log.AddLog(unzipCmd, "INFO") /*compress file on local colony manager*/
	if strings.Contains(sourceZipFile, ".zip") {
		err = toolkit.ZipCompress(sourcePath, sourceZipFile)
	} else if strings.Contains(sourceZipFile, ".tar") {
		err = toolkit.TarCompress(sourcePath, sourceZipFile)
	}
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	rmCmdZip := toolkit.Sprintf("rm -rf %s", destZipFile)
	log.AddLog(rmCmdZip, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(rmCmdZip) /*delete zip file on server before copy file*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	log.AddLog(toolkit.Sprintf("scp from %s to %s", sourceZipFile, destPath), "INFO")
	err = sshSetting.SshCopyByPath(sourceZipFile, destPath) /*copy zip file from colony manager to server*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	rmCmdZipOutput := toolkit.Sprintf("rm -rf %s", destZipPath)
	log.AddLog(rmCmdZipOutput, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(rmCmdZipOutput) /*delete folder before extract zip file on server*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	mkdirDestCmd := toolkit.Sprintf("%s %s%s%s", server.CmdMkDir, destZipPath, serverPathSeparator, appID)
	log.AddLog(mkdirDestCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(mkdirDestCmd) /*make new dest folder on server for folder extraction*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	chmodDestCmd := toolkit.Sprintf("chmod -R 755 %s%s%s", destZipPath, serverPathSeparator, appID)
	log.AddLog(chmodDestCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(chmodDestCmd) /*set chmod on new folder extraction*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	log.AddLog(unzipCmd, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(unzipCmd) /*extract zip file to server*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	log.AddLog(toolkit.Sprintf("remove %s", sourceZipFile), "INFO")
	err = os.Remove(sourceZipFile) /*remove zip file from local colony manager*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}

	log.AddLog(rmCmdZip, "INFO")
	_, err = sshSetting.GetOutputCommandSsh(rmCmdZip) /*delete zip file on server after folder extraction*/
	if err != nil {
		log.AddLog(err.Error(), "ERROR")
		return err
	}
	return nil
}

func (p *PageController) SendFiles(data []*colonycore.PanelID, serverid string) error {
	path := filepath.Join(EC_DATA_PATH, "widget", "log")
	log, _ := toolkit.NewLog(false, true, path, "sendfile-%s", "20060102-1504")

	for _, pvalue := range data {
		for _, wValue := range pvalue.WidgetID {
			appID := wValue.ID
			log.AddLog("Get widget with ID: "+appID, "INFO")
			widget := new(colonycore.Widget)
			err := colonycore.Get(widget, appID)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return err
			}

			log.AddLog("Get server with ID: "+serverid, "INFO")
			server := new(colonycore.Server)
			err = colonycore.Get(server, serverid)
			if err != nil {
				log.AddLog(err.Error(), "ERROR")
				return err
			}

			serverPathSeparator := p.GetServerPathSeparator(server)
			sourcePath := filepath.Join(EC_DATA_PATH, "widget", appID)
			destPath := strings.Join([]string{server.AppPath, "src", "widget"}, serverPathSeparator)

			if server.OS == "windows" {
				if strings.Contains(server.CmdExtract, "7z") || strings.Contains(server.CmdExtract, "zip") {
					err = copyFileToServer(server, sourcePath, destPath, appID, log)
					if err != nil {
						log.AddLog(err.Error(), "ERROR")
						return err
					}
				} else {
					message := "currently only zip/7z command which is supported"
					log.AddLog(message, "ERROR")
					return err
				}
			} else {
				if strings.Contains(server.CmdExtract, "tar") || strings.Contains(server.CmdExtract, "zip") {
					err = copyFileToServer(server, sourcePath, destPath, appID, log)
					if err != nil {
						log.AddLog(err.Error(), "ERROR")
						return err
					}
				} else {
					message := "currently only zip/tar command which is supported"
					log.AddLog(message, "ERROR")
					return err
				}
			}
		}
	}
	return nil
}
