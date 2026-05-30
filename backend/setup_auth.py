"""Opens browser to authenticate with Google for Vertex AI access.
Run this once, then the app will use the saved credentials."""

import os, sys, json, webbrowser
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

# Find the OAuth client secret
possible_paths = [
    os.path.join(os.path.dirname(__file__), "..", "credentials.json"),
    os.path.join(os.path.dirname(__file__), "..", "client_secret_*.json"),
]
import glob
matches = glob.glob(os.path.join(os.path.dirname(__file__), "..", "client_secret_*.json"))
matches.append(os.path.join(os.path.dirname(__file__), "..", "credentials.json"))

json_file = None
for p in matches:
    if os.path.exists(p):
        json_file = p
        break

if not json_file:
    print("ERROR: No OAuth client secret file found.")
    print("Create one at: console.cloud.google.com/apis/credentials")
    print("-> + Create Credentials -> OAuth client ID -> Desktop app")
    print("Save the downloaded JSON file in the project root folder.")
    sys.exit(1)

print(f"Using OAuth file: {json_file}")
print("A browser will open for you to sign in with your Google account.")
print("Complete the login in the browser, then return here.")
print()

flow = InstalledAppFlow.from_client_secrets_file(json_file, SCOPES)
creds = flow.run_local_server(port=0, open_browser=True)

# Save to the well-known ADC path
adc_dir = os.path.join(os.environ.get("APPDATA", ""), "gcloud")
os.makedirs(adc_dir, exist_ok=True)
adc_path = os.path.join(adc_dir, "application_default_credentials.json")

with open(adc_path, "w") as f:
    json.dump(json.loads(creds.to_json()), f)

print(f"\nDONE! Credentials saved to: {adc_path}")
print("The google-genai SDK will auto-detect this when GOOGLE_GENAI_USE_VERTEXAI=true")
