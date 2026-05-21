---
layout: post
title:  "Introducing GaugeForge"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [hardware, arduino, automation, open-source, devops, developer-tools]
excerpt: "GaugeForge is an Arduino-driven OBD-II stepper gauge cluster for building custom automotive instrument panels. YAML configuration, a desktop GUI editor, X27 stepper support, and a full alert system."
---

Custom instrument panels have always required either expensive proprietary systems or a lot of manual wiring and firmware pain. [GaugeForge](https://github.com/jmassardo/gaugeforge) is my attempt to change that - an open-source Arduino firmware and desktop toolchain for building your own OBD-II gauge cluster with X27 stepper motors and a YAML configuration file.

The short version: you describe your gauges in YAML, pick your PIDs, wire up your steppers, flash the firmware, and your physical needles start moving.

## The Hardware Side

GaugeForge drives X27 automotive stepper motors - the same ones used in factory instrument clusters. Each gauge gets four GPIO pins (a1, a2, b1, b2) for the stepper coils. An Arduino Mega 2560 is recommended for builds with more than four gauges due to pin count.

The OBD-II adapter connects via RX/TX serial to the `obd` section of your config. Standard SAE Mode 01 PIDs work out of the box. GM enhanced Mode 22 PIDs are also supported.

```yaml
version: "1.1"
gauges:
  tachometer:
    gaugeType: dual-top
    pid: 010C
    unit: rpm
    minValue: 0
    maxValue: 8000
    pins: { a1: 6, a2: 7, b1: 8, b2: 9 }
    position: 2
    enabled: true
stepper:
  type: X27
  stepsPerRevolution: 945   # 315° * 3 steps/degree
  maxAngle: 315
  stepDelay: 2000
  speed: 60
```

## Calculated PIDs

Standard OBD-II doesn't give you everything. GaugeForge supports calculated/virtual PIDs - custom derived values built from mathematical expressions combining existing PID data.

Some examples:

```text
Power Estimation:  (TORQUE * RPM * 5252) / 63025
Fuel Economy:      (VSS > 0) ? (MAF * 0.0805) / VSS : 0
Boost PSI:         (BOOST_KPA - 101.325) * 0.145038
Temp Delta:        ECT - IAT
```

Calculated PIDs are saved with your configuration and show up in gauge dropdowns as `calc:your_pid_id`. The Formula Builder in the desktop GUI makes creating and testing them interactive.

## The Desktop GUI

Manual YAML editing is supported, but the GUI is the recommended workflow. It's an Electron app that gives you:

- Visual gauge list with enable/disable and reorder controls
- Pin matrix with conflict highlighting
- PID search with metadata preview (unit, formula, range)
- Formula Builder for calculated PIDs with live testing
- Live Data Monitor for real-time OBD and calculated value verification
- Real-time validation panel that turns green when your config is clean
- Color scheme live preview

The typical flow: load or create a config in the GUI, resolve any validation warnings, export YAML, flash firmware, test.

## Alert System

GaugeForge includes a configurable alert system for PID value monitoring and system health. Alerts support warning and critical thresholds, cooldown periods to prevent spam, priority levels, and actions including visual indicators, audio, logging, and notifications.

```yaml
alerts:
  - id: high_rpm_warning
    type: pid_value
    pidCode: 010C
    thresholds:
      warning: 6000
      critical: 7000
    conditions:
      criticalCondition: greater_than
    cooldownPeriod: 5000
    priority: high
    actions:
      visual: true
      audio: true
```

## Quick Start

```bash
git clone https://github.com/jmassardo/gaugeforge.git
cd gaugeforge
# Launch the GUI
cd gui && npm install && npm start
# Or edit config.yaml directly, then flash:
# Open gaugeforge.ino in Arduino IDE, select Mega, upload
```

See `QUICKSTART.md` in the repo for the full hardware shopping list and wiring guide.

## What's on the Roadmap

- ESP32 Wi-Fi config push
- MCP23017 I/O expander abstraction for larger builds
- SD card logging mode
- Performance optimization and memory improvements

The project is source-available. Check the licensing doc before commercial use.

## Status

This project is still very much conceptual. Most of the software is complete, however, the physical pieces are still pending.

**[Check it out on GitHub](https://github.com/jmassardo/gaugeforge)**
