document.addEventListener('DOMContentLoaded', () => {
  // Set orange favicon and page title (styled like Sandisolar 192.168.31.219, in orange theme)
  try {
    document.title = 'Datouboss Controller';
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#og)"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="30" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">DT</text></svg>`;
    const faviconUrl = 'data:image/svg+xml,' + encodeURIComponent(faviconSvg);
    let favLink = document.querySelector("link[rel*='icon']");
    if (!favLink) {
      favLink = document.createElement('link');
      favLink.rel = 'icon';
      document.head.appendChild(favLink);
    }
    favLink.type = 'image/svg+xml';
    favLink.href = faviconUrl;
  } catch (e) {
    console.warn('Could not set favicon:', e);
  }

  const root = document.createElement('div');
  root.id = 'custom-dashboard';
  document.body.appendChild(root);

  root.innerHTML = `
    <!-- Header -->
    <div class="dash-header">
      <div class="logo-section">
        <div class="logo-icon">DT</div>
        <div class="logo-title">
          <h1>DT Datouboss & JK-BMS Bridge <span class="badge-pill">ESP32 WROOM</span></h1>
          <p>Мультипротокольний шлюз: Інвертор Datouboss DT-1218 + JK-BMS BLE + Growatt BMS Emulator</p>
        </div>
      </div>
      <div class="header-right">
        <div class="connection-status">
          <div class="status-dot" id="status-dot"></div>
          <span id="status-text">Підключення...</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="dash-nav">
      <button class="nav-tab active" data-tab="tab-overview">📊 Огляд</button>
      <button class="nav-tab" data-tab="tab-inverter">⚡ Інвертор Datouboss</button>
      <button class="nav-tab" data-tab="tab-jkbms">🔋 JK-BMS Батарея</button>
      <button class="nav-tab" data-tab="tab-growatt">🌉 Growatt BMS Шлюз</button>
      <button class="nav-tab" data-tab="tab-system">🛠️ Діагностика & Логи</button>
    </div>

    <!-- Quick Stat Badges (Always visible) -->
    <div class="quick-stats-grid">
      <div class="stat-badge">
        <div class="stat-icon">🔌</div>
        <div class="stat-meta">
          <span class="stat-label">Мережа AC</span>
          <span class="stat-val val-cyan" id="quick-ac-voltage">---</span>
        </div>
      </div>
      <div class="stat-badge">
        <div class="stat-icon">⚡</div>
        <div class="stat-meta">
          <span class="stat-label">Режим Інвертора</span>
          <span class="stat-val val-blue" id="quick-inverter-status">---</span>
        </div>
      </div>
      <div class="stat-badge">
        <div class="stat-icon">🔋</div>
        <div class="stat-meta">
          <span class="stat-label">АКБ Напруга (JK)</span>
          <span class="stat-val val-green" id="quick-bat-voltage">---</span>
        </div>
      </div>
      <div class="stat-badge">
        <div class="stat-icon">📊</div>
        <div class="stat-meta">
          <span class="stat-label">Заряд АКБ (SOC)</span>
          <span class="stat-val val-green" id="quick-bat-soc">---</span>
        </div>
      </div>
    </div>

    <!-- TAB 1: OVERVIEW -->
    <div class="tab-pane active" id="tab-overview">
      <!-- 4-Cells Pack Visualizer -->
      <div class="battery-pack-visualizer">
        <div class="pack-header">
          <div class="pack-title">
            <span>🔋 Осередки LiFePO4 (JK-BMS 4S)</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span>ΔV: <span id="visual-delta-voltage" class="val-green" style="font-weight:700;">---</span> mV</span>
            <span>|</span>
            <span>MOS: <span id="visual-mos-temp" style="font-weight:700;">---</span></span>
            <span>|</span>
            <span id="visual-balancer-badge" class="badge-pill" style="font-size:0.75rem; background:rgba(255,255,255,0.06); color:var(--text-muted); border-color:rgba(255,255,255,0.1);">Балансир: Очікування</span>
            <span id="visual-balancer-current" style="font-weight:700; color:var(--accent-orange); display:none;">0.000 A</span>
          </div>
        </div>
        <div class="cells-grid">
          <div class="cell-meter" id="cell-box-1">
            <span class="cell-name">Cell 1</span>
            <div class="cell-bar-wrap">
              <div class="cell-bar-fill" id="cell-fill-1" style="height: 50%;"></div>
            </div>
            <span class="cell-volt-text" id="val-sensor-cell_1_voltage">--- V</span>
            <span class="cell-balance-badge" id="cell-bal-1" style="display:none;"></span>
          </div>
          <div class="cell-meter" id="cell-box-2">
            <span class="cell-name">Cell 2</span>
            <div class="cell-bar-wrap">
              <div class="cell-bar-fill" id="cell-fill-2" style="height: 50%;"></div>
            </div>
            <span class="cell-volt-text" id="val-sensor-cell_2_voltage">--- V</span>
            <span class="cell-balance-badge" id="cell-bal-2" style="display:none;"></span>
          </div>
          <div class="cell-meter" id="cell-box-3">
            <span class="cell-name">Cell 3</span>
            <div class="cell-bar-wrap">
              <div class="cell-bar-fill" id="cell-fill-3" style="height: 50%;"></div>
            </div>
            <span class="cell-volt-text" id="val-sensor-cell_3_voltage">--- V</span>
            <span class="cell-balance-badge" id="cell-bal-3" style="display:none;"></span>
          </div>
          <div class="cell-meter" id="cell-box-4">
            <span class="cell-name">Cell 4</span>
            <div class="cell-bar-wrap">
              <div class="cell-bar-fill" id="cell-fill-4" style="height: 50%;"></div>
            </div>
            <span class="cell-volt-text" id="val-sensor-cell_4_voltage">--- V</span>
            <span class="cell-balance-badge" id="cell-bal-4" style="display:none;"></span>
          </div>
        </div>
      </div>

      <div class="cards-grid">
        <!-- Overview Card 1: Inverter Summary -->
        <div class="dash-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">⚡ Інвертор Datouboss DT-1218</h2>
              <div class="card-subtitle">Порт RS485-1 (Контур 2)</div>
            </div>
            <span class="badge-pill" id="badge-inv-comm">RS485 OK</span>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">🏢 Вхідна напруга AC</span>
              <span class="param-value val-cyan" id="overview-ac-voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ HV перетворювач</span>
              <span class="param-value val-orange" id="overview-hv-voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚙️ Статус інвертора</span>
              <span class="param-value" id="overview-inverter-status">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔋 Напруга АКБ (з інвертора)</span>
              <span class="param-value" id="overview-dt-battery-voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Струм заряду інвертора</span>
              <span class="param-value" id="overview-dt-battery-current">---</span>
            </div>
          </div>
        </div>

        <!-- Overview Card 2: JK-BMS Summary -->
        <div class="dash-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">🔋 Акумуляторна батарея JK-BMS</h2>
              <div class="card-subtitle">Bluetooth BLE (JK-BMS)</div>
            </div>
            <span class="badge-pill" style="background:rgba(16,185,129,0.15); color:var(--accent-green); border-color:rgba(16,185,129,0.3);" id="badge-ble-status">BLE CONNECTED</span>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">📈 Загальна напруга АКБ</span>
              <span class="param-value val-green" id="overview-jk-total-voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Струм АКБ (JK)</span>
              <span class="param-value" id="overview-jk-current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📊 Рівень заряду (SOC)</span>
              <span class="param-value val-green" id="overview-jk-soc">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔋 Залишкова ємність</span>
              <span class="param-value" id="overview-jk-capacity">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Потужність заряду / розряду</span>
              <span class="param-value" id="overview-jk-power">---</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: INVERTER DATOUBOSS -->
    <div class="tab-pane" id="tab-inverter">
      <div class="cards-grid">
        <!-- Telemetry -->
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">📊 Телеметрія параметрів (Holding Regs)</h2>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">🏢 Напруга мережі AC (Reg 2)</span>
              <span class="param-value val-cyan" id="val-sensor-ac_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ HV перетворювач (Reg 4)</span>
              <span class="param-value val-orange" id="val-sensor-hv_bus_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📈 Напруга акумулятора (Reg 8)</span>
              <span class="param-value val-green" id="val-sensor-battery_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Струм акумулятора (Reg 17)</span>
              <span class="param-value" id="val-sensor-battery_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📊 Заряд батареї (BMS SOC)</span>
              <span class="param-value val-green" id="inverter-tab-bms-soc">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚙️ Поріг відновлення A20 (Reg 20)</span>
              <span class="param-value" id="val-sensor-battery_soc">51 %</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔌 Струм від мережі A12 (Reg 12)</span>
              <span class="param-value val-cyan" id="val-sensor-a12_utility_charge_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">☀️ Сонячний / макс струм A14 (Reg 14)</span>
              <span class="param-value val-orange" id="val-sensor-a14_solar_charge_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚓ Буферна напруга Float (Reg 21)</span>
              <span class="param-value" id="val-sensor-float_charge_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🚀 Макс. струм заряду (Reg 24)</span>
              <span class="param-value" id="val-sensor-max_charge_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🎚️ Максимальний ліміт струму (Reg 51)</span>
              <span class="param-value" id="val-sensor-max_current_limit">---</span>
            </div>
          </div>
        </div>

        <!-- Controls & Temperatures -->
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">⚙️ Керування та температури</h2>
          </div>
          <div class="param-list">
            <!-- A12 Utility Current Control -->
            <div class="param-row">
              <div>
                <span class="param-name" style="font-weight:600; color:var(--text-primary);">🔌 Струм від мережі (A12)</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">Регістр 12 (10A - 80A, зараз в меню: 30A)</div>
              </div>
              <div class="control-input-group">
                <input type="number" id="input-a12-current" min="10" max="80" step="1" placeholder="30" class="custom-num-input">
                <button class="btn-send" onclick="applyA12Current()">Застосувати</button>
              </div>
            </div>

            <!-- A14 Solar/Total Current Control -->
            <div class="param-row">
              <div>
                <span class="param-name" style="font-weight:600; color:var(--text-primary);">☀️ Сонячний / загальний струм (A14)</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">Регістр 14 (10A - 80A, зараз в меню: 45A)</div>
              </div>
              <div class="control-input-group">
                <input type="number" id="input-a14-current" min="10" max="80" step="1" placeholder="45" class="custom-num-input">
                <button class="btn-send" onclick="applyA14Current()">Застосувати</button>
              </div>
            </div>

            <!-- Float Voltage Control -->
            <div class="param-row">
              <div>
                <span class="param-name" style="font-weight:600; color:var(--text-primary);">⚓ Буферна напруга (Float)</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">Регістр 21 (13.0V - 14.6V)</div>
              </div>
              <div class="control-input-group">
                <input type="number" id="input-float-voltage" min="13.0" max="14.6" step="0.1" placeholder="13.8" class="custom-num-input">
                <button class="btn-send" onclick="applyFloatVoltage()">Застосувати</button>
              </div>
            </div>

            <!-- Max Charge Current Control -->
            <div class="param-row">
              <div>
                <span class="param-name" style="font-weight:600; color:var(--text-primary);">🚀 Загальний ліміт струму</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">Регістр 24 (10A - 80A)</div>
              </div>
              <div class="control-input-group">
                <input type="number" id="input-charge-current" min="10" max="80" step="1" placeholder="40" class="custom-num-input">
                <button class="btn-send" onclick="applyChargeCurrent()">Застосувати</button>
              </div>
            </div>

            <!-- Temperatures -->
            <div style="margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 12px;">
              <div class="param-row">
                <span class="param-name">🌡️ Температура трансформатора (Reg 15)</span>
                <span class="param-value" id="val-sensor-transformer_temperature">---</span>
              </div>
              <div class="param-row">
                <span class="param-name">🌡️ Температура DC-DC (Reg 16)</span>
                <span class="param-value" id="val-sensor-dcdc_temperature">---</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: JK-BMS TELEMETRY -->
    <div class="tab-pane" id="tab-jkbms">
      <div class="cards-grid">
        <!-- Cells & Voltages -->
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">🔋 Напруги осередків та балансування</h2>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">Осередок 1 (Cell 1)</span>
              <span class="param-value val-green" id="tab-cell-1">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Осередок 2 (Cell 2)</span>
              <span class="param-value val-green" id="tab-cell-2">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Осередок 3 (Cell 3)</span>
              <span class="param-value val-green" id="tab-cell-3">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Осередок 4 (Cell 4)</span>
              <span class="param-value val-green" id="tab-cell-4">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📐 Мінімальна напруга осередку</span>
              <span class="param-value" id="val-sensor-jk_min_cell_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📐 Максимальна напруга осередку</span>
              <span class="param-value" id="val-sensor-jk_max_cell_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚖️ Дельта напруги осередків (ΔV)</span>
              <span class="param-value val-green" id="val-sensor-jk_delta_cell_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔄 Стан балансування</span>
              <span class="param-value" id="val-text_sensor-jk_balancer_status">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Струм балансування</span>
              <span class="param-value val-orange" id="val-sensor-jk_balancing_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🎯 Напрямок перекачування</span>
              <span class="param-value" id="val-balancer-direction">Немає</span>
            </div>
            <div class="param-row">
              <span class="param-name">🌡️ Температура MOSFET</span>
              <span class="param-value" id="val-sensor-jk_mos_temp">---</span>
            </div>
          </div>
        </div>

        <!-- Protection Switches & Power -->
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">🛡️ Захисні ключі та потужність</h2>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">📈 Загальна напруга батареї</span>
              <span class="param-value val-green" id="val-sensor-jk_total_voltage">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Струм батареї (A)</span>
              <span class="param-value" id="val-sensor-jk_current">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📊 Рівень заряду (SOC)</span>
              <span class="param-value val-green" id="val-sensor-jk_soc">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔋 Залишкова ємність (Ah)</span>
              <span class="param-value" id="val-sensor-jk_capacity_remaining">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Потужність заряду</span>
              <span class="param-value val-green" id="val-sensor-jk_charging_power">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚡ Потужність розряду</span>
              <span class="param-value val-orange" id="val-sensor-jk_discharging_power">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⚠️ Помилки JK-BMS</span>
              <span class="param-value val-purple" id="val-text_sensor-jk_errors">Немає помилок</span>
            </div>

            <!-- Switch Toggles -->
            <div style="margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 12px; display:flex; flex-direction:column; gap:10px;">
              <div class="param-row">
                <span class="param-name">🔌 Дозвіл заряду (Charging MOS)</span>
                <label class="switch-label">
                  <input type="checkbox" id="switch-jk_bms_charging" onchange="toggleSwitch('jk_bms_charging', this.checked)">
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <span class="param-name">💡 Дозвіл розряду (Discharging MOS)</span>
                <label class="switch-label">
                  <input type="checkbox" id="switch-jk_bms_discharging" onchange="toggleSwitch('jk_bms_discharging', this.checked)">
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <span class="param-name">⚖️ Активний балансир (Balancer)</span>
                <label class="switch-label">
                  <input type="checkbox" id="switch-jk_bms_balancer" onchange="toggleSwitch('jk_bms_balancer', this.checked)">
                  <span class="switch-slider"></span>
                </label>
              </div>
              <div class="param-row">
                <span class="param-name">💤 Режим сну (Smart Sleep)</span>
                <label class="switch-label">
                  <input type="checkbox" id="switch-jk_bms_smart_sleep" onchange="toggleSwitch('jk_bms_smart_sleep', this.checked)">
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: GROWATT BMS BRIDGE -->
    <div class="tab-pane" id="tab-growatt">
      <div class="cards-grid">
        <!-- Bridge Status -->
        <div class="dash-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">🌉 Емуляція Growatt BMS Slave</h2>
              <div class="card-subtitle">RS485-2 BMS Port (9600 8N1, Slave Addr 1)</div>
            </div>
            <div class="bridge-status-pill bridge-idle" id="bridge-pill">
              <div class="status-dot" id="bridge-dot"></div>
              <span id="bridge-status-text">Очікування запиту...</span>
            </div>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">📥 Отримано пакетів від інвертора (Rx)</span>
              <span class="param-value val-cyan" id="val-sensor-growatt_bms_rx_packets">0</span>
            </div>
            <div class="param-row">
              <span class="param-name">📤 Відправлено відповідей інвертору (Tx)</span>
              <span class="param-value val-green" id="val-sensor-growatt_bms_tx_packets">0</span>
            </div>
            <div class="param-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
              <span class="param-name">🔍 Останній запит інвертора (Hex):</span>
              <div class="hex-request-box" style="width:100%;">
                <span id="val-text_sensor-growatt_bms_last_request">Очікування першого запиту...</span>
              </div>
            </div>
            <div class="param-row">
              <div>
                <span class="param-name" style="font-weight:600; color:var(--text-primary);">🚀 Ліміт струму заряду для BMS</span>
                <div style="font-size:0.75rem; color:var(--text-muted);">Транслюється в Регістр 2 Growatt (10A - 150A)</div>
              </div>
              <div class="control-input-group">
                <input type="number" id="input-bms-max-current" min="10" max="150" step="1" placeholder="65" class="custom-num-input">
                <button class="btn-send" onclick="applyBmsMaxCurrent()">Задати</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modbus Mapping Info & Guide -->
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">📋 Мапінг регістрів Growatt та статус</h2>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">Reg 0: Battery Voltage (0.01 V)</span>
              <span class="param-value val-green" id="growatt-map-volt">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Reg 1: Battery SOC (%)</span>
              <span class="param-value val-green" id="growatt-map-soc">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Reg 2: Max Charge Current (0.1 A)</span>
              <span class="param-value" id="growatt-map-max-charge">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">Reg 3: Max Discharge Current (0.1 A)</span>
              <span class="param-value">150.0 A (Fixed)</span>
            </div>
            <div class="param-row">
              <span class="param-name">Reg 4: Battery Temperature (0.1 °C)</span>
              <span class="param-value" id="growatt-map-temp">---</span>
            </div>
          </div>
          <div style="margin-top:14px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid var(--border-color); font-size:0.83rem; color:var(--text-secondary); line-height:1.5;">
            <b style="color:var(--text-primary);">Підключення до інвертора:</b>
            <ul style="margin:6px 0 0 16px; padding:0;">
              <li>Порт інвертора: <b>RS485-2 (BMS)</b></li>
              <li>Розпіновка RJ45: Пін 2 = <b>A(+)</b>, Пін 1 = <b>B(-)</b>, Пін 8/3 = <b>GND</b></li>
              <li>Налаштування інвертора: <b>A17 = Li</b>, <b>A18 = Growatt (GRW)</b></li>
              <li>Результат: <b>Помилка 63 зникає</b>, інвертор відображає точний SOC % з JK-BMS.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: SYSTEM & LOGS -->
    <div class="tab-pane" id="tab-system">
      <div class="cards-grid">
        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">🌐 Мережа та стан ESP32</h2>
          </div>
          <div class="param-list">
            <div class="param-row">
              <span class="param-name">🌐 IP адреса</span>
              <span class="param-value val-cyan" id="val-text_sensor-ip_address">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📡 Wi-Fi мережа (SSID)</span>
              <span class="param-value" id="val-text_sensor-connected_ssid">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">📶 Wi-Fi сигнал (RSSI)</span>
              <span class="param-value" id="val-sensor-wifi_signal">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">⏱️ Час безперервної роботи (Uptime)</span>
              <span class="param-value" id="val-sensor-uptime">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">💾 Вільна оперативна пам'ять (RAM)</span>
              <span class="param-value val-green" id="val-sensor-dt_free_heap">---</span>
            </div>
            <div class="param-row">
              <span class="param-name">🔄 Причина рестарту (Reset Reason)</span>
              <span class="param-value val-orange" id="val-text_sensor-dt_reset_reason">---</span>
            </div>
          </div>
        </div>

        <div class="dash-card">
          <div class="card-header">
            <h2 class="card-title">📋 Логи подій (Live Terminal)</h2>
            <button onclick="clearLogs()" style="background:rgba(255,255,255,0.06); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:6px; padding:4px 10px; cursor:pointer; font-size:0.75rem;">Очистити</button>
          </div>
          <div class="terminal-card" id="terminal-box">
            <div class="log-entry"><span class="log-time">[System]</span><span class="log-msg info">Ініціалізація інтерфейсу завершена. Очікування потоку подій /events...</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab switching logic
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      navTabs.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });

  // Keep focus state on inputs so SSE doesn't overwrite values while typing
  document.querySelectorAll('.custom-num-input').forEach(input => {
    input.addEventListener('focus', () => { input.dataset.userEditing = 'true'; });
    input.addEventListener('blur', () => { input.dataset.userEditing = ''; });
  });

  // State cache
  const stateCache = {};

  // Server-Sent Events listener
  const eventSource = new EventSource('/events');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  eventSource.onopen = () => {
    if (statusDot) statusDot.className = 'status-dot online';
    if (statusText) statusText.innerText = 'Онлайн';
    addLog('Підключено до EventSource', 'success');
  };

  eventSource.onerror = () => {
    if (statusDot) statusDot.className = 'status-dot';
    if (statusText) statusText.innerText = 'Відновлення...';
  };

  let isInverterOnline = false;

  function updateInverterOnlineUI(isOnline) {
    isInverterOnline = isOnline;
    const badge = document.getElementById('badge-inv-comm');
    const qStatus = document.getElementById('quick-inverter-status');
    const ovStatus = document.getElementById('overview-inverter-status');
    const qAc = document.getElementById('quick-ac-voltage');
    const ovAc = document.getElementById('overview-ac-voltage');
    const valAc = document.getElementById('val-sensor-ac_voltage');
    const valInvStatus = document.getElementById('val-sensor-inverter_status');

    if (!isOnline) {
      if (badge) {
        badge.innerText = 'ВИМКНЕНО (ОФЛАЙН)';
        badge.style.background = 'rgba(148,163,184,0.15)';
        badge.style.color = '#94a3b8';
        badge.style.borderColor = 'rgba(148,163,184,0.3)';
      }
      if (qStatus) qStatus.innerHTML = '<span style="color:var(--text-muted)">Вимкнено (Офлайн)</span>';
      if (ovStatus) ovStatus.innerHTML = '<span style="color:var(--text-muted)">Вимкнено (Офлайн)</span>';
      if (valInvStatus) {
        const cached = stateCache['sensor-inverter_status'];
        const text = cached ? getInverterStatusText(cached.value) : '';
        valInvStatus.innerHTML = `<span style="color:var(--text-muted)">Вимкнено (Офлайн)${text ? ' [було: ' + text + ']' : ''}</span>`;
      }
      if (qAc) qAc.innerHTML = '<span style="color:var(--text-muted)">0.0 V</span>';
      if (ovAc) ovAc.innerHTML = '<span style="color:var(--text-muted)">0.0 V</span>';
      if (valAc) valAc.innerHTML = '<span style="color:var(--text-muted)">0.0 V (Офлайн)</span>';

      const pill = document.getElementById('bridge-pill');
      const dot = document.getElementById('bridge-dot');
      const txt = document.getElementById('bridge-status-text');
      if (pill) pill.className = 'bridge-status-pill bridge-idle';
      if (dot) dot.className = 'status-dot';
      if (txt) txt.innerText = 'Інвертор вимкнено';
    } else {
      if (badge) {
        badge.innerText = 'RS485 OK';
        badge.style.background = 'rgba(16,185,129,0.15)';
        badge.style.color = 'var(--accent-green)';
        badge.style.borderColor = 'rgba(16,185,129,0.3)';
      }
      const cached = stateCache['sensor-inverter_status'];
      if (cached && cached.value !== undefined && cached.value !== null) {
        const text = getInverterStatusText(cached.value);
        if (qStatus) qStatus.innerText = text;
        if (ovStatus) ovStatus.innerText = text;
        if (valInvStatus) valInvStatus.innerText = `${text} (${cached.value})`;
      }
      const cachedAc = stateCache['sensor-ac_voltage'];
      if (cachedAc && cachedAc.state) {
        if (qAc) qAc.innerText = cachedAc.state;
        if (ovAc) ovAc.innerText = cachedAc.state;
        if (valAc) valAc.innerText = cachedAc.state;
      }
    }
  }

  // Initialize offline by default until live confirmation
  updateInverterOnlineUI(false);

  eventSource.addEventListener('state', (e) => {
    try {
      const data = JSON.parse(e.data);
      updateEntity(data.id, data.state, data.value);
    } catch (err) {
      console.error('Error parsing SSE event:', err);
    }
  });

  function updateEntity(id, stateText, val) {
    stateCache[id] = { state: stateText, value: val };

    if (id === 'binary_sensor-inverter_online') {
      updateInverterOnlineUI(val === true || stateText === 'ON' || stateText === 'true');
      return;
    }

    let el = document.getElementById(`val-${id}`);
    if (!el && id === 'sensor-jk_state_of_charge') el = document.getElementById('val-sensor-jk_soc');
    if (!el && id === 'sensor-jk_remaining_capacity') el = document.getElementById('val-sensor-jk_capacity_remaining');
    if (!el && id === 'sensor-jk_mos_temperature') el = document.getElementById('val-sensor-jk_mos_temp');
    if (!el && (id === 'sensor-ip_address' || id === 'text_sensor-ip_address')) el = document.getElementById('val-text_sensor-ip_address');
    if (!el && (id === 'sensor-connected_ssid' || id === 'text_sensor-connected_ssid')) el = document.getElementById('val-text_sensor-connected_ssid');
    if (!el && (id === 'sensor-reset_reason' || id === 'text_sensor-reset_reason')) el = document.getElementById('val-text_sensor-dt_reset_reason');
    if (!el && (id === 'sensor-jk_bms_errors' || id === 'sensor-jk_errors')) el = document.getElementById('val-text_sensor-jk_errors');
    if (el) {
      el.innerText = stateText;
    }

    // Direct mappings
    if (id === 'sensor-ac_voltage') {
      const q = document.getElementById('quick-ac-voltage');
      const ov = document.getElementById('overview-ac-voltage');
      if (isInverterOnline) {
        if (q) q.innerText = stateText;
        if (ov) ov.innerText = stateText;
        if (el) el.innerText = stateText;
      } else {
        if (q) q.innerHTML = '<span style="color:var(--text-muted)">0.0 V</span>';
        if (ov) ov.innerHTML = '<span style="color:var(--text-muted)">0.0 V</span>';
        if (el) el.innerHTML = '<span style="color:var(--text-muted)">0.0 V (Офлайн)</span>';
      }
    } else if (id === 'sensor-hv_bus_voltage') {
      const ov = document.getElementById('overview-hv-voltage');
      if (ov) ov.innerText = stateText;
    } else if (id === 'sensor-inverter_status') {
      const q = document.getElementById('quick-inverter-status');
      const ov = document.getElementById('overview-inverter-status');
      const text = getInverterStatusText(val);
      if (isInverterOnline) {
        if (q) q.innerText = text;
        if (ov) ov.innerText = text;
        if (el) el.innerText = `${text} (${val})`;
        const badge = document.getElementById('badge-inv-comm');
        if (badge) {
          badge.innerText = 'RS485 OK';
          badge.style.background = 'rgba(16,185,129,0.15)';
          badge.style.color = 'var(--accent-green)';
          badge.style.borderColor = 'rgba(16,185,129,0.3)';
        }
      } else {
        if (q) q.innerHTML = '<span style="color:var(--text-muted)">Вимкнено (Офлайн)</span>';
        if (ov) ov.innerHTML = '<span style="color:var(--text-muted)">Вимкнено (Офлайн)</span>';
        if (el) el.innerHTML = `<span style="color:var(--text-muted)">Вимкнено (Офлайн) [було: ${text}]</span>`;
      }
    } else if (id === 'sensor-battery_voltage') {
      const ov = document.getElementById('overview-dt-battery-voltage');
      if (ov) ov.innerText = stateText;
    } else if (id === 'sensor-battery_current') {
      const ov = document.getElementById('overview-dt-battery-current');
      if (ov) ov.innerText = stateText;
    } else if (id === 'sensor-battery_soc') {
      const v = document.getElementById('val-sensor-battery_soc');
      if (v) v.innerText = stateText;
      const q = document.getElementById('quick-bat-soc');
      if (q && q.innerText === '---') q.innerText = stateText.includes('%') ? stateText : `${stateText} %`;
    } else if (id === 'sensor-jk_total_voltage') {
      const q = document.getElementById('quick-bat-voltage');
      if (q) q.innerText = stateText;
      const ov = document.getElementById('overview-jk-total-voltage');
      if (ov) ov.innerText = stateText;
      const gw = document.getElementById('growatt-map-volt');
      if (gw) gw.innerText = `${stateText} (${Math.round(parseFloat(val)*100)} у Reg 22)`;
    } else if (id === 'sensor-jk_soc' || id === 'sensor-jk_state_of_charge') {
      const textVal = stateText.includes('%') ? stateText : `${stateText} %`;
      const q = document.getElementById('quick-bat-soc');
      if (q) q.innerText = textVal;
      const ov = document.getElementById('overview-jk-soc');
      if (ov) ov.innerText = textVal;
      const invBmsSoc = document.getElementById('inverter-tab-bms-soc');
      if (invBmsSoc) invBmsSoc.innerText = textVal;
      const gw = document.getElementById('growatt-map-soc');
      if (gw) gw.innerText = `${textVal} (у Reg 21)`;
      const v = document.getElementById('val-sensor-jk_soc');
      if (v) v.innerText = textVal;
    } else if (id === 'sensor-jk_current') {
      const ov = document.getElementById('overview-jk-current');
      if (ov) ov.innerText = stateText;
    } else if (id === 'sensor-jk_capacity_remaining' || id === 'sensor-jk_remaining_capacity') {
      const ov = document.getElementById('overview-jk-capacity');
      if (ov) ov.innerText = stateText;
      const v = document.getElementById('val-sensor-jk_capacity_remaining');
      if (v) v.innerText = stateText;
    } else if (id === 'sensor-jk_mos_temp' || id === 'sensor-jk_mos_temperature') {
      const vmos = document.getElementById('visual-mos-temp');
      if (vmos) vmos.innerText = stateText;
      const gw = document.getElementById('growatt-map-temp');
      if (gw) gw.innerText = `${stateText} (${Math.round(parseFloat(val)*10)} у Reg 24)`;
      const v = document.getElementById('val-sensor-jk_mos_temp');
      if (v) v.innerText = stateText;
    } else if (id === 'sensor-jk_charging_power' || id === 'sensor-jk_discharging_power') {
      updatePowerSummary();
    } else if (id === 'sensor-jk_delta_cell_voltage') {
      const vdelta = document.getElementById('visual-delta-voltage');
      const mv = (parseFloat(val) * 1000).toFixed(0);
      if (vdelta) vdelta.innerText = mv;
    } else if (id === 'sensor-cell_1_voltage' || id === 'sensor-cell_2_voltage' || id === 'sensor-cell_3_voltage' || id === 'sensor-cell_4_voltage') {
      updateCellVisual(id, val, stateText);
    } else if (id === 'sensor-growatt_rx_packets' || id === 'sensor-growatt_bms_rx_packets') {
      const elRx = document.getElementById('val-sensor-growatt_bms_rx_packets') || document.getElementById('val-sensor-growatt_rx_packets');
      if (elRx) elRx.innerText = stateText;
      const count = parseInt(val, 10) || 0;
      if (count > 0 && isInverterOnline) {
        const pill = document.getElementById('bridge-pill');
        const dot = document.getElementById('bridge-dot');
        const txt = document.getElementById('bridge-status-text');
        if (pill) pill.className = 'bridge-status-pill bridge-active';
        if (dot) dot.className = 'status-dot online';
        if (txt) txt.innerText = 'Активний обмін';
      }
    } else if (id === 'sensor-growatt_tx_packets' || id === 'sensor-growatt_bms_tx_packets') {
      const elTx = document.getElementById('val-sensor-growatt_bms_tx_packets') || document.getElementById('val-sensor-growatt_tx_packets');
      if (elTx) elTx.innerText = stateText;
    } else if (id === 'text_sensor-growatt_last_request' || id === 'text_sensor-growatt_bms_last_request') {
      const elReq = document.getElementById('val-text_sensor-growatt_bms_last_request') || document.getElementById('val-text_sensor-growatt_last_request');
      if (elReq) elReq.innerText = stateText;
    } else if (id === 'number-bms_max_charge_current') {
      const gw = document.getElementById('growatt-map-max-charge');
      if (gw) gw.innerText = `${stateText} (${Math.round(parseFloat(val)*10)} у Reg 2)`;
      const inp = document.getElementById('input-bms-max-current');
      if (inp && !inp.dataset.userEditing) inp.value = val;
    } else if (id === 'number-float_voltage_setting' || id === 'number-float_voltage_num') {
      const inp = document.getElementById('input-float-voltage');
      if (inp && !inp.dataset.userEditing) inp.value = val;
    } else if (id === 'number-max_charge_current_setting' || id === 'number-max_charge_current_num') {
      const inp = document.getElementById('input-charge-current');
      if (inp && !inp.dataset.userEditing) inp.value = val;
    } else if (id === 'number-a12_utility_current_setting' || id === 'number-a12_charge_current_num') {
      const inp = document.getElementById('input-a12-current');
      if (inp && !inp.dataset.userEditing) inp.value = val;
    } else if (id === 'number-a14_solar_current_setting' || id === 'number-a14_charge_current_num') {
      const inp = document.getElementById('input-a14-current');
      if (inp && !inp.dataset.userEditing) inp.value = val;
    } else if (id.startsWith('switch-')) {
      const sw = document.getElementById(id);
      if (sw) sw.checked = (stateText.toUpperCase() === 'ON' || val === true);
    } else if (id === 'sensor-wifi_signal' || id === 'sensor-dt_wifi_signal') {
      const elRssi = document.getElementById('val-sensor-wifi_signal') || document.getElementById('val-sensor-dt_wifi_signal');
      if (elRssi) elRssi.innerText = `${stateText} dBm`;
    } else if (id === 'sensor-uptime' || id === 'sensor-dt_uptime') {
      const elUp = document.getElementById('val-sensor-uptime') || document.getElementById('val-sensor-dt_uptime');
      if (elUp) {
        const sec = parseInt(val, 10);
        if (!isNaN(sec)) {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          elUp.innerText = `${h}г ${m}хв ${s}с`;
        } else {
          elUp.innerText = stateText;
        }
      }
    } else if (id === 'sensor-dt_free_heap') {
      const elHeap = document.getElementById('val-sensor-dt_free_heap');
      if (elHeap) elHeap.innerText = `${parseFloat(val).toFixed(1)} кБ`;
    } else if (id === 'text_sensor-ip_address' || id === 'sensor-ip_address') {
      const elIp = document.getElementById('val-text_sensor-ip_address');
      if (elIp) elIp.innerText = stateText;
    } else if (id === 'text_sensor-connected_ssid' || id === 'sensor-connected_ssid') {
      const elSsid = document.getElementById('val-text_sensor-connected_ssid');
      if (elSsid) elSsid.innerText = stateText;
    } else if (id === 'text_sensor-dt_reset_reason' || id === 'text_sensor-reset_reason' || id === 'sensor-reset_reason') {
      const elRst = document.getElementById('val-text_sensor-dt_reset_reason');
      if (elRst) elRst.innerText = stateText;
    } else if (id === 'text_sensor-jk_errors' || id === 'sensor-jk_bms_errors' || id === 'sensor-jk_errors') {
      const elErr = document.getElementById('val-text_sensor-jk_errors');
      if (elErr) {
        if (!stateText || stateText.trim() === '') {
          elErr.innerText = 'Немає помилок';
          elErr.className = 'param-value val-purple';
        } else {
          elErr.innerText = stateText;
          elErr.className = 'param-value val-red';
        }
      }
    } else if (id === 'sensor-jk_balancing_current') {
      balanceCurrent = Math.abs(parseFloat(val)) || 0;
      const elCur = document.getElementById('val-sensor-jk_balancing_current');
      if (elCur) elCur.innerText = `${balanceCurrent.toFixed(3)} A`;
      updateBalancerVisual();
    } else if (id === 'binary_sensor-jk_balancing_active') {
      isBalancing = (stateText.toUpperCase() === 'ON' || val === true || val === 1);
      updateBalancerVisual();
    } else if (id === 'text_sensor-jk_balancer_status') {
      const elSt = document.getElementById('val-text_sensor-jk_balancer_status');
      if (elSt) {
        if (stateText.toLowerCase().includes('balanc')) {
          elSt.innerHTML = '<span class="val-green">Балансування</span>';
          isBalancing = true;
        } else {
          elSt.innerHTML = '<span style="color:var(--text-muted)">Очікування (Idle)</span>';
          if (!stateCache['binary_sensor-jk_balancing_active']) isBalancing = false;
        }
      }
      updateBalancerVisual();
    } else if (id === 'sensor-jk_min_voltage_cell') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) minCell = parsed;
      updateBalancerVisual();
    } else if (id === 'sensor-jk_max_voltage_cell') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) maxCell = parsed;
      updateBalancerVisual();
    } else if (id === 'sensor-jk_min_cell_voltage' || id === 'sensor-jk_max_cell_voltage') {
      updateBalancerVisual();
    }

    // Power calculation for summary
    updatePowerSummary();
  }

  function getInverterStatusText(val) {
    const code = parseInt(val, 10);
    if (code === 0) return 'Standby (Очікування)';
    if (code === 1) return 'Line Mode (Мережа)';
    if (code === 2) return 'Battery Mode (АКБ)';
    if (code === 3) return 'Fault (Помилка)';
    return `Режим ${val}`;
  }

  function updateCellVisual(id, val, text) {
    const num = id.replace('sensor-cell_', '').replace('_voltage', '');
    const fill = document.getElementById(`cell-fill-${num}`);
    const tabEl = document.getElementById(`tab-cell-${num}`);
    if (tabEl) tabEl.innerText = text;

    const v = parseFloat(val);
    if (!isNaN(v) && fill) {
      // 3.0V = 0%, 3.65V = 100%
      const pct = Math.min(100, Math.max(5, ((v - 3.0) / 0.65) * 100));
      fill.style.height = `${pct}%`;
      if (v < 3.1) {
        fill.style.background = 'linear-gradient(0deg, #ef4444 0%, #f87171 100%)';
      } else if (v < 3.25) {
        fill.style.background = 'linear-gradient(0deg, #f59e0b 0%, #fbbf24 100%)';
      } else {
        fill.style.background = 'linear-gradient(0deg, #10b981 0%, #34d399 100%)';
      }
    }
  }

  function updatePowerSummary() {
    const pwrEl = document.getElementById('overview-jk-power');
    if (!pwrEl) return;
    const chg = stateCache['sensor-jk_charging_power'];
    const dchg = stateCache['sensor-jk_discharging_power'];
    const chgW = chg ? parseFloat(chg.value) || 0 : 0;
    const dchgW = dchg ? parseFloat(dchg.value) || 0 : 0;
    if (chgW > 5) {
      pwrEl.innerHTML = `<span class="val-green">+${chgW.toFixed(0)} W (Зарядка)</span>`;
    } else if (dchgW > 5) {
      pwrEl.innerHTML = `<span class="val-orange">-${dchgW.toFixed(0)} W (Розряд)</span>`;
    } else {
      pwrEl.innerText = '0 W (Спокій)';
    }
  }

  // Balancer state & visualizer
  let minCell = 0;
  let maxCell = 0;
  let isBalancing = false;
  let balanceCurrent = 0;

  function updateBalancerVisual() {
    // 1. Pack header elements
    const badge = document.getElementById('visual-balancer-badge');
    const curEl = document.getElementById('visual-balancer-current');
    if (badge) {
      if (isBalancing) {
        badge.className = 'badge-pill bridge-active';
        badge.style.background = 'rgba(16, 185, 129, 0.2)';
        badge.style.color = '#34d399';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.innerText = 'Балансир: Активний';
      } else {
        badge.className = 'badge-pill';
        badge.style.background = 'rgba(255, 255, 255, 0.06)';
        badge.style.color = 'var(--text-muted)';
        badge.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        badge.innerText = 'Балансир: Очікування';
      }
    }
    if (curEl) {
      if (isBalancing && balanceCurrent > 0) {
        curEl.style.display = 'inline';
        curEl.innerText = `${balanceCurrent.toFixed(3)} A`;
      } else {
        curEl.style.display = 'none';
      }
    }

    // 2. Direction in Tab 3 & Min/Max Cell labels
    const dirEl = document.getElementById('val-balancer-direction');
    if (dirEl) {
      if (isBalancing && maxCell > 0 && minCell > 0 && maxCell !== minCell) {
        dirEl.innerHTML = `<span class="val-red">Cell ${maxCell}</span> ➔ <span class="val-green">Cell ${minCell}</span>`;
      } else if (isBalancing) {
        dirEl.innerText = 'Активно';
      } else {
        dirEl.innerText = 'Немає';
      }
    }

    const elMin = document.getElementById('val-sensor-jk_min_cell_voltage');
    if (elMin && stateCache['sensor-jk_min_cell_voltage']) {
      const v = stateCache['sensor-jk_min_cell_voltage'].value || stateCache['sensor-jk_min_cell_voltage'].state;
      const num = parseFloat(v);
      elMin.innerText = (!isNaN(num) && minCell > 0) ? `${num.toFixed(3)} V (Cell ${minCell})` : `${v} V`;
    }

    const elMax = document.getElementById('val-sensor-jk_max_cell_voltage');
    if (elMax && stateCache['sensor-jk_max_cell_voltage']) {
      const v = stateCache['sensor-jk_max_cell_voltage'].value || stateCache['sensor-jk_max_cell_voltage'].state;
      const num = parseFloat(v);
      elMax.innerText = (!isNaN(num) && maxCell > 0) ? `${num.toFixed(3)} V (Cell ${maxCell})` : `${v} V`;
    }

    // 3. Cell badges (1 to 4)
    for (let i = 1; i <= 4; i++) {
      const bTag = document.getElementById(`cell-bal-${i}`);
      const box = document.getElementById(`cell-box-${i}`);
      if (box) {
        box.classList.remove('balancing-source', 'balancing-target');
      }
      if (bTag) {
        if (isBalancing && maxCell === i) {
          bTag.style.display = 'inline-block';
          bTag.className = 'cell-balance-badge cell-balance-source';
          bTag.innerText = '⬆ Віддає';
          if (box) box.classList.add('balancing-source');
        } else if (isBalancing && minCell === i) {
          bTag.style.display = 'inline-block';
          bTag.className = 'cell-balance-badge cell-balance-target';
          bTag.innerText = '⬇ Приймає';
          if (box) box.classList.add('balancing-target');
        } else {
          bTag.style.display = 'none';
        }
      }
    }
  }

  // Terminal logs
  function addLog(msg, type = 'info') {
    const box = document.getElementById('terminal-box');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'log-entry';
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg ${type}">${msg}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    while (box.children.length > 80) box.removeChild(box.firstChild);
  }

  window.clearLogs = () => {
    const box = document.getElementById('terminal-box');
    if (box) box.innerHTML = '';
  };

  // Commands & POST Handlers
  window.toggleSwitch = (switchId, checked) => {
    const action = checked ? 'turn_on' : 'turn_off';
    const url = `/switch/${switchId}/${action}`;
    addLog(`Команда перемикачу: POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Успішно перемкнено: ${switchId} (${action})`, 'success');
        else addLog(`Помилка перемикача ${switchId}: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };

  window.applyA12Current = () => {
    const inp = document.getElementById('input-a12-current');
    const val = inp ? inp.value : null;
    if (!val) return;
    if (inp) inp.dataset.userEditing = '';
    const url = `/number/${encodeURIComponent('A12 Utility Current Setting')}/set?value=${encodeURIComponent(val)}`;
    addLog(`Встановлення струму мережі (A12, Reg 12): POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Струм мережі (A12) успішно змінено на ${val} A`, 'success');
        else addLog(`Помилка A12: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };

  window.applyA14Current = () => {
    const inp = document.getElementById('input-a14-current');
    const val = inp ? inp.value : null;
    if (!val) return;
    if (inp) inp.dataset.userEditing = '';
    const url = `/number/${encodeURIComponent('A14 Solar Current Setting')}/set?value=${encodeURIComponent(val)}`;
    addLog(`Встановлення сонячного/макс струму (A14, Reg 14): POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Сонячний/макс струм (A14) успішно змінено на ${val} A`, 'success');
        else addLog(`Помилка A14: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };

  window.applyFloatVoltage = () => {
    const inp = document.getElementById('input-float-voltage');
    const val = inp ? inp.value : null;
    if (!val) return;
    if (inp) inp.dataset.userEditing = '';
    const url = `/number/${encodeURIComponent('Float Voltage Setting')}/set?value=${encodeURIComponent(val)}`;
    addLog(`Встановлення буферної напруги: POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Буферну напругу успішно оновлено: ${val} V`, 'success');
        else addLog(`Помилка Float: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };

  window.applyChargeCurrent = () => {
    const inp = document.getElementById('input-charge-current');
    const val = inp ? inp.value : null;
    if (!val) return;
    if (inp) inp.dataset.userEditing = '';
    const url = `/number/${encodeURIComponent('Max Charge Current Setting')}/set?value=${encodeURIComponent(val)}`;
    addLog(`Встановлення макс. струму заряду (Reg 24): POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Макс. струм заряду (Reg 24) оновлено: ${val} A`, 'success');
        else addLog(`Помилка Reg 24: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };

  window.applyBmsMaxCurrent = () => {
    const inp = document.getElementById('input-bms-max-current');
    const val = inp ? inp.value : null;
    if (!val) return;
    if (inp) inp.dataset.userEditing = '';
    const url = `/number/${encodeURIComponent('BMS Max Charge Current')}/set?value=${encodeURIComponent(val)}`;
    addLog(`Задання ліміту струму BMS: POST ${url}`, 'info');
    fetch(url, { method: 'POST', body: '' })
      .then(r => {
        if (r.ok) addLog(`Ліміт струму BMS оновлено: ${val} A`, 'success');
        else addLog(`Помилка ліміту BMS: статус ${r.status}`, 'error');
      })
      .catch(e => addLog(`Помилка мережі: ${e}`, 'error'));
  };
});

