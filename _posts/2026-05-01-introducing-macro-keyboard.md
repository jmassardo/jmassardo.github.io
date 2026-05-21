---
layout: post
title:  "Introducing Macro Keyboard"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [hardware, arduino, automation, open-source, developer-tools]
excerpt: "Macro Keyboard is an Electron app and Arduino firmware for a fully programmable physical macro keyboard. YAML configuration, context-aware profiles, macro recording, and cross-platform support."
---

Software macro tools are fine. Physical macro keyboards are better. There's something satisfying about a dedicated button that does exactly one thing when you press it - no modifier keys, no menu navigation, no hoping the shortcut is still bound.

[Macro Keyboard](https://github.com/jmassardo/macro-keyboard) is an Electron desktop application paired with Arduino Micro firmware that turns a button matrix into a fully programmable macro keyboard. YAML configuration, context-aware profile switching, macro recording, and cross-platform support across macOS, Windows, and Linux.

## The Hardware

The Arduino Micro runs the firmware and communicates with the desktop app over USB serial. Supported configurations:

| Layout | Buttons | Encoders |
|--------|---------|----------|
| 2x4 | 8 | 0-8 |
| 3x4 | 12 | 0-8 |
| 4x4 | 16 | 0-8 |
| 4x6 | 24 | 0-8 |
| 4x8 | 32 | 0-8 |

Wire your button matrix with diodes (prevents ghosting when multiple buttons are pressed), flash the firmware, connect via USB. The firmware handles debouncing.

Flashing is straightforward:

```
1. Install Arduino IDE
2. Open arduino/macro-keyboard-firmware/macro-keyboard-firmware.ino
3. Configure your layout in config.h
4. Upload to Arduino Micro
```

## Configuration

Everything is YAML. Per-button action assignment, per-encoder binding, illumination settings:

```yaml
buttons:
  button1:
    description: "Volume Up"
    type: "keypress"
    action: "VolumeUp"

  button2:
    description: "Launch Terminal"
    type: "application"
    action: "Terminal"

  button3:
    description: "Screenshot"
    type: "keypress"
    action: "cmd+shift+3"

  button4:
    description: "Deploy Script"
    type: "shell"
    action: "./deploy.sh staging"
```

Action types: `keypress` for keyboard shortcuts, `application` for launching apps, and `shell` for running commands (with security validation - dangerous patterns are blocked).

Hot-reload means configuration changes take effect without restarting the app.

## Context-Aware Profiles

Here is where it gets genuinely useful. The app can automatically switch profiles based on which application is active, the time of day, or other system state. You can have one set of macros active in your code editor and a completely different set in your video editor, with no manual switching.

The rules engine supports priorities and conditions. Manual override lets you temporarily or permanently pin a profile regardless of context.

## Macro Recording

Rather than manually writing out key sequences, you can record them in real time - keystrokes and timing are captured and saved as a reusable macro. Macros are organized into playbooks and can be imported/exported for sharing across machines.

## Cross-Platform Notes

- **macOS**: Runs in the status menu (top bar), native notifications, macOS key combinations
- **Windows**: System tray, Windows notifications, Windows key combinations
- **Linux**: Headless service mode (no GUI), YAML config only, logs to file and console

## Getting Started

```bash
git clone https://github.com/jmassardo/macro-keyboard.git
cd macro-keyboard
npm install
npm start
```

Or grab the [latest release](https://github.com/jmassardo/macro-keyboard/releases) for a prebuilt binary. The initial release (v1.0.0) is available for macOS, Windows, and Linux, plus the Arduino firmware.

## Status

This project is still very much conceptual. Most of the software is complete, however, the physical pieces are still pending.

**[Check it out on GitHub](https://github.com/jmassardo/macro-keyboard)**
