package controller

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sshclient"
)

var (
	leSourcePath = filepath.Join(EC_DATA_PATH, "langenvironment", "installer")
)

const (
	DESTINSTALL_PATH = "/usr/local/"
	// DESTINSTALL_SCALA_PATH = "/usr/local/share/"
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

	dataServer, err := new(colonycore.Server).GetServerSSH()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

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
		// serverLang.ServerHost = each.Host
		serverLang.ServerHost = each.ID
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

	sshSetting, sshClient, err := dataServers.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer sshClient.Close()

	var query *dbox.Filter
	if payload.Lang == LANG_SCALA {
		var IsInstalled bool
		for _, eachLang := range dataServers.InstalledLang {
			if eachLang.Lang == LANG_JAVA {
				IsInstalled = eachLang.IsInstalled
				break
			}
		}
		if !IsInstalled {
			query = dbox.Or(dbox.Eq("language", LANG_JAVA), dbox.Eq("language", LANG_SCALA))
		} else {
			query = dbox.Eq("language", payload.Lang)
		}
	} else {
		query = dbox.Eq("language", payload.Lang)
	}

	dataLanguage := []colonycore.LanguageEnviroment{}
	cursor, err := colonycore.Find(new(colonycore.LanguageEnviroment), query)
	cursor.Fetch(&dataLanguage, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()
	if cursor.Count() > 0 {
		for _, eachLang := range dataLanguage {
			for _, dataInstaller := range eachLang.Installer {
				var sourcePath string
				var destinationPath string
				pathstring := []string{dataServers.DataPath, "langenvironment", "installer"}

				var installShPath, uninstallShPath string

				if strings.ToLower(dataServers.OS) == strings.ToLower(dataInstaller.OS) {
					// fmt.Println(ii, " : -- > ", eachLang.Language)
					targetLang := new(colonycore.InstalledLang)
					targetLang.Lang = eachLang.Language

					for _, eachLang := range dataServers.InstalledLang {
						if eachLang.Lang == targetLang.Lang {
							targetLang = eachLang
							break
						}
					}

					targetLang.IsInstalled = true

					if eachLang.Language == LANG_GO {
						pathstring = append(pathstring, LANG_GO)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "uninstall.sh")
					} else if eachLang.Language == LANG_JAVA {
						pathstring = append(pathstring, LANG_JAVA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, "uninstall.sh")
					} else if eachLang.Language == LANG_SCALA {
						pathstring = append(pathstring, LANG_SCALA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, "uninstall.sh")
					}
					installShdestPath := strings.Join(append(pathstring, "install.sh"), serverPathSeparator)
					uninstallShdestPath := strings.Join(append(pathstring, "uninstall.sh"), serverPathSeparator)
					installFilePath := strings.Join(append(pathstring, dataInstaller.InstallerSource), serverPathSeparator)

					err = sshSetting.SshCopyByPath(sourcePath, destinationPath)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					err = sshSetting.SshCopyByPath(installShPath, destinationPath)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					err = sshSetting.SshCopyByPath(uninstallShPath, destinationPath)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					//sed -i 's/^M//' install.sh
					cmdSedInstall := fmt.Sprintf("sed -i 's/\r//g' %s", installShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdSedInstall)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
					//sed -i 's/^M//' uninstall.sh
					cmdSedUninstall := fmt.Sprintf("sed -i 's/\r//g' %s", uninstallShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdSedUninstall)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					// // chmod +x install.sh
					cmdChmodCliInstall := fmt.Sprintf("chmod +x %s", installShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdChmodCliInstall)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
					// // chmod +x uninstall.sh
					cmdChmodCliUninstall := fmt.Sprintf("chmod +x %s", uninstallShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdChmodCliUninstall)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					// // sh install.sh installFilePath DESTINSTALL_PATH projectpath
					cmdShCli := fmt.Sprintf("bash %s %s %s", installShdestPath, installFilePath, DESTINSTALL_PATH)
					outputCmd, err := sshSetting.RunCommandSshAsMap(cmdShCli)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
					fmt.Println(" :: : ", outputCmd[0].Output)

					newInstalledLangs := []*colonycore.InstalledLang{}

					for _, each := range dataServers.InstalledLang {
						if each.Lang == targetLang.Lang {
							continue
						}

						newInstalledLangs = append(newInstalledLangs, each)
					}

					newInstalledLangs = append(newInstalledLangs, targetLang)
					dataServers.InstalledLang = newInstalledLangs
					colonycore.Save(dataServers)
				}
			}
		}
	}

	return helper.CreateResult(true, payload, "")
}

