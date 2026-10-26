import os, json
from dotenv import load_dotenv
ROOT = r"D:\assingment\ADA-V2-My-utmost-Creation"
load_dotenv(os.path.join(ROOT, ".env"))

def resolve(cwd):
    """Replicate server.py: SETTINGS_FILE is CWD-relative; then server.py:212-213 assigns
       the config onto audio_loop.email_agent with NO env fallback (plain assignment)."""
    os.chdir(cwd)
    sf = "settings.json"
    cfg = json.load(open(sf)).get("email_config", {}) if os.path.exists(sf) else {}
    # audio_loop.email_agent  -> server.py assigns these directly (no `or env` fallback)
    voice_email = cfg.get("email_address", "")
    voice_pass  = cfg.get("password", "")
    # manual panel -> server.py:297 creates EmailAgent(email_address=..., password=...)
    # EmailAgent.__init__ uses `x or os.getenv(...)` so it DOES fall back to .env
    panel_email = cfg.get("email_address", "") or os.getenv("EMAIL_ADDRESS")
    panel_pass  = cfg.get("password", "") or os.getenv("EMAIL_PASSWORD")
    return sf, cfg, voice_email, voice_pass, panel_email, panel_pass

for label, cwd in [("Electron launch (cwd=backend/)", os.path.join(ROOT,"backend")),
                   ("Manual run  (cwd=project root)", ROOT)]:
    sf, cfg, ve, vp, pe, pp = resolve(cwd)
    print(f"\n=== {label} ===")
    print(f"  settings file read : ./{sf}")
    print(f"  email_config        : {cfg}")
    print(f"  VOICE + PROACTIVE agent (server.py:212 plain assignment):")
    print(f"     address = {ve!r}")
    print(f"     password= {vp!r}")
    ok_v = bool(ve and vp)
    print(f"     -> ada.py:683 connect() runs? {ok_v}   (proactive monitor needs connected=True)")
    print(f"  MANUAL INBOX PANEL agent (EmailAgent ctor has `or os.getenv` fallback):")
    print(f"     address = {pe!r}")
    print(f"     password= {pp!r}")
    ok_p = bool(pe and pp)
    print(f"     -> credentials present? {ok_p}")
    if ok_p and " " in pp:
        print(f"     -> NOTE: password contains spaces -> IMAP/SMTP auth will FAIL")
