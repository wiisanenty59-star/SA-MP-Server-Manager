🎮 SA-MP Admin Panel API

A powerful backend API for managing a SA-MP (San Andreas Multiplayer) server.
Built with FastAPI, MongoDB, and RCON, this panel allows full server, player, gang, and file management.

🚀 Features
🔌 SA-MP RCON integration (server control & commands)
👥 Player management (kick, ban, give money, set level)
🏴 Gang system with stats and rankings
🗺️ Territory management
🛠️ Admin management system
📊 Live rankings & activity logs
📁 File browser & editor (server files)
📡 Server control (start, stop, restart via Supervisor)
💾 MongoDB persistence
📦 Downloadable server & admin packages
🧰 Tech Stack
Backend: FastAPI (Python)
Database: MongoDB (Motor async driver)
Server Control: Supervisor + subprocess
Communication: SA-MP RCON (UDP)
Container-ready: Supports Docker / containerized deployment
⚙️ Installation
1. Clone the repository
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
2. Install dependencies
pip install -r requirements.txt
3. Environment variables

Create a .env file:

MONGO_URL=mongodb://localhost:27017
DB_NAME=samp_admin
SAMP_SERVER_DIR=/app/samp-server/samp03
4. Run MongoDB

Make sure MongoDB is running:

sudo systemctl start mongod
5. Start the API server
uvicorn server:app --host 0.0.0.0 --port 8001
📡 API Endpoints Overview
🩺 Health
GET /api/health
🖥️ Server Status
POST /api/server/status
👥 Players
POST /api/server/players
⚡ RCON Command
POST /api/server/rcon
🎮 Player Actions
POST /api/server/player-action

Actions:

kick
ban
givemoney
setlevel
setmoney
🛡️ Admin Management
GET    /api/admins
POST   /api/admins
DELETE /api/admins/{name}
🏴 Gang System
GET    /api/gangs
POST   /api/gangs
PUT    /api/gangs/{gang_id}
DELETE /api/gangs/{gang_id}
👤 Gang Members
GET    /api/gang-members
POST   /api/gang-members/assign
DELETE /api/gang-members/{player_name}
🗺️ Territories
GET /api/territories
PUT /api/territories/{id}
📊 Stats & Rankings
GET  /api/stats
GET  /api/rankings
POST /api/rankings
GET  /api/gangs/rankings
📜 Logs
GET /api/logs
⚙️ Server Config
GET  /api/server/config
POST /api/server/config
🖥️ Server Control
POST /api/server/control

Actions:

start
stop
restart
status
📁 File Manager
POST   /api/files/browse
POST   /api/files/read
POST   /api/files/write
DELETE /api/files/delete/{path}
📦 Downloads
/api/download/server-package
/api/download/admin-package
/api/download/install-script
/api/download/full-package
🔐 Security Notes
Restrict RCON access (never expose publicly)
Use authentication for production deployments
Validate file paths (already protected in code)
Secure MongoDB with authentication
Use HTTPS in production
📂 Project Structure
backend/
├── server.py
├── requirements.txt
├── .env

frontend/
├── src/
├── public/
├── package.json
🧪 Example Request
curl -X POST http://localhost:8001/api/server/status \
-H "Content-Type: application/json" \
-d '{"host":"127.0.0.1","port":7777,"rcon_password":"yourpass"}'
🚀 Future Improvements
JWT Authentication
Role-based access control
Real-time WebSocket updates
Live chat / in-game chat viewer
UI dashboard (React / Vue)
Docker Compose setup
🤝 Contributing

Pull requests are welcome.
Open an issue before major changes.

📜 License

MIT License

🙌 Credits

Built for SA-MP server administration and automation.
