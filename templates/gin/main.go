package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Hello from Go Fiber app on Forge!",
			"status":  "ok",
		})
	})

	http.HandleFunc("/openapi.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"openapi": "3.0.0",
			"info": map[string]string{
				"title":   "Go Fiber API",
				"version": "1.0.0",
			},
			"paths": map[string]interface{}{
				"/": map[string]interface{}{
					"get": map[string]interface{}{
						"summary": "Root health check",
					},
				},
			},
		})
	})

	log.Printf("Server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
