package controller

import (
	// "encoding/json"
	// // "errors"
	// "fmt"
	// "path/filepath"
	// "strings"
	// // "time"

	// "github.com/eaciit/colony-core/v0"
	// "github.com/eaciit/colony-manager/helper"
	// // "github.com/eaciit/dbox"
	// _ "github.com/eaciit/dbox/dbc/jsons"
	// "github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/live"
	// // "github.com/eaciit/sshclient"
	// "github.com/eaciit/toolkit"
	// // "golang.org/x/crypto/ssh"
)

// var (
// 	leSourcePath = filepath.Join(EC_DATA_PATH, "langenvironment", "Installer")
// )

// // const (
// // 	// os+arsitektur os+bahasa
// // 	SERVER_OS = ""
// // 	ARCH_OS   = ""
// // 	LANG      = ""
// // )

// type Langinstaller struct {
// 	server_os string
// 	arch_os   string
// 	lang      string
// }

// // var mapInstaller = map[string]Langinstaller{"linux": Langinstaller, "windows": Langinstaller}

type LangenvironmentController struct {
	App
}

func CreateLangenvironmentController(l *knot.Server) *LangenvironmentController {
	var controller = new(LangenvironmentController)
	controller.Server = l
	return controller
}

// func (l *LangenvironmentController) GetSampleDataForSetupLang() colonycore.LanguageEnvironmentPayload {
// 	// s := `[{ "ServerId": "vagrant-test1", "Lang": [ "go" ] }, { "ServerId": "vagrant-test2", "Lang": [ "go", "java" ] }]`
// 	s := `{ "ServerId": "test", "Lang": [ "go" ] }`

// 	r := colonycore.LanguageEnvironmentPayload{}
// 	err := json.Unmarshal([]byte(s), &r)
// 	if err != nil {
// 		fmt.Println(err)
// 	}

// 	return r
// }

// func (l *LangenvironmentController) Setup(r *knot.WebContext) interface{} {
// 	r.Config.OutputType = knot.OutputJson
// 	// payload := new(colonycore.Server)

// 	// var data []string
// 	// err := r.GetPayload(&data)
// 	// if err != nil {
// 	// 	return helper.CreateResult(false, nil, err.Error())
// 	// }
// 	data := l.GetSampleDataForSetupLang()
// 	fmt.Println(data.Lang)

// 	dataServers := new(colonycore.Server)
// 	err := colonycore.Get(dataServers, data.ServerId)
// 	if err != nil {
// 		fmt.Println(err)
// 	}
// 	serverPathSeparator := CreateApplicationController(l.Server).GetServerPathSeparator(dataServers)

// 	sshSetting, sshClient, err := CreateServerController(l.Server).SSHConnect(dataServers)
// 	if err != nil {
// 		fmt.Println(err)
// 	}
// 	defer sshClient.Close()

// 	var sourcePath string
// 	var destinationPath string

// 	pathstring := []string{dataServers.DataPath, "langenvironment", "installer", "golang"}
// 	// destinationPath := strings.Join([]string{dataServers.DataPath, "langenvironment", "installer", "golang"}, serverPathSeparator)

// 	if dataServers.OS == "linux" {
// 		if toolkit.HasMember(data.Lang, "go") {
// 			sourcePath = filepath.Join(leSourcePath, "golang", dataServers.OS, "go1.6.linux-amd64.tar.gz")
// 			destinationPath = strings.Join(append(pathstring, dataServers.OS), serverPathSeparator)
// 		}

// 		err = sshSetting.SshCopyByPath(sourcePath, destinationPath)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 		// tar -C /usr/local -zxvf go1.6.linux-amd64.tar.gz
// 		cmdExtractFile := fmt.Sprintf("tar -C %s -zxvf %s", "/home/vagrant/test/testextract", "go1.6.linux-amd64.tar.gz")
// 		_, err := sshSetting.GetOutputCommandSsh(cmdExtractFile)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 		setEnvPath := func() error {
// 			cmd1 := `sed -i '/export GOPATH/d' ~/.bashrc`
// 			sshSetting.GetOutputCommandSsh(cmd1)

// 			cmd2 := "echo 'export GOPATH=/home/vagrant/goproject' >> ~/.bashrc"
// 			sshSetting.GetOutputCommandSsh(cmd2)

// 			return nil
// 		}

// 		//new folder src, bin, pkg
// 		cmdMkdirBin := fmt.Sprintf(`mkdir -p "%s"`, "goproject/bin")
// 		_, err = sshSetting.GetOutputCommandSsh(cmdMkdirBin)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 		cmdMkdirPkg := fmt.Sprintf(`mkdir -p "%s"`, "goproject/pkg")
// 		_, err = sshSetting.GetOutputCommandSsh(cmdMkdirPkg)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 		cmdMkdirSrc := fmt.Sprintf(`mkdir -p "%s"`, "goproject/src")
// 		_, err = sshSetting.GetOutputCommandSsh(cmdMkdirSrc)
// 		if err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 		if err := setEnvPath(); err != nil {
// 			return helper.CreateResult(false, nil, err.Error())
// 		}

// 	}

// 	// for key, val := range data {
// 	// 	fmt.Println("key : ", key, "  :: ", val)
// 	// }

// 	return helper.CreateResult(true, data, "")
// }
