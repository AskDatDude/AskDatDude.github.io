<!--- metadata
id: 008
title: Linux Defaults with Ansible
subtitle: Server management course project
date: 05.05.2026
url: /work/project.html?project=linux-defaults-ansible
image: /assets/projects/linux-defaults-ansible/Ansible1.webp
imageAlt: Linux defaults with Ansible cover image
summary: A small Ansible project that turns a fresh Debian or Ubuntu host into a more usable baseline system with firewall rules, fail2ban, automatic updates, SSH hardening, and tmux defaults. My part focused on the default_security role and the security automation.
tags: ["Ansible", "Linux", "SSH", "UFW", "fail2ban"]
creators: Andro Ott, Robin Niinemets
duration: Course mini-project
tools: ["Ansible", "Debian", "Ubuntu", "UFW", "fail2ban", "unattended-upgrades", "OpenSSH", "tmux"]
buttons: [{"text": "GitHub Repository", "url": "https://github.com/AndroOtt/Linux-defaults-with-ansible"}]
category: infrastructure
type: academic
status: complete
featured: true
--->

# Linux Defaults with Ansible

This was a small server management project for Tero Karvinen's Palvelimien Hallinta course. The idea was simple: take a fresh Debian or Ubuntu machine and apply the defaults I usually want before trusting it as a working Linux host.

The project uses one local Ansible playbook, `site.yml`, with two roles:

- `default_security` for firewall, SSH, fail2ban, and automatic updates.
- `tmux` for a system-wide terminal multiplexer configuration.

The project was built with Andro Ott. The split was clear: Andro worked on the tmux automation and project homepage, while I worked on the UFW firewall, automatic updates, fail2ban, SSH configuration, and the default security role.

---

### Problem

Fresh Linux installs are not always dangerous, but they are unfinished. A new machine often needs the same baseline work every time:

- Install and enable a firewall.
- Allow SSH without opening unnecessary ports.
- Reduce brute-force login risk.
- Keep security updates moving automatically.
- Apply consistent terminal defaults.

Doing this manually is easy once. Doing it manually every time is where mistakes happen. The project goal was to make the baseline repeatable with one command.

### My Role

My main contribution was the `default_security` role. The repository history shows 6 visible commits from my author identities for this part of the project.

I added or updated:

- The `default_security` role in `site.yml`.
- Package installation for `fail2ban`, `ufw`, `unattended-upgrades`, and `openssh-server`.
- UFW default deny incoming policy.
- UFW allow rule for `22/tcp`.
- Forced firewall enablement for repeatable local runs.
- fail2ban SSH jail configuration.
- unattended-upgrades configuration.
- SSH hardening drop-in file.
- Handlers for restarting `fail2ban` and SSH when config changes.
- README details for the security role.

This was not meant to become a full server hardening framework. It was a focused baseline for a course project and small personal servers.

### Technical Approach

The playbook targets `localhost` with `connection: local` and `become: true`. That means it can be run directly on the machine being configured:

```bash
sudo ansible-playbook site.yml
```

The `default_security` role installs 4 core packages:

- `fail2ban`
- `ufw`
- `unattended-upgrades`
- `openssh-server`

Then it places 4 configuration files:

- `/etc/fail2ban/jail.local`
- `/etc/apt/apt.conf.d/50unattended-upgrades`
- `/etc/apt/apt.conf.d/20auto-upgrades`
- `/etc/ssh/sshd_config.d/99-hardened.conf`

The firewall behavior is intentionally small:

- Deny incoming traffic by default.
- Allow `22/tcp` for SSH.
- Enable UFW with `--force` so the playbook can run without an interactive prompt.

The fail2ban SSH jail is also simple and measurable:

- Ban time: 24 hours.
- Find time: 10 minutes.
- Max retries: 3.

For updates, APT is configured to refresh package lists daily, download upgradeable packages daily, run unattended upgrades, and autoclean every 7 days. Automatic reboots are disabled, because I prefer a server to stay predictable unless reboots are planned.

### Result

After running the playbook, a fresh Debian or Ubuntu host gets a practical baseline:

- Firewall is enabled.
- SSH is allowed on port 22.
- Root SSH login is disabled.
- fail2ban watches SSH login failures.
- Security updates are configured to run automatically.
- tmux is installed with shared defaults.

The biggest win is repeatability. Instead of keeping these steps as notes, the defaults live as code. If something breaks, the repository shows exactly what changed and why.

### What I Learned

This project made Ansible feel practical to me. The useful part was not writing YAML. The useful part was turning normal admin habits into a repeatable checklist that can be reviewed, rerun, and improved.

I also learned that infrastructure automation benefits from staying small. A focused role is easier to understand, test, and reuse than a broad hardening framework that tries to solve every possible server setup.
