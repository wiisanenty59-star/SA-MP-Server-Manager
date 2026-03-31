# 🎮 SA-MP Admin Panel API

A powerful backend API for managing a SA-MP (San Andreas Multiplayer) server. Built with Elixir and the Phoenix Framework, this panel provides full server, player, gang, and file management with high performance and real-time capabilities.

## 🚀 Features

- 🔌 SA-MP RCON integration (server control & commands)  
- 👥 Player management (kick, ban, give money, set level)  
- 🏴 Gang system with stats and rankings  
- 🗺️ Territory management  
- 🛠️ Admin management system  
- 📊 Live rankings & activity logs  
- 📁 File browser & editor (server files)  
- 📡 Server control (start, stop, restart via system supervisor)  
- ⚡ Real-time updates powered by Phoenix Channels / LiveView  
- 💾 Persistent storage (MongoDB or adaptable database layer)  
- 📦 Downloadable server & admin packages  

## 🧰 Tech Stack

- **Backend:** Elixir + Phoenix Framework  
- **Real-time:** Phoenix Channels / LiveView  
- **Database:** MongoDB (or adaptable to PostgreSQL)  
- **Concurrency:** BEAM VM (Erlang/Elixir runtime)  
- **Server Control:** System commands / supervisor  
- **Communication:** SA-MP RCON (UDP)  
- **Scalable & Fault-Tolerant:** Built on Erlang/BEAM architecture  

## ⚙️ Installation

### Clone the repository
```bash
git clone https://github.com/wiisanenty59-star/SA-MP-Server-Manager.git
cd YOUR-REPO
Install dependencies
mix deps.get
Setup environment

Create a .env or configure environment variables:

MONGO_URL=mongodb://localhost:27017
DB_NAME=samp_admin
SAMP_SERVER_DIR=/app/samp-server/samp03
Run database (MongoDB)
sudo systemctl start mongod
Start Phoenix server
mix phx.server

Or inside IEx:

iex -S mix phx.server
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
GET /api/admins
POST /api/admins
DELETE /api/admins/{name}
🏴 Gang System
GET /api/gangs
POST /api/gangs
PUT /api/gangs/{gang_id}
DELETE /api/gangs/{gang_id}
👤 Gang Members
GET /api/gang-members
POST /api/gang-members/assign
DELETE /api/gang-members/{player_name}
🗺️ Territories
GET /api/territories
PUT /api/territories/{id}
📊 Stats & Rankings
GET /api/stats
GET /api/rankings
POST /api/rankings
GET /api/gangs/rankings
📜 Logs
GET /api/logs
⚙️ Server Config
GET /api/server/config
POST /api/server/config
🖥️ Server Control
POST /api/server/control

Actions:

start
stop
restart
status
📁 File Manager
POST /api/files/browse
POST /api/files/read
POST /api/files/write
DELETE /api/files/delete/{path}
📦 Downloads
/api/download/server-package
/api/download/admin-package
/api/download/install-script
/api/download/full-package
🔐 Security Notes
Restrict RCON access (never expose publicly)
Implement authentication for production deployments
Validate all file paths
Secure database credentials
Use HTTPS in production
📂 Project Structure
lib/
├── your_app/
│   ├── web/
│   ├── contexts/
│   ├── services/
│   └── controllers/
├── your_app_web/
│   ├── controllers/
│   ├── channels/
│   ├── live/
│   └── router.ex

config/
├── config.exs

mix.exs
🧪 Example Request
curl -X POST http://localhost:4000/api/server/status \
-H "Content-Type: application/json" \
-d '{"host":"127.0.0.1","port":7777,"rcon_password":"yourpass"}'
🚀 Future Improvements
JWT Authentication
Role-based access control
Real-time WebSocket dashboards
Live chat / in-game chat viewer
Full UI dashboard using Phoenix LiveView
Docker & Docker Compose setup
SaaS scaling (multi-server support)
🔮 Future Direction

This project is actively evolving toward a full SaaS platform (RedBeam SaaS). Future updates may include:

⚙️ Migration to a fully Elixir-native architecture
☁️ Multi-tenant SaaS platform for managing multiple SA-MP servers
📡 Real-time distributed system using Phoenix PubSub
🔐 Advanced authentication, billing, and subscription systems
🧩 Plugin system for extending server functionality
🔄 Update Status

🚧 Elixir / Phoenix Rewrite Coming Soon
The current FastAPI version is being migrated to a high-performance Elixir + Phoenix architecture to support scalability, real-time updates, and SaaS expansion.

🤝 Contributing

Pull requests are welcome. Open an issue before major changes.

📜 License

MIT License

🙌 Credits

Built for SA-MP server administration and automation.
