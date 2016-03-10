package controller

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/colony-manager/helper"
	"github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/errorlib"
	. "github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sshclient"
	// "github.com/eaciit/toolkit"
	"io"
	"os"
	"path/filepath"
	"strconv"
	// "log"
	"bytes"
	"runtime"
	"strings"
	"time"
)

type FileBrowserController struct {
	App
}

const (
	USER        = "hdfs"
	SERVER_NODE = "node"
	SERVER_HDFS = "hdfs"
	DELIMITER   = "/"
)

func CreateFileBrowserController(s *knot.Server) *FileBrowserController {
	var controller = new(FileBrowserController)
	controller.Server = s
	return controller
}

func (s *FileBrowserController) GetServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	cursor, err := colonycore.Find(new(colonycore.Server), nil)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	data := []colonycore.Server{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}
	defer cursor.Close()

	return helper.CreateResult(true, data, "")
}

func (s *FileBrowserController) GetDir(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "FORM")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {

		var result []colonycore.FileInfo

		if server.ServerType == SERVER_NODE {
			if payload.Search != "" {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				// search in app-path
				listApp, err := sshclient.Search(setting, server.AppPath, true, payload.Search)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				resultApp, err := colonycore.ConstructFileInfo(listApp, server.AppPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				// search in data-path
				listData, err := sshclient.Search(setting, server.DataPath, true, payload.Search)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				resultData, err := colonycore.ConstructFileInfo(listData, server.DataPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				if len(resultApp) > 0 {
					resultApp = colonycore.ConstructSearchResult(resultApp, server.AppPath)
					result = append(result, resultApp...)
				}
				if len(resultData) > 0 {
					resultData = colonycore.ConstructSearchResult(resultData, server.DataPath)
					result = append(result, resultData...)
				}

			} else if payload.Path == "" {
				appFolder := colonycore.FileInfo{
					Name:       "APP",
					Path:       server.AppPath,
					IsDir:      true,
					IsEditable: false,
				}

				dataFolder := colonycore.FileInfo{
					Name:       "DATA",
					Path:       server.DataPath,
					IsDir:      true,
					IsEditable: false,
				}

				result = append(result, appFolder)
				result = append(result, dataFolder)
			} else {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				list, err := sshclient.List(setting, payload.Path, true)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				result, err = colonycore.ConstructFileInfo(list, payload.Path)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			}
		} else if server.ServerType == SERVER_HDFS {
			h := setHDFSConnection(server.Host, server.SSHUser)

			//check whether SourcePath type is directory or file
			if payload.Path == "" {
				payload.Path = "/"
			}
			res, err := h.List(payload.Path)
			if err != nil {
				return helper.CreateResult(false, nil, err.Error())
			}

			for _, files := range res.FileStatuses.FileStatus {
				var xNode colonycore.FileInfo

				xNode.Name = files.PathSuffix
				xNode.Size = float64(files.Length)
				xNode.Group = files.Group
				xNode.Permissions = files.Permission
				xNode.User = files.Owner
				xNode.Path = strings.Replace(payload.Path+"/", "//", "/", -1) + files.PathSuffix

				if files.Type == "FILE" {
					xNode.IsDir = false
				} else {
					xNode.IsDir = true

					if path == "/" {
						xNode.IsEditable = false
					} else {
						xNode.IsEditable = true
					}
				}

				result = append(result, xNode)
			}
		}

		return helper.CreateResult(true, result, "")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) GetContent(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			path := payload.Path
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				result, err := sshclient.Cat(setting, path)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, result, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.GetToLocal(path, server.AppPath, "")
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				//open downloaded hdfs file
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				result, err := sshclient.Cat(setting, path)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, result, "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) Edit(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" && payload.Contents != "" && payload.Permission != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				err = sshclient.MakeFile(setting, payload.Contents, payload.Path, payload.Permission, false)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				err = sshclient.MakeFile(setting, payload.Contents, payload.Path, payload.Permission, false)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				h := setHDFSConnection(server.Host, server.SSHUser)
				isDirectory := false
				SourcePath := payload.Path
				DestPath := filepath.Join(server.DataPath, "filebrowser", "temp")

				if !strings.Contains(strings.Split(SourcePath, "/")[len(SourcePath)-1], ".") {
					isDirectory = true
				}

				if isDirectory {
					_, emap := h.PutDir(SourcePath, DestPath)
					if emap != nil {
						for k, v := range emap {
							fmt.Sprintf("Error when create %v : %v \n", k, v)
						}
					}
				} else {
					err := h.Put(SourcePath, DestPath, "", nil)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
				}
				return helper.CreateResult(true, "", "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) NewFile(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeFile(setting, " ", payload.Path, "", false)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				//create file on local
				tempPath := strings.Replace(GetHomeDir()+"/", "//", "/", -1)

				if tempPath == "" {
					return helper.CreateResult(false, nil, "No Temporary Directory")
				}
				FileName := strings.Split(payload.Path, "/")[len(strings.Split(payload.Path, "/"))-1]

				file, err := os.Create(tempPath + FileName)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				defer file.Close()

				//put new file to hdfs
				err = h.Put(tempPath+FileName, strings.Replace(payload.Path+"/", "//", "/", -1), "", nil)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				//remove file on local
				err = os.Remove(tempPath + FileName)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, "", "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) NewFolder(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeDir(setting, payload.Path, "")

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				//create new directory on hdfs
				err = h.MakeDir(payload.Path, "")
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, "", "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) Delete(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				er := sshclient.Remove(setting, true, payload.Path)

				if er != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				errs := h.Delete(true, payload.Path)
				if errs != nil {
					if len(errs) > 0 {
						for _, err := range errs {
							return helper.CreateResult(false, nil, err.Error())
						}
					}
				}
				return helper.CreateResult(true, "", "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) Permission(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" && payload.Permission != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Chmod(setting, payload.Path, payload.Permission, true)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.SetPermission(payload.Path, payload.Permission)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func getMultipart(r *knot.WebContext, fileName string) (server colonycore.Server, payload colonycore.FileBrowserPayload, err error) {
	file, _, err := r.Request.FormFile(fileName)

	if err != nil {
		return
	}
	defer file.Close()

	payload.File = file

	var tmp map[string]interface{}
	_, s, err := r.GetPayloadMultipart(&tmp)

	if err != nil {
		return
	}

	payload.Path = s["path"][0]
	payload.ServerId = s["serverId"][0]
	payload.FileName = s["filename"][0]
	payload.FileSizes, _ = strconv.ParseInt(s["filesizes"][0], 10, 64)

	query := dbox.Eq("_id", payload.ServerId)

	cursor, err := colonycore.Find(new(colonycore.Server), query)
	if err != nil {
		return
	}

	data := []colonycore.Server{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return
	}
	defer cursor.Close()

	if len(data) != 0 {
		server = data[0]
	}

	return
}

func (s *FileBrowserController) Upload(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	server, payload, err := getMultipart(r, "myfiles")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" && payload.File != nil {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = setting.SshCopyByFile(payload.File, payload.FileSizes, 0666, payload.FileName, payload.Path)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)
				isDirectory := false
				SourcePath := payload.Path
				DestPath := filepath.Join(server.DataPath, "filebrowser", "temp")

				if !strings.Contains(strings.Split(SourcePath, "/")[len(SourcePath)-1], ".") {
					isDirectory = true
				}

				if isDirectory {
					_, emap := h.PutDir(SourcePath, DestPath)
					if emap != nil {
						for k, v := range emap {
							fmt.Sprintf("Error when create %v : %v \n", k, v)
						}
					}
				} else {
					err := h.Put(SourcePath, DestPath, "", nil)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
				}
				return helper.CreateResult(true, "", "")
			}
		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func (s *FileBrowserController) Download(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputHtml
	server, payload, err := getServer(r, "FORM")

	if err != nil {
		return ""
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				result, err := setting.SshGetFile(payload.Path)

				r.Writer.Header().Set("Content-Disposition", "attachment; filename='"+payload.Path[strings.LastIndex(payload.Path, DELIMITER)+1:]+"'")
				r.Writer.Header().Set("Content-Type", r.Writer.Header().Get("Content-Type"))
				r.Writer.Header().Set("Content-Length", strconv.Itoa(len(result.Bytes())))

				io.Copy(r.Writer, bytes.NewReader(result.Bytes()))

				return ""
			} else if server.ServerType == SERVER_HDFS {
				//get hdfs file to server.apppath
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.GetToLocal(payload.Path, server.AppPath, "")
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, "", "")
			}
		}
	}

	return ""
}

func (s *FileBrowserController) Rename(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" && payload.NewName != "" {
			newPath := payload.Path[:strings.LastIndex(payload.Path, DELIMITER)+1] + payload.NewName

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Rename(setting, payload.Path, newPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.Rename(payload.Path, newPath)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			}

		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func getServer(r *knot.WebContext, tp string) (server colonycore.Server, payload colonycore.FileBrowserPayload, err error) {
	if tp == "FORM" {
		err = r.GetForms(&payload)
	} else if tp == "PAYLOAD" {
		err = r.GetPayload(&payload)
	}

	if err != nil {
		return
	}

	if payload.ServerId == "" {
		err = errorlib.Error("", "", "getServer", "Please input serverId")
		return
	}

	query := dbox.Eq("_id", payload.ServerId)

	cursor, err := colonycore.Find(new(colonycore.Server), query)
	if err != nil {
		return
	}

	data := []colonycore.Server{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return
	}
	defer cursor.Close()

	if len(data) != 0 {
		server = data[0]
	}

	return
}

func sshConnect(payload *colonycore.Server) (sshclient.SshSetting, error) {
	client := sshclient.SshSetting{}
	client.SSHHost = payload.Host

	if payload.SSHType == "File" {
		client.SSHAuthType = sshclient.SSHAuthType_Certificate
		client.SSHKeyLocation = payload.SSHFile
	} else {
		client.SSHAuthType = sshclient.SSHAuthType_Password
		client.SSHUser = payload.SSHUser
		client.SSHPassword = payload.SSHPass
	}

	_, err := client.Connect()

	return client, err
}

func setHDFSConnection(Server, User string) *WebHdfs {
	h, err := NewWebHdfs(NewHdfsConfig("http://192.168.0.223:50070", "hdfs"))
	if err != nil {
		fmt.Println(err.Error())
	}
	h.Config.TimeOut = 2 * time.Millisecond
	h.Config.PoolSize = 100
	return h
}

func GetHomeDir() string {
	if runtime.GOOS == "windows" {
		home := os.Getenv("HOMEDRIVE") + os.Getenv("HOMEPATH")
		if home == "" {
			home = os.Getenv("USERPROFILE")
		}
		return home
	}
	return os.Getenv("HOME")
}
