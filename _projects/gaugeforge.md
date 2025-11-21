---
layout: page
title: "GaugeForge Project"
date: 2025-11-16
category: electronics
status: active
excerpt: "Arduino-based OBD-II gauge cluster system with X27 stepper motors - your dash, your data, your way."
related_tags: [obd-ii, automotive, electronics, arduino, gauges]
github: https://github.com/jmassardo/gaugeforge
---

## The Vision

Build a modern, flexible, fully customizable instrument cluster using inexpensive X27 automotive stepper motors, an Arduino (or compatible MCU), and simple YAML configuration. GaugeForge (formerly Goblin Gauge) brings professional-grade gauge clusters to DIY automotive enthusiasts with zero coding required.

**Project Status:** Active development, v1.1 released  
**Current Config Version:** 1.1 (schema)  
**Hardware Platform:** Arduino Mega 2560 (recommended), Nano, ESP32, STM32

## What It Does

GaugeForge connects to your vehicle's OBD-II port and drives physical analog-style gauges using real-time vehicle data. Support for standard OBD-II PIDs plus manufacturer-specific enhanced PIDs (GM, Ford, Honda, Toyota, and more). A desktop GUI makes configuration visual and validation automatic.

**Core capabilities:**
- Real-time OBD-II data monitoring with multiple adapter support (ELM327, STN variants)
- X27 stepper motor control with smooth needle movement
- RGB illumination with auto-dimming based on vehicle lighting
- Calculated/virtual PIDs for custom derived values
- Advanced alert system with comprehensive monitoring
- Live data streaming and hardware testing
- Professional data logging with CSV export

## Key Features

### Hardware Flexibility
- **Arduino Mega 2560** - Supports 8-12 gauges directly (54 digital pins)
- **Arduino Nano** - Compact builds with 3-4 gauges (18 usable I/O pins)
- **ESP32 Support** - Wi-Fi configuration, OTA updates, web-based interface
- **STM32 Evaluation** - Advanced features and performance
- **I2C Expansion** - MCP23017 GPIO expanders for additional gauges

### X27 Stepper Motors
- 940 steps per revolution, 315° arc
- Direct coil control (4 pins per gauge)
- Smooth, authentic analog movement
- Professional automotive-grade appearance
- Multiple gauge layout options (single, dual, quad variants)

### OBD-II Integration
- **Multiple Adapter Support** - ELM327, STN1110, STN2120, STN2230
- **Automatic Protocol Detection** - ISO9141, KWP2000, CAN variants
- **Enhanced Error Handling** - Automatic recovery with escalation strategies
- **Connection Monitoring** - Real-time quality assessment and health recommendations
- **175+ PID Database** - Standard Mode 01 plus manufacturer Mode 22 examples

### Desktop Configuration GUI
- **Cross-platform** - Windows, macOS, Linux support
- **Visual Editing** - No coding required, YAML generation automatic
- **Real-time Validation** - Pin conflict detection, configuration verification
- **Live Data Monitoring** - Test gauges with real vehicle data
- **Hardware Testing** - Stepper motor calibration and diagnostics
- **Interactive Pin Mapper** - Visual Arduino board layouts with click-to-assign
- **Formula Builder** - Create calculated PIDs with interactive expression editor

### Advanced Features (v1.1)
- **Calculated/Virtual PIDs** - Create custom derived values from existing PIDs
- **Alert System** - Comprehensive monitoring with PID thresholds and system health
- **Data Logging** - Professional CSV export for analysis and troubleshooting
- **Performance Profiling** - PID response time tracking and optimization
- **Smart PID Features** - Auto-discovery, conditional activation, grouping/batching
- **Platform Management** - Multi-platform support with automatic code generation

## Project Components

### Arduino Firmware (`gaugeforge.ino`)
C++ firmware for Arduino-compatible microcontrollers. Handles OBD-II communication, stepper motor control, RGB illumination, and real-time data processing.

**Key modules:**
- OBD-II protocol communication (UART interface)
- X27 stepper motor driver (SwitecX25 library)
- RGB LED control with PWM dimming
- Configuration parser (reads from YAML compiled into sketch)
- Real-time gauge updates with smooth interpolation

