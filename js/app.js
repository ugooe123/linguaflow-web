const App = {
  state: {
    tab: "translate",
    apiKey: localStorage.getItem("lf_api_key") || "",
    apiBase: localStorage.getItem("lf_api_base") || "https://api.openai.com/v1",
    model: localStorage.getItem("lf_model") || "gpt-4o-mini",
    loading: false,
    result: null,
  },

  init() {
    this.restoreState();
    this.bindEvents();
    this.renderTabs();
  },

  restoreState() {
    if (this.state.apiKey) {
      document.getElementById("apiKey").value = this.state.apiKey;
    }
    document.getElementById("apiBase").value = this.state.apiBase;
    document.getElementById("model").value = this.state.model;
  },

  bindEvents() {
    // Tab switching
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    // Translate button
    document.getElementById("translateBtn").addEventListener("click", () => this.translate());

    // Copy result
    document.getElementById("copyBtn").addEventListener("click", () => this.copyResult());

    // Download result
    document.getElementById("downloadBtn").addEventListener("click", () => this.downloadResult());

    // Save settings
    document.getElementById("saveSettings").addEventListener("click", () => this.saveSettings());

    // File upload
    document.getElementById("fileInput").addEventListener("change", (e) => this.handleFile(e));
  },

  switchTab(tab) {
    this.state.tab = tab;
    this.renderTabs();
    document.querySelectorAll(".tab-content").forEach((el) => {
      el.style.display = el.id === `tab-${tab}` ? "block" : "none";
    });
  },

  renderTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === this.state.tab);
    });
  },

  handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("sourceText").value = ev.target.result;
    };
    reader.readAsText(file);
  },

  async translate() {
    const sourceText = document.getElementById("sourceText").value.trim();
    if (!sourceText) {
      this.showAlert("error", "请粘贴要翻译的内容");
      return;
    }

    const targetLang = document.getElementById("targetLang").value;
    const apiKey = document.getElementById("apiKey").value.trim();
    const apiBase = document.getElementById("apiBase").value.trim();
    const model = document.getElementById("model").value;

    const useMyKey = document.getElementById("useMyKey").checked;

    this.setLoading(true);
    document.getElementById("result").classList.remove("show");

    try {
      let result;

      if (useMyKey && apiKey) {
        // BYOK - translate directly from browser
        result = await this.translateWithKey(sourceText, targetLang, apiKey, apiBase, model);
      } else {
        // Paid translation via serverless
        result = await this.translatePaid(sourceText, targetLang);
      }

      this.state.result = result;
      document.getElementById("resultText").textContent = result;
      document.getElementById("result").classList.add("show");
      this.showAlert("success", "翻译完成！");
    } catch (err) {
      this.showAlert("error", "翻译失败: " + err.message);
    } finally {
      this.setLoading(false);
    }
  },

  async translateWithKey(text, targetLang, apiKey, apiBase, model) {
    const langNames = {
      "zh-CN": "Simplified Chinese", "zh-TW": "Traditional Chinese",
      "ja": "Japanese", "ko": "Korean", "es": "Spanish",
      "fr": "French", "de": "German", "pt-BR": "Brazilian Portuguese",
      "ru": "Russian", "ar": "Arabic", "vi": "Vietnamese",
      "th": "Thai", "id": "Indonesian", "hi": "Hindi",
      "it": "Italian", "nl": "Dutch", "tr": "Turkish",
    };

    const systemPrompt = `You are a professional technical document translator.
Translate the following Markdown content from English to ${langNames[targetLang] || targetLang}.
Rules:
1. Preserve ALL Markdown formatting: code blocks \`\`\`, inline code \`, headings ##, links [...](...), images ![alt](url), tables, lists, bold **, italic *, etc.
2. Do NOT translate content inside code blocks or inline code.
3. Do NOT change URLs or file paths.
4. Keep technical terms accurate (API, CLI, SDK, JSON, etc. stay as-is).
5. Return ONLY the translated Markdown, nothing else.`;

    const resp = await fetch(`${apiBase.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`API error (${resp.status}): ${err.slice(0, 200)}`);
    }

    const data = await resp.json();
    return data.choices[0].message.content;
  },

  async translatePaid(text, targetLang) {
    // TODO: implement paid translation via serverless function
    throw new Error("付费翻译功能即将上线。请先使用自带 API Key 模式（免费）。");
  },

  copyResult() {
    if (!this.state.result) return;
    navigator.clipboard.writeText(this.state.result).then(() => {
      this.showAlert("success", "已复制到剪贴板");
    });
  },

  downloadResult() {
    if (!this.state.result) return;
    const blob = new Blob([this.state.result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translated-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  saveSettings() {
    const apiKey = document.getElementById("apiKey").value.trim();
    const apiBase = document.getElementById("apiBase").value.trim();
    const model = document.getElementById("model").value;

    if (apiKey) localStorage.setItem("lf_api_key", apiKey);
    localStorage.setItem("lf_api_base", apiBase);
    localStorage.setItem("lf_model", model);

    this.showAlert("success", "设置已保存（本地）");
  },

  setLoading(loading) {
    this.state.loading = loading;
    const btn = document.getElementById("translateBtn");
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 翻译中...';
    } else {
      btn.disabled = false;
      btn.innerHTML = "🌍 开始翻译";
    }
  },

  showAlert(type, msg) {
    const alert = document.getElementById("alert");
    alert.className = `alert ${type}`;
    alert.textContent = msg;
    setTimeout(() => {
      if (alert.textContent === msg) {
        alert.className = "alert";
        alert.textContent = "";
      }
    }, 5000);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());