import os
import asyncio
from pathlib import Path

class NetworkAgent:
    def __init__(self, servers=None):
        self.servers = servers or []
        # servers format: [{"name": "Server1", "host": "192.168.1.10", "share": "SharedFolder", "username": "user", "password": "pass"}]

    async def connect_and_list_files(self, server_name, remote_path="."):
        """Connects to a network server and lists files."""
        server = self._find_server(server_name)
        if not server:
            return {"error": f"Server '{server_name}' not found in configuration."}

        # For demo purposes, we'll use a simple SMB-like approach or local mapping
        # In a real scenario, you'd use smbprotocol or similar
        # Here we simulate or use a mounted path
        try:
            # Attempt to construct a UNC path or use a mounted drive
            # Windows UNC: \\\\host\\share\\path
            # For this demo, we'll assume the server is accessible via a mapped path or UNC
            unc_path = f"\\\\{server['host']}\\{server['share']}\\{remote_path}"
            
            # If the path exists (e.g., already mapped or accessible), list it
            if os.path.exists(unc_path):
                items = os.listdir(unc_path)
                files = []
                for item in items:
                    full_path = os.path.join(unc_path, item)
                    is_dir = os.path.isdir(full_path)
                    files.append({"name": item, "is_directory": is_dir})
                return {"server": server_name, "path": remote_path, "files": files}
            else:
                return {"error": f"Path '{unc_path}' is not accessible. Ensure the server is online and you have permissions."}
        except Exception as e:
            return {"error": f"Failed to access server: {str(e)}"}

    async def download_file(self, server_name, remote_path, local_dest):
        """Downloads a file from a network server to a local destination."""
        server = self._find_server(server_name)
        if not server:
            return {"error": f"Server '{server_name}' not found."}

        try:
            unc_path = f"\\\\{server['host']}\\{server['share']}\\{remote_path}"
            if os.path.exists(unc_path):
                # Ensure local destination directory exists
                os.makedirs(os.path.dirname(local_dest), exist_ok=True)
                # Copy file
                import shutil
                shutil.copy2(unc_path, local_dest)
                return {"success": True, "message": f"Downloaded '{remote_path}' to '{local_dest}'"}
            else:
                return {"error": f"Remote file '{remote_path}' not found on server '{server_name}'."}
        except Exception as e:
            return {"error": f"Failed to download file: {str(e)}"}

    def _find_server(self, server_name):
        for s in self.servers:
            if s.get("name", "").lower() == server_name.lower() or s.get("host") == server_name:
                return s
        return None

    def add_server(self, name, host, share, username="", password=""):
        self.servers.append({
            "name": name,
            "host": host,
            "share": share,
            "username": username,
            "password": password
        })
        print(f"[NetworkAgent] Added server: {name} ({host})")