### Desktop GUI (Electron App)
Professional cross-platform configuration tool built with Electron, Node.js, and modern web technologies.

**Features:**
- Visual gauge configuration with drag-and-drop
- PID database browser with 175+ predefined PIDs
- Pin mapping visualizer with Arduino board layouts
- Real-time validation and error detection
- Live data streaming from connected vehicles
- Hardware testing suite for stepper motors
- Formula builder for calculated PIDs
- Alert management dashboard
- Configuration export/import with examples

### PID Database (`pids.yaml`)
Comprehensive database of 175+ OBD-II parameter IDs covering:
- **Standard Mode 01** - Universal OBD-II PIDs (speed, RPM, temperature, fuel)
- **Enhanced Mode 22** - Manufacturer-specific PIDs (14 manufacturers)
  - GM: Boost pressure, IAT2, knock retard, injector pulse
  - Ford: Turbo pressure, transmission temp, EGT
  - Honda: VTEC status, oil pressure, MAP sensor
  - Toyota: Hybrid battery, electric motor data
  - And more...

### Configuration System (YAML)
Human-readable YAML configuration defines your entire gauge cluster setup. The GUI generates and validates these automatically, but you can also edit by hand.

**Config includes:**
- Hardware platform selection (Mega, Nano, ESP32, STM32)
- Pin assignments for gauges and peripherals
- OBD-II adapter settings (baud rate, protocol)
- Gauge definitions (PID mappings, ranges, calibration)
- RGB illumination configuration
- Alert thresholds and rules
- Calculated PID formulas

## Tech Stack

### Firmware
- **Language:** C/C++ (Arduino framework)
- **Libraries:** SwitecX25 (stepper control), ArduinoJson (config parsing)
- **Platform:** Arduino IDE or arduino-cli
- **Hardware:** Arduino Mega 2560, Nano, ESP32 DevKit, STM32 Blue Pill

### Desktop GUI
- **Framework:** Electron (cross-platform desktop apps)
- **Frontend:** HTML5, CSS3, JavaScript (vanilla ES6+)
- **Backend:** Node.js with SerialPort, YAML parsing
- **Build System:** electron-builder for distribution packages

### Communication Protocols
- **OBD-II:** UART serial communication with ELM327-compatible adapters
- **Protocols Supported:** ISO9141-2, ISO14230-4 (KWP2000), ISO15765-4 (CAN)
- **CAN Standards:** 11-bit/29-bit IDs, 250K/500K baud rates
- **Future:** Direct CAN-BUS support (bypass OBD-II adapter), J1939, LIN-BUS

### Data Formats
- **Configuration:** YAML (human-readable, version-controlled)
- **PID Database:** YAML with structured definitions
- **Data Logging:** CSV export with timestamps
- **Documentation:** Markdown with Jekyll site generator

## Current Development Status

### ✅ Completed Features (v1.1)
- Arduino firmware with X27 stepper motor support
- Cross-platform Electron GUI for configuration
- 175+ PID database (14 manufacturers)
- Real-time validation and pin conflict detection
- Multiple gauge layout types
- RGB illumination with auto-dimming
- Professional column-based filtering in PID management
- Advanced alert system with comprehensive monitoring
- Calculated/Virtual PID system with Formula Builder
- Live data streaming and visualization
- Platform management (Mega, Nano, ESP32, STM32)
- I2C expansion support with MCP23017
- Pin mapping visualizer with interactive selection
- Hardware testing interface
- Data logging with CSV export
- Enhanced OBD communication with multi-adapter support

### 🚧 In Progress
- ESP32 Wi-Fi configuration push
- Calculated PID persistence (save/load with configurations)
- MCP23017 expander abstraction (auto pin allocation UI)
- Performance optimization and memory usage improvements
- Hardware integration testing and validation

### 📋 Planned Features (Roadmap)
- **Phase 2:** Smart PID auto-discovery and performance profiling
- **Phase 3:** Direct CAN-BUS support (bypass OBD-II adapter)
- **Phase 4:** Mobile companion app (iOS/Android)
- **Phase 5:** Cloud data sync and fleet management
- **Phase 6:** Advanced analytics with machine learning

