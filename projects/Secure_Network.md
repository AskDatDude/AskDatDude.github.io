<!--- metadata
id: 006
title: Secure Home Network On a Budget
subtitle: Homelab Project
date: 6.10.2025
url: projects/project.html?project=Secure_Network
image: /assets/projects/Secure_Network/chart.webp
imageAlt: Secure Home Network hardware
summary: This homelab project demonstrates how I build a secure, segmented home network using affordable hardware and security architecture principles. It covers hardware selection, VLAN design, build process, and operational practices for strong isolation and minimal attack surface.
tags: ["Network", "Security", "VLAN", "WireGuard", "Homelab"]
creators: Robin Niinemets
duration: 1.5 weeks
tools: ["TP-Link ER605", "TP-Link SG105E", "Proxmox", "WireGuard"]
--->  

# Secure Home Network On a Budget

This homelab project applies security architecture principles to a practical home environment. The design separates management, user devices, wireless clients, internal services, and a future DMZ into distinct VLANs. By default, traffic between VLANs is denied; only intentional, minimal pathways are permitted.

Administrative access to the management VLAN (VLAN10) is physically gated: you must connect directly to a dedicated router port. Remote access is provided solely through WireGuard over LAN, with scoped routes that deliberately exclude management.

This report walks through the hardware choices, network plan, build process, and operational practices, without compromising OPSEC.

---

### Hardware selection

Enterprise level hardware is really expensive, but it allows to configure secure networks. So my first step was choosing hardware that was both cost-effective and capable of supporting the security features I wanted to implement, primarily network segmentation. I already had a consumer level Wi-Fi router, so no need to get a AP.

- **Router (TP-Link ER605 v2):** I chose this router because it is a powerful entry point into business-grade networking without a high cost. Its key features were support for VLANs and a stateful firewall. This allows it to not only create the virtual network segments but also to enforce access control rules between them, which is the core of this design. It offered the performance needed for gigabit internet and inter-VLAN routing.

- **Switch (TP-Link SG105E):**  A standard unmanaged switch wouldn't work for this project because it can't process VLAN tags. I selected the SG105E because it's a "smart" managed switch, meaning it understands 802.1Q VLAN tagging. This was the most affordable way to extend the segmented networks from the router to the various connected devices. Its simple web interface was sufficient for configuring the necessary trunk and access ports.

- **Proxmox VE:** Proxmox is a powerful, open-source virtualization platform that allows me to run multiple isolated virtual machines (VMs) and containers (LXC) for my homelab and future public services. This approach is efficient, scalable, and allows me to treat infrastructure as software, which is a key practice in modern IT and security. I run it on both of my server machines.

![Image of the hardware of the setup.](/assets/projects/Secure_Network/hardware.webp)

Together, these components deliver secure segmentation without breaking budget. The whole setup cost me about 200€ including the Proxmox servers, without them just the bare network devices were little over 120€. So very affordable, for what I get.

### Designing a Secure Network

Before I even got the devices I wrote down my requirements that I needed. So this is 100% purpose build, which allowed to keep the budget low. The hardware is limited, but it's exactly enough for my requirements and needs.

Requirements for this project was:

- Separated trust zones (VLANs) 802.1Q
- WireGuard support for secure remote management
- Possibility for securely deploying publicly available services

Most important here was the VLANs. I needed to reduce the attack surface, so even if some part of my setup would compromise, it would be contained and manageable. So I started with VLANs, I made one VLAN for each kind of devices.

- **VLAN10**: This is the most sensitive area, reserved for managing the router, switch, and infrastructure. Because compromise here would be high impact, I made access local‑only via a dedicated, labeled port on the router.

- **VLAN20** hosts homelab services that are meant for internal use. It needs some reachability from trusted user devices but should be insulated from everything else.

- **VLAN30** is the wireless client network and is treated as the least trusted. It is isolated from all internal subnets. Clients cannot reach the AP’s management interface either. From a security standpoint, this zone is designed to be a dead‑end for lateral movement.

- **VLAN40 – Future DMZ:** Will host public-facing services. When it goes live, Internet traffic will terminate here and will not have a path into interior networks.

- **VLAN50** is my desktop/user network. It’s allowed to reach specific Proxmox services with WireGuard. No default access.

Here is the whole network visualized. The guiding principles were: default‑deny between zones, least‑privilege allow rules, physical control for management, and simple operations that I can consistently validate.

![Chart of the whole network topology](/assets/projects/Secure_Network/chart.webp)

---

### Building The Network

The ISP uplink connects into the TP‑Link ER605 v2 router. The TP‑Link SG105E switch provides VLAN tagging and access ports. The router and switch live in VLAN10. The Proxmox homelab (VLAN20), the Wi‑Fi AP (VLAN30), and my primary workstation (VLAN50) are all connected to the switch on ports configured for their respective VLANs. WireGuard provides secure remote access with carefully limited routes, deliberately excluding the management network.

### Segmenting the VLANs

I created the VLANs on the router, set matching tags on the switch, and assigned access ports per device role. The trunk between router and switch carries all VLANs; user/device ports are untagged in their respective VLANs. DHCP scopes and addressing were defined per VLAN to avoid overlap and make logging clear. Inter‑VLAN policies were set to “deny by default,” and I added only the minimum rules needed to support intended workflows. The router’s WAN administration and any auto‑exposure features (like UPnP) were disabled to shrink the attack surface. Credentials are strong and unique; time sync is enabled for consistent logs.

A key design choice was the physical control of VLAN10. To administer the environment, I connect a laptop via cable to a specific, labeled port on the router that belongs to VLAN10. No Wi‑Fi SSID, no VPN route, and no other VLAN can reach VLAN10. This keeps management pathways simple, auditable, and hard to accidentally expose. Personally I don't need constant access to management VLAN so I limit it for smaller exposure and attack surface. The system is designed so it could be enabled by WireGuard if needed.

This model produces short, understandable rules and a topology where the diagram mirrors the policy: green arrows for the few allowed flows and red arrows for everything else.

### Operating the Network Day‑to‑day

Day-to-day work is mostly about keeping things visible, tidy, and predictable:

- **Backups and changes:** Router, switch, and homelab configs are backed up and labeled. Before making a change, I snapshot configs. Afterward, I do quick tests from each VLAN and a VPN client to confirm that traffic only flows where it should.

- **Watching logs:** The firewall logs denied inter-VLAN traffic and VPN activity. This makes it easy to catch misconfigurations or spot devices trying to reach places they shouldn’t.

- **Updates and testing:** Devices and homelab systems are patched on a regular schedule. Because the firewall rules are simple and explicit, regression testing is quick: I check that VLAN10 still gives me management access, VLAN50 can still reach the right homelab services, and VLAN30 Wi-Fi clients stay completely isolated.

The strength of the design is its simplicity. Management access is physically isolated, which blocks whole categories of remote attacks. Segmentation follows a default-deny approach, so every boundary is enforced by default. The VPN is set up with least privilege, giving just enough access to work without exposing more than necessary. Wi-Fi is treated as untrusted, which reduces the impact if a wireless device is ever compromised.

---

### Conclusion

So in the end the whole network came out quite strong. The attack surface is limited to physical access attacks mostly and the whole networks imprint is quite small. Strict management access and segmentation, minimal exceptions and carefully scoped LAN VPN access. The architecture of this network is transparent, repeatable and practical. Keeping cost down, without compromising security. This is a good base, that I can build on and modify.  
