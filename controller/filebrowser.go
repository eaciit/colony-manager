package controller

import (
	"fmt"
	"mime/multipart"

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
	//"path/filepath"
	"strconv"
	// "log"
	"bytes"
	"io/ioutil"
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

type ListDir struct {
	Dir      colonycore.FileInfo
	DirDepth int
}

func CreateFileBrowserController(s *knot.Server) *FileBrowserController {
	var controller = new(FileBrowserController)
	controller.Server = s
	return controller
}

func (s *FileBrowserController) GetServers(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson

	servers, err := new(colonycore.Server).GetByType()
	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	return helper.CreateResult(true, servers, "")
}

func (s *FileBrowserController) GetDir(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "FORM")
	fmt.Println(server)

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		var result []colonycore.FileInfo
		var tempResult []ListDir

		if server.ServerType == SERVER_NODE {
			if payload.Search != "" {
				setting, _, err := (&server).Connect()

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
				setting, _, err := (&server).Connect()

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
			fmt.Println("=----", server.ServiceHDFS)
			h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

			//check whether SourcePath type is directory or file
			var depth = 1
			var dir = ""
			var isComplete = false

			if payload.Path == "" {
				payload.Path = "/"
				dir = payload.Path
			}

			if payload.Search != "" {
				for !isComplete {
					if depth == 10 {
						isComplete = true
					}

					DepthList := GetDirbyDepth(tempResult, depth)
					depth++

					if len(DepthList) == 0 {
						if dir != "/" {
							isComplete = true
						} else {
							Dirs, _ := GetDirContent(dir, h)

							for _, singleDir := range Dirs {
								if singleDir.IsDir {
									var res ListDir
									res.Dir = singleDir
									res.DirDepth = depth
									tempResult = append(tempResult, res)
								}

								if strings.Contains(singleDir.Name, payload.Search) {
									result = append(result, singleDir)
								}
							}
						}
					} else {
						for _, singleDepthList := range DepthList {
							dir = singleDepthList.Dir.Path

							Dirs, _ := GetDirContent(dir, h)

							for _, singleDir := range Dirs {
								if singleDir.IsDir {
									var res ListDir
									res.Dir = singleDir
									res.DirDepth = depth
									tempResult = append(tempResult, res)
								}

								if strings.Contains(singleDir.Name, payload.Search) {
									result = append(result, singleDir)
								}
							}
						}
					}
				}
			} else {
				result, err = GetDirContent(payload.Path, h)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			}
		}

		return helper.CreateResult(true, result, "")
	}

	return helper.CreateResult(false, nil, "")
}

func GetDirContent(path string, h *WebHdfs) (Dirs []colonycore.FileInfo, err error) {
	res, err := h.List(path)
	if err != nil {
		return nil, err
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
			xNode.IsEditable = true
		} else {
			xNode.IsDir = true

			if path == "/" {
				xNode.IsEditable = false
			} else {
				xNode.IsEditable = true
			}
		}

		Dirs = append(Dirs, xNode)
	}

	return Dirs, err
}

func GetDirbyDepth(List []ListDir, depth int) (Dirs []ListDir) {
	for _, dir := range List {
		if dir.DirDepth == depth {
			Dirs = append(Dirs, dir)
		}
	}

	return Dirs
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
				setting, _, err := (&server).Connect()
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				result, err := sshclient.Cat(setting, path)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, result, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

				err := h.GetToLocal(path, strings.Replace(GetHomeDir()+"/", "//", "/", -1)+strings.Split(path, "/")[len(strings.Split(path, "/"))-1], "", (&server).ServiceHDFS.HostAlias)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				//open downloaded hdfs file
				result, err := ioutil.ReadFile(strings.Replace(GetHomeDir()+"/", "//", "/", -1) + strings.Split(path, "/")[len(strings.Split(path, "/"))-1])
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, string(result), "")
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
				setting, _, err := (&server).Connect()
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				err = sshclient.MakeFile(setting, payload.Contents, payload.Path, payload.Permission, false)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				DestPath := payload.Path
				SourcePath := strings.Replace(GetHomeDir()+"/", "//", "/", -1) + strings.Split(DestPath, "/")[len(strings.Split(DestPath, "/"))-1]
				err := ioutil.WriteFile(SourcePath, []byte(payload.Contents), 0755)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)
				err = h.Put(SourcePath, DestPath, "", map[string]string{"overwrite": "true"}, (&server).ServiceHDFS.HostAlias)
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

