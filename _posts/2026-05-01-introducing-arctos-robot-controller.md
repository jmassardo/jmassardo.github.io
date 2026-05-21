---
layout: post
title:  "Introducing Arctos Robot Controller"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [hardware, automation, open-source, developer-tools, devops, raspberry-pi]
excerpt: "Arctos Robot Controller is a web-based GUI for controlling multi-axis robotic arms. Manual control, G-code execution, position replay, real-time WebSocket communication, and MKS57D/42D stepper support."
---

The [Arctos](https://arctosrobotics.com/) robot arm community is great, but I'm not a fan of ROS. Plus I'm a nerd and like modifying things 🤷🏼‍♀️. I wanted something that could handle my MKS57D steppers, speak G-code, save and replay positions, and run in a browser without needing a dedicated application installed on every machine I might control from.

[Arctos Robot Controller](https://github.com/jmassardo/arctos-robot-controller) is a Node.js/React application that provides exactly that. Web-based, real-time WebSocket communication, and a clean interface for manual jogging, G-code execution, and position sequence replay.

## Core Functionality

**Manual Control** - Jog individual axes with +/- buttons within configured limits. Control grippers with open/50%/close positions. Save the current arm position with a custom name at any point.

**G-code Execution** - Built-in editor with syntax highlighting, a "Load Sample" option for reference, and real-time execution progress tracking. Full execution history with timestamps.

**Position Replay** - Load any saved position with one click, or build sequences from multiple positions with configurable delays and loop counts. Useful for repetitive tasks or testing.

**Multi-tab Real-time Sync** - Open the controller in multiple browser tabs and all of them update in real time via WebSocket. Useful when you want one display showing status while another is issuing commands.

## Supported Hardware

| Controller | Axes | Protocol |
|------------|------|----------|
| MKS57D | 6-axis | Serial/CAN |
| MKS42D | 4-axis | Serial/CAN |
| Arctos | Variable | Serial |
| Generic/Custom | Configurable | Serial, CAN, RS485 |

CAN bus uses SocketCAN-compatible interfaces (Canable and similar). Serial supports RS-232/RS-485 at configurable baud rates.

## Configuration

Robot type, communication protocol, axis limits, and manipulator ranges are all configurable from the UI without restarting. Settings persist to `config/robot-config.json`. Hot-swapping robot types works cleanly.

```json
{
  "robotType": "MKS57D",
  "protocol": "Serial",
  "serialConfig": {
    "port": "/dev/ttyUSB0",
    "baudRate": 115200
  },
  "axes": [
    { "name": "Shoulder", "min": -90, "max": 90, "current": 0, "enabled": true }
  ]
}
```

## Running It

Local setup takes about two minutes:

```bash
git clone https://github.com/jmassardo/arctos-robot-controller.git
cd arctos-robot-controller
npm install
npm start          # backend on :5000

# in a second terminal:
cd client
npm install
npm start          # frontend on :3000, proxies to backend
```

Docker is also supported for cleaner deployment:

```bash
docker build -t arctos-robot-controller .
docker run -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/config:/app/config \
  arctos-robot-controller
```

The quickest way to evaluate without hardware is GitHub Codespaces - open the repo, create a codespace, and the environment is ready in a few minutes.

## Security

JWT authentication with automatic refresh, three-tier RBAC (Admin, Operator, Viewer), account lockout, input validation, rate limiting, and structured audit logging. The default admin password is `admin123!` and should be changed immediately in any non-local deployment.

## Testing

The project has 95%+ code coverage across 46 backend unit/integration tests, React component tests, and 30 Playwright E2E scenarios covering full user workflows in Chrome, Firefox, and Safari.

```bash
npm run test:all      # everything
npm run test:e2e      # Playwright scenarios
npm run test:coverage # with coverage report
```

## Roadmap

- Phase 2: Advanced G-code features, improved hardware integration
- Phase 3: Machine learning for automation, advanced sequencing
- Phase 4: Cloud connectivity, remote monitoring, fleet management

Licensed MIT.

## Status

This project is still very much conceptual. Most of the software is complete, however, I need to finish building and wiring my Arctos arm before I can really test the software.

**[Check it out on GitHub](https://github.com/jmassardo/arctos-robot-controller)**
