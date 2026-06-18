<!--- metadata
id: 007
title: Tactical Mesh Network Transmission Layer
subtitle: Defence hackathon project
date: 16.05.2026
url: /work/project.html?project=mesh-network-transmission
image: /assets/projects/mesh-network-transmission/Mesh.webp
imageAlt: Tactical mesh network transmission cover image
summary: A hackathon concept for UDP-style communication over raw 802.11 packets in degraded environments. The Rust radio library was provided externally; our work focused on the Python layer, protocol design, node behavior, and the simplest working transmission demo. The project won the transmission layer category.
tags: ["Python", "Mesh Network", "Radio", "Security", "Testing"]
creators: Robin Niinemets, Patrik Mihelson, Otto Freund, Oskari Haverinen
collaborators: Kova Labs challenge mentors
duration: Hackathon weekend
tools: ["Python", "ctypes", "Rust FFI", "802.11 monitor mode", "ChaCha20-Poly1305", "uv"]
buttons: [{"text": "GitHub Repository", "url": "https://github.com/p-lemonish/nothing-to-see-here"}]
category: infrastructure
type: work
status: complete
featured: true
--->

# Tactical Mesh Network Transmission Layer

This project came from a defence hackathon challenge: build a communication system for autonomous drones using low-power radio hardware. The environment was assumed to be degraded, contested, and unreliable. That made the goal more interesting than a normal network exercise. The system had to move data between nodes even when the link quality changed, when nodes joined late, and when direct communication was not always reliable.

Our solution idea was to build a small UDP-style networking layer on top of raw IEEE 802.11 packets. The radio layer gave us the ability to send and receive raw frames. On top of that, we designed a simple message format with sender identity, message type, sequence/state information, and enough routing behavior to move data between nodes without a normal Wi-Fi network.

The important boundary is this: we did not write the Rust radio library. The Rust/C radio layer came from the provided `kova-wfb-rs` base. Our work was in the Python and project glue around it: protocol design, Python examples, message handling, node configs, status payloads, tests, setup docs, and demo workflow.

The challenge had three layers: transmission, mesh, and application. We wanted to think about all of them, but the hackathon weekend forced the scope down hard. In practice we barely had time to get the transmission layer working in its simplest useful form. That was still enough to win the transmission layer part of the competition.

---

### Problem And Scope

Normal networks are too comfortable. They assume stable infrastructure, known access points, clean routing, and predictable links. This challenge asked for something closer to field conditions:

- Multiple autonomous nodes needed to share data over radio.
- Communication needed to work without normal Wi-Fi association.
- Nodes needed a shared stream identifier so traffic could be filtered from raw frame captures.
- The team needed enough tooling to test, debug, and demonstrate the network during a short hackathon.

The full challenge was broader than what we could realistically finish. A complete system would need a stronger routing model, more reliable delivery, better interference handling, better crypto design, and real hardware testing over distance. We did not get there.

What we did build was concept work: a rough but working transmission-layer prototype that showed raw packet communication could be wrapped into a small application protocol. The code is hackathon code. Some of it is messy, some of it is too large, and some of it was written just to get a demo working before the deadline. The design choices mattered more than having clean production code.

### My Role

My work focused on making the prototype usable as a real demo instead of only a low-level radio test.

The main pieces I worked on were:

- Python sender/receiver flow in `mesh_txrx.py`.
- Structured application payloads in `app_proto.py`.
- Message types for status, hello, sync, and routed data.
- Link health state and auto-generated node status messages.
- Node configuration cleanup, including interface corrections.
- Setup documentation for Linux VM and `uv` based workflows.
- Small tests around protocol behavior where it mattered.

I intentionally treated the Rust library as an integration boundary. That kept the work honest: call the provided radio layer, wrap it with clearer application behavior, and make the simplest working demo repeatable.

### Design Idea

The project used a shared `stream_id` to separate our traffic from other raw 802.11 frames. In the provided setup, the team stream id was `0xdeadbeef`, visible in packet captures as `57:42:de:ad:be:ef`.

Above that raw stream, we treated each payload more like a UDP datagram than a connected session. A node could broadcast a small message, another node could receive it, and the protocol header gave enough context to decide what the message meant.

The design choices were:

- **Connectionless messages:** send small packets without building a full session model.
- **Node identity:** give every node a sender id so logs and payloads made sense.
- **Message types:** separate hello, sync, status, and routed data.
- **Simple routing:** use TTL-limited forwarding so packets could be repeated without flooding forever.
- **Observable status:** send structured node state instead of only text strings.
- **Config-driven nodes:** start nodes from config files so the demo could be repeated quickly.
- **Channel experiments:** explore synchronized hopping across channels `36`, `40`, and `48` with 5-second slots.

This was not a complete mesh network. It was the start of a transport idea: raw packets underneath, a small datagram-like protocol above, and just enough node behavior to prove that the approach could work in simple cases.

### Result

The most important result was that we got the design running in its simplest form.

We could send status or routed messages across the shared raw packet stream. We could also watch logs for channel, sender, sequence, TTL, and delivery behavior. That gave us a working demonstration of the core idea: a UDP-like communication layer over raw radio packets, without relying on normal Wi-Fi association.

That result was enough for the hackathon scope and strong enough to win the transmission layer category.

It is also important to be honest about what it was not. This was not production-ready communication software. It was not a complete tactical mesh system. It would not work as-is in practice. It was a concept prototype made under weekend constraints, and many parts would need to be redesigned before real use.

### Limitations

We had ambitious goals at the start:

- reliable transmission in poor radio conditions,
- routing between multiple autonomous nodes,
- self-healing behavior,
- useful application-layer payloads,
- and enough security to make the traffic meaningful in a contested setting.

We did not fully hit those goals. We reached the first rough proof: raw packet communication with a simple protocol layer above it. The rest stayed mostly as design direction and early experiments.

The main limitations were:

- link quality was hard to predict,
- hardware and driver behavior cost a lot of time,
- monitor mode setup was fragile,
- routing was still naive,
- reliability was not solved,
- and the code structure was shaped by the deadline more than by maintainability.

For a hackathon, that was an acceptable tradeoff. For a real system, it would need a serious rewrite.

### What I Learned

This project taught me that wireless communication still has many hard problems that are not solved just because the protocol idea is good. During the weekend we hit issues with interface names, monitor mode, driver behavior, privileges, channel agreement, timing, packet visibility, and link reliability.

The biggest personal lesson was that wireless systems are very physical. A design can look clean on paper and still fail because a driver behaves differently, a channel is noisy, a dongle drops frames, or two nodes are not really hearing each other the way the logs suggest.

I also learned the value of scope control. We wanted a mesh network. What we actually had time to prove was a simple transmission layer. Keeping that boundary clear made the project stronger, because we could explain what worked, what did not work, and why the concept was still valuable.
