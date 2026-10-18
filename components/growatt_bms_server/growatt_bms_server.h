#pragma once

#include "esphome/core/component.h"
#include "esphome/components/uart/uart.h"
#include "esphome/components/sensor/sensor.h"
#include "esphome/components/number/number.h"
#include "esphome/components/text_sensor/text_sensor.h"
#include <vector>
#include <esp_ota_ops.h>

namespace esphome {
namespace growatt_bms {

class GrowattBmsServer : public Component, public uart::UARTDevice {
 public:
  GrowattBmsServer() = default;

  void setup() override {
    // Immediately mark new OTA image as valid to prevent unwanted rollback
    esp_ota_mark_app_valid_cancel_rollback();

    while (this->available()) {
      this->read();
    }
    ESP_LOGI("growatt_bms", "Growatt BMS Server initialized on UART (GPIO17 RX / GPIO16 TX, 9600 8N1)");
  }

  void loop() override {
    while (this->available()) {
      uint8_t c;
      this->read_byte(&c);
      this->rx_buffer_.push_back(c);
      this->last_byte_time_ = millis();
    }

    // Protection against buffer accumulation from line noise
    if (this->rx_buffer_.size() > 256) {
      this->rx_buffer_.clear();
    }

    // 5ms silence timeout triggers frame processing (Modbus RTU 3.5 char @ 9600 baud is ~3.65ms)
    if (!this->rx_buffer_.empty() && (millis() - this->last_byte_time_ > 5)) {
      this->handle_frame();
      this->rx_buffer_.clear();
    }
  }

  void set_voltage_sensor(sensor::Sensor *s) { this->voltage_sensor_ = s; }
  void set_current_sensor(sensor::Sensor *s) { this->current_sensor_ = s; }
  void set_soc_sensor(sensor::Sensor *s) { this->soc_sensor_ = s; }
  void set_temp_sensor(sensor::Sensor *s) { this->temp_sensor_ = s; }
  void set_max_charge_current_number(number::Number *n) { this->max_charge_current_num_ = n; }

  void set_rx_packets_sensor(sensor::Sensor *s) { this->rx_packets_sensor_ = s; }
  void set_tx_packets_sensor(sensor::Sensor *s) { this->tx_packets_sensor_ = s; }
  void set_last_request_sensor(text_sensor::TextSensor *s) { this->last_req_sensor_ = s; }

  void set_cell_1_sensor(sensor::Sensor *s) { this->cell_1_sensor_ = s; }
  void set_cell_2_sensor(sensor::Sensor *s) { this->cell_2_sensor_ = s; }
  void set_cell_3_sensor(sensor::Sensor *s) { this->cell_3_sensor_ = s; }
  void set_cell_4_sensor(sensor::Sensor *s) { this->cell_4_sensor_ = s; }
  void set_capacity_sensor(sensor::Sensor *s) { this->capacity_sensor_ = s; }
  void set_delta_voltage_sensor(sensor::Sensor *s) { this->delta_voltage_sensor_ = s; }

 protected:
  std::vector<uint8_t> rx_buffer_;
  uint32_t last_byte_time_{0};
  uint32_t rx_count_{0};
  uint32_t tx_count_{0};
  uint32_t last_telemetry_publish_{0};

  sensor::Sensor *voltage_sensor_{nullptr};
  sensor::Sensor *current_sensor_{nullptr};
  sensor::Sensor *soc_sensor_{nullptr};
  sensor::Sensor *temp_sensor_{nullptr};
  number::Number *max_charge_current_num_{nullptr};

  sensor::Sensor *rx_packets_sensor_{nullptr};
  sensor::Sensor *tx_packets_sensor_{nullptr};
  text_sensor::TextSensor *last_req_sensor_{nullptr};

  sensor::Sensor *cell_1_sensor_{nullptr};
  sensor::Sensor *cell_2_sensor_{nullptr};
  sensor::Sensor *cell_3_sensor_{nullptr};
  sensor::Sensor *cell_4_sensor_{nullptr};
  sensor::Sensor *capacity_sensor_{nullptr};
  sensor::Sensor *delta_voltage_sensor_{nullptr};

  static uint16_t crc16(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t pos = 0; pos < len; pos++) {
      crc ^= (uint16_t)data[pos];
      for (int i = 8; i != 0; i--) {
        if ((crc & 0x0001) != 0) {
          crc >>= 1;
          crc ^= 0xA001;
        } else {
          crc >>= 1;
        }
      }
    }
    return crc;
  }

  void handle_frame() {
    if (this->rx_buffer_.size() < 8) {
      return;
    }

    // Verify CRC immediately before doing any processing
    size_t len = this->rx_buffer_.size();
    uint16_t expected_crc = (this->rx_buffer_[len - 1] << 8) | this->rx_buffer_[len - 2];
    uint16_t computed_crc = crc16(this->rx_buffer_.data(), len - 2);

    if (expected_crc != computed_crc) {
      ESP_LOGW("growatt_bms", "CRC Mismatch: exp 0x%04X, got 0x%04X", expected_crc, computed_crc);
      return;
    }

    uint8_t slave_id = this->rx_buffer_[0];
    uint8_t func = this->rx_buffer_[1];

    if (func == 0x03 || func == 0x04) {
      uint16_t start_reg = (this->rx_buffer_[2] << 8) | this->rx_buffer_[3];
      uint16_t reg_count = (this->rx_buffer_[4] << 8) | this->rx_buffer_[5];

      if (reg_count > 64) reg_count = 64;
      uint8_t byte_count = (uint8_t)(reg_count * 2);

      float v_bat = (this->voltage_sensor_ && this->voltage_sensor_->has_state()) ? this->voltage_sensor_->state : 13.3f;
      float i_bat = (this->current_sensor_ && this->current_sensor_->has_state()) ? this->current_sensor_->state : 0.0f;
      float soc = (this->soc_sensor_ && this->soc_sensor_->has_state()) ? this->soc_sensor_->state : 100.0f;
      float temp_c = (this->temp_sensor_ && this->temp_sensor_->has_state()) ? this->temp_sensor_->state : 25.0f;
      float max_chg = 65.0f;
      if (this->max_charge_current_num_ && this->max_charge_current_num_->has_state()) {
        max_chg = this->max_charge_current_num_->state;
      }
      float cap_ah = (this->capacity_sensor_ && this->capacity_sensor_->has_state()) ? this->capacity_sensor_->state : 140.0f;
      float delta_v = (this->delta_voltage_sensor_ && this->delta_voltage_sensor_->has_state()) ? this->delta_voltage_sensor_->state : 0.001f;
      float c1 = (this->cell_1_sensor_ && this->cell_1_sensor_->has_state()) ? this->cell_1_sensor_->state : (v_bat / 4.0f);
      float c2 = (this->cell_2_sensor_ && this->cell_2_sensor_->has_state()) ? this->cell_2_sensor_->state : (v_bat / 4.0f);
      float c3 = (this->cell_3_sensor_ && this->cell_3_sensor_->has_state()) ? this->cell_3_sensor_->state : (v_bat / 4.0f);
      float c4 = (this->cell_4_sensor_ && this->cell_4_sensor_->has_state()) ? this->cell_4_sensor_->state : (v_bat / 4.0f);

      // Protect against zero / uninitialized cell voltages
      if (c1 <= 0.5f) c1 = v_bat / 4.0f;
      if (c2 <= 0.5f) c2 = v_bat / 4.0f;
      if (c3 <= 0.5f) c3 = v_bat / 4.0f;
      if (c4 <= 0.5f) c4 = v_bat / 4.0f;
      if (v_bat <= 5.0f) v_bat = 13.3f;

      float cells[4] = {c1, c2, c3, c4};
      float max_c = cells[0];
      float min_c = cells[0];
      uint16_t max_idx = 1;
      uint16_t min_idx = 1;
      for (int k = 1; k < 4; k++) {
        if (cells[k] > max_c) {
          max_c = cells[k];
          max_idx = (uint16_t)(k + 1);
        }
        if (cells[k] < min_c) {
          min_c = cells[k];
          min_idx = (uint16_t)(k + 1);
        }
      }
      if (max_c < 2.0f) max_c = 3.33f;
      if (min_c < 2.0f) min_c = 3.32f;

      std::vector<uint8_t> resp;
      resp.push_back(slave_id);
      resp.push_back(func);
      resp.push_back(byte_count);

      for (uint16_t i = 0; i < reg_count; i++) {
        uint16_t reg_idx = start_reg + i;
        uint16_t reg_val = 0;

        // Q/SZQY—20001—2017 Growatt RS485 ESS Protocol (40-register block starting at reg 1)
        if (start_reg == 1 && reg_count >= 20) {
          switch (reg_idx) {
            case 1:  reg_val = 0x0100; break; // MCU FW Version 1.0
            case 2:  reg_val = 0x0100; break; // MCU HW Version 1.0
            case 3:  reg_val = 0x0001; break; // Battery Type: 1 = LiFePO4
            case 4:  reg_val = 0x0100; break; // Protocol Version 1.0
            case 5:  reg_val = 0x2026; break; // Date/Time Year
            case 6:  reg_val = 0x0000; break; // Status/Data
            case 7:  reg_val = 0x0910; break; // Date/Time Month/Day
            case 8:
            case 9:
            case 10:
            case 11:
            case 12: reg_val = 0x0000; break; // Bar Code
            case 13: reg_val = 0x0001; break; // BMS Manufacturer ID
            case 14: reg_val = 0x0001; break; // PACK Manufacturer & Version
            case 15: reg_val = (uint16_t)(cap_ah * 100.0f); break; // Using Cap (10mAh)
            case 16: reg_val = (uint16_t)((int16_t)(i_bat * 100.0f)); break; // Gauge IC Current (10mA)
            case 17: reg_val = 0x0000; break; // Date Lo
            case 18: reg_val = 0x0000; break; // Date Hi
            case 19: reg_val = 0x0003; break; // Status: Bit 0=Charge OK, Bit 1=Discharge OK
            case 20: reg_val = 0x0000; break; // Error code (0 = Normal, no errors)
            case 21: reg_val = (uint16_t)soc; break; // SOC %
            case 22: reg_val = (uint16_t)(v_bat * 100.0f); break; // Voltage in 10mV (e.g. 13.27V -> 1327)
            case 23: reg_val = (uint16_t)((int16_t)(i_bat * 100.0f)); break; // Current in 10mA
            case 24: reg_val = (uint16_t)((int16_t)temp_c); break; // Temp in degC
            case 25: reg_val = (uint16_t)(max_chg * 100.0f); break; // Max Charge Current (10mA, e.g. 65.0A -> 6500)
            case 26: reg_val = (uint16_t)(cap_ah * (soc / 100.0f) * 100.0f); break; // Remaining Capacity (10mAh)
            case 27: reg_val = (uint16_t)(cap_ah * 100.0f); break; // Full Capacity (10mAh, 140Ah -> 14000)
            case 28: reg_val = 0x0100; break; // YW/FW Version
            case 29: reg_val = (uint16_t)(delta_v * 1000.0f); break; // Delta Cell Voltage (mV)
            case 30: reg_val = 50; break; // Cycles
            case 31: reg_val = 0x0001; break; // Battery ID / Pack Online
            case 32: reg_val = 100; break; // SOH 100%
            case 33: reg_val = 1440; break; // CV Voltage (Constant Voltage Charge limit) in 10mV: 14.40V
            case 34: reg_val = 0x0000; break; // Warning (0 = No warning)
            case 35: reg_val = (uint16_t)(max_chg * 100.0f); break; // Max Discharge Current (10mA, e.g. 65.0A -> 6500)
            case 36: reg_val = 0x0000; break; // Extended Error (0 = Normal)
            case 37: reg_val = (uint16_t)(max_c * 1000.0f); break; // Max Cell Voltage (mV, e.g. 3330)
            case 38: reg_val = (uint16_t)(min_c * 1000.0f); break; // Min Cell Voltage (mV, e.g. 3320)
            case 39: reg_val = max_idx; break; // Max Cell Index (1..4)
            case 40: reg_val = min_idx; break; // Min Cell Index (1..4)
            default: reg_val = 0x0000; break;
          }
        } else {
          // Standard short 5-register Growatt query (0-based)
          if (reg_idx == 0) {
            reg_val = (uint16_t)(v_bat * 100.0f);
          } else if (reg_idx == 1) {
            reg_val = (uint16_t)soc;
          } else if (reg_idx == 2) {
            reg_val = (uint16_t)(max_chg * 10.0f);
          } else if (reg_idx == 3) {
            reg_val = 1500;
          } else if (reg_idx == 4) {
            reg_val = (uint16_t)(temp_c * 10.0f);
          } else {
            reg_val = 0;
          }
        }

        resp.push_back((reg_val >> 8) & 0xFF);
        resp.push_back(reg_val & 0xFF);
      }

      uint16_t resp_crc = crc16(resp.data(), resp.size());
      resp.push_back(resp_crc & 0xFF);
      resp.push_back((resp_crc >> 8) & 0xFF);

      // Immediately transmit response to inverter without blocking or delay
      this->write_array(resp.data(), resp.size());

      this->tx_count_++;
      this->rx_count_++;

      // Throttle telemetry updates and logging to every 5 seconds
      uint32_t now = millis();
      if (now - this->last_telemetry_publish_ >= 5000) {
        this->last_telemetry_publish_ = now;
        if (this->tx_packets_sensor_ != nullptr) {
          this->tx_packets_sensor_->publish_state(this->tx_count_);
        }
        if (this->rx_packets_sensor_ != nullptr) {
          this->rx_packets_sensor_->publish_state(this->rx_count_);
        }
        if (this->last_req_sensor_ != nullptr) {
          char hex_buf[48];
          size_t out_pos = 0;
          for (size_t i = 0; i < this->rx_buffer_.size() && i < 8; i++) {
            out_pos += snprintf(hex_buf + out_pos, sizeof(hex_buf) - out_pos, "%02X ", this->rx_buffer_[i]);
          }
          this->last_req_sensor_->publish_state(hex_buf);
        }
        ESP_LOGI("growatt_bms", "BMS OK: Reg=0x%04X, Count=%d -> Resp=%d B (V=%.2fV, SOC=%.0f%%)",
                 start_reg, reg_count, (int)resp.size(), v_bat, soc);
      }
    }
  }
};

}  // namespace growatt_bms
}  // namespace esphome
