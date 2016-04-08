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
	s := `{ "ServerId": "localhost", "Lang": "go" }`

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

func (le *LangenvironmentController) GetServerLanguage(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	cursorServer, err := colonycore.Find(new(colonycore.Server), dbox.Eq("serverType", "node"))
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	dataServer := []colonycore.Server{}
	err = cursorServer.Fetch(&dataServer, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursorServer.Close()

	cursorLangEnc, err := colonycore.Find(new(colonycore.LanguageEnviroment), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	dataLangEnv := []colonycore.LanguageEnviroment{}
	err = cursorLangEnc.Fetch(&dataLangEnv, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursorLangEnc.Close()

	result := []*colonycore.ServerLanguage{}
	// result := []ServerLanguage{}

	for _, each := range dataServer {
		serverLang := new(colonycore.ServerLanguage)
		serverLang.ServerID = each.ID
		serverLang.ServerOS = each.OS
		serverLang.ServerHost = each.Host
		serverLang.Languages = []*colonycore.InstalledLang{}

		if each.InstalledLang == nil {
			each.InstalledLang = []*colonycore.InstalledLang{}
		}

		for _, eachLang := range dataLangEnv {
			var lang *colonycore.InstalledLang = nil
			for _, eachInstalledLang := range each.InstalledLang {
				if eachInstalledLang.Lang == eachLang.Language {
					lang = eachInstalledLang
					break
				}
			}

			if lang == nil {
				lang = new(colonycore.InstalledLang)
				lang.Lang = eachLang.Language
				lang.Version = ""
				lang.IsInstalled = false
			}

			serverLang.Languages = append(serverLang.Languages, lang)
		}

		result = append(result, serverLang)
	}

	return helper.CreateResult(true, result, "")
}

func (l *LangenvironmentController) SetupFromSH(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	// payload := l.GetSampleDataForSetupLang()

	payload := new(colonycore.LanguageEnvironmentPayload)
	err := r.GetPayload(payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	dataServers := new(colonycore.Server)
	err = colonycore.Get(dataServers, payload.ServerId)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	serverPathSeparator := CreateApplicationController(l.Server).GetServerPathSeparator(dataServers)
	// fmt.Println(" ::: ", dataServers)

	sshSetting, sshClient, err := dataServers.Connect()
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
			for _, dataInstaller := range eachLang.Installer {
				var sourcePath string
				var destinationPath string
				pathstring := []string{dataServers.DataPath, "langenvironment", "installer"}

				var installShPath string

				if strings.ToLower(dataServers.OS) == strings.ToLower(dataInstaller.OS) {
					if eachLang.Language == LANG_GO {
						pathstring = append(pathstring, LANG_GO)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "install.sh")
					} else if eachLang.Language == LANG_JAVA {
						pathstring = append(pathstring, LANG_JAVA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, "install.sh")
					} else if eachLang.Language == LANG_SCALA {
						pathstring = append(pathstring, LANG_SCALA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, "install.sh")
					}
					installShdestPath := strings.Join(append(pathstring, "install.sh"), serverPathSeparator)
					installFilePath := strings.Join(append(pathstring, dataInstaller.InstallerSource), serverPathSeparator)

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
					cmdShCli := fmt.Sprintf("bash %s %s %s", installShdestPath, installFilePath, DESTINSTALL_PATH)
					outputCmd, err := sshSetting.RunCommandSshAsMap(cmdShCli)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
					// fmt.Println(" --- > ", outputCmd)
					// fmt.Println("go run : ", outputCmd[0].CMD)
					fmt.Println(" :: : ", outputCmd[0].Output)
				}
			}
		}
	}

	return helper.CreateResult(true, payload, "")
}
