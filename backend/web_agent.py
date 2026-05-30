import os
import sys
import asyncio
import base64
import json
from pathlib import Path
from dotenv import load_dotenv
from playwright.async_api import async_playwright
try:
    from playwright_stealth import stealth_async
except ImportError:
    stealth_async = None
from google import genai
from google.genai import types

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
USE_VERTEX_AI = os.getenv("VERTEX_ENABLED", "").lower() in ("true", "1")
VERTEX_PROJECT = os.getenv("VERTEX_PROJECT")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", "us-central1")

if USE_VERTEX_AI:
    if not VERTEX_PROJECT:
        raise ValueError("VERTEX_PROJECT must be set when VERTEX_ENABLED=true")
    print(f"[CONFIG] Vertex AI mode — project={VERTEX_PROJECT}, uses OAuth/ADC")
elif not API_KEY:
    raise ValueError("Set GEMINI_API_KEY in .env or set VERTEX_ENABLED=true with OAuth/ADC")

SCREEN_WIDTH = 1440
SCREEN_HEIGHT = 900
MODEL_ID = "models/gemini-2.5-flash"
COOKIE_DIR = Path("browser_data")
COOKIE_DIR.mkdir(exist_ok=True)

BROWSER_TOOLS = [
    types.FunctionDeclaration(
        name="navigate",
        description="Navigate to a URL",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The full URL to navigate to"}
            },
            "required": ["url"]
        }
    ),
    types.FunctionDeclaration(
        name="click",
        description="Click at specific coordinates on the page",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "X coordinate to click"},
                "y": {"type": "integer", "description": "Y coordinate to click"}
            },
            "required": ["x", "y"]
        }
    ),
    types.FunctionDeclaration(
        name="type_text",
        description="Type text into an input field",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "X coordinate to click first"},
                "y": {"type": "integer", "description": "Y coordinate to click first"},
                "text": {"type": "string", "description": "Text to type"},
                "press_enter": {"type": "boolean", "description": "Press Enter after typing"}
            },
            "required": ["x", "y", "text"]
        }
    ),
    types.FunctionDeclaration(
        name="scroll",
        description="Scroll the page",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "direction": {"type": "string", "enum": ["down", "up", "right", "left"]},
                "amount": {"type": "integer", "description": "Scroll amount in pixels"}
            },
            "required": ["direction"]
        }
    ),
    types.FunctionDeclaration(
        name="wait",
        description="Wait for a specified number of seconds",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "seconds": {"type": "integer", "description": "Number of seconds to wait"}
            },
            "required": ["seconds"]
        }
    ),
    types.FunctionDeclaration(
        name="go_back",
        description="Go back to the previous page"
    ),
    types.FunctionDeclaration(
        name="extract_text",
        description="Extract visible text content from the current page",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "selector": {"type": "string", "description": "Optional CSS selector to extract specific content"}
            }
        }
    ),
    types.FunctionDeclaration(
        name="finish",
        description="Call this when the task is complete. Provide a summary of what was done.",
        parameters_json_schema={
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "Summary of what was accomplished"}
            },
            "required": ["summary"]
        }
    ),
]

