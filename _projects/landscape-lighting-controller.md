---
layout: page
title: "Landscape Lighting Controller"
date: 2025-11-19
category: home-automation
status: active
excerpt: "ESP8266-powered 4-channel relay controller for landscape lighting with ESPHome and Home Assistant integration."
related_tags: [homeassistant, esphome, lighting, automation, esp8266]
github_gist: https://gist.github.com/jmassardo/e869b9569e7accee7b3c1b2cfcdf3198
---

## The Problem

Finding reliable landscape lighting control that integrates with Home Assistant isn't always straightforward. Commercial solutions are expensive, and cheap relay boards from Amazon often lack good documentation or working ESPHome configurations. After purchasing a Eujgoov 4-Channel WiFi Smart Home Relay Module, I had to figure out the UART protocol through trial and error.

## The Solution

A fully functional ESPHome configuration for serial-controlled relay boards, enabling reliable landscape lighting automation through Home Assistant. No coding required once configured, just flash and connect.

**Hardware:** Eujgoov 4-Channel WiFi Smart Home Relay Module  
**Platform:** ESP8266 (ESP-01 1M)  
**Protocol:** UART serial communication (115200 baud)  
**Integration:** ESPHome + Home Assistant API  
**Enclosure:** Custom 3D printed weatherproof case

## Hardware Details

