# ESP8266 Router Monitor

An IoT-based router monitoring and automatic recovery system built using the ESP8266 ESP-01. The project continuously monitors internet connectivity, automatically restarts the router when a network failure is detected, and logs all events to Google Sheets through Google Apps Script.

---

## Overview

Internet connectivity issues often require manually restarting a router to restore service. This project automates that process by continuously monitoring internet availability and performing a controlled router power cycle whenever a persistent failure is detected.

The system combines embedded hardware, Wi-Fi communication, cloud logging, and automation to create a reliable and low-cost network monitoring solution.

---

## Features

* Continuous internet connectivity monitoring
* Automatic router restart during network failures
* Wi-Fi diagnostics and status tracking
* Google Sheets cloud logging
* Google Apps Script integration
* Real-time event recording
* Remote monitoring through cloud logs
* Low-cost IoT implementation
* GitHub-based version control

---

## System Architecture

Internet
↓
Router
↓
ESP8266 Router Monitor
↓
Failure Detection Logic
↓
Relay Control System
↓
Automatic Router Restart
↓
Google Apps Script
↓
Google Sheets Logging

---

## Hardware Components

| Component              | Description                            |
| ---------------------- | -------------------------------------- |
| ESP8266 ESP-01         | Main controller and Wi-Fi module       |
| Relay Module           | Controls router power supply           |
| DC-DC Power Module     | Provides regulated 3.3V and 5V outputs |
| Router                 | Network device being monitored         |
| USB-to-UART Programmer | Firmware uploading and debugging       |
| Jumper Wires           | Hardware connections                   |

---

## Software Components

* Arduino IDE
* ESP8266WiFi Library
* ESP8266HTTPClient Library
* Google Apps Script
* Google Sheets
* GitHub

---

## Working Principle

1. ESP8266 connects to the configured Wi-Fi network.
2. The system continuously checks internet availability.
3. If connectivity is lost, multiple verification checks are performed.
4. Upon confirming failure, the relay disconnects router power.
5. After a predefined delay, power is restored.
6. Router reboots automatically.
7. Event details are logged to Google Sheets.
8. Monitoring resumes.

---

## Google Sheets Integration

The project uses Google Apps Script as a cloud backend.

### Logged Information

* Internet Status
* Timestamp
* Restart Events
* System Activity
* Network Recovery Events

### Data Flow

ESP8266 → Google Apps Script → Google Sheets

---

## Project Structure

```text
ESP8266-Router-Monitor/
│
├── ESP8266_Router_Monitor.ino
├── Google_Apps_Script.gs
├── Circuit_Diagram/
├── Block_Diagram/
├── Flowchart/
├── Images/
├── Documentation/
│   └── Project_Report.pdf
└── README.md
```

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/ESP8266-Router-Monitor.git
```

### 2. Open Arduino IDE

Open:

```text
ESP8266_Router_Monitor.ino
```

### 3. Configure Settings

Update:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

Update your Google Apps Script Web App URL.

### 4. Upload Firmware

* Connect ESP8266 ESP-01 using USB-to-UART programmer
* Select correct board and COM port
* Upload firmware

### 5. Deploy Google Apps Script

* Create Google Sheet
* Add Apps Script
* Deploy as Web App
* Copy deployment URL
* Update firmware configuration

---

## Applications

* Home Internet Monitoring
* Small Office Networks
* Remote Network Management
* IoT Installations
* Educational Projects
* Network Automation Systems

---

## Future Improvements

* Mobile Application Integration
* Telegram and Email Alerts
* Advanced Analytics Dashboard
* OTA Firmware Updates
* Multi-Router Support
* AI-Based Failure Prediction
* Enhanced Security Features

---

## Results

The project successfully:

* Monitors internet connectivity in real time
* Detects persistent network failures
* Automatically restarts the router
* Logs events to Google Sheets
* Operates continuously with minimal user intervention

---

## Developed By

**Srinivas Raju R**

IoT Enthusiast • Embedded Systems Developer • DIY Networking Projects

---

## License

This project is intended for educational, research, and personal use. Feel free to modify and enhance the system according to your requirements.

---

## Acknowledgements

Special thanks to:

* Arduino Community
* ESP8266 Open-Source Community
* Google Apps Script Platform
* Google Sheets Services
* GitHub Open-Source Ecosystem

for providing the tools and resources that made this project possible.
