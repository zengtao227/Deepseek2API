package history

import "github.com/go-chi/chi/v5"

func RegisterRoutes(r chi.Router, h *Handler) {
	r.Get("/chat-history", h.getChatHistory)
	r.Get("/chat-history/{id}", h.getChatHistoryItem)
	r.Delete("/chat-history", h.clearChatHistory)
	r.Delete("/chat-history/{id}", h.deleteChatHistoryItem)
	r.Put("/chat-history/settings", h.updateChatHistorySettings)
}
