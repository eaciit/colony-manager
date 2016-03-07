package controller

import (
	// "encoding/json"
	// "errors"
	// "fmt"
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
	// "net/http"
	"os"
	"path/filepath"
	"strconv"
	// "log"
	// "bufio"
	// "io/ioutil"
	"bytes"
	"mime/multipart"
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

	if server.RecordID() != nil && payload != nil {
		path := ""
		search := ""

		if payload["path"] != nil {
			path = payload["path"].(string)
		}

		if payload["search"] != nil {
			search = payload["search"].(string)
		}

		var result []colonycore.FileInfo

		if server.ServerType == SERVER_NODE {
			if search != "" {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				// search in app-path
				listApp, err := sshclient.Search(setting, server.AppPath, true, search)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				resultApp, err := colonycore.ConstructFileInfo(listApp, server.AppPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				// search in data-path
				listData, err := sshclient.Search(setting, server.DataPath, true, search)

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

			} else if path == "" {
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

				list, err := sshclient.List(setting, path, true)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				result, err = colonycore.ConstructFileInfo(list, path)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			}
		} else if server.ServerType == SERVER_HDFS {
			h := setHDFSConnection(server.Host, server.SSHUser)

			//check whether SourcePath type is directory or file
			if path == "" {
				path = "/"
			}
			res, err := h.List(path)
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
				xNode.Path = strings.Replace(path+"/", "//", "/", -1) + files.PathSuffix

				if files.Type == "FILE" {
					xNode.IsDir = false
				} else {
					xNode.IsDir = true
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil {
			path := payload["path"].(string)
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil && payload["contents"] != nil && payload["permission"] != nil {
			path := payload["path"].(string)
			content := payload["contents"].(string)
			permission := payload["permission"].(string)

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				err = sshclient.MakeFile(setting, content, path, permission, false)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				err = sshclient.MakeFile(setting, content, path, permission, false)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				h := setHDFSConnection(server.Host, server.SSHUser)
				isDirectory := false
				SourcePath := path
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil {
			path := payload["path"].(string)
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeFile(setting, " ", path, "", false)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				//create file on local
				tempPath := strings.Replace(os.Getenv(server.AppPath)+"/", "//", "/", -1)

				if tempPath == "" {
					return helper.CreateResult(false, nil, "No Temporary Directory")
				}
				FileName := path

				file, err := os.Create(tempPath + FileName)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				defer file.Close()

				//put new file to hdfs
				err = h.Put(tempPath+FileName, strings.Replace(path+"/", "//", "/", -1)+FileName, "", nil)
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil {
			path := payload["path"].(string)
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeDir(setting, path, "")

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				//create new directory on hdfs
				err = h.MakeDir(path, "")
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil {
			path := payload["path"].(string)

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				er := sshclient.Remove(setting, true, path)

				if er != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				errs := h.Delete(true, path)
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil && payload["permission"] != nil {
			path := payload["path"].(string)
			permission := payload["permission"].(string)
			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Chmod(setting, path, permission, true)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.SetPermission(path, permission)
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

func getMultipart(r *knot.WebContext, fileName string) (server colonycore.Server, payload map[string]interface{}, err error) {
	payload = make(map[string]interface{})
	file, _, err := r.Request.FormFile(fileName)

	if err != nil {
		return
	}
	defer file.Close()

	payload["file"] = file

	var tmp map[string]interface{}
	_, s, err := r.GetPayloadMultipart(&tmp)

	if err != nil {
		return
	}

	payload["path"] = s["path"][0]
	payload["serverId"] = s["serverId"][0]
	payload["filename"] = s["filename"][0]
	payload["filesizes"] = s["filesizes"][0]

	serverId := payload["serverId"].(string)
	query := dbox.Eq("_id", serverId)

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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil && payload["file"] != nil {
			path := payload["path"].(string)
			file := payload["file"].(multipart.File)
			filename := payload["filename"].(string)
			size, _ := strconv.ParseInt(payload["filesizes"].(string), 10, 64)

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = setting.SshCopyByFile(file, size, 0666, filename, path)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)
				isDirectory := false
				SourcePath := path
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil {
			path := payload["path"].(string)

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				result, err := setting.SshGetFile(path)

				r.Writer.Header().Set("Content-Disposition", "attachment; filename='"+path[strings.LastIndex(path, DELIMITER)+1:]+"'")
				r.Writer.Header().Set("Content-Type", r.Writer.Header().Get("Content-Type"))
				r.Writer.Header().Set("Content-Length", strconv.Itoa(len(result.Bytes())))

				io.Copy(r.Writer, bytes.NewReader(result.Bytes()))

				return ""
			} else if server.ServerType == SERVER_HDFS {
				//get hdfs file to server.apppath
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.GetToLocal(path, server.AppPath, "")
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

	if server.RecordID() != nil && payload != nil {
		if payload["path"] != nil && payload["newname"] != nil {
			path := payload["path"].(string)
			newName := payload["newname"].(string)
			newPath := path[:strings.LastIndex(path, DELIMITER)+1] + newName

			if server.ServerType == SERVER_NODE {
				setting, err := sshConnect(&server)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Rename(setting, path, newPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.Host, server.SSHUser)

				err := h.Rename(path, newPath)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			}

		}

		return helper.CreateResult(false, nil, "Please check your param")
	}

	return helper.CreateResult(false, nil, "")
}

func getServer(r *knot.WebContext, tp string) (server colonycore.Server, payload map[string]interface{}, err error) {
	if tp == "FORM" {
		err = r.GetForms(&payload)
	} else if tp == "PAYLOAD" {
		err = r.GetPayload(&payload)
	}

	if err != nil {
		return
	}

	if payload["serverId"] == nil {
		err = errorlib.Error("", "", "getServer", "Please input serverId")
		return
	}

	serverId := payload["serverId"].(string)
	query := dbox.Eq("_id", serverId)

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
