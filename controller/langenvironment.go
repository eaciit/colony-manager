package controller

import (
	"encoding/json"
	// "errors"
	"fmt"
	"path/filepath"
	"strings"
	// "time"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
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

// const (
// 	// os+arsitektur os+bahasa
// 	SERVER_OS = ""
// 	ARCH_OS   = ""
// 	LANG      = ""
// )
const (
	SERVER_WIN   = "windows"
	SERVER_LINUX = "linux"
	SERVER_OSX   = "osx"

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
	s := `{ "ServerId": "test", "Lang": [ "go" ] }`

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
	fmt.Println(data)
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (l *LangenvironmentController) Setup(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	payload := []*colonycore.LanguageEnvironmentPayload{}
	err := r.GetPayload(&payload)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	for _, each := range payload {
		dataServers := new(colonycore.Server)
		err := colonycore.Get(dataServers, each.ServerId)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		serverPathSeparator := CreateApplicationController(l.Server).GetServerPathSeparator(dataServers)

		sshSetting, sshClient, err := CreateServerController(l.Server).SSHConnect(dataServers)
		if err != nil {
			return helper.CreateResult(false, nil, err.Error())
		}
		defer sshClient.Close()

		var sourcePath string
		var destinationPath string
		var dataFile string
		var pathstring []string

		// destinationPath := strings.Join([]string{dataServers.DataPath, "langenvironment", "installer", "golang"}, serverPathSeparator)
		for _, eachDetail := range each.Lang {
			if dataServers.OS == SERVER_LINUX {
				cmdUnameM := fmt.Sprintf(`uname -m`)
				outArch, _ := sshSetting.GetOutputCommandSsh(cmdUnameM)

				if eachDetail == LANG_GO {
					pathstring = []string{dataServers.DataPath, "langenvironment", "installer", LANG_GO}

					dataFile = getArch(dataServers.OS, LANG_GO, outArch)
					sourcePath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, dataFile)
					destinationPath = strings.Join(append(pathstring, dataServers.OS), serverPathSeparator)
				}

				err = sshSetting.SshCopyByPath(sourcePath, destinationPath)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				// "/home/vagrant/test/testextract"
				cmdExtractFile := fmt.Sprintf("sudo tar -xvf %s -C %s", strings.Join([]string{destinationPath, dataFile}, serverPathSeparator), "/usr/local")
				_, err := sshSetting.GetOutputCommandSsh(cmdExtractFile)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				cmdChmodCli := fmt.Sprintf("sudo chmod -R 755 %s", "/usr/local/go")
				_, err = sshSetting.GetOutputCommandSsh(cmdChmodCli)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				setEnvPath := func() error {
					cmd1 := `sed -i '/export GOPATH/d' ~/.bashrc`
					sshSetting.GetOutputCommandSsh(cmd1)

					cmd2 := "echo 'export GOPATH=/home/vagrant/goproject' >> ~/.bashrc"
					sshSetting.GetOutputCommandSsh(cmd2)

					return nil
				}

				//new folder src, bin, pkg
				cmdMkdirBin := fmt.Sprintf(`mkdir -p "%s"`, "goproject/bin")
				_, err = sshSetting.GetOutputCommandSsh(cmdMkdirBin)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				cmdMkdirPkg := fmt.Sprintf(`mkdir -p "%s"`, "goproject/pkg")
				_, err = sshSetting.GetOutputCommandSsh(cmdMkdirPkg)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				cmdMkdirSrc := fmt.Sprintf(`mkdir -p "%s"`, "goproject/src")
				_, err = sshSetting.GetOutputCommandSsh(cmdMkdirSrc)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				if err := setEnvPath(); err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				//testing run build golang
				cmdMkdirtest := fmt.Sprintf(`mkdir -p "%s"`, "goproject/src/test")
				_, err = sshSetting.GetOutputCommandSsh(cmdMkdirtest)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				cmdTouch := "touch goproject/src/test/main.go"
				_, err = sshSetting.GetOutputCommandSsh(cmdTouch)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				cmdEcho := `echo -e 'package main\nimport "fmt"\nfunc main(){fmt.Println("hello world")}' >> goproject/src/test/main.go`
				_, err = sshSetting.GetOutputCommandSsh(cmdEcho)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				cmdRun := "go run goproject/src/test/main.go"
				_, err = sshSetting.GetOutputCommandSsh(cmdRun)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				// fmt.Println(" :::: ", outRunTest)
			}
		}
	}

	return helper.CreateResult(true, payload, "")
}
