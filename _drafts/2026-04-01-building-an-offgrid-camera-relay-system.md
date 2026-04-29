---
layout: post
title:  "Building an Off-Grid Camera Relay System for a Rural Road"
date:   2026-04-01 10:00:00 -0500
category: Blog
tags: [ubiquiti, devops, automation, security, solar, off-grid, home-assistant]
excerpt: "A practical build guide for a solar-powered roadside camera relay using Ubiquiti gear, a LiFePO4 power station, and Home Assistant telemetry."
---

I live out on a dead-end country road. Most days it is quiet, and that is exactly why we like it. The downside is that quiet roads attract people who assume nobody is watching. We started seeing trash dumping, roadside drinking, and other late-night nonsense at the end of the road.

Our neighbor group agreed we needed visibility, and as the neighborhood nerd, I decided to build a solution for us.

This post is the story of turning that idea into a working off-grid camera relay, from early design choices to the things we learned after real-world constraints showed up.

## The Brief: Build a Tiny Remote Site

Here were the non-negotiables:

- No utility power at the install location
- No trenching new cable
- Reliable network path back to the house
- Monitoring so we get alerts before downtime

That last one matters more than people think. A camera that silently died two days ago is basically decorative hardware.

## Picking the Network Stack

Most of my gear is already Ubiquiti, so I stayed in that ecosystem and kept management simple.

Core design:

- 2x [Ubiquiti Device Bridge Pro](https://store.ui.com/us/en/category/wifi-bridging/products/udb-pro?variant=udb-pro-us) for the point-to-point link
- 2x [Ubiquiti G5 Bullet](https://store.ui.com/us/en/category/cameras-bullet/products/uvc-g5-bullet?variant=uvc-g5-bullet) for coverage
- 1x [Ubiquiti USW-Flex](https://store.ui.com/us/en/category/switching-utility/products/usw-flex?variant=usw-flex) as the remote switch

Power and observability:

- 2x 100W rigid solar panels in parallel
- GRECELL H1200 class LiFePO4 power station
- ESP32 telemetry node for power-system data
- Home Assistant for dashboarding and alerting

The intent was simple: stable video path plus enough telemetry to know when something is drifting before it fails.

## The Moment This Became a Power Project

Stop me if you have heard this one. You start with "just two cameras" and suddenly you are doing energy math on a whiteboard.

Estimated continuous load looked like this:

| Device | Power |
|---|---|
| 2 cameras | 8W |
| USW-Flex | 5W |
| bridge radio budget | ~8W to 19W depending on model |
| **Total (typical)** | **~21W** |

Daily consumption:

```text
21W * 24h = 504Wh/day
```

That single line drives almost every hardware choice after it.

I went with two 100W rigid panels because they are easier to mount permanently, easier to angle correctly, and less awkward than giant folding panel formats in a mailbox-adjacent install.

## The Mailbox Debate

At one point, we explored mounting solar directly on the mailbox structure. It sounds clever until geometry and shading show up to ruin your day.

What made it a bad idea in practice:

- Rounded mailbox top geometry
- Directional compromise from wrap-around placement
- Partial shading risks that can crush actual production

The better answer was boring and effective:

- Dedicated nearby post for the panels
- Enclosure mounted behind the brick mailbox where it stays out of sight
- Short cable run back to the enclosure

At about 20-30 feet of cable run, 10 or 12 AWG can both be viable depending on your final panel and connector specs.

## Enclosure Reality Check

This was another area where theory and reality fought each other.

The enclosure needed to hold the power station, switch, and injectors while still allowing airflow and maintenance access. You can absolutely fit this class of build into a 24 x 16 x 12 weatherproof enclosure, but only if you verify internal dimensions. Product pages often advertise external dimensions, and that mismatch can be painful.

Quick checklist that saved headaches:

- Cable glands for solar and Ethernet ingress
- Clearance around the power station for airflow
- Backplate layout for switch and injectors before drilling
- Drip loops on every external cable entry

## AC Injectors vs Custom DC-DC PoE Path

We considered the classic efficiency question: should we convert battery DC up to 24V/48V and feed PoE directly?

For this load, I chose AC injectors from the power station and moved on with life.

Why:

- Simpler troubleshooting in the field
- Fewer custom points of failure
- Easy replacement with commodity parts

Yes, there is a conversion-efficiency tax. No, it was not the bottleneck in this project.

## Telemetry: The Difference Between "Installed" and "Operated"

I added an ESP32 telemetry node to read the power station bus and publish into Home Assistant.

That gave me live visibility into:

- Pack voltage
- Charge/discharge current
- Charge and load power
- Thermal behavior
- Output state changes

Alerts are now tied to operational conditions, including low battery thresholds and unexpected charging behavior. This turns the system from reactive to proactive.

References:

- [ESPHome](https://esphome.io/)
- [Home Assistant Automations](https://www.home-assistant.io/docs/automation/)

## Lightning and Surge Protection

If your setup includes outdoor Ethernet and exposed metal structure, lightning planning is mandatory, not optional.

Minimum baseline:

- Bond exposed metal structures appropriately
- Use outdoor-rated Ethernet surge suppression on exposed lines
- Keep grounding and surge paths intentional and inspectable

For Ubiquiti environments, the [Ethernet Surge Protector](https://store.ui.com/us/en/category/accessories-poe-power/collections/pro-store-poe-and-power-surge-protection-outdoor/products/ethernet-surge-protector?variant=eth-sp-g2) is a practical starting point.

## Summary and Key Takeaways

The high-level lesson is straightforward: this was not a camera purchase, it was a small infrastructure project.

Here is your action plan if you are building something similar:

1. Do the power budget first.
2. Optimize panel placement for sun and maintainability, not cleverness.
3. Validate enclosure internals before buying.
4. Favor simple, serviceable power paths over maximum theoretical efficiency.
5. Add telemetry and alerts on day one.
6. Treat surge and grounding as core design requirements.

Together, those choices gave us a system that is boring in the best possible way: it stays up, records reliably, and tells us when it needs attention.
