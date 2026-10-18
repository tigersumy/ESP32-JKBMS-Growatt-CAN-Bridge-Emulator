import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Set

import paho.mqtt.client as mqtt
from starlette.applications import Starlette
from starlette.responses import HTMLResponse, Response, StreamingResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("datouboss_dashboard")

BASE_DIR = Path(__file__).resolve().parent

MQTT_BROKER = os.getenv("MQTT_BROKER", "127.0.0.1")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "")
MQTT_PASS = os.getenv("MQTT_PASS", "")
MQTT_PREFIX = os.getenv("MQTT_PREFIX", "datouboss")
PORT = int(os.getenv("PORT", "8088"))

cached_states: Dict[str, dict] = {}
sse_subscribers: Set[asyncio.Queue] = set()
loop: asyncio.AbstractEventLoop = None

INVERTER_ENTITIES = {
    "sensor-ac_voltage",
    "sensor-hv_bus_voltage",
    "sensor-inverter_status",
    "sensor-battery_voltage",
    "sensor-battery_current",
    "sensor-battery_soc",
    "sensor-transformer_temperature",
    "sensor-dcdc_temperature",
    "sensor-a12_utility_charge_current",
    "sensor-a12_charge_current",
    "sensor-a14_solar_charge_current",
    "sensor-a14_charge_current",
    "sensor-float_charge_voltage",
    "sensor-max_charge_current",
    "sensor-max_current_limit",
    "sensor-growatt_rx_packets",
    "sensor-growatt_bms_rx_packets",
    "sensor-growatt_tx_packets",
    "sensor-growatt_bms_tx_packets",
    "text_sensor-growatt_last_request",
    "text_sensor-growatt_bms_last_request",
}

last_inverter_telemetry_time: float = 0.0
inverter_is_online: bool = False

ALIASES = {
    "sensor-jk_soc": "sensor-jk_state_of_charge",
    "sensor-jk_capacity_remaining": "sensor-jk_remaining_capacity",
    "sensor-jk_mos_temp": "sensor-jk_mos_temperature",
    "sensor-growatt_rx_packets": "sensor-growatt_bms_rx_packets",
    "sensor-growatt_tx_packets": "sensor-growatt_bms_tx_packets",
    "text_sensor-growatt_last_request": "text_sensor-growatt_bms_last_request",
    "sensor-dt_wifi_signal": "sensor-wifi_signal",
    "sensor-dt_uptime": "sensor-uptime",
    "sensor-dt_free_heap": "sensor-free_heap",
    "text_sensor-dt_reset_reason": "text_sensor-reset_reason",
    "number-a12_charge_current_num": "number-a12_utility_current_setting",
    "number-a14_charge_current_num": "number-a14_solar_current_setting",
    "number-max_charge_current_num": "number-max_charge_current_setting",
    "number-float_voltage_num": "number-float_voltage_setting",
    "switch-jk_switch_charging": "switch-jk_bms_charging",
    "switch-jk_switch_discharging": "switch-jk_bms_discharging",
    "switch-jk_switch_balancer": "switch-jk_bms_balancer",
    "switch-jk_switch_smart_sleep": "switch-jk_bms_smart_sleep",
    "text_sensor-ip_address": "sensor-ip_address",
    "text_sensor-connected_ssid": "sensor-connected_ssid",
    "text_sensor-jk_errors": "sensor-jk_bms_errors",
    "text_sensor-jk_balancer_status": "sensor-jk_balancer_status",
    "text_sensor-dt_reset_reason": "sensor-reset_reason",
    "text_sensor-reset_reason": "sensor-reset_reason",
    "text_sensor-growatt_bms_last_request": "sensor-growatt_bms_last_request",
}

NUMBER_CMD_TOPICS = {
    "A12 Utility Current Setting": "datouboss/number/a12_utility_current_setting/command",
    "a12_charge_current_num": "datouboss/number/a12_utility_current_setting/command",
    "A14 Solar Current Setting": "datouboss/number/a14_solar_current_setting/command",
    "a14_charge_current_num": "datouboss/number/a14_solar_current_setting/command",
    "Max Charge Current Setting": "datouboss/number/max_charge_current_setting/command",
    "max_charge_current_num": "datouboss/number/max_charge_current_setting/command",
    "Float Voltage Setting": "datouboss/number/float_voltage_setting/command",
    "float_voltage_num": "datouboss/number/float_voltage_setting/command",
    "BMS Max Charge Current": "datouboss/number/bms_max_charge_current/command",
    "bms_max_charge_current": "datouboss/number/bms_max_charge_current/command",
}

SWITCH_CMD_TOPICS = {
    "jk_switch_charging": "datouboss/switch/jk_bms_charging/command",
    "jk_bms_charging": "datouboss/switch/jk_bms_charging/command",
    "jk_switch_discharging": "datouboss/switch/jk_bms_discharging/command",
    "jk_bms_discharging": "datouboss/switch/jk_bms_discharging/command",
    "jk_switch_balancer": "datouboss/switch/jk_bms_balancer/command",
    "jk_bms_balancer": "datouboss/switch/jk_bms_balancer/command",
    "jk_switch_smart_sleep": "datouboss/switch/jk_bms_smart_sleep/command",
    "jk_bms_smart_sleep": "datouboss/switch/jk_bms_smart_sleep/command",
}

mqtt_client = mqtt.Client()

def on_mqtt_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to MQTT broker %s:%d", MQTT_BROKER, MQTT_PORT)
        client.subscribe(f"{MQTT_PREFIX}/#")
    else:
        logger.error("Failed to connect to MQTT broker, return code: %d", rc)

