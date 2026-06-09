"""Vercel serverless function for paid translation."""

import os
import json
import http.client
from urllib.parse import urlparse


def handler(request):
    """Handle POST /api/translate"""
    if request.method != "POST":
        return {"statusCode": 405, "body": json.dumps({"error": "Method not allowed"})}

    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, AttributeError):
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON"})}

    text = body.get("text", "")
    target_lang = body.get("target_lang", "zh-CN")
    api_key = os.environ.get("LINGUAFLOW_API_KEY") or os.environ.get("OPENAI_API_KEY")
    api_base = os.environ.get("LINGUAFLOW_API_BASE", "https://api.openai.com/v1")
    model = os.environ.get("LINGUAFLOW_MODEL", "gpt-4o-mini")

    if not api_key:
        return {"statusCode": 500, "body": json.dumps({"error": "Server API key not configured"})}
    if not text.strip():
        return {"statusCode": 400, "body": json.dumps({"error": "Text is required"})}

    lang_names = {
        "zh-CN": "Simplified Chinese", "ja": "Japanese", "ko": "Korean",
        "es": "Spanish", "fr": "French", "de": "German",
        "pt-BR": "Brazilian Portuguese", "ru": "Russian",
    }

    system_prompt = (
        f"You are a professional technical document translator. "
        f"Translate the following Markdown content from English to {lang_names.get(target_lang, target_lang)}.\n"
        f"Rules:\n"
        f"1. Preserve ALL Markdown formatting: code blocks, inline code, headings, links, images, tables, lists.\n"
        f"2. Do NOT translate content inside code blocks or inline code.\n"
        f"3. Do NOT change URLs or file paths.\n"
        f"4. Keep technical terms accurate (API, CLI, SDK, JSON, etc. stay as-is).\n"
        f"5. Return ONLY the translated Markdown, nothing else."
    )

    try:
        parsed = urlparse(api_base.rstrip("/"))
        path = parsed.path.rstrip("/") + "/chat/completions"
        conn = http.client.HTTPSConnection(parsed.netloc) if parsed.scheme == "https" else http.client.HTTPConnection(parsed.netloc)
        
        payload = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text},
            ],
            "temperature": 0.3,
        })

        conn.request("POST", path, payload, {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        })

        resp = conn.getresponse()
        data = json.loads(resp.read().decode())
        conn.close()

        translated = data["choices"][0]["message"]["content"]

        return {"statusCode": 200, "body": json.dumps({"result": translated})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)[:200]})}