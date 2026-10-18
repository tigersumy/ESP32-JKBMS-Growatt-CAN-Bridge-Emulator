import esphome.codegen as cg
from esphome.components import uart, sensor, number, text_sensor
import esphome.config_validation as cv
from esphome.const import CONF_ID

DEPENDENCIES = ["uart"]
AUTO_LOAD = ["sensor", "number", "text_sensor"]

growatt_bms_ns = cg.esphome_ns.namespace("growatt_bms")
GrowattBmsServer = growatt_bms_ns.class_("GrowattBmsServer", cg.Component, uart.UARTDevice)

CONF_VOLTAGE_SENSOR = "voltage_sensor"
CONF_CURRENT_SENSOR = "current_sensor"
CONF_SOC_SENSOR = "soc_sensor"
CONF_TEMP_SENSOR = "temp_sensor"
CONF_MAX_CHARGE_CURRENT_NUMBER = "max_charge_current_number"
CONF_RX_PACKETS_SENSOR = "rx_packets_sensor"
CONF_TX_PACKETS_SENSOR = "tx_packets_sensor"
CONF_LAST_REQUEST_SENSOR = "last_request_sensor"

CONF_CELL_1_SENSOR = "cell_1_sensor"
CONF_CELL_2_SENSOR = "cell_2_sensor"
CONF_CELL_3_SENSOR = "cell_3_sensor"
CONF_CELL_4_SENSOR = "cell_4_sensor"
CONF_CAPACITY_SENSOR = "capacity_sensor"
CONF_DELTA_VOLTAGE_SENSOR = "delta_voltage_sensor"

CONFIG_SCHEMA = (
    cv.Schema({
        cv.GenerateID(): cv.declare_id(GrowattBmsServer),
        cv.Required(CONF_VOLTAGE_SENSOR): cv.use_id(sensor.Sensor),
        cv.Required(CONF_CURRENT_SENSOR): cv.use_id(sensor.Sensor),
        cv.Required(CONF_SOC_SENSOR): cv.use_id(sensor.Sensor),
        cv.Required(CONF_TEMP_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_MAX_CHARGE_CURRENT_NUMBER): cv.use_id(number.Number),
        cv.Optional(CONF_RX_PACKETS_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_TX_PACKETS_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_LAST_REQUEST_SENSOR): cv.use_id(text_sensor.TextSensor),
        cv.Optional(CONF_CELL_1_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_CELL_2_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_CELL_3_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_CELL_4_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_CAPACITY_SENSOR): cv.use_id(sensor.Sensor),
        cv.Optional(CONF_DELTA_VOLTAGE_SENSOR): cv.use_id(sensor.Sensor),
    })
    .extend(cv.COMPONENT_SCHEMA)
    .extend(uart.UART_DEVICE_SCHEMA)
)

async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    await uart.register_uart_device(var, config)

    sens = await cg.get_variable(config[CONF_VOLTAGE_SENSOR])
    cg.add(var.set_voltage_sensor(sens))

    sens = await cg.get_variable(config[CONF_CURRENT_SENSOR])
    cg.add(var.set_current_sensor(sens))

    sens = await cg.get_variable(config[CONF_SOC_SENSOR])
    cg.add(var.set_soc_sensor(sens))

    sens = await cg.get_variable(config[CONF_TEMP_SENSOR])
    cg.add(var.set_temp_sensor(sens))

    if CONF_MAX_CHARGE_CURRENT_NUMBER in config:
        num = await cg.get_variable(config[CONF_MAX_CHARGE_CURRENT_NUMBER])
        cg.add(var.set_max_charge_current_number(num))

    if CONF_RX_PACKETS_SENSOR in config:
        sens = await cg.get_variable(config[CONF_RX_PACKETS_SENSOR])
        cg.add(var.set_rx_packets_sensor(sens))

    if CONF_TX_PACKETS_SENSOR in config:
        sens = await cg.get_variable(config[CONF_TX_PACKETS_SENSOR])
        cg.add(var.set_tx_packets_sensor(sens))

    if CONF_LAST_REQUEST_SENSOR in config:
        sens = await cg.get_variable(config[CONF_LAST_REQUEST_SENSOR])
        cg.add(var.set_last_request_sensor(sens))

    if CONF_CELL_1_SENSOR in config:
        sens = await cg.get_variable(config[CONF_CELL_1_SENSOR])
        cg.add(var.set_cell_1_sensor(sens))

    if CONF_CELL_2_SENSOR in config:
        sens = await cg.get_variable(config[CONF_CELL_2_SENSOR])
        cg.add(var.set_cell_2_sensor(sens))

    if CONF_CELL_3_SENSOR in config:
        sens = await cg.get_variable(config[CONF_CELL_3_SENSOR])
        cg.add(var.set_cell_3_sensor(sens))

    if CONF_CELL_4_SENSOR in config:
        sens = await cg.get_variable(config[CONF_CELL_4_SENSOR])
        cg.add(var.set_cell_4_sensor(sens))

    if CONF_CAPACITY_SENSOR in config:
        sens = await cg.get_variable(config[CONF_CAPACITY_SENSOR])
        cg.add(var.set_capacity_sensor(sens))

    if CONF_DELTA_VOLTAGE_SENSOR in config:
        sens = await cg.get_variable(config[CONF_DELTA_VOLTAGE_SENSOR])
        cg.add(var.set_delta_voltage_sensor(sens))
