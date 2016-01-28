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
	IncludeFiles []string = []string{"views/_head.html", "views/_loader.html"}
	AppBasePath  string   = "/"
)

func init() {
	AppBasePath, _ = os.Getwd()
	fmt.Println("Base Path ===> ", AppBasePath)
}
