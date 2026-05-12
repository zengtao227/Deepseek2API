package accounts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"

	"Deepseek2API/internal/config"
)

func (h *Handler) listAccounts(w http.ResponseWriter, r *http.Request) {
	page := intFromQuery(r, "page", 1)
	pageSize := intFromQuery(r, "page_size", 10)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 1
	}
	if pageSize > 5000 {
		pageSize = 5000
	}
	accounts := h.Store.Snapshot().Accounts
	reverseAccounts(accounts)
	q := strings.TrimSpace(strings.ToLower(r.URL.Query().Get("q")))
	if q != "" {
		filtered := make([]config.Account, 0, len(accounts))
		for _, acc := range accounts {
			id := strings.ToLower(acc.Identifier())
			if strings.Contains(id, q) ||
				strings.Contains(strings.ToLower(acc.Name), q) ||
				strings.Contains(strings.ToLower(acc.Remark), q) ||
				strings.Contains(strings.ToLower(acc.Email), q) ||
				strings.Contains(strings.ToLower(acc.Mobile), q) {
				filtered = append(filtered, acc)
			}
		}
		accounts = filtered
	}
	total := len(accounts)
	totalPages := 1
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
	}
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	items := make([]map[string]any, 0, end-start)
	for _, acc := range accounts[start:end] {
		testStatus, _ := h.Store.AccountTestStatus(acc.Identifier())
		token := strings.TrimSpace(acc.Token)
		items = append(items, map[string]any{
			"identifier":    acc.Identifier(),
			"name":          acc.Name,
			"remark":        acc.Remark,
			"email":         acc.Email,
			"mobile":        acc.Mobile,
			"proxy_id":      acc.ProxyID,
			"has_password":  acc.Password != "",
			"has_token":     token != "",
			"token_preview": maskSecretPreview(token),
			"test_status":   testStatus,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items, "total": total, "page": page, "page_size": pageSize, "total_pages": totalPages})
}

func (h *Handler) addAccount(w http.ResponseWriter, r *http.Request) {
	var req map[string]any
	_ = json.NewDecoder(r.Body).Decode(&req)
	acc := toAccount(req)
	if acc.Identifier() == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "需要 email 或 mobile"})
		return
	}
	err := h.Store.Update(func(c *config.Config) error {
		if acc.ProxyID != "" {
			if _, ok := findProxyByID(*c, acc.ProxyID); !ok {
				return fmt.Errorf("代理不存在")
			}
		}
		mobileKey := config.CanonicalMobileKey(acc.Mobile)
		for _, a := range c.Accounts {
			if acc.Email != "" && a.Email == acc.Email {
				return fmt.Errorf("邮箱已存在")
			}
			if mobileKey != "" && config.CanonicalMobileKey(a.Mobile) == mobileKey {
				return fmt.Errorf("手机号已存在")
			}
		}
		c.Accounts = append(c.Accounts, acc)
		return nil
	})
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
		return
	}
	h.Pool.Reset()
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "total_accounts": len(h.Store.Snapshot().Accounts)})
}

func (h *Handler) updateAccount(w http.ResponseWriter, r *http.Request) {
	identifier := chi.URLParam(r, "identifier")
	if decoded, err := url.PathUnescape(identifier); err == nil {
		identifier = decoded
	}

	var req map[string]any
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "invalid json"})
		return
	}
	name, nameOK := fieldStringOptional(req, "name")
	remark, remarkOK := fieldStringOptional(req, "remark")

	err := h.Store.Update(func(c *config.Config) error {
		for i, acc := range c.Accounts {
			if !accountMatchesIdentifier(acc, identifier) {
				continue
			}
			if nameOK {
				c.Accounts[i].Name = name
			}
			if remarkOK {
				c.Accounts[i].Remark = remark
			}
			return nil
		}
		return newRequestError("账号不存在")
	})
	if err != nil {
		if detail, ok := requestErrorDetail(err); ok {
			writeJSON(w, http.StatusNotFound, map[string]any{"detail": detail})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "total_accounts": len(h.Store.Snapshot().Accounts)})
}

func (h *Handler) deleteAccount(w http.ResponseWriter, r *http.Request) {
	identifier := chi.URLParam(r, "identifier")
	if decoded, err := url.PathUnescape(identifier); err == nil {
		identifier = decoded
	}
	err := h.Store.Update(func(c *config.Config) error {
		idx := -1
		for i, a := range c.Accounts {
			if accountMatchesIdentifier(a, identifier) {
				idx = i
				break
			}
		}
		if idx < 0 {
			return fmt.Errorf("账号不存在")
		}
		c.Accounts = append(c.Accounts[:idx], c.Accounts[idx+1:]...)
		return nil
	})
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"detail": err.Error()})
		return
	}
	h.Pool.Reset()
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "total_accounts": len(h.Store.Snapshot().Accounts)})
}

func (h *Handler) captureToken(w http.ResponseWriter, r *http.Request) {
	var req map[string]any
	_ = json.NewDecoder(r.Body).Decode(&req)
	email := strings.TrimSpace(fmt.Sprintf("%v", req["email"]))
	token := strings.TrimSpace(fmt.Sprintf("%v", req["token"]))
	if email == "" || token == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "需要 email 和 token"})
		return
	}
	if token == "<nil>" || email == "<nil>" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "需要有效的 email 和 token"})
		return
	}
	err := h.Store.Update(func(c *config.Config) error {
		for i, acc := range c.Accounts {
			if acc.Email == email {
				c.Accounts[i].Token = token
				c.Accounts[i].Password = ""
				return nil
			}
		}
		c.Accounts = append(c.Accounts, config.Account{
			Email: email,
			Token: token,
		})
		return nil
	})
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": err.Error()})
		return
	}
	h.Pool.Reset()
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "email": email, "message": "Token 已保存"})
}

// batchUpdateTokens 批量更新多个账户的 token
// POST /admin/accounts/batch-update-tokens
// Body: [{"email": "...", "token": "..."}, ...]
func (h *Handler) batchUpdateTokens(w http.ResponseWriter, r *http.Request) {
	var tokens []map[string]string
	if err := json.NewDecoder(r.Body).Decode(&tokens); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "请求格式错误: " + err.Error()})
		return
	}

	if len(tokens) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "至少需要一个 token"})
		return
	}

	// 验证所有 token
	for _, item := range tokens {
		email := strings.TrimSpace(item["email"])
		token := strings.TrimSpace(item["token"])
		if email == "" || token == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "每个项目都需要有效的 email 和 token"})
			return
		}
	}

	// 批量更新
	updated := 0
	added := 0
	err := h.Store.Update(func(c *config.Config) error {
		for _, item := range tokens {
			email := strings.TrimSpace(item["email"])
			token := strings.TrimSpace(item["token"])

			found := false
			for i, acc := range c.Accounts {
				if acc.Email == email {
					c.Accounts[i].Token = token
					c.Accounts[i].Password = "" // 清除密码，使用 token 模式
					updated++
					found = true
					break
				}
			}
			if !found {
				c.Accounts = append(c.Accounts, config.Account{
					Email: email,
					Token: token,
				})
				added++
			}
		}
		return nil
	})

	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"detail": "更新失败: " + err.Error()})
		return
	}

	h.Pool.Reset()
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": fmt.Sprintf("批量更新完成: 更新了 %d 个账户，新增了 %d 个账户", updated, added),
		"updated": updated,
		"added":   added,
		"total":   updated + added,
	})
}
