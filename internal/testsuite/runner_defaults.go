package testsuite

import (
	"os"
	"strings"
	"time"
)

func DefaultOptions() Options {
	return Options{
		ConfigPath:  "config.json",
		AdminKey:    strings.TrimSpace(os.Getenv("DS2API_ADMIN_KEY")),
		OutputDir:   "artifacts/testsuite",
		Port:        0,
		Timeout:     120 * time.Second,
		Retries:     2,
		NoPreflight: false,
		MaxKeepRuns: 5,
	}
}