func (s *FileBrowserController) NewFile(r *knot.WebContext) interface{} {
	r.Config.OutputType = knot.OutputJson
	server, payload, err := getServer(r, "PAYLOAD")

	if err != nil {
		return helper.CreateResult(false, nil, err.Error())
	}

	if server.RecordID() != nil {
		if payload.Path != "" {
			if server.ServerType == SERVER_NODE {
				setting, _, err := (&server).Connect()
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeFile(setting, " ", payload.Path, "", false)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

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
				err = h.Put(tempPath+FileName, strings.Replace(payload.Path+"/", "//", "/", -1), "", nil, (&server).ServiceHDFS.HostAlias)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				//remove file on local
				// err = os.Remove(tempPath + FileName)
				// if err != nil {
				// 	return helper.CreateResult(false, nil, err.Error())
				// }
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
				setting, _, err := (&server).Connect()
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.MakeDir(setting, payload.Path, "")

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

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
				setting, _, err := (&server).Connect()
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				er := sshclient.Remove(setting, true, payload.Path)

				if er != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

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
				setting, _, err := (&server).Connect()

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Chmod(setting, payload.Path, payload.Permission, true)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

				permission, err := helper.ConstructPermission(payload.Permission)

				err = h.SetPermission(payload.Path, permission)
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

func getMultipart(r *knot.WebContext, fileName string) (server colonycore.ServerByType, payload colonycore.FileBrowserPayload, err error) {
	var tmp map[string]interface{}
	_, s, err := r.GetPayloadMultipart(&tmp)

	if err != nil {
		return
	}
	payload.ServerId = s["serverId"][0]
	payload.ServerType = s["serverType"][0]
	payload.Path = s["path"][0]

	err = r.Request.ParseMultipartForm(100000)
	if err != nil {
		return
	}

	m := r.Request.MultipartForm
	files := m.File[fileName]

	for key, _ := range files {
		var file multipart.File
		file, err = files[key].Open()
		defer file.Close()
		if err != nil {
			return
		}

		payload.File = append(payload.File, file)
		payload.FileName = append(payload.FileName, s["filename"][key])

		tmpSize, _ := strconv.ParseInt(s["filesizes"][key], 10, 64)
		payload.FileSizes = append(payload.FileSizes, tmpSize)
	}

	query := dbox.Eq("_id", payload.ServerId)

	cursor, err := colonycore.Find(new(colonycore.Server), query)
	if err != nil {
		return
	}

	data := []colonycore.ServerByType{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return
	}
	defer cursor.Close()

	if len(data) != 0 {
		server = data[0]
		server.ServerType = payload.ServerType
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
				setting, _, err := (&server).Connect()

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				for key, _ := range payload.File {
					err = setting.SshCopyByFile(payload.File[key], payload.FileSizes[key], 0666, payload.FileName[key], payload.Path)

					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}
				}

				return helper.CreateResult(true, nil, "")
			} else if server.ServerType == SERVER_HDFS {
				for key, _ := range payload.File {
					DestPath := strings.Replace(payload.Path+"/", "//", "/", -1) + payload.FileName[key]
					SourcePath := strings.Replace(GetHomeDir()+"/", "//", "/", -1) + payload.FileName[key]

					read, err := ioutil.ReadAll(payload.File[key])
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					err = ioutil.WriteFile(SourcePath, read, 0755)
					if err != nil {
						return helper.CreateResult(false, nil, err.Error())
					}

					h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

					err = h.Put(SourcePath, DestPath, "", nil, (&server).ServiceHDFS.HostAlias)
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
				setting, _, err := (&server).Connect()

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
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

				err := h.GetToLocal(payload.Path, strings.Replace(GetHomeDir()+"/", "//", "/", -1)+strings.Split(payload.Path, "/")[len(strings.Split(payload.Path, "/"))-1], "", (&server).ServiceHDFS.HostAlias)
				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				result, err := ioutil.ReadFile(strings.Replace(GetHomeDir()+"/", "//", "/", -1) + strings.Split(payload.Path, "/")[len(strings.Split(payload.Path, "/"))-1])

				r.Writer.Header().Set("Content-Disposition", "attachment; filename='"+strings.Replace(GetHomeDir()+"/", "//", "/", -1)+strings.Split(payload.Path, "/")[len(strings.Split(payload.Path, "/"))-1]+"'")
				r.Writer.Header().Set("Content-Type", r.Writer.Header().Get("Content-Type"))
				r.Writer.Header().Set("Content-Length", strconv.Itoa(len(result)))

				io.Copy(r.Writer, bytes.NewReader(result))

				//return helper.CreateResult(true, "", "")
				return ""
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
				setting, _, err := (&server).Connect()

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}

				err = sshclient.Rename(setting, payload.Path, newPath)

				if err != nil {
					return helper.CreateResult(false, nil, err.Error())
				}
			} else if server.ServerType == SERVER_HDFS {
				h := setHDFSConnection(server.ServiceHDFS.Host, server.ServiceHDFS.User)

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

func getServer(r *knot.WebContext, tp string) (server colonycore.ServerByType, payload colonycore.FileBrowserPayload, err error) {
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

	data := []colonycore.ServerByType{}
	err = cursor.Fetch(&data, 0, false)
	if err != nil {
		return
	}
	defer cursor.Close()

	if len(data) != 0 {
		server = data[0]
		server.ServerType = payload.ServerType
	}

	return
}

func setHDFSConnection(Server, User string) *WebHdfs {
	h, err := NewWebHdfs(NewHdfsConfig(Server, User))
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
