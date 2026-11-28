#!/usr/bin/env python3
"""ClassGuard status check, run every 10 minutes by GitHub Actions (.github/workflows/status.yml in the releases repo).
Posts to Discord #status when something stops working, and again when it's fixed. State is kept between runs in
.status/state.json (GitHub Actions cache). The webhook address comes from the DISCORD_STATUS_WEBHOOK secret."""
import json, os, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

SITE = "https://class-guard.github.io/classguard-releases/"
LATEST = "https://github.com/Class-Guard/classguard-releases/releases/latest/download/"
SUPABASE = "https://lygaythvmuqscdfpjnfk.supabase.co"
ANON = "sb_publishable_lb8X5WE6tg63BF6RMEL_Gw_JoV-UsNj"   # the public (publishable) key, as in the apps and website
STATE = Path(".status/state.json")

def fetch(url, method="GET", headers=None, body=None):
    req = urllib.request.Request(url, method=method, data=body, headers={"User-Agent": "ClassGuard-Status", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=20) as r: return r.status, r.read(200_000)
    except urllib.error.HTTPError as e: return e.code, b""

def feed(platform):
    code, body = fetch(LATEST + f"{platform}-update.json")
    return code == 200 and json.loads(body).get("build", 0) > 0

CHECKS = {
    "Website": lambda: (lambda r: r[0] == 200 and b"ClassGuard" in r[1])(fetch(SITE)),
    "Parent page": lambda: fetch(SITE + "parent.html")[0] == 200,
    "Mac update checks": lambda: feed("mac"),
    "Windows update checks": lambda: feed("windows"),
    "Windows download": lambda: fetch(LATEST + "ClassGuard-Setup.exe", "HEAD")[0] == 200,
    "Account service": lambda: fetch(f"{SUPABASE}/rest/v1/pricing?select=id", headers={"apikey": ANON})[0] == 200,
    "Sign-in and Pro": lambda: fetch(f"{SUPABASE}/functions/v1/entitlement", "POST", {"Content-Type": "application/json"}, b"{}")[0] in (401, 403),
}

def ok(check):
    for attempt in range(2):   # re-check once before calling something down
        try:
            if CHECKS[check](): return True
        except Exception: pass
        time.sleep(20)
    return False

def post(title, lines, color):
    hook = os.environ.get("DISCORD_STATUS_WEBHOOK")
    if not hook: print("(no webhook)", title, lines); return
    body = {"username": "ClassGuard Status", "avatar_url": SITE + "logo.png", "embeds": [{
        "author": {"name": "ClassGuard Status", "icon_url": SITE + "logo.png"}, "title": title, "color": color,
        "description": "\n".join(lines), "timestamp": datetime.now(timezone.utc).isoformat()}]}
    urllib.request.urlopen(urllib.request.Request(hook, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "ClassGuard-Status"}), timeout=20)

def main():
    before = json.loads(STATE.read_text()) if STATE.exists() else {}   # check -> unix time it went down
    now = int(time.time()); after = {}
    for check in CHECKS:
        if not ok(check): after[check] = before.get(check, now)
    broke = [c for c in after if c not in before]; fixed = [c for c in before if c not in after]
    if broke:
        post("Something isn't working", [f"🔴 **{c}** isn't working." for c in broke] +
             ["", "ClassGuard keeps blocking on everyone's computers. We're looking into it."], 0xF19A8F)
    if fixed:
        post("Fixed", [f"🟢 **{c}** is working again (down about {max(1, round((now - before[c]) / 60))} min)." for c in fixed], 0x7AD3A5)
    STATE.parent.mkdir(exist_ok=True); STATE.write_text(json.dumps(after))
    print("down:", ", ".join(after) or "nothing")

if __name__ == "__main__":
    main()
