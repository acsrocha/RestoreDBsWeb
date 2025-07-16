// Adicione este código ao seu backend Go

package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
)

// Estrutura para configuração CORS
type CORSConfig struct {
	AllowedOrigins []string `json:"allowed_origins"`
	mu             sync.RWMutex
}

// Instância global da configuração CORS
var corsConfig = &CORSConfig{
	AllowedOrigins: []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"http://127.0.0.1:5173",
	},
}

// Middleware CORS dinâmico
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		
		corsConfig.mu.RLock()
		allowedOrigins := corsConfig.AllowedOrigins
		corsConfig.mu.RUnlock()
		
		// Verifica se a origem está permitida
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

// Handler para obter configuração CORS atual
func getCORSConfigHandler(w http.ResponseWriter, r *http.Request) {
	corsConfig.mu.RLock()
	config := map[string]interface{}{
		"allowed_origins": corsConfig.AllowedOrigins,
	}
	corsConfig.mu.RUnlock()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// Handler para atualizar configuração CORS
func updateCORSConfigHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var request struct {
		AllowedOrigins string `json:"allowed_origins"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	
	// Parse origins (separadas por vírgula)
	origins := strings.Split(request.AllowedOrigins, ",")
	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}
	
	// Atualiza configuração
	corsConfig.mu.Lock()
	corsConfig.AllowedOrigins = origins
	corsConfig.mu.Unlock()
	
	response := map[string]interface{}{
		"message": "CORS configuration updated successfully",
		"allowed_origins": origins,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Adicione estas rotas ao seu router principal:
/*
func setupRoutes() {
	// ... suas rotas existentes ...
	
	// Rotas para configuração CORS (protegidas por API Key)
	http.HandleFunc("/api/admin/cors/config", authMiddleware(getCORSConfigHandler))
	http.HandleFunc("/api/admin/cors/update", authMiddleware(updateCORSConfigHandler))
	
	// Aplique o middleware CORS a todas as rotas
	handler := corsMiddleware(http.DefaultServeMux)
	
	log.Println("Servidor iniciando na porta 8558...")
	log.Fatal(http.ListenAndServe(":8558", handler))
}
*/