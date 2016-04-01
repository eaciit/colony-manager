package controller

import (
	// "archive/zip"
	"encoding/json"
	// "errors"
	"fmt"
	"path/filepath"
	"strings"
	// "time"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	// "github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/live"
	// "github.com/eaciit/sshclient"
	// "github.com/eaciit/toolkit"
	// "golang.org/x/crypto/ssh"
)

var (
	leSourcePath = filepath.Join(EC_DATA_PATH, "langenvironment", "installer")
)

const (
	DESTINSTALL_PATH = "/usr/local/"
	SERVER_WIN       = "windows"
	SERVER_LINUX     = "linux"
	SERVER_OSX       = "osx"

	LANG_GO    = "go"
	LANG_JAVA  = "java"
	LANG_SCALA = "scala"

	INSTALLER_LINUX_GO = "go1.6.linux-x86_64.tar.gz"
)

type LangenvironmentController struct {
	App
}

func getArch(serverOS string, lang string, arch string) string {
	var result string
	if serverOS == SERVER_LINUX {
		if lang == LANG_GO {
			result = fmt.Sprintf("%s1.6.%s-%s.%s", LANG_GO, SERVER_LINUX, strings.TrimSpace(arch), "tar.gz")
		}
	} else if serverOS == SERVER_WIN {
		if lang == LANG_GO {
			result = fmt.Sprintf("%s1.6.%s-%s.%s", LANG_GO, SERVER_WIN, strings.TrimSpace(arch), "zip")
		}
	}

	return result
}

func CreateLangenvironmentController(l *knot.Server) *LangenvironmentController {
	var controller = new(LangenvironmentController)
	controller.Server = l
	return controller
}

func (l *LangenvironmentController) GetSampleDataForSetupLang() colonycore.LanguageEnvironmentPayload {
	// s := `[{ "ServerId": "vagrant-test1", "Lang": [ "go" ] }, { "ServerId": "vagrant-test2", "Lang": [ "go", "java" ] }]`
	s := `{ "ServerId": "test", "Lang": "go" }`

	r := colonycore.LanguageEnvironmentPayload{}
	err := json.Unmarshal([]byte(s), &r)
	if err != nil {
		fmt.Println(err)
	}

	return r
}

func (le *LangenvironmentController) GetLanguage(r *knot.WebContext) interface{} {
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
	// fmt.Println(data)
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (l *LangenvironmentController) SetupFromSH(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := l.GetSampleDataForSetupLang()

	dataServers := new(colonycore.Server)
	err := colonycore.Get(dataServers, payload.ServerId)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	serverPathSeparator := CreateApplicationController(l.Server).GetServerPathSeparator(dataServers)

	sshSetting, sshClient, err := CreateServerController(l.Server).SSHConnect(dataServers)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer sshClient.Close()

	dataLanguage := []colonycore.LanguageEnviroment{}
	cursor, err := colonycore.Find(new(colonycore.LanguageEnviroment), dbox.Eq("language", payload.Lang))
	cursor.Fetch(&dataLanguage, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()
	fmt.Println(dataLanguage)
	if cursor.Count() > 0 {
		for _, eachLang := range dataLanguage {
			var sourcePath string
			var destinationPath string
			var pathstring []string

			if eachLang.Language == LANG_GO {
				pathstring = []string{dataServers.DataPath, "langenvironment", "installer", LANG_GO}

				sourcePath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, INSTALLER_LINUX_GO)
				destinationPath = strings.Join(append(pathstring, dataServers.OS), serverPathSeparator)
			}
			installShPath := filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "install.sh")

			pathstring = append(pathstring, dataServers.OS)
			installShdestPath := strings.Join(append(pathstring, "install.sh"), serverPathSeparator)
			installFilePath := strings.Join(append(pathstring, INSTALLER_LINUX_GO), serverPathSeparator)

			// compressPath := filepath.Join(leSourcePath)
			// err = toolkit.TarCompress(compressPath, filepath.Join(compressPath, fmt.Sprintf("%s.tar", dataServers.OS)))
			// if err != nil {
			// 	fmt.Println(err)
			// }

			err = sshSetting.SshCopyByPath(sourcePath, destinationPath)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			err = sshSetting.SshCopyByPath(installShPath, destinationPath)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			//sed -i 's/^M//' install.sh
			cmdSedInstall := fmt.Sprintf("sed -i 's/\r//g' %s", installShdestPath)
			_, err = sshSetting.GetOutputCommandSsh(cmdSedInstall)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			// // chmod +x install.sh
			cmdChmodCli := fmt.Sprintf("chmod -x %s", installShdestPath)
			_, err = sshSetting.GetOutputCommandSsh(cmdChmodCli)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			// // sh install.sh installFilePath DESTINSTALL_PATH projectpath
			cmdShCli := fmt.Sprintf("bash %s %s %s %s", installShdestPath, installFilePath, DESTINSTALL_PATH, "goproject")
			fmt.Println("sh command :: ", cmdShCli)
			_, err = sshSetting.GetOutputCommandSsh(cmdShCli)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

		}
	}

	return helper.CreateResult(true, payload, "")
}