func (l *LangenvironmentController) UninstallLang(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

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

	sshSetting, sshClient, err := dataServers.Connect()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer sshClient.Close()

	var query *dbox.Filter
	if payload.Lang == LANG_SCALA {
		var IsInstalled bool
		for _, eachLang := range dataServers.InstalledLang {
			if eachLang.Lang == LANG_JAVA {
				IsInstalled = eachLang.IsInstalled
				break
			}
		}
		if !IsInstalled {
			query = dbox.Or(dbox.Eq("language", LANG_JAVA), dbox.Eq("language", LANG_SCALA))
		} else {
			query = dbox.Eq("language", payload.Lang)
		}
	} else {
		query = dbox.Eq("language", payload.Lang)
	}

	result, err := l.ProcessSetup(dataServers, query, serverPathSeparator, sshSetting)
	if err != nil {
		helper.CreateResult(false, nil, err.Error())
	}
	fmt.Println("result :: ", result)

	for _, eachLang := range dataServers.InstalledLang {
		if eachLang.Lang == payload.Lang {
			eachLang.IsInstalled = false
			break
		}
	}

	err = colonycore.Save(dataServers)
	if err != nil {
		helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, payload, "")
}
func (l *LangenvironmentController) ProcessSetup(dataServers *colonycore.Server, query *dbox.Filter, serverPathSeparator string, sshSetting sshclient.SshSetting) ([]sshclient.RunCommandResult, error) {
	outputCmd := []sshclient.RunCommandResult{}

	dataLanguage := []colonycore.LanguageEnviroment{}
	cursor, err := colonycore.Find(new(colonycore.LanguageEnviroment), query)
	cursor.Fetch(&dataLanguage, 0, false)
	if err != nil {
		return outputCmd, err
	}
	defer cursor.Close()

	if cursor.Count() > 0 {
		for _, eachLang := range dataLanguage {
			for _, dataInstaller := range eachLang.Installer {
				var sourcePath string
				var destinationPath string
				pathstring := []string{dataServers.DataPath, "langenvironment", "installer"}

				var installShPath, uninstallShPath string

				if strings.ToLower(dataServers.OS) == strings.ToLower(dataInstaller.OS) {
					// targetLang := new(colonycore.InstalledLang)
					// targetLang.Lang = eachLang.Language

					// for _, eachLang := range dataServers.InstalledLang {
					// 	if eachLang.Lang == targetLang.Lang {
					// 		targetLang = eachLang
					// 		break
					// 	}
					// }

					if eachLang.Language == LANG_GO {
						pathstring = append(pathstring, LANG_GO)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_GO, dataServers.OS, "uninstall.sh")
					} else if eachLang.Language == LANG_JAVA {
						pathstring = append(pathstring, LANG_JAVA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_JAVA, dataServers.OS, "uninstall.sh")
					} else if eachLang.Language == LANG_SCALA {
						pathstring = append(pathstring, LANG_SCALA)
						pathstring = append(pathstring, dataServers.OS)
						sourcePath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, dataInstaller.InstallerSource)
						destinationPath = strings.Join(pathstring, serverPathSeparator)
						installShPath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, "install.sh")
						uninstallShPath = filepath.Join(leSourcePath, LANG_SCALA, dataServers.OS, "uninstall.sh")
					}
					installShdestPath := strings.Join(append(pathstring, "install.sh"), serverPathSeparator)
					uninstallShdestPath := strings.Join(append(pathstring, "uninstall.sh"), serverPathSeparator)
					// installFilePath := strings.Join(append(pathstring, dataInstaller.InstallerSource), serverPathSeparator)

					err = sshSetting.SshCopyByPath(sourcePath, destinationPath)
					if err != nil {
						return outputCmd, err
					}

					err = sshSetting.SshCopyByPath(installShPath, destinationPath)
					if err != nil {
						return outputCmd, err
					}

					err = sshSetting.SshCopyByPath(uninstallShPath, destinationPath)
					if err != nil {
						return outputCmd, err
					}

					//sed -i 's/^M//' install.sh
					cmdSedInstall := fmt.Sprintf("sed -i 's/\r//g' %s", installShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdSedInstall)
					if err != nil {
						return outputCmd, err
					}
					//sed -i 's/^M//' uninstall.sh
					cmdSedUninstall := fmt.Sprintf("sed -i 's/\r//g' %s", uninstallShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdSedUninstall)
					if err != nil {
						return outputCmd, err
					}

					// // chmod +x install.sh
					cmdChmodCliInstall := fmt.Sprintf("chmod +x %s", installShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdChmodCliInstall)
					if err != nil {
						return outputCmd, err
					}
					// // chmod +x uninstall.sh
					cmdChmodCliUninstall := fmt.Sprintf("chmod +x %s", uninstallShdestPath)
					_, err = sshSetting.GetOutputCommandSsh(cmdChmodCliUninstall)
					if err != nil {
						return outputCmd, err
					}

					// // sh install.sh installFilePath DESTINSTALL_PATH projectpath
					cmdShCli := fmt.Sprintf("bash %s %s", uninstallShdestPath, DESTINSTALL_PATH)
					outputCmd, err = sshSetting.RunCommandSshAsMap(cmdShCli)
					if err != nil {
						return outputCmd, err
					}
					fmt.Println(" :: : ", outputCmd[0].Output)

					// targetLang.IsInstalled = true
					// dataServers.InstalledLang = append(dataServers.InstalledLang, targetLang)
					// colonycore.Save(dataServers)
				}
			}
		}
	}

	return outputCmd, nil
}