### Relay Module Specifications
- **Model:** Eujgoov 4-Channel WiFi Smart Home Relay Module
- **Amazon Link:** [B09LQNYPHQ](https://www.amazon.com/dp/B09LQNYPHQ)
- **Microcontroller:** ESP8266 (ESP-01 1M board)
- **Communication:** UART serial protocol
- **Channels:** 4 independent relays
- **Control Method:** Hex command sequences over serial

### Custom 3D Printed Enclosure
- **Design:** Custom Fusion 360 CAD model
- **MakerWorld Link:** [4 Channel Relay Enclosure](https://makerworld.com/en/models/1994629-4-channel-relay-enclosure)
- **License:** Creative Commons Attribution-Noncommercial-Share Alike
- **Fasteners:** M4 x 10mm heat-set inserts (exterior corners), M3 x 4mm (internal relay board mounting)
- **Print Settings:** 0.2mm layer height, 5 walls, 15% infill
- **Features:** Weatherproof design, secure mounting bosses, professional appearance

The enclosure was specifically designed for this relay board after not finding a suitable pre-made option. Custom designed in Fusion 360 with proper mounting points for the relay board and heat-press threaded inserts for secure assembly.

### UART Command Protocol
The relay board uses a simple hex-based serial protocol:

**Turn On Relay:**
- Relay 1: `0xA0, 0x01, 0x01, 0xA2`
- Relay 2: `0xA0, 0x02, 0x01, 0xA3`
- Relay 3: `0xA0, 0x03, 0x01, 0xA4`
- Relay 4: `0xA0, 0x04, 0x01, 0xA5`

**Turn Off Relay:**
- Relay 1: `0xA0, 0x01, 0x00, 0xA1`
- Relay 2: `0xA0, 0x02, 0x00, 0xA2`
- Relay 3: `0xA0, 0x03, 0x00, 0xA3`
- Relay 4: `0xA0, 0x04, 0x00, 0xA4`

**Pattern:** `0xA0, [channel], [state], [checksum]`
- Channel: 0x01-0x04 (relays 1-4)
- State: 0x01 (on) or 0x00 (off)
- Checksum: 0xA0 + channel + state

### Pin Configuration
- **TX Pin:** GPIO1 (serial transmit to relay board)
- **RX Pin:** GPIO3 (serial receive from relay board)
- **Baud Rate:** 115200

## ESPHome Configuration

The complete working configuration handles all 4 relays with proper UART communication:

### Key Configuration Elements

**UART Setup:**
```yaml
uart:
  tx_pin: GPIO1
  rx_pin: GPIO3
  baud_rate: 115200
  debug:
    direction: BOTH
    dummy_receiver: true
    after:
      delimiter: "\n"
      sequence:
        - lambda: UARTDebug::log_hex(direction, bytes, ':');
```

**Logger Configuration:**
```yaml
logger:
  baud_rate: 0  # Disable serial logging (UART used for relay control)
```

**Switch Template (per relay):**
```yaml
switch:
  - platform: template
    name: "Relay 1"
    id: relay_1
    optimistic: true
    turn_on_action:
      - uart.write: [0xA0, 0x01, 0x01, 0xA2]
      - delay: 100ms
    turn_off_action:
      - uart.write: [0xA0, 0x01, 0x00, 0xA1]
      - delay: 100ms
```

### Important Configuration Notes

1. **Serial Logging Must Be Disabled** - The UART pins are used for relay control, so `baud_rate: 0` is critical in the logger configuration.

2. **UART Debug for Troubleshooting** - The debug section helps reverse-engineer commands by logging hex traffic. Remove after initial setup for cleaner logs.

3. **Optimistic Mode** - Since the relay board doesn't send state confirmation, `optimistic: true` tells ESPHome to assume commands succeed.

4. **100ms Delays** - Small delays between commands prevent UART buffer overruns and ensure reliable switching.

## Features & Capabilities

### Home Assistant Integration
- **Native API Integration** - Relays appear as switches in Home Assistant
- **Encrypted Communication** - API encryption key for secure local control
- **OTA Updates** - Flash firmware updates over WiFi
- **Web Interface** - Built-in web server on port 80 for direct access

### Automation Possibilities
- **Sunrise/Sunset Scheduling** - Automatic lighting based on solar position
- **Motion Detection Integration** - Trigger zones based on motion sensors
- **Weather-based Control** - Adjust timing based on cloud cover or conditions
- **Manual Override** - Physical or dashboard control anytime
- **Zone Grouping** - Control multiple zones together for different scenes

### Reliability Features
- **WiFi Auto-Reconnect** - Automatic recovery from network issues
- **Template Switches** - Reliable state management
- **UART Error Handling** - Debug logging for troubleshooting
- **Optimistic State Tracking** - Immediate UI feedback

## Setup Instructions

### 1. Hardware Connection
- Connect ESP8266 to relay board (usually pre-wired in module)
- Ensure proper power supply (typically 5V or 12V depending on relay board)
- Connect relay outputs to landscape lighting transformer zones

### 2. ESPHome Configuration
- Create new device in ESPHome dashboard
- Copy configuration from [GitHub Gist](https://gist.github.com/jmassardo/e869b9569e7accee7b3c1b2cfcdf3198)
- Update WiFi credentials and encryption keys
- Customize relay names for your zones (e.g., "Front Yard", "Backyard", "Driveway")

### 3. Initial Flash
- Connect ESP8266 via USB serial adapter (if not already on WiFi)
- Flash firmware from ESPHome
- Verify connection in web interface or ESPHome logs

### 4. Home Assistant Setup
- Device should auto-discover via ESPHome integration
- Add switch entities to dashboard
- Create automations for scheduling

### 5. Testing & Calibration
- Test each relay individually
- Verify no interference between channels
- Check UART debug logs if issues occur
- Set up automations once hardware is confirmed working

## Home Assistant Automation Examples

### Basic Sunset Automation
```yaml
automation:
  - alias: "Landscape Lights On at Sunset"
    trigger:
      - platform: sun
        event: sunset
        offset: "-00:30:00"  # 30 minutes before sunset
    action:
      - service: switch.turn_on
        target:
          entity_id:
            - switch.relay_1
            - switch.relay_2
            - switch.relay_3
            - switch.relay_4
```

### Smart Morning Shutoff
```yaml
automation:
  - alias: "Landscape Lights Off After Sunrise"
    trigger:
      - platform: sun
        event: sunrise
        offset: "00:30:00"  # 30 minutes after sunrise
    action:
      - service: switch.turn_off
        target:
          entity_id: all
          device_id: [your_relay_controller_device_id]
```

### Zone-Based Control
```yaml
automation:
  - alias: "Front Yard Motion Detection"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_yard_motion
        to: "on"
    condition:
      - condition: sun
        after: sunset
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.relay_1  # Front yard zone
      - delay: "00:05:00"
      - service: switch.turn_off
        target:
          entity_id: switch.relay_1
```

## Troubleshooting

### Relays Not Responding
- **Check UART connections** - Verify GPIO1 (TX) and GPIO3 (RX) are correct
- **Verify baud rate** - Must be 115200 for this relay board
- **Review logs** - Enable UART debug to see hex commands being sent
- **Test power** - Ensure adequate power supply to relay board

### Random Switching or Interference
- **Add delays** - Increase delay between commands (try 200ms)
- **Check wiring** - Ensure clean power and ground connections
- **Reduce WiFi retries** - Lower fast_connect attempts in WiFi config

### Home Assistant Integration Issues
- **Check encryption key** - Must match between ESPHome and HA
- **Verify API enabled** - Ensure Home Assistant API block is present
- **Network connectivity** - Confirm device is on same network/VLAN
- **Force discovery** - Restart ESPHome integration in HA

### OTA Update Failures
- **Check password** - OTA password must be correct
- **WiFi signal** - Strong signal required for reliable OTA
- **Use USB** - Fall back to wired flashing if OTA fails repeatedly

## Lessons Learned

### Serial Protocol Discovery
Finding the right UART commands took experimentation. The UART debug output was essential for reverse-engineering the protocol. The hex pattern (0xA0 prefix, channel byte, state byte, checksum) is simple once you see it in action.

### Logger Conflicts
Initial attempts failed because serial logging competed with UART relay control. Setting `baud_rate: 0` in the logger was the critical fix.

### Optimistic State Management
Without feedback from the relay board, optimistic mode is necessary. This works fine for simple on/off control but means you can't detect relay failures automatically.

### Reliability Through Simplicity
The 100ms delays and straightforward UART commands make this setup very reliable. No complex protocols or timing issues, just simple hex sequences.

## Future Enhancements

### Planned Improvements
- Nothing currently planned

## Custom Enclosure Design

The project includes a custom-designed 3D printed enclosure specifically engineered for this relay board. After searching for pre-made options and finding nothing suitable, I designed this enclosure from scratch in Fusion 360.

### Design Features
- **Weatherproof construction** - Sealed design suitable for outdoor installation
- **Secure mounting** - Internal bosses with M3 x 4mm heat-set inserts hold the relay board firmly
- **Professional assembly** - M4 x 10mm heat-set inserts in exterior corners for robust construction
- **Proper ventilation** - Designed to prevent heat buildup while maintaining weather resistance
- **Clean aesthetics** - Professional appearance suitable for visible installations

### Print Specifications
- **Layer Height:** 0.2mm
- **Wall Count:** 5 walls for strength
- **Infill:** 15% (balances strength and material usage)
- **Material:** Any standard filament (PLA, PETG, ASA recommended for outdoor use)
- **Print Time:** Approximately 6-8 hours depending on printer

### Files & License
The 3D model is freely available on MakerWorld under Creative Commons Attribution-Noncommercial-Share Alike license. This allows anyone to download, print, and modify the design for personal use.

**Download:** [MakerWorld - 4 Channel Relay Enclosure](https://makerworld.com/en/models/1994629-4-channel-relay-enclosure)

The design process involved:
1. Measuring the relay board dimensions precisely
2. Modeling in Fusion 360 with proper clearances
3. Test printing and iterating on mounting points
4. Adding heat-set insert locations for professional assembly
5. Final print and assembly with actual hardware validation

## Bill of Materials

- **Relay Module:** Eujgoov 4-Channel WiFi (~$15-20 on Amazon)
- **3D Printed Enclosure:** Custom design (filament cost ~$2-3)
- **Heat-Set Inserts:** M4 x 10mm (4x exterior) + M3 x 4mm (2x interior) (~$5)
- **Landscape Transformer:** Low-voltage AC transformer (if not existing)
- **Wiring:** 12-16 AWG outdoor rated wire
- **Power Supply:** 5V or 12V depending on relay board specs

**Total Cost:** ~$30-50 for complete controller hardware (excluding lighting fixtures)

## Why This Approach?

### Advantages Over Commercial Solutions
- **Cost Effective** - $20 vs $100+ for commercial smart relay systems
- **Full Control** - No cloud dependency, works entirely local
- **Home Assistant Native** - Deep integration with existing automations
- **Open Source** - Modify and extend as needed
- **Community Support** - ESPHome and HA have massive communities

### Compared to Other DIY Options
- **Simpler than Sonoff** - No need to flash custom firmware initially
- **More Channels** - 4 zones vs typical 1-2 on WiFi switches
- **Cleaner Installation** - Single device vs multiple WiFi switches
- **Better for Lighting** - Designed for relay control vs repurposed switches

## Resources

- **ESPHome Configuration Gist:** [relay-controller.yml](https://gist.github.com/jmassardo/e869b9569e7accee7b3c1b2cfcdf3198)
- **3D Printed Enclosure:** [MakerWorld - 4 Channel Relay Enclosure](https://makerworld.com/en/models/1994629-4-channel-relay-enclosure)
- **Hardware:** [Amazon - Eujgoov 4-Channel Relay](https://www.amazon.com/dp/B09LQNYPHQ)
- **ESPHome Documentation:** [esphome.io](https://esphome.io)
- **Home Assistant:** [home-assistant.io](https://home-assistant.io)

---

*This project combines custom 3D design, ESPHome configuration, and Home Assistant automation to create a complete landscape lighting solution. Both the enclosure CAD files and ESPHome config are freely available for anyone building a similar system.*

## Related Posts

{% assign related_posts = site.tags.homeassistant %}
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
