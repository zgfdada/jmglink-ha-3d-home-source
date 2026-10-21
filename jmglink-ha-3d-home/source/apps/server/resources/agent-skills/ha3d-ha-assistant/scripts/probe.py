"""Read-only connection probe using the saved 3D Home provider configuration."""
import json
import os
import urllib.request

def main():
    base = os.environ.get("HA3D_URL", "http://127.0.0.1:8101").rstrip("/")
    request = urllib.request.Request(base + "/api/voice-assistant/test", method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    print(result.get("message", "连接测试完成"))

if __name__ == "__main__":
    main()
