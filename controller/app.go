package controller

import (
	"fmt"
	"github.com/eaciit/knot/knot.v1"
	"os"
)

type App struct {
	Server *knot.Server
}

var (
	LayoutFile   string   = "views/layout.html"
	IncludeFiles []string = []string{}
	AppViewPath  string   = "/"
)

func init() {
	AppViewPath, _ = os.Getwd()
	fmt.Println(AppViewPath)
}
