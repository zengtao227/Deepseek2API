package handler

import (
	"net/http"
	"sync"

	"Deepseek2API/app"
)

var (
	once sync.Once
	h    http.Handler
)

func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		h = app.NewHandler()
	})
	h.ServeHTTP(w, r)
}
