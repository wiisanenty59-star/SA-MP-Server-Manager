from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
import socket
import struct
import asyncio
from contextlib import asynccontextmanager

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'samp_admin')

db_client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client, db
    db_client = AsyncIOMotorClient(MONGO_URL)
    db = db_client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")
    yield
    db_client.close()
    print("Disconnected from MongoDB")

app = FastAPI(title="SAMP Admin Panel API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================

class ServerConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 7777
    rcon_password: str = ""

class Player(BaseModel):
    id: int
    name: str
    score: int = 0
    ping: int = 0

class OnlinePlayersResponse(BaseModel):
    players: List[Player]
    max_players: int
    server_name: str

class AdminUser(BaseModel):
    name: str
    level: int = Field(ge=1, le=5)
    added_at: Optional[datetime] = None

class Territory(BaseModel):
    id: int
    name: str
    owner_gang_id: int = -1
    income: int = 0
    level: int = 0

class Gang(BaseModel):
    gang_id: int
    name: str
    tag: str = ""
    color: str = "#FFFFFF"
    description: str = ""
    leader: str = ""
    total_kills: int = 0
    total_deaths: int = 0
    total_respect: int = 0
    members: int = 0
    territories_owned: int = 0

class GangUpdate(BaseModel):
    name: Optional[str] = None
    tag: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    leader: Optional[str] = None

class PlayerGangAssignment(BaseModel):
    player_name: str
    gang_id: int

class RankingEntry(BaseModel):
    rank: int
    name: str
    gang: str = "None"
    kills: int = 0
    deaths: int = 0
    level: int = 0
    respect: int = 0
    last_seen: str = ""

class RCONCommand(BaseModel):
    host: str
    port: int
    password: str
    command: str

class PlayerAction(BaseModel):
    player_id: Optional[int] = None
    player_name: Optional[str] = None
    action: str
    value: Optional[Any] = None

class ActivityLog(BaseModel):
    timestamp: datetime
    action: str
    details: str
    admin: str = "System"

# ============================================================
# RCON IMPLEMENTATION
# ============================================================

class SAMPRcon:
    def __init__(self, host: str, port: int, password: str):
        self.host = host
        self.port = port
        self.password = password
        self.sock = None

    def _pack_string(self, s: str) -> bytes:
        encoded = s.encode('utf-8')
        return struct.pack('<H', len(encoded)) + encoded

    def _send_packet(self, packet_type: str, data: bytes) -> bytes:
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.sock.settimeout(3.0)
            
            # SAMP packet format
            header = b'SAMP'
            ip_parts = [int(x) for x in self.host.split('.')]
            ip_bytes = bytes(ip_parts)
            port_bytes = struct.pack('<H', self.port)
            opcode = ord(packet_type)
            
            packet = header + ip_bytes + port_bytes + bytes([opcode]) + data
            
            self.sock.sendto(packet, (self.host, self.port))
            response, _ = self.sock.recvfrom(4096)
            
            return response[11:]  # Skip header
        except socket.timeout:
            raise HTTPException(status_code=504, detail="Server timeout")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"RCON error: {str(e)}")
        finally:
            if self.sock:
                self.sock.close()

    def get_info(self) -> dict:
        response = self._send_packet('i', b'')
        
        try:
            offset = 0
            password_protected = response[offset]
            offset += 1
            
            players = struct.unpack('<H', response[offset:offset+2])[0]
            offset += 2
            
            max_players = struct.unpack('<H', response[offset:offset+2])[0]
            offset += 2
            
            hostname_len = struct.unpack('<I', response[offset:offset+4])[0]
            offset += 4
            hostname = response[offset:offset+hostname_len].decode('utf-8', errors='ignore')
            offset += hostname_len
            
            gamemode_len = struct.unpack('<I', response[offset:offset+4])[0]
            offset += 4
            gamemode = response[offset:offset+gamemode_len].decode('utf-8', errors='ignore')
            
            return {
                "hostname": hostname,
                "players": players,
                "max_players": max_players,
                "gamemode": gamemode,
                "password_protected": bool(password_protected)
            }
        except:
            return {
                "hostname": "Unknown",
                "players": 0,
                "max_players": 0,
                "gamemode": "Unknown",
                "password_protected": False
            }

    def get_players(self) -> List[Dict]:
        response = self._send_packet('c', b'')
        
        try:
            offset = 0
            player_count = struct.unpack('<H', response[offset:offset+2])[0]
            offset += 2
            
            players = []
            for i in range(player_count):
                player_id = response[offset]
                offset += 1
                
                name_len = response[offset]
                offset += 1
                name = response[offset:offset+name_len].decode('utf-8', errors='ignore')
                offset += name_len
                
                score = struct.unpack('<I', response[offset:offset+4])[0]
                offset += 4
                
                ping = struct.unpack('<I', response[offset:offset+4])[0]
                offset += 4
                
                players.append({
                    "id": player_id,
                    "name": name,
                    "score": score,
                    "ping": ping
                })
            
            return players
        except:
            return []

    def send_rcon_command(self, command: str) -> str:
        password_data = self._pack_string(self.password)
        command_data = self._pack_string(command)
        data = password_data + command_data
        
        response = self._send_packet('x', data)
        
        try:
            response_len = struct.unpack('<H', response[0:2])[0]
            return response[2:2+response_len].decode('utf-8', errors='ignore')
        except:
            return "Command executed"

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# Server Status
@app.post("/api/server/status")
async def get_server_status(config: ServerConfig):
    try:
        rcon = SAMPRcon(config.host, config.port, config.rcon_password)
        info = rcon.get_info()
        return {
            "online": True,
            "hostname": info["hostname"],
            "players": info["players"],
            "max_players": info["max_players"],
            "gamemode": info["gamemode"],
            "password_protected": info["password_protected"]
        }
    except Exception as e:
        return {
            "online": False,
            "error": str(e)
        }

