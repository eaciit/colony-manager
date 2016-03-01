package controller

import (
	// "encoding/json"
	// "errors"
	// "fmt"
	// "github.com/eaciit/colony-core/v0"
	// "github.com/eaciit/colony-manager/helper"
	// "github.com/eaciit/dbox"
	_ "github.com/eaciit/dbox/dbc/jsons"
	"github.com/eaciit/knot/knot.v1"
	// "github.com/eaciit/toolkit"
	// "io"
	// "net/http"
	// "os"
	// "path/filepath"
	// "strconv"
	// "strings"
)

type FileBrowserController struct {
	App
}

func CreateFileBrowserController(s *knot.Server) *FileBrowserController {
	var controller = new(FileBrowserController)
	controller.Server = s
	return controller
}
