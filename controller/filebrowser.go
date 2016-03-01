package controller

import (
	// "encoding/json"
	// "errors"
	"fmt"
	// "github.com/eaciit/colony-core/v0"
	// "github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	. "github.com/eaciit/hdc/hdfs"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/toolkit"
	// "io"
	// "net/http"
	"os"
	// "path/filepath"
	// "strconv"
	"strings"
	"time"
)

type FileBrowserController struct {
	App
}

const (
	USER = "hdfs"
)

func CreateFileBrowserController(s *knot.Server) *FileBrowserController {
	var controller = new(FileBrowserController)
	controller.Server = s
	return controller
}

func SetHDFSConnection(Server, User string) *WebHdfs {
	h, err := NewWebHdfs(NewHdfsConfig("http://192.168.0.223:50070", "hdfs"))
	if err != nil {
		fmt.Println(err.Error())
	}
	h.Config.TimeOut = 2 * time.Millisecond
	h.Config.PoolSize = 100
	return h
}

func (d *FileBrowserController) CreateNewFile(Server, FilePath, FileName string) error {
	var e error
	h := SetHDFSConnection(Server, USER)

	//create file on local
	tempPath := os.Getenv("HOME")

	if tempPath == "" {
		fmt.Println("No Home Directory")
	}

	file, e := os.Create(tempPath + "/" + FileName)
	if e != nil {
		fmt.Println(e)
	}
	defer file.Close()

	//put new file to hdfs
	e = h.Put(tempPath+"/"+FileName, FilePath+"/"+FileName, "", nil)
	if e != nil {
		fmt.Println(e)
	}

	//remove file on local
	e = os.Remove(tempPath + "/" + FileName)
	if e != nil {
		fmt.Println(e)
	}
	return e
}

func (d *FileBrowserController) CreateNewDirectory(Server, DirPath, Permission string) error {
	var e error
	h := SetHDFSConnection(Server, USER)

	//create new directory on hdfs
	e = h.MakeDir(DirPath, Permission)
	if e != nil {
		fmt.Println(e)
	}

	return e
}

func (d *FileBrowserController) List(Server, DirPath string) (*HdfsData, error) {
	var e error
	h := SetHDFSConnection(Server, USER)

	//check whether SourcePath type is directory or file
	res, e := h.List(DirPath)
	if e != nil {
		fmt.Println(e)
	}
	return res, e
}

func (d *FileBrowserController) Upload(Server, SourcePath, DestPath string) error {
	var retVal interface{}
	h := SetHDFSConnection(Server, USER)
	isDirectory := false

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
		retVal = emap
	} else {
		e := h.Put(SourcePath, DestPath, "", nil)
		if e != nil {
			fmt.Println(e)
		}
		retVal = e
	}
	return retVal.(error)
}

func (d *FileBrowserController) Download(Server, SourcePath, DestPath string) error {
	h := SetHDFSConnection(Server, USER)

	e := h.GetToLocal(SourcePath, DestPath, "")
	if e != nil {
		fmt.Println(e)
	}
	return e
}
