package app

import (
	"net/http"

	"Deepseek2API/internal/config"
	"Deepseek2API/internal/server"
)

func NewHandler() http.Handler {
	app, err := server.NewApp()
	if err != nil {
		config.Logger.Error("[app] init failed", "error", err)
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			server.WriteUnhandledError(w, err)
		})
	}
	return app.Router
}
