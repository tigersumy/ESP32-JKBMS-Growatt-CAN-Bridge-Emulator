# ⚡ ESP32 — JK-BMS to Growatt BMS Protocol Bridge & Emulator (Datouboss / Aohai)

[![ESPHome](https://img.shields.io/badge/ESPHome-2024+-000000?style=flat&logo=esphome)](https://esphome.io/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32--WROOM--32-red?style=flat&logo=espressif)](https://www.espressif.com/)
[![Modbus RTU](https://img.shields.io/badge/Protocol-Modbus%20RTU%20RS485-blue)](https://modbus.org/)
[![Growatt BMS](https://img.shields.io/badge/BMS%20Protocol-Growatt%20ESS-green)]()
[![JK-BMS BLE](https://img.shields.io/badge/BMS-JK--BMS%20BLE-orange)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An intelligent multi-protocol gateway, hardware bridge, and zero-latency emulator connecting **JK-BMS** (via Bluetooth Low Energy) to **Growatt-protocol hybrid inverters** (such as **Datouboss DT-1218 / Aohai OEM**) via RS485 / CAN BMS ports.

Eliminates the dreaded **`Error 63` (BMS Communication Loss)**, provides automated battery charge management, and delivers modern real-time Web & MQTT telemetry dashboards.

---

## 📋 The Engineering Challenge

1. **Inverter Requirements (Datouboss DT-1218 / Aohai OEM / Growatt)**:
   - For automated LiFePO4 charging and battery state sync, parameter `A17` must be set to `Li` with protocol `GRO` (Growatt ESS).
   - In this mode, the inverter's BMS communication port acts as a **Modbus RTU Master**, querying the BMS every 1.0–1.5 seconds for a 40-register block (`0x03 0x0001 0x0028`).
   - **Critical Vulnerability**: If the BMS fails to respond within 3–5 seconds or CRC fails, the inverter enters alarm mode and halts battery charging with **`Error 63`**.
2. **JK-BMS Limitations**:
   - Standard JK-BMS units (4S–24S) only support Bluetooth Low Energy (BLE) and a proprietary TTL UART.
   - They do **not** natively speak Growatt RS485 / CAN ESS protocol.
3. **The Solution**:
   - An **ESP32-WROOM-32** bridges both worlds:
     - **BLE Central**: Continuously streams cell voltages, SOC, current, and temperatures from JK-BMS.
     - **Growatt BMS Slave Emulator (UART1 / RS485-2)**: Responds to inverter queries in **< 5 ms** with accurate battery telemetry converted to Growatt ESS specifications.
     - **Modbus RTU Master (UART2 / RS485-1)**: Reads AC grid voltage, DC-DC bus voltage, inverter temps, and dynamically adjusts charge current limits.
     - **Dual Dashboards**: Responsive on-device ESPHome UI + standalone Python Starlette/SSE dashboard with live watchdog and Apple HomeKit integration.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    POWER HARDWARE                                       |
|                                                                                         |
|   +--------------------------+                         +----------------------------+   |
|   |   LiFePO4 4S Battery     |                         |  Hybrid Inverter           |   |
|   |   150 Ah / 12.8V         |                         |  Datouboss DT-1218         |   |
|   |                          |                         |  (12V / 1800W / Aohai OEM) |   |
|   |  +--------------------+  |                         |                            |   |
|   |  |   JK-BMS           |  |                         |  +----------------------+  |   |
|   |  |   (Active Balance) |  |                         |  | RS485-2 (BMS GRO Port|  |   |
|   |  +---------+----------+  |                         |  | RJ45: Master (9600)  |  |   |
|   +------------|-------------+                         |  +----------+-----------+  |   |
|                | BLE 2.4 GHz                           |             |              |   |
|                | (300-byte frame)                      |             | RS485 Differential|
|                v                                       |             v Bus (A+ / B-)     |
|   +----------------------------------------------------+-------------+----------+   |   |
|   |   ESP32-WROOM-32 GATEWAY NODE                                                |   |   |
|   |                                                                              |   |   |
|   |   [BLE Client Engine] -----> Battery Telemetry Cache                         |   |   |
|   |                                   |                                          |   |   |
|   |   [UART1 / GPIO16,17] <-----------+                                          |   |   |
|   |           |                                                                  |   |   |
|   |           v                                                                  |   |   |
|   |   [RS485-BMS Transceiver] <==================================================+   |   |
|   |   (Growatt Slave Emulator: <5ms response, Zero-Latency)                      |   |   |
|   |                                                                              |   |   |
|   |   [UART2 / GPIO14,27] <======================================================+   |   |
|   |           ^                                        | RS485 Differential          |   |
|   |           |                                        | Bus (A+ / B-)               |   |
|   |   [RS485-INV Transceiver]                          v                             |   |
|   |   (Inverter Telemetry Polling)            +----------------------+               |   |
|   |                                           | RS485-1 (Monitor)    |               |   |
|   |   [Wi-Fi 802.11 b/g/n]                    | RJ45: Slave Addr 1   |               |   |
|   +-------------|-----------------------------+----------------------+---------------+   |
+-----------------|------------------------------------------------------------------------+
                  | MQTT (Wi-Fi 2.4 GHz / prefix `datouboss/#`)
                  v
+------------------------------------------------------------------------------------------+
|                              SERVER / HUB (MAC MINI / LINUX / HA)                        |
|                                                                                          |
|   +------------------------------------+      +--------------------------------------+   |
|   |  MQTT Broker (e.g. Mosquitto 1883) | <----+  Python Starlette/SSE Web Dashboard  |   |
|   +-----------------+------------------+      |  (Port 8088 / server.py)             |   |
|                     |                         +-------------------+------------------+   |
|                     v                                             |                      |
|   +------------------------------------+                          v                      |
|   |  Homebridge / Home Assistant       |             Browser Clients                 |   |
|   |  (Battery SOC & Charge State)      |             http://<SERVER_IP>:8088         |   |
|   +------------------------------------+                                                 |
+------------------------------------------------------------------------------------------+
```

---

## 🔌 Hardware Pinout & Wiring

| ESP32 Pin | Function | Direction | Connected Module | Destination Port / Device |
| :--- | :--- | :---: | :--- | :--- |
| **GPIO 16** | UART1 TXD | Output | Transceiver #1 `DI` | Inverter RS485-2 (BMS Port) Pin 1 (A+) / Pin 2 (B-) |
| **GPIO 17** | UART1 RXD | Input | Transceiver #1 `RO` | Inverter RS485-2 (BMS Port) Pin 1 (A+) / Pin 2 (B-) |
| **GPIO 14** | UART2 TXD | Output | Transceiver #2 `DI` | Inverter RS485-1 (Monitor) Pin 7 (A+) / Pin 8 (B-) |
| **GPIO 27** | UART2 RXD | Input | Transceiver #2 `RO` | Inverter RS485-1 (Monitor) Pin 7 (A+) / Pin 8 (B-) |
| **5V / VIN** | Logic Power | Input | Step-down DC-DC (5.1V) | Common +5V Rail |
| **GND** | Ground | - | Common Ground | Common GND (ESP32, RS485 modules, DC-DC, Inverter) |
| **Antenna** | BLE 2.4 GHz | Duplex | Onboard PCB Antenna | JK-BMS Bluetooth |

> [!IMPORTANT]
> **Common Ground Requirement**: Connect the GND lines of both RS485 transceivers, ESP32, DC-DC converter, and the inverter chassis to a common ground point. Floating grounds cause common-mode noise, byte framing corruptions (CRC errors), and transceiver damage.

---

## ⚡ Growatt BMS Protocol (40-Register Map)

The bridge responds to function code `0x03` (Read Holding Registers) at address `0x0001` for `0x0028` (40 registers), returning an 85-byte Modbus RTU payload:

| Register | Parameter Name | Scale / Unit | ESP32 Value Calculation | Description |
| :---: | :--- | :---: | :--- | :--- |
| **1** | MCU FW Version | Raw Hex | `0x0100` | BMS Firmware Version (v1.0) |
| **2** | MCU HW Version | Raw Hex | `0x0100` | BMS Hardware Version (v1.0) |
| **3** | Battery Type | Enum | `0x0001` | **1 = LiFePO4** |
| **4** | Protocol Version | Raw Hex | `0x0100` | Protocol Version (v1.0) |
| **5** | Date: Year | Integer | `0x2026` | Timestamp Year |
| **6** | Status/Data Flags | Bitmask | `0x0000` | Normal status |
| **7** | Date: Month/Day | Raw Hex | `0x0910` | Timestamp Date |
| **8..12** | Bar Code | ASCII | `0x0000` | Serial number string |
| **13** | Manufacturer ID | ID | `0x0001` | Battery Manufacturer ID |
| **14** | Pack Version | Version | `0x0001` | Pack assembly version |
| **15** | Using Capacity | 10 mAh | `(uint16_t)(Cap_Ah * 100.0f)` | Rated capacity (e.g. 150Ah $\to$ 15000) |
| **16** | Gauge Current | 10 mA | `(uint16_t)((int16_t)(I_bat * 100.0f))` | Live battery current (+ charge, - discharge) |
| **19** | BMS Status Flags | Bitmask | `0x0003` | **Bit 0=1 (Charge OK), Bit 1=1 (Discharge OK)** |
| **20** | Error Code | Enum | `0x0000` | **0 = Normal** (No BMS faults) |
| **21** | State of Charge (SOC) | **1 %** | `(uint16_t)SOC` | **Battery Charge Level (e.g. 85 %)** |
| **22** | Pack Total Voltage | **10 mV** | `(uint16_t)(V_bat * 100.0f)` | **Pack Voltage (e.g. 13.35V $\to$ 1335)** |
| **23** | Pack Current | **10 mA** | `(uint16_t)((int16_t)(I_bat * 100.0f))` | Instantaneous pack current |
| **24** | Temperature | **1 °C** | `(uint16_t)((int16_t)T_MOS)` | MOS / Cell temperature |
| **25** | Max Charge Current | **10 mA** | `(uint16_t)(Max_Charge_A * 100.0f)` | **Dynamic Charge Current Limit (e.g. 60A)** |
| **26** | Remaining Capacity | 10 mAh | `(uint16_t)(Cap_Ah * (SOC/100) * 100)` | Available remaining energy |
| **27** | Full Capacity | 10 mAh | `(uint16_t)(Cap_Ah * 100.0f)` | Total nominal capacity |
| **29** | Delta Cell Voltage | **1 mV** | `(uint16_t)(Delta_V * 1000.0f)` | $\Delta V = V_{max} - V_{min}$ (mV) |
| **30** | Cycle Count | Integer | `50` | Total discharge cycles |
| **31** | Pack Online Status | Enum | `0x0001` | 1 = Pack Online and Ready |
| **32** | State of Health (SOH) | **1 %** | `100` | Battery Health Percentage |
| **33** | CV Charge Voltage | **10 mV** | `1440` | **Constant Voltage Cutoff: 14.40V** |
| **34** | Warning Flags | Bitmask | `0x0000` | 0 = No Warnings |
| **35** | Max Discharge Current| **10 mA** | `(uint16_t)(Max_Charge_A * 100.0f)` | Allowed discharge limit |
| **37** | Max Cell Voltage | **1 mV** | `(uint16_t)(Cell_Max * 1000.0f)` | Highest individual cell voltage |
| **38** | Min Cell Voltage | **1 mV** | `(uint16_t)(Cell_Min * 1000.0f)` | Lowest individual cell voltage |
| **39** | Max Cell Index | Index | `Max_Cell_Num` (1..4) | Index of cell with highest voltage |
| **40** | Min Cell Index | Index | `Min_Cell_Num` (1..4) | Index of cell with lowest voltage |

---

## 🛠️ How Zero-Latency Architecture Prevents Error 63

Many standard Modbus bridge implementations fail because they attempt to query the BMS on-demand when the inverter asks. This causes response latency > 300 ms, leading to timeout errors.

This project implements a non-blocking asynchronous pipeline in C++ ([`components/growatt_bms_server/growatt_bms_server.h`](components/growatt_bms_server/growatt_bms_server.h)):
1. **Background Cache**: JK-BMS BLE telemetry runs in an asynchronous FreeRTOS task, constantly keeping an atomic in-memory cache of voltages, SOC, and currents updated.
2. **Instant Response (< 5 ms)**: When an inverter query arrives on UART1, the frame is verified with hardware-accelerated CRC-16-IBM (`0xA001`), loaded with fresh cached telemetry, and pushed directly into the UART transmit FIFO buffer.
3. **No CPU Blocking**: Elimination of blocking `flush()` calls prevents FreeRTOS task starvation and keeps BLE connectivity rock solid.

---

## 🖥️ Web Dashboards & Monitoring

### 1. On-Device ESPHome Dashboard
Directly served by the ESP32 Web Server with custom styling ([`custom_datouboss.css`](custom_datouboss.css)) and logic ([`custom_datouboss.js`](custom_datouboss.js)):
- **Real-Time Live Scheme**: Visual interactive SVG power flow (Grid, Inverter, Battery, Load).
- **Diagnostics Panel**: JK-BMS individual cell voltages, balance status, MOS temperature, and Rx/Tx packet counters.
- **Inverter Controls**: Direct sliders to adjust Utility Charge Current (`A12`), Solar Charge Current (`A14`), and Float Voltage.

### 2. Standalone Starlette / SSE Web Hub ([`web_dashboard/`](web_dashboard/))
A lightweight Python service that connects to your MQTT broker, ingests telemetry, and serves a zero-latency dashboard over Server-Sent Events (SSE):
- **Live Inverter Watchdog**: Automatically detects when the inverter is switched off physically, resetting display badges to `Offline (Вимкнено)` and AC voltage to `0.0V` instead of displaying stale retained MQTT messages.
- **HomeKit Ready**: Bridges battery SOC and charging states directly to Apple Home via Homebridge.

---

## 🚀 Quick Start Guide

### Prerequisites
- ESP32 development board (e.g. ESP32-WROOM-32).
- Two TTL-to-RS485 transceiver modules with automatic flow control (e.g. XY-485 / MAX485).
- RJ45 patch cable (cut and stripped to connect Pins 1, 2 for BMS and Pins 7, 8 for Monitor).
- [ESPHome](https://esphome.io/) (v2024.6 or newer recommended).

### 1. Clone & Configure
```bash
git clone https://github.com/tigersumy/ESP32-JKBMS-Growatt-CAN-Bridge-Emulator.git
cd ESP32-JKBMS-Growatt-CAN-Bridge-Emulator

# Copy example secrets and customize with your credentials
cp secrets.yaml.example secrets.yaml
```

Edit `secrets.yaml`:
```yaml
wifi_ssid: "Your_WiFi_Name"
wifi_password: "Your_WiFi_Password"
ap_password: "Fallback_AP_Password"
ota_password: "Your_OTA_Password"

mqtt_broker: "192.168.1.100"
mqtt_username: "your_user"
mqtt_password: "your_password"

# Bluetooth MAC address of your JK-BMS
jkbms_mac_address: "C8:47:80:XX:XX:XX"
```

### 2. Compile and Flash
```bash
# Compile and upload via USB serial
esphome run datouboss.yml

# Or upload via OTA once initially flashed
esphome run datouboss.yml --device <ESP32_IP>
```

### 3. Start Web Dashboard (Optional)
```bash
cd web_dashboard
cp .env.example .env
# Edit .env with your MQTT broker IP and credentials
pip install -r requirements.txt
python server.py
```
Open `http://localhost:8088` in your browser.

---

## 📂 Repository Structure

```
├── components/
│   └── growatt_bms_server/      # C++ ESPHome custom component implementing Growatt BMS Slave
│       ├── __init__.py
│       └── growatt_bms_server.h # Zero-latency Modbus RTU response generator
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md   # Comprehensive technical specification & mathematics
│   ├── MODBUS_TELEMETRY_GUIDE.md# Modbus register reference & command frames
│   └── PROJECT_OVERVIEW.md      # Obsidian engineering vault document
├── web_dashboard/
│   ├── index.html               # SSE-driven web dashboard
│   ├── server.py                # Starlette / asyncio / MQTT backend server
│   ├── custom_datouboss.css     # Dark theme glassmorphism styling
│   ├── custom_datouboss.js      # Frontend event handler & reactive UI
│   ├── com.datouboss.dashboard.plist # macOS launchd daemon configuration
│   ├── requirements.txt
│   └── .env.example
├── custom_datouboss.css         # ESPHome web server custom CSS
├── custom_datouboss.js          # ESPHome web server custom JS
├── datouboss.yml                # Main ESPHome gateway configuration
├── secrets.yaml.example         # Template for Wi-Fi, MQTT, and BLE credentials
├── run_dashboard.sh             # Dashboard runner script
└── README.md                    # Project documentation
```

---

## 🔒 Security & Privacy Notice

- All confidential credentials (Wi-Fi passwords, MQTT tokens, private MAC addresses) have been externalized into `secrets.yaml` and `.env` files.
- `secrets.yaml` and `.env` are excluded from version control via `.gitignore`.
- Always generate unique passwords for your fallback Access Point and OTA updates before deploying into production.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
Contributions, issues, and feature requests are welcome!