## Getting Started

### Hardware Requirements (Minimum)
- Arduino Mega 2560 (recommended) or Nano
- OBD-II UART adapter (ELM327-compatible)
- X27 stepper motors (one per gauge, ~$5 each)
- 12V to 5V buck converter (automotive-grade)
- Optional: RGB LEDs for illumination (pins 44/45/46 default)
- Wiring, breadboard/PCB, connectors

### Software Setup
```bash
# Clone repository
git clone https://github.com/jmassardo/gaugeforge.git
cd gaugeforge

# Launch GUI (optional but recommended)
cd gui
npm install
npm start

# Configure your setup visually or edit config.yaml manually

# Open gaugeforge.ino in Arduino IDE
# Select board (Mega 2560 recommended)
# Upload to Arduino

# Wire X27 steppers per config (4 pins each)
# Connect OBD-II adapter (RX/TX per config)
# Power up and observe self-test sweep
```

### Quick Configuration
1. **Launch GUI** and create new configuration
2. **Select Platform** (Mega 2560 for most builds)
3. **Add Gauges** - Choose PIDs from database (speed, RPM, temp, etc.)
4. **Assign Pins** - Use interactive pin mapper or auto-assign
5. **Configure OBD** - Set adapter type and communication pins
6. **Test Live** - Connect to vehicle and verify data
7. **Export** - Save YAML and flash firmware to Arduino

## Example Configurations

The repository includes working examples for popular vehicles:
- **Ford Mustang** - Speedometer, tach, coolant temp, fuel level
- **Honda Civic** - Metric units, 4-gauge setup with oil pressure
- **Ford F-150** - Truck-specific PIDs with towing monitoring
- **Tesla Model 3** - EV-specific gauges (speed, SOC, power)
- **Minimal Config** - 2-gauge beginner setup (Arduino Nano compatible)

## Development Workflow

1. **Extend `pids.yaml`** - Add custom PIDs or manufacturer-specific parameters
2. **GUI Configuration** - Visual editing with real-time validation
3. **Clear Validation Issues** - Fix pin conflicts and configuration errors
4. **Export YAML** - Save validated configuration
5. **Build & Flash** - Upload firmware to Arduino
6. **Test & Tune** - Observe startup sweep and live data, adjust as needed

## Documentation

Comprehensive documentation available in the Jekyll site:
- **Getting Started** - Complete setup walkthrough
- **Hardware Guide** - Wiring diagrams and component specifications
- **Configuration Reference** - YAML schema documentation
- **PID Database** - Complete PID listings with formulas
- **Live Data & Testing** - Real-time monitoring and hardware validation
- **Troubleshooting** - Common issues and solutions

## Community & Support

- **GitHub Repository** - Source code, issues, discussions
- **Documentation Site** - Comprehensive guides and reference
- **Example Configurations** - Vehicle-specific templates
- **Video Tutorials** - Setup and configuration walkthroughs (planned)

## License & Contributing

Source-available project with planned mixed licensing strategy. See `gaugeforge-site/docs/licensing.md` and trademark policy before commercial use.

**Contributions welcome:**
1. Fork and create feature branch
2. Keep documentation in sync with code changes
3. Provide test configurations or validation notes
4. Submit pull request with clear description

**Focus areas:**
- Additional vehicle PID definitions
- Hardware platform testing and validation
- GUI UX improvements and accessibility
- Performance optimizations
- Documentation enhancements

## Related Posts

{% assign related_posts = site.tags.canbus %}
{% if related_posts.size > 0 %}
<ul class="related-posts">
{% for post in related_posts limit:5 %}
  <li>
    <h3>
      <a href="{{ site.baseurl }}{{ post.url }}">
        {{ post.title }}
        <small>{{ post.date | date_to_string }}</small>
      </a>
    </h3>
  </li>
{% endfor %}
</ul>
{% else %}
<p><em>No related posts yet.</em></p>
{% endif %}
