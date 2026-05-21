---
layout: post
title:  "Introducing ElectroSim"
date:   2026-05-01 10:00:00 -0500
category: Blog
tags: [hardware, arduino, open-source, developer-tools, automation, devops]
excerpt: "ElectroSim is a cross-platform Arduino circuit simulator with drag-and-drop circuit design, real-time simulation at 60 FPS, a full Monaco code editor, and headless mode for CI/CD testing."
---

Testing Arduino circuits without hardware is annoying. Tinkercad exists but has limitations. Wokwi is good but online-only. I wanted something local, fast, and extensible - something I could also run headlessly in a CI pipeline.

[ElectroSim](https://github.com/jmassardo/electrosim) is the result: a cross-platform desktop Arduino circuit simulator built on Electron and React, with a real simulation engine, a full Monaco code editor, and a headless mode for automated testing.

## What It Does

The core loop is: design a circuit visually, write Arduino code in the editor, hit upload, hit play, watch it run.

**Circuit Design** - Drag-and-drop components onto a canvas. Smart snap-to-grid, zoom, pan, rulers. Real-time connection validation gives you instant feedback if something is wired wrong.

**Component Library** - LEDs (multiple colors), resistors, capacitors, buttons, servo motors, and an Arduino Uno board with all pins simulated. Sensors, displays, and communication modules are on the roadmap.

**Simulation Engine** - Realistic electrical calculations: voltage, current, power, LED brightness curves, resistor heating, capacitor charge/discharge cycles. PWM outputs use accurate duty cycle to voltage conversion. Timing functions (`delay()`, `millis()`) simulate correctly.

**Code Editor** - Monaco (the VS Code editor engine) with full Arduino C++ syntax highlighting, auto-completion, and the complete Arduino API. The integrated Serial Monitor shows real-time output and supports two-way communication.

**Performance** - 60 FPS simulation maintained even with complex circuits. Smart canvas rendering only redraws changed components. GPU acceleration where available.

## Headless Mode

This is the feature I use most for workflow integration. ElectroSim can run from the command line with no UI:

```bash
electrosim --headless --sketch blink.ino --circuit blink.json --timeout 10s
```

Useful for CI pipelines that want to validate Arduino sketches against simulated circuits before deploying to physical hardware. The exit code reflects pass/fail.

## Your First Simulation in 5 Minutes

```
1. File → New Project
2. Drag Arduino Uno to canvas
3. Add LED and a 220Ω resistor
4. Connect: pin 13 → LED anode → resistor → GND
5. Write code:
```

```cpp
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Starting!");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
```

```
6. Click Upload, then Play
7. Watch the LED blink and serial output appear
```

## Technical Stack

- **Frontend**: React 18, TypeScript, Material-UI, HTML5 Canvas, Monaco Editor
- **Backend**: Electron 26, Node.js 18
- **Simulation**: Custom circuit solver + Arduino virtual machine
- **Build**: Webpack 5, Jest for testing, Playwright for E2E
- **Platforms**: Windows, macOS, Linux (x64 and ARM64/Apple Silicon)

Test coverage is 99% (108/109 tests passing).

## Install

Download from the [releases page](https://github.com/jmassardo/electrosim/releases) or build from source:

```bash
git clone https://github.com/jmassardo/electrosim.git
cd electrosim
npm install
npm start
```

## What's Coming

- Expanded component library: temperature sensors, photoresistors, PIR sensors, LCD displays, I2C/SPI/Bluetooth modules
- Web version for browser-based use
- Cloud project sharing

## Status

This project is still very much conceptual. Most of the software is complete, however, the physical pieces are still pending. I actually started this not long after starting [GaugeForge]({% post_url 2026-05-01-introducing-gaugeforge %}). I wanted a way to test multiple permutations of gauge hardware to figure out the best patterns before starting to build physical gauges.

**[Check it out on GitHub](https://github.com/jmassardo/electrosim)**
