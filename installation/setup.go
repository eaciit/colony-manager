package setup

import (
	"fmt"
	"github.com/eaciit/colony-core/v0"
	"github.com/eaciit/toolkit"
)

func ACL() {
	var driver, host, db, user, pass string

	fmt.Println("Setup ACL database ==============")

	fmt.Print("  driver (mongo/json/csv/mysql) : ")
	fmt.Scanln(&driver)

	fmt.Print("  host (& port) : ")
	fmt.Scanln(&host)

	fmt.Print("  database name : ")
	fmt.Scanln(&db)

	fmt.Print("  username : ")
	fmt.Scanln(&user)

	fmt.Print("  password : ")
	fmt.Scanln(&pass)

	config := toolkit.M{}
	config.Set("driver", driver)
	config.Set("host", host)
	config.Set("db", db)
	config.Set("user", user)
	config.Set("pass", pass)

	fmt.Println("ACL Configuration saved!")
	colonycore.SetConfig(colonycore.CONF_DB_ACL, config)
}