def parse_val(payload_str: str):
    try:
        if "." in payload_str:
            return float(payload_str)
        return int(payload_str)
    except ValueError:
        if payload_str.upper() in ("ON", "TRUE"):
            return True
        if payload_str.upper() in ("OFF", "FALSE"):
            return False
        return payload_str

def broadcast_state(entity_id: str, state_text: str, val, retained: bool = False):
    payload = json.dumps({"id": entity_id, "state": state_text, "value": val, "retained": retained})
    msg = f"event: state\ndata: {payload}\n\n"
    
    cached_states[entity_id] = msg
    
    for alias_id, target_id in ALIASES.items():
        if target_id == entity_id:
            alias_payload = json.dumps({"id": alias_id, "state": state_text, "value": val, "retained": retained})
            cached_states[alias_id] = f"event: state\ndata: {alias_payload}\n\n"
        elif alias_id == entity_id:
            alias_payload = json.dumps({"id": target_id, "state": state_text, "value": val, "retained": retained})
            cached_states[target_id] = f"event: state\ndata: {alias_payload}\n\n"

    if loop and sse_subscribers:
        for q in list(sse_subscribers):
            loop.call_soon_threadsafe(q.put_nowait, msg)

def set_inverter_online(is_online: bool):
    global inverter_is_online
    inverter_is_online = is_online
    state_str = "ON" if is_online else "OFF"
    logger.info("Inverter online status updated: %s (is_online=%s)", state_str, is_online)
    broadcast_state("binary_sensor-inverter_online", state_str, is_online, retained=False)

async def inverter_watchdog_loop():
    while True:
        try:
            await asyncio.sleep(2)
            now = time.time()
            is_live = (now - last_inverter_telemetry_time < 25) if last_inverter_telemetry_time > 0 else False
            if is_live != inverter_is_online:
                set_inverter_online(is_live)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Error in inverter watchdog: %s", e)

def on_mqtt_message(client, userdata, msg):
    global last_inverter_telemetry_time
    topic = msg.topic
    parts = topic.split("/")
    if len(parts) >= 4 and parts[0] == MQTT_PREFIX and parts[-1] == "state":
        component = parts[1]
        name = parts[2]
        payload = msg.payload.decode(errors="ignore")
        
        entity_id = f"{component}-{name}"
        val = parse_val(payload)
        
        # Track active inverter telemetry (only from live, non-retained messages)
        if (entity_id in INVERTER_ENTITIES or f"sensor-{name}" in INVERTER_ENTITIES) and not msg.retain:
            last_inverter_telemetry_time = time.time()
            if not inverter_is_online:
                set_inverter_online(True)
                
        broadcast_state(entity_id, payload, val, msg.retain)

mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
mqtt_client.on_connect = on_mqtt_connect
mqtt_client.on_message = on_mqtt_message

@asynccontextmanager
async def lifespan(app: Starlette):
    global loop
    loop = asyncio.get_running_loop()
    
    # Initialize offline state by default in cache
    set_inverter_online(False)
    
    logger.info("Starting MQTT client...")
    try:
        mqtt_client.connect_async(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
    except Exception as e:
        logger.error("Error connecting MQTT: %s", e)
        
    watchdog_task = asyncio.create_task(inverter_watchdog_loop())
    yield
    watchdog_task.cancel()
    mqtt_client.loop_stop()

async def sse_endpoint(request):
    queue = asyncio.Queue()
    sse_subscribers.add(queue)

    async def event_generator():
        try:
            for state_msg in cached_states.values():
                yield state_msg.encode("utf-8")
            
            yield b": ping\n\n"

            while True:
                data = await queue.get()
                yield data.encode("utf-8")
        except asyncio.CancelledError:
            pass
        finally:
            sse_subscribers.discard(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

async def switch_control(request):
    switch_id = request.path_params.get("switch_id")
    action = request.path_params.get("action")
    cmd_topic = SWITCH_CMD_TOPICS.get(switch_id, f"{MQTT_PREFIX}/switch/{switch_id}/command")
    payload = "ON" if action == "turn_on" else "OFF"
    
    logger.info("Switch command: %s -> %s = %s", switch_id, cmd_topic, payload)
    mqtt_client.publish(cmd_topic, payload)
    return Response(status_code=200)

async def number_control(request):
    number_id = request.path_params.get("number_id")
    value = request.query_params.get("value")
    if value is None:
        return Response(status_code=400, content="Missing value parameter")
    
    cmd_topic = NUMBER_CMD_TOPICS.get(number_id, f"{MQTT_PREFIX}/number/{number_id}/command")
    logger.info("Number command: %s -> %s = %s", number_id, cmd_topic, value)
    mqtt_client.publish(cmd_topic, str(value))
    return Response(status_code=200)

async def index_page(request):
    html_file = BASE_DIR / "index.html"
    return HTMLResponse(content=html_file.read_text(encoding="utf-8"))

routes = [
    Route("/", endpoint=index_page),
    Route("/events", endpoint=sse_endpoint),
    Route("/switch/{switch_id}/{action}", endpoint=switch_control, methods=["POST"]),
    Route("/number/{number_id}/set", endpoint=number_control, methods=["POST"]),
    Mount("/", app=StaticFiles(directory=str(BASE_DIR)), name="static"),
]

app = Starlette(routes=routes, lifespan=lifespan)

if __name__ == "__main__":
    logger.info("Starting Datouboss Web Dashboard on http://0.0.0.0:%d", PORT)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