class WebAgent:
    def __init__(self):
        if USE_VERTEX_AI:
            self.client = genai.Client(
                vertexai=True,
                project=VERTEX_PROJECT,
                location=VERTEX_LOCATION
            )
        else:
            self.client = genai.Client(api_key=API_KEY)
        self.browser = None
        self.context = None
        self.page = None
        self.cookie_file = COOKIE_DIR / "cookies.json"

    async def save_cookies(self):
        try:
            cookies = await self.context.cookies()
            with open(self.cookie_file, "w") as f:
                json.dump(cookies, f)
        except Exception as e:
            print(f"[WARN] Failed to save cookies: {e}")

    async def load_cookies(self):
        if self.cookie_file.exists():
            try:
                with open(self.cookie_file, "r") as f:
                    cookies = json.load(f)
                await self.context.add_cookies(cookies)
                print(f"[INFO] Loaded {len(cookies)} cookies.")
                return True
            except Exception as e:
                print(f"[WARN] Failed to load cookies: {e}")
        return False

    async def execute_tool(self, fn_name, args):
        print(f"[ACTION] {fn_name} {args}")
        result = {"success": True}

        try:
            if fn_name == "navigate":
                await self.page.goto(args["url"], wait_until="domcontentloaded", timeout=30000)
            elif fn_name == "click":
                await self.page.mouse.click(args["x"], args["y"])
            elif fn_name == "type_text":
                await self.page.mouse.click(args["x"], args["y"])
                # Select all and clear
                await self.page.keyboard.press("Control+A")
                await self.page.keyboard.press("Backspace")
                await self.page.keyboard.type(args["text"])
                if args.get("press_enter"):
                    await self.page.keyboard.press("Enter")
            elif fn_name == "scroll":
                dx, dy = 0, 0
                amount = args.get("amount", 600)
                d = args["direction"]
                if d == "down": dy = amount
                elif d == "up": dy = -amount
                elif d == "right": dx = amount
                elif d == "left": dx = -amount
                await self.page.mouse.wheel(dx, dy)
            elif fn_name == "wait":
                await asyncio.sleep(args["seconds"])
            elif fn_name == "go_back":
                await self.page.go_back()
            elif fn_name == "extract_text":
                selector = args.get("selector")
                if selector:
                    elements = await self.page.query_selector_all(selector)
                    texts = [await el.inner_text() for el in elements]
                    result["text"] = "\n".join(texts)
                else:
                    result["text"] = await self.page.evaluate("document.body.innerText")
                result["text"] = result["text"][:8000]
            elif fn_name == "finish":
                result["summary"] = args.get("summary", "")
            else:
                result = {"success": False, "error": f"Unknown tool: {fn_name}"}
        except Exception as e:
            result = {"success": False, "error": str(e)}

        await asyncio.sleep(0.5)
        return result

    async def run_task(self, prompt, update_callback=None):
        print(f"[START] WebAgent. Goal: {prompt}")
        final_response = "Agent finished without a final summary."

        async with async_playwright() as p:
            try:
                self.browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--disable-gpu",
                        "--window-size=1920,1080"
                    ]
                )
            except Exception as e:
                err = str(e)
                msg = "Web Agent failed to start."
                if "Executable doesn't exist" in err or "browser" in err.lower():
                    msg = ("Playwright browser not installed. "
                           "Run this command in your terminal:\n"
                           "  python -m playwright install chromium")
                else:
                    msg = f"Browser launch failed: {e}"
                print(f"[CRITICAL] {msg}")
                if update_callback:
                    await update_callback(None, msg)
                return f"[ERROR] {msg}"

            self.context = await self.browser.new_context(
                viewport={"width": SCREEN_WIDTH, "height": SCREEN_HEIGHT},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                locale="en-US",
                timezone_id="America/New_York"
            )

            if stealth_async:
                try:
                    await stealth_async(self.context)
                except Exception as e:
                    print(f"[WARN] Stealth failed (non-fatal): {e}")

            await self.load_cookies()
            self.page = await self.context.new_page()

            try:
                await self.page.goto("https://www.google.com", wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                print(f"[WARN] Initial navigation failed: {e}")

            tool = types.Tool(function_declarations=BROWSER_TOOLS)
            config = types.GenerateContentConfig(tools=[tool])

            try:
                screenshot_bytes = await self.page.screenshot(type="png")
            except Exception as e:
                print(f"[ERR] Screenshot failed: {e}")
                if update_callback:
                    await update_callback(None, f"Screenshot error: {e}")
                await self.browser.close()
                return f"[ERROR] Screenshot failed: {e}"

            if update_callback:
                encoded_image = base64.b64encode(screenshot_bytes).decode('utf-8')
                await update_callback(encoded_image, "Web Agent Initialized")

            # First turn: text-only prompt (no image — avoids SDK model capability check on Vertex AI)
            chat_history = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)]
                )
            ]

            MAX_TURNS = 30
            first_turn = True

            for turn in range(MAX_TURNS):
                print(f"\n--- Turn {turn + 1} ---")

                try:
                    response = await self.client.aio.models.generate_content(
                        model=MODEL_ID,
                        contents=chat_history,
                        config=config
                    )
                except Exception as e:
                    err_str = str(e)
                    print(f"[CRITICAL] API Error: {err_str}")
                    if "API_KEY_INVALID" in err_str or "API key not valid" in err_str:
                        msg = "Your API key is invalid."
                    elif "billing" in err_str.lower() or "quota" in err_str.lower() or "429" in err_str:
                        msg = ("This model requires billing. "
                               "Enable Generative Language API, link billing, and create an API key.")
                    elif "deadline" in err_str.lower() or "timeout" in err_str.lower():
                        msg = "API request timed out. Try a simpler task."
                    else:
                        msg = f"API Error: {err_str[:300]}"
                    print(f"[CRITICAL] {msg}")
                    if update_callback:
                        await update_callback(None, msg)
                    final_response = f"[ERROR] {msg}"
                    break

                if not response.candidates:
                    print("[WARN] No candidates returned.")
                    break

                candidate = response.candidates[0]
                if not candidate.content:
                    print("[WARN] Empty candidate content.")
                    break

                model_content = candidate.content
                chat_history.append(model_content)

                fc_parts = [p for p in model_content.parts if p.function_call]
                text_parts = [p for p in model_content.parts if p.text]

                for p in text_parts:
                    print(f"[AGENT] {p.text[:200]}")
                    final_response = p.text

                if not fc_parts:
                    if not any(p.function_call for p in model_content.parts):
                        print("[DONE] No function calls.")
                        if update_callback:
                            await update_callback(None, "Task Complete")
                        break
                    continue

                # Check for CAPTCHA before executing
                try:
                    page_text = await self.page.evaluate("document.body.innerText")
                    if "captcha" in page_text.lower() or "verify you are human" in page_text.lower():
                        print("[WARN] CAPTCHA detected.")
                        if update_callback:
                            await update_callback(None, "CAPTCHA blocked automation")
                        break
                except:
                    pass

                function_responses = []
                actions_log = []

                for p in fc_parts:
                    fc = p.function_call
                    tool_result = await self.execute_tool(fc.name, fc.args)
                    actions_log.append(fc.name)
                    function_responses.append(
                        types.Part.from_function_response(
                            name=fc.name,
                            response=tool_result
                        )
                    )

                # Take screenshot after actions
                try:
                    screenshot_bytes = await self.page.screenshot(type="png")
                except:
                    print("[ERR] Screenshot failed after action")
                    break

                if update_callback:
                    encoded_image = base64.b64encode(screenshot_bytes).decode('utf-8')
                    await update_callback(encoded_image, f"Executed: {', '.join(actions_log)}")

                # Send screenshot as user content (separate from function responses)
                screenshot_part = types.Part.from_bytes(data=screenshot_bytes, mime_type="image/png")
                chat_history.append(types.Content(role="user", parts=[screenshot_part]))
                # Send function responses as tool content
                chat_history.append(types.Content(role="tool", parts=function_responses))

            try:
                await self.save_cookies()
                await self.browser.close()
                print("[CLOSE] Browser closed.")
            except:
                pass

            return final_response


if __name__ == "__main__":
    agent = WebAgent()
    asyncio.run(agent.run_task("Go to google.com and search for 'Gemini API' pricing."))
