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
	IncludeFiles []string = []string{"views/_head.html", "views/_loader.html", "views/page-servers.html"}
	AppBasePath  string   = func(dir string, err error) string { return dir }(os.Getwd())
)

func init() {
	fmt.Println("Base Path ===> ", AppBasePath)
}