# Online Players
@app.post("/api/server/players")
async def get_online_players(config: ServerConfig):
    try:
        rcon = SAMPRcon(config.host, config.port, config.rcon_password)
        info = rcon.get_info()
        players = rcon.get_players()
        
        return {
            "players": players,
            "max_players": info["max_players"],
            "server_name": info["hostname"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# RCON Command
@app.post("/api/server/rcon")
async def send_rcon_command(cmd: RCONCommand):
    try:
        rcon = SAMPRcon(cmd.host, cmd.port, cmd.password)
        result = rcon.send_rcon_command(cmd.command)
        
        # Log the command
        await db.activity_logs.insert_one({
            "timestamp": datetime.now(timezone.utc),
            "action": "RCON Command",
            "details": cmd.command,
            "result": result
        })
        
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Player Actions
@app.post("/api/server/player-action")
async def player_action(config: ServerConfig, action_data: PlayerAction):
    try:
        rcon = SAMPRcon(config.host, config.port, config.rcon_password)
        
        command = ""
        if action_data.action == "kick":
            command = f"akick {action_data.player_id}"
        elif action_data.action == "ban":
            command = f"aban {action_data.player_id}"
        elif action_data.action == "givemoney":
            command = f"givemoney {action_data.player_id} {action_data.value}"
        elif action_data.action == "setlevel":
            command = f"setlevel {action_data.player_id} {action_data.value}"
        elif action_data.action == "setmoney":
            command = f"setmoney {action_data.player_id} {action_data.value}"
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        result = rcon.send_rcon_command(command)
        
        # Log the action
        await db.activity_logs.insert_one({
            "timestamp": datetime.now(timezone.utc),
            "action": action_data.action,
            "details": f"Player ID: {action_data.player_id}, Value: {action_data.value}",
            "result": result
        })
        
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admins Management
@app.get("/api/admins")
async def get_admins():
    admins = await db.admins.find({}, {"_id": 0}).to_list(length=100)
    return {"admins": admins}

@app.post("/api/admins")
async def add_admin(admin: AdminUser):
    admin_dict = admin.model_dump()
    admin_dict["added_at"] = datetime.now(timezone.utc)
    
    # Check if already exists
    existing = await db.admins.find_one({"name": admin.name})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    await db.admins.insert_one(admin_dict)
    
    # Log the action
    await db.activity_logs.insert_one({
        "timestamp": datetime.now(timezone.utc),
        "action": "Add Admin",
        "details": f"Added {admin.name} with level {admin.level}"
    })
    
    return {"success": True, "message": "Admin added"}

@app.delete("/api/admins/{name}")
async def remove_admin(name: str):
    result = await db.admins.delete_one({"name": name})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Log the action
    await db.activity_logs.insert_one({
        "timestamp": datetime.now(timezone.utc),
        "action": "Remove Admin",
        "details": f"Removed {name}"
    })
    
    return {"success": True, "message": "Admin removed"}

# Territories
@app.get("/api/territories")
async def get_territories():
    territories = await db.territories.find({}, {"_id": 0}).to_list(length=20)
    
    # Initialize with default territories if empty
    if not territories:
        default_territories = [
            {"id": i, "name": f"Territory {i+1}", "owner_gang_id": -1, "income": 0, "level": 0}
            for i in range(16)
        ]
        await db.territories.insert_many(default_territories)
        return {"territories": default_territories}
    
    return {"territories": territories}

@app.put("/api/territories/{territory_id}")
async def update_territory(territory_id: int, territory: Territory):
    result = await db.territories.update_one(
        {"id": territory_id},
        {"$set": territory.model_dump()},
        upsert=True
    )
    
    # Log the action
    await db.activity_logs.insert_one({
        "timestamp": datetime.now(timezone.utc),
        "action": "Update Territory",
        "details": f"Territory {territory_id}: {territory.name}"
    })
    
    return {"success": True, "message": "Territory updated"}

# Rankings
@app.get("/api/rankings")
async def get_rankings():
    rankings = await db.rankings.find({}, {"_id": 0}).sort("kills", -1).limit(100).to_list(length=100)
    return {"rankings": rankings}

@app.post("/api/rankings")
async def add_ranking(ranking: RankingEntry):
    await db.rankings.insert_one(ranking.model_dump())
    return {"success": True}

# ============================================================
# GANG MANAGEMENT
# ============================================================

DEFAULT_GANGS = [
    {"gang_id": 1, "name": "Kill 2 Survive", "tag": "K2S", "color": "#FF6D00", "description": "The most ruthless gang on the block. We don't run, we hunt.", "leader": "TeeWhy", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
    {"gang_id": 2, "name": "Shotgun Grove Crips", "tag": "SGC", "color": "#00E676", "description": "Grove Street. Home. Shotguns loaded, block secured.", "leader": "", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
    {"gang_id": 3, "name": "1-9 Ballas", "tag": "19B", "color": "#AA00FF", "description": "The 1-9 set. Purple reign in every hood we touch.", "leader": "", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
    {"gang_id": 4, "name": "Eastside Vagos Locos", "tag": "EVL", "color": "#FFD600", "description": "Eastside for life. Los Santos Vagos run the yellow line.", "leader": "", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
    {"gang_id": 5, "name": "Azteca Nation 13", "tag": "AN13", "color": "#00BCD4", "description": "Barrio Azteca. Thirteen forever. Blood in, blood out.", "leader": "", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
    {"gang_id": 6, "name": "Red Dragon Triads", "tag": "RDT", "color": "#D50000", "description": "The Dragon rises from the East. Silent and deadly.", "leader": "", "total_kills": 0, "total_deaths": 0, "total_respect": 0, "members": 0, "territories_owned": 0},
]

@app.get("/api/gangs")
async def get_gangs():
    gangs = await db.gangs.find({}, {"_id": 0}).to_list(length=50)
    if not gangs:
        await db.gangs.insert_many([g.copy() for g in DEFAULT_GANGS])
        gangs = DEFAULT_GANGS
    # Compute live stats for each gang
    for gang in gangs:
        member_count = await db.gang_members.count_documents({"gang_id": gang["gang_id"]})
        gang["members"] = member_count
        territory_count = await db.territories.count_documents({"owner_gang_id": gang["gang_id"]})
        gang["territories_owned"] = territory_count
        # Aggregate kills/deaths/respect from members
        members = await db.gang_members.find({"gang_id": gang["gang_id"]}, {"_id": 0}).to_list(length=200)
        gang["total_kills"] = sum(m.get("kills", 0) for m in members)
        gang["total_deaths"] = sum(m.get("deaths", 0) for m in members)
        gang["total_respect"] = sum(m.get("respect", 0) for m in members)
    return {"gangs": gangs}

@app.post("/api/gangs")
async def create_gang(gang: Gang):
    existing = await db.gangs.find_one({"gang_id": gang.gang_id})
    if existing:
        raise HTTPException(status_code=400, detail="Gang ID already exists")
    name_exists = await db.gangs.find_one({"name": gang.name})
    if name_exists:
        raise HTTPException(status_code=400, detail="Gang name already exists")
    await db.gangs.insert_one(gang.model_dump())
    await db.activity_logs.insert_one({"timestamp": datetime.now(timezone.utc), "action": "Create Gang", "details": f"Created {gang.name} [{gang.tag}]"})
    return {"success": True, "message": f"Gang '{gang.name}' created"}

@app.put("/api/gangs/{gang_id}")
async def update_gang(gang_id: int, update: GangUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.gangs.update_one({"gang_id": gang_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gang not found")
    await db.activity_logs.insert_one({"timestamp": datetime.now(timezone.utc), "action": "Update Gang", "details": f"Updated gang {gang_id}: {update_dict}"})
    return {"success": True, "message": "Gang updated"}

@app.delete("/api/gangs/{gang_id}")
async def delete_gang(gang_id: int):
    result = await db.gangs.delete_one({"gang_id": gang_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gang not found")
    await db.gang_members.update_many({"gang_id": gang_id}, {"$set": {"gang_id": -1}})
    await db.territories.update_many({"owner_gang_id": gang_id}, {"$set": {"owner_gang_id": -1}})
    await db.activity_logs.insert_one({"timestamp": datetime.now(timezone.utc), "action": "Delete Gang", "details": f"Deleted gang {gang_id}"})
    return {"success": True, "message": "Gang deleted"}

@app.get("/api/gangs/rankings")
async def get_gang_rankings():
    gangs = await db.gangs.find({}, {"_id": 0}).to_list(length=50)
    if not gangs:
        await db.gangs.insert_many([g.copy() for g in DEFAULT_GANGS])
        gangs = DEFAULT_GANGS
    rankings = []
    for gang in gangs:
        members = await db.gang_members.find({"gang_id": gang["gang_id"]}, {"_id": 0}).to_list(length=200)
        member_count = len(members)
        total_kills = sum(m.get("kills", 0) for m in members)
        total_deaths = sum(m.get("deaths", 0) for m in members)
        total_respect = sum(m.get("respect", 0) for m in members)
        total_money = sum(m.get("money", 0) for m in members)
        territories = await db.territories.count_documents({"owner_gang_id": gang["gang_id"]})
        kd_ratio = round(total_kills / max(total_deaths, 1), 2)
        score = (total_kills * 3) + (total_respect * 2) + (territories * 500) + (member_count * 50)
        rankings.append({
            "gang_id": gang["gang_id"],
            "name": gang["name"],
            "tag": gang["tag"],
            "color": gang["color"],
            "members": member_count,
            "total_kills": total_kills,
            "total_deaths": total_deaths,
            "kd_ratio": kd_ratio,
            "total_respect": total_respect,
            "total_money": total_money,
            "territories": territories,
            "score": score,
        })
    rankings.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(rankings):
        r["rank"] = i + 1
    return {"rankings": rankings}

# ============================================================
# GANG MEMBER MANAGEMENT
# ============================================================

@app.get("/api/gang-members")
async def get_gang_members(gang_id: Optional[int] = None):
    query = {} if gang_id is None else {"gang_id": gang_id}
    members = await db.gang_members.find(query, {"_id": 0}).to_list(length=500)
    return {"members": members}

@app.post("/api/gang-members/assign")
async def assign_player_to_gang(data: PlayerGangAssignment):
    existing = await db.gang_members.find_one({"player_name": data.player_name})
    if existing:
        await db.gang_members.update_one({"player_name": data.player_name}, {"$set": {"gang_id": data.gang_id}})
        action = "moved to"
    else:
        await db.gang_members.insert_one({"player_name": data.player_name, "gang_id": data.gang_id, "kills": 0, "deaths": 0, "respect": 0, "money": 0, "level": 1, "joined_at": datetime.now(timezone.utc).isoformat()})
        action = "added to"
    gang = await db.gangs.find_one({"gang_id": data.gang_id}, {"_id": 0})
    gang_name = gang["name"] if gang else f"Gang #{data.gang_id}"
    await db.activity_logs.insert_one({"timestamp": datetime.now(timezone.utc), "action": "Gang Assignment", "details": f"{data.player_name} {action} {gang_name}"})
    return {"success": True, "message": f"{data.player_name} {action} {gang_name}"}

@app.delete("/api/gang-members/{player_name}")
async def remove_player_from_gang(player_name: str):
    result = await db.gang_members.delete_one({"player_name": player_name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not in any gang")
    await db.activity_logs.insert_one({"timestamp": datetime.now(timezone.utc), "action": "Gang Removal", "details": f"{player_name} removed from gang"})
    return {"success": True, "message": f"{player_name} removed from gang"}

# Activity Logs
@app.get("/api/logs")
async def get_activity_logs(limit: int = 50):
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(length=limit)
    return {"logs": logs}

# Server Config
@app.get("/api/server/config")
async def get_server_config():
    config = await db.server_config.find_one({}, {"_id": 0})
    if not config:
        config = {"host": "127.0.0.1", "port": 7777, "rcon_password": ""}
    return config

@app.post("/api/server/config")
async def save_server_config(config: ServerConfig):
    await db.server_config.delete_many({})
    await db.server_config.insert_one(config.model_dump())
    return {"success": True, "message": "Configuration saved"}

# Stats
@app.get("/api/stats")
async def get_stats():
    total_admins = await db.admins.count_documents({})
    total_logs = await db.activity_logs.count_documents({})
    total_rankings = await db.rankings.count_documents({})
    total_gangs = await db.gangs.count_documents({})
    total_members = await db.gang_members.count_documents({})
    
    return {
        "total_admins": total_admins,
        "total_logs": total_logs,
        "total_rankings": total_rankings,
        "total_gangs": total_gangs,
        "total_members": total_members
    }

# ============================================================
# SERVER CONTROL
# ============================================================

import subprocess

class ServerControlRequest(BaseModel):
    action: str  # start, stop, restart, status

@app.post("/api/server/control")
async def server_control(request: ServerControlRequest):
    try:
        samp_server_path = "/app/samp-server/samp03"
        
        if request.action == "start":
            # Start server using supervisor or direct command
            result = subprocess.run(
                ["supervisorctl", "start", "samp-server"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0 or "already started" in result.stdout.lower():
                await db.activity_logs.insert_one({
                    "timestamp": datetime.now(timezone.utc),
                    "action": "Server Start",
                    "details": "SA-MP server started"
                })
                return {"success": True, "message": "Server started", "output": result.stdout}
            else:
                return {"success": False, "message": "Failed to start", "output": result.stderr}
                
        elif request.action == "stop":
            result = subprocess.run(
                ["supervisorctl", "stop", "samp-server"],
                capture_output=True,
                text=True,
                timeout=10
            )
            await db.activity_logs.insert_one({
                "timestamp": datetime.now(timezone.utc),
                "action": "Server Stop",
                "details": "SA-MP server stopped"
            })
            return {"success": True, "message": "Server stopped", "output": result.stdout}
            
        elif request.action == "restart":
            result = subprocess.run(
                ["supervisorctl", "restart", "samp-server"],
                capture_output=True,
                text=True,
                timeout=10
            )
            await db.activity_logs.insert_one({
                "timestamp": datetime.now(timezone.utc),
                "action": "Server Restart",
                "details": "SA-MP server restarted"
            })
            return {"success": True, "message": "Server restarted", "output": result.stdout}
            
        elif request.action == "status":
            result = subprocess.run(
                ["supervisorctl", "status", "samp-server"],
                capture_output=True,
                text=True,
                timeout=5
            )
            is_running = "RUNNING" in result.stdout
            return {
                "success": True, 
                "running": is_running,
                "status": result.stdout.strip(),
                "message": "Running" if is_running else "Stopped"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Command timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/server/logs")
async def get_server_logs(lines: int = 100):
    try:
        log_file = "/var/log/supervisor/samp-server.out.log"
        if not os.path.exists(log_file):
            return {"logs": "No logs available"}
        
        result = subprocess.run(
            ["tail", "-n", str(lines), log_file],
            capture_output=True,
            text=True
        )
        return {"logs": result.stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# FILE BROWSER & EDITOR
# ============================================================

import os
from pathlib import Path

# Base directory for file operations (SAMP server root)
SAMP_SERVER_DIR = os.environ.get('SAMP_SERVER_DIR', '/app/samp-server/samp03')

class FileBrowserRequest(BaseModel):
    path: Optional[str] = ""

class FileContentRequest(BaseModel):
    path: str
    content: Optional[str] = None

@app.post("/api/files/browse")
async def browse_files(request: FileBrowserRequest):
    try:
        base_path = Path(SAMP_SERVER_DIR)
        target_path = base_path / request.path
        
        # Security: Prevent directory traversal
        if not str(target_path.resolve()).startswith(str(base_path.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not target_path.exists():
            return {"files": [], "directories": [], "current_path": request.path}
        
        files = []
        directories = []
        
        for item in sorted(target_path.iterdir()):
            rel_path = str(item.relative_to(base_path))
            
            if item.is_file():
                files.append({
                    "name": item.name,
                    "path": rel_path,
                    "size": item.stat().st_size,
                    "modified": item.stat().st_mtime,
                    "extension": item.suffix
                })
            elif item.is_dir():
                directories.append({
                    "name": item.name,
                    "path": rel_path
                })
        
        return {
            "files": files,
            "directories": directories,
            "current_path": request.path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/read")
async def read_file(request: FileContentRequest):
    try:
        base_path = Path(SAMP_SERVER_DIR)
        target_file = base_path / request.path
        
        # Security check
        if not str(target_file.resolve()).startswith(str(base_path.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not target_file.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Read file content
        with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return {
            "path": request.path,
            "content": content,
            "size": target_file.stat().st_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/write")
async def write_file(request: FileContentRequest):
    try:
        base_path = Path(SAMP_SERVER_DIR)
        target_file = base_path / request.path
        
        # Security check
        if not str(target_file.resolve()).startswith(str(base_path.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create parent directories if needed
        target_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file content
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(request.content)
        
        # Log the action
        await db.activity_logs.insert_one({
            "timestamp": datetime.now(timezone.utc),
            "action": "File Edit",
            "details": f"Edited {request.path}"
        })
        
        return {"success": True, "message": f"File {request.path} saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/delete/{path:path}")
async def delete_file(path: str):
    try:
        base_path = Path(SAMP_SERVER_DIR)
        target_file = base_path / path
        
        # Security check
        if not str(target_file.resolve()).startswith(str(base_path.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if target_file.is_file():
            target_file.unlink()
        elif target_file.is_dir():
            import shutil
            shutil.rmtree(target_file)
        
        # Log the action
        await db.activity_logs.insert_one({
            "timestamp": datetime.now(timezone.utc),
            "action": "File Delete",
            "details": f"Deleted {path}"
        })
        
        return {"success": True, "message": "File deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# DOWNLOAD ENDPOINTS
# ============================================================

from fastapi.responses import StreamingResponse
import tarfile
import io
import tempfile

@app.get("/api/download/server-package")
async def download_server_package():
    """Download the complete SA-MP server as a tar.gz archive"""
    samp_dir = "/app/samp-server/samp03"
    if not os.path.exists(samp_dir):
        raise HTTPException(status_code=404, detail="SA-MP server directory not found")

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        tar.add(samp_dir, arcname="samp03")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/gzip",
        headers={"Content-Disposition": "attachment; filename=samp-server-package.tar.gz"}
    )

@app.get("/api/download/admin-package")
async def download_admin_package():
    """Download the web admin panel source as a tar.gz archive"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        # Backend
        backend_dir = "/app/backend"
        for item in ["server.py", "requirements.txt", ".env"]:
            fpath = os.path.join(backend_dir, item)
            if os.path.exists(fpath):
                tar.add(fpath, arcname=f"admin-panel/backend/{item}")
        # Frontend source
        frontend_dir = "/app/frontend"
        for item in ["package.json", "tailwind.config.js", "postcss.config.js"]:
            fpath = os.path.join(frontend_dir, item)
            if os.path.exists(fpath):
                tar.add(fpath, arcname=f"admin-panel/frontend/{item}")
        src_dir = os.path.join(frontend_dir, "src")
        if os.path.exists(src_dir):
            tar.add(src_dir, arcname="admin-panel/frontend/src")
        public_dir = os.path.join(frontend_dir, "public")
        if os.path.exists(public_dir):
            tar.add(public_dir, arcname="admin-panel/frontend/public")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/gzip",
        headers={"Content-Disposition": "attachment; filename=admin-panel-package.tar.gz"}
    )

@app.get("/api/download/install-script")
async def download_install_script():
    """Download the Ubuntu installation script"""
    script_path = "/app/install_samp_server.sh"
    if not os.path.exists(script_path):
        raise HTTPException(status_code=404, detail="Install script not found")

    with open(script_path, "r") as f:
        content = f.read()

    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/plain",
        headers={"Content-Disposition": "attachment; filename=install_samp_server.sh"}
    )

@app.get("/api/download/full-package")
async def download_full_package():
    """Download EVERYTHING - SA-MP server + Admin Panel + Install Script"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        # SA-MP server
        samp_dir = "/app/samp-server/samp03"
        if os.path.exists(samp_dir):
            tar.add(samp_dir, arcname="boyzinthehood/samp-server")
        # Backend
        backend_dir = "/app/backend"
        for item in ["server.py", "requirements.txt"]:
            fpath = os.path.join(backend_dir, item)
            if os.path.exists(fpath):
                tar.add(fpath, arcname=f"boyzinthehood/admin-panel/backend/{item}")
        # Frontend source
        frontend_dir = "/app/frontend"
        for item in ["package.json", "tailwind.config.js", "postcss.config.js"]:
            fpath = os.path.join(frontend_dir, item)
            if os.path.exists(fpath):
                tar.add(fpath, arcname=f"boyzinthehood/admin-panel/frontend/{item}")
        src_dir = os.path.join(frontend_dir, "src")
        if os.path.exists(src_dir):
            tar.add(src_dir, arcname="boyzinthehood/admin-panel/frontend/src")
        public_dir = os.path.join(frontend_dir, "public")
        if os.path.exists(public_dir):
            tar.add(public_dir, arcname="boyzinthehood/admin-panel/frontend/public")
        # Install script
        script_path = "/app/install_samp_server.sh"
        if os.path.exists(script_path):
            tar.add(script_path, arcname="boyzinthehood/install.sh")
        # Compile script
        compile_path = "/app/compile_gamemode.sh"
        if os.path.exists(compile_path):
            tar.add(compile_path, arcname="boyzinthehood/compile_gamemode.sh")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/gzip",
        headers={"Content-Disposition": "attachment; filename=boyzinthehood-full-package.tar.gz"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
