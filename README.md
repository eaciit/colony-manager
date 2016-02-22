# Colony Manager

Magic

### Dev Setup

After go-getting this project, please follow steps below.

 - `go get` these two projects
   + [github.com/eaciit/colony-core](github.com/eaciit/colony-core) 
   + [github.com/eaciit/colony-app](github.com/eaciit/colony-app)

 - Set these two environment variables 

 for windows:
   + `EC_APP_PATH`  => `%GOPATH%\src\github.com\eaciit\colony-app\app-root`
   + `EC_DATA_PATH` => `%GOPATH%\src\github.com\eaciit\colony-app\data-root`

 for unix/linux/darwin:
   + `EC_APP_PATH`  => `$GOPATH/src/github.com/eaciit/colony-app/app-root`
   + `EC_DATA_PATH` => `$GOPATH/src/github.com/eaciit/colony-app/data-root`

Run the app

```go
go run colony.go
```
