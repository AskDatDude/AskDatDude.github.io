<!--- metadata
id: 003
title: Simple TCP-Server
subtitle: Small Python project
date: 02.06.2024
url: projects/project.html?project=TCP_Server
image: assets/Designer(1).jpeg
imageAlt: Simple TCP-Server logo
summary: This project is a simple TCP server that listens for incoming connections on a specified port. The server will respond with a message to the client when a connection is established. The server will then wait for the client to send a message, and when the client sends a message, the server will respond with a message to the client. The server will continue to wait for messages from the client until the client sends a message that says "exit". When the server receives a message that says "exit", the server will close the connection and terminate.
tags: ["Python", "TCP", "Server", "Infrastructure"]
originalSource: freeCodeCamp Concepts
duration: 4 hours
tools: ["Python", "VM VirtualBox"]
buttons: [{"text": "TCP-Server Github Repo", "url": "https://github.com/AskDatDude/Simple_TCP_Server"}]
--->

### Simple TCP Server

This project is a simple TCP server implementation. It allows clients to connect to the server using TCP/IP and exchange data. The server listens for incoming connections, accepts client requests, and handles data transmission.

### Files

**server.py:** This file contains the main implementation of the TCP server. It sets up the server socket, listens for incoming connections, and handles client requests.

**client.py:** This file provides a sample client implementation that can connect to the server and send/receive data.

### Usage

To use the Simple TCP Server, follow these steps:

1. Run the `server.py` file to start the server.
2. Run the `client.py` file to start a client and connect to the server.
3. Use the client to send and receive data from the server.

This is a simple example of a TCP server implementation. You can modify the code to add more functionality or customize it to suit your needs. But I created this project to learn more about networking and socket programming in Python.
