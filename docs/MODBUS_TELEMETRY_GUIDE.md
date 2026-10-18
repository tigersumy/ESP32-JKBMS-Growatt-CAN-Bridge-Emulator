# Antigravity: Довідник Modbus-регістрів, телеметрії та конфігурацій Datouboss (DT1218 / Sandisolar / HaiPower)

Документ містить повний зведений реєстр Modbus RTU / TCP регістрів[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span), маски статусів, діагностичні коди помилок платформи[span_3](start_span)[span_3](end_span), схеми підключення[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span) та готові YAML-конфігурації для автономної інтеграції через ESPHome і брокер MQTT на базі Mac mini M4[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span).

---

## 1. Специфікація фізичного та протокольного рівнів

* **Фізичний інтерфейс:** RS485 (двопровідна шина A/B з вирівнюванням сигнальної землі GND)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span).
* **Розпіновка RJ45 роз'єму інвертора Datouboss / Sandisolar:**
  * **Pin 1:** RS485-B (Data-)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
  * **Pin 2:** RS485-A (Data+)[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)
  * **Pin 8 (або 3/7):** Сигнальна земля (GND)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)
  * *Увага:* Контакт Pin 4 (+12V) не підключати (ризик вигорання порту через імпульси живлення ESP32)[span_17](start_span)[span_17](end_span).
* **Параметри UART / кадру RTU:**
  * Швидкість: `9600 baud` (рідше 2400)[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span)
  * Формат: 8 біт даних, 1 стоп-біт, без парності (`8N1`)[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)
  * Modbus Slave ID за замовчуванням: `1` (діапазон адрес 1–254)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span)
* **Підтримувані коди функцій Modbus:**
  * `0x03` — Читання значень Holding-регістрів[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)
  * `0x04` — Читання значень Input-регістрів[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span)
  * `0x06` — Запис (попереднє встановлення) одного Holding-регістра[span_29](start_span)[span_29](end_span)[span_30](start_span)[span_30](end_span)
  * `0x10` — Запис блоку Holding-регістрів[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span)

---

## 2. Зведена карта регістрів інвертора

### 2.1. Сенсори телеметрії (Input / Read Registers, Function 0x04)

| Адреса | Тип регістру | Тип даних | Одиниці | Множник / Фільтр | Назва параметра / Опис |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **0** | Read | `U_WORD` | — | — | **Inverter Status** (Код режиму роботи)[span_33](start_span)[span_33](end_span) |
| **2** | Read | `U_WORD` | V | `0.1` | **Inverter Voltage** (Вихідна напруга AC)[span_34](start_span)[span_34](end_span) |
| **5** | Read | `S_WORD` | A | `0.1` | **Inverter Current** (Вихідний струм AC)[span_35](start_span)[span_35](end_span) |
| **8** | Read | `U_WORD` | V | `0.1` | **Bus1 Voltage** (Напруга високовольтної шини DC-DC)[span_36](start_span)[span_36](end_span) |
| **10** | Read | `S_WORD` | °C | `0.1` | **Temp Inverter** (Температура перетворювача)[span_37](start_span)[span_37](end_span) |
| **11** | Read | `S_WORD` | °C | `0.1` | **Temp Boost** (Температура IPM / модулів підвищення)[span_38](start_span)[span_38](end_span) |
| **12** | Read | `S_WORD` | °C | `0.1` | **Temp LLC** (Температура силового вузла LLC)[span_39](start_span)[span_39](end_span) |
| **13** | Read | `S_WORD` | °C | `0.1` | **Temp External NTC** (Температура виносного NTC датчика)[span_40](start_span)[span_40](end_span) |
| **42** | Read | `U_WORD` | V | `0.1` | **Grid Voltage** (Вхідна напруга міської мережі AC)[span_41](start_span)[span_41](end_span) |
| **43** | Read | `S_WORD` | A | `0.1` | **Grid Current** (Вхідний струм міської мережі)[span_42](start_span)[span_42](end_span) |
| **51** | Read | `U_WORD` | Hz | `0.01` | **Grid Frequency** (Частота вхідної мережі AC)[span_43](start_span)[span_43](end_span) |
| **52** | Read | `S_WORD` | — | `0.0001` | **Power Factor** (Коефіцієнт потужності зі знаком)[span_44](start_span)[span_44](end_span) |
| **55** | Read | `U_WORD` | V | `0.1` | **EPS Voltage** (Напруга резервної гілки EPS)[span_45](start_span)[span_45](end_span) |
| **56** | Read | `U_WORD` | A | `0.1` | **EPS Current** (Струм резервної гілки EPS)[span_46](start_span)[span_46](end_span) |
| **64** | Read | `U_WORD` | V | `0.1` | **PV1 Voltage** (Напруга сонячних панелей трекера 1)[span_47](start_span)[span_47](end_span) |
| **65** | Read | `U_WORD` | A | `0.1` | **PV1 Current** (Струм сонячних панелей трекера 1)[span_48](start_span)[span_48](end_span) |
| **96** | Read | `U_WORD` | V | `0.1` | **Generator Voltage** (Напруга генератора)[span_49](start_span)[span_49](end_span) |
| **97** | Read | `U_WORD` | A | `0.1` | **Generator Current** (Струм генератора)[span_50](start_span)[span_50](end_span) |
| **106** | Read | `U_WORD` | RPM | — | **Fan Speed** (Швидкість охолоджувальних вентиляторів)[span_51](start_span)[span_51](end_span) |
| **107** | Read | `U_DWORD` (2 reg) | h | `0.00833333` | **Total Operation Time** (Загальний час напрацювання в годинах)[span_52](start_span)[span_52](end_span) |
| **141** | Read | `S_WORD` | A | `0.01` | **BMS Battery Current** (Струм АКБ: `+` заряд, `-` розряд)[span_53](start_span)[span_53](end_span) |
| **142** | Read | `S_WORD` | °C | `0.1` | **BMS Battery Temperature** (Температура батареї від BMS)[span_54](start_span)[span_54](end_span) |
| **143** | Read | `U_WORD` | A | `0.1` | **BMS Max Allowed Charge Current** (Ліміт заряду від BMS)[span_55](start_span)[span_55](end_span) |
| **144** | Read | `U_WORD` | A | `0.1` | **BMS Max Allowed Discharge Current** (Ліміт розряду від BMS)[span_56](start_span)[span_56](end_span) |
| **150** | Read | `U_WORD` | V | `0.001` | **BMS Cell Delta Voltage** (Розбаланс між комірками в мілівольтах)[span_57](start_span)[span_57](end_span) |
| **151** | Read | `U_WORD` | — | — | **BMS Battery Cycle Count** (Кількість повних циклів батареї)[span_58](start_span)[span_58](end_span) |
| **152** | Read | `U_WORD` | % | — | **Battery SOH** (Залишкове здоров'я батареї)[span_59](start_span)[span_59](end_span) |
| **157** | Read | `U_WORD` | V | `0.001` | **BMS Max Cell Voltage** (Максимальна напруга комірки)[span_60](start_span)[span_60](end_span) |
| **158** | Read | `U_WORD` | V | `0.001` | **BMS Min Cell Voltage** (Мінімальна напруга комірки)[span_61](start_span)[span_61](end_span) |
| **284** | Read | `U_DWORD` (2 reg) | VA | `0.1` | **Power Total Apparent ALL** (Загальна повна потужність)[span_62](start_span)[span_62](end_span) |
| **286** | Read | `S_DWORD` (2 reg) | W | `-0.1` | **Power Total Active** (Загальна вихідна активна потужність)[span_63](start_span)[span_63](end_span) |
| **288** | Read | `S_DWORD` (2 reg) | var | `0.1` | **Power Total Reactive ALL** (Загальна реактивна потужність)[span_64](start_span)[span_64](end_span) |
| **320** | Read | `U_DWORD` (2 reg) | W | `0.1` | **Power To User Total** (Сумарна віддача споживачу)[span_65](start_span)[span_65](end_span) |
| **330** | Read | `U_DWORD` (2 reg) | W | `0.1` | **Power Out Load** (Потужність локального навантаження)[span_66](start_span)[span_66](end_span) |
| **379** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Solar Generation Today** (Виробіток PV за день)[span_67](start_span)[span_67](end_span) |
| **381** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Solar Generation Total** (Сумарний накопичений виробіток PV)[span_68](start_span)[span_68](end_span) |
| **383** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Energy Charge Today** (Енергія заряду за день)[span_69](start_span)[span_69](end_span) |
| **385** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Energy Charge Total** (Сумарна накопичена енергія заряду)[span_70](start_span)[span_70](end_span) |
| **387** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Energy Discharge Today** (Енергія розряду за день)[span_71](start_span)[span_71](end_span) |
| **389** | Read | `U_DWORD` (2 reg) | kWh | `0.1` | **Energy Discharge Total** (Сумарна накопичена енергія розряду)[span_72](start_span)[span_72](end_span) |

---

### 2.2. Регістри налаштування та керування (Holding Registers, Function 0x03 / 0x06 / 0x10)

| Адреса | Тип даних | Діапазон значень | Масштаб / Лямбда | Опис та системне призначення |
| :---: | :---: | :---: | :---: | :--- |
| **0** | `U_WORD` | Біт 0 (0 або 1) | `bitmask: 1` | **Power Switch** (Головне вимкнення / увімкнення перетворення AC)[span_73](start_span)[span_73](end_span) |
| **63** | `U_DWORD` (2 reg) | За паспортом | `multiply: 0.1` | **Inverter Maximum Rated Power** (Номінальна потужність, Вт)[span_74](start_span)[span_74](end_span) |
| **125** | `U_WORD` | 0, 1, 2 | `optionsmap` | **Inverter Battery SubType** (`0`=Lead-Acid, `1`=Lithium, `2`=Lithium No Comm)[span_75](start_span)[span_75](end_span) |
| **129** | `U_WORD` | 10–120 A | `x * 0.01` | **Battery Max Charge Current** (Загальний ліміт струму заряду батареї)[span_76](start_span)[span_76](end_span) |
| **130** | `U_WORD` | 40.0–52.0 V | `x / 100.0` | **Battery Stop Discharge Voltage** (Напруга припинення розряду)[span_77](start_span)[span_77](end_span) |
| **131** | `U_WORD` | 48.0–59.2 V | `x / 100.0` | **Battery Constant Charge Voltage** (Напруга відсікання постійного заряду CV)[span_78](start_span)[span_78](end_span) |
| **139** | `U_WORD` | 10–100 % | `(float)x` | **Battery Charge Stop SOC** (Поріг заряду припинення заряджання)[span_79](start_span)[span_79](end_span) |
| **140** | `U_WORD` | 10–100 % | `(float)x` | **On-Grid Discharge Stop SOC** (Поріг зупинки розряду за наявності AC)[span_80](start_span)[span_80](end_span) |
| **141** | `U_WORD` | 10–100 % | `(float)x` | **Off-Grid Discharge Stop SOC** (Поріг повного відключення в автономії)[span_81](start_span)[span_81](end_span) |
| **181** | `U_WORD` | 0, 1, 2 | `optionsmap` | **Inverter Charge Source Priority** (`0`=CSO, `1`=SNU, `2`=OSO)[span_82](start_span)[span_82](end_span) |
| **182** | `U_WORD` | 0, 1, 2, 10 | `optionsmap` | **Inverter Output Source Priority** (`0`=SOL, `1`=UTI, `2`=SBU, `10`=Grid-Tie)[span_83](start_span)[span_83](end_span) |
| **185** | `U_WORD` | 20–100 % | `(float)x` | **On-Grid End-of-Discharge Recovery SOC** (SOC повернення розряду в мережі)[span_84](start_span)[span_84](end_span) |
| **187** | `U_WORD` | 10–100 % | `(float)x` | **Off-Grid End-of-Discharge Recovery SOC** (SOC відновлення розряду в автономії)[span_85](start_span)[span_85](end_span) |
| **188** | `U_WORD` | 40.0–48.0 V | `x / 10.0` | **Battery Under Voltage Cut-off** (Аварійна відсічка низької напруги АКБ)[span_86](start_span)[span_86](end_span) |
| **189** | `U_WORD` | 0–100 A | `x * 0.1` | **AC Grid Charge Current** (Струм заряджання від міської мережі)[span_87](start_span)[span_87](end_span) |
| **190** | `U_WORD` | 48.0–58.4 V | `x / 100.0` | **Battery Float Voltage** (Напруга буферного підтримання)[span_88](start_span)[span_88](end_span) |
| **191** | `U_WORD` | 44.0–52.0 V | `x / 10.0` | **Battery to AC Voltage** (Поріг повернення живлення на мережу)[span_89](start_span)[span_89](end_span) |
| **192** | `U_WORD` | 48.0–58.0 V | `x / 10.0` | **Inverter AC to Battery Voltage** (Поріг переходу з мережі на батарею)[span_90](start_span)[span_90](end_span) |
| **194** | `U_WORD` | 5–900 min | `(float)x` | **Boost Charge Max Time** (Максимальний час підвищеного заряду)[span_91](start_span)[span_91](end_span) |
| **195** | `U_WORD` | 40.0–50.0 V | `x / 10.0` | **Battery Under Voltage Alarm** (Поріг активації попередження про розряд)[span_92](start_span)[span_92](end_span) |
| **201** | `U_WORD` | Бітова маска | Read-Modify-Write | **System Settings Mask** (Біти: 0=ECO, 1=Overload Restart, 2=Overtemp Restart, 3=Reminder)[span_93](start_span)[span_93](end_span) |
| **202** | `U_WORD` | 220, 230, 240 | `optionsmap` | **Inverter Output AC Voltage** (Встановлення номіналу вихідної напруги AC) |
| **207** | `U_WORD` | 0 або 1 | `x > 0` | **Enable Buzzer** (Керування звуковою пищалкою)[span_94](start_span)[span_94](end_span) |
| **208** | `U_WORD` | 0 або 1 | `x > 0` | **Inverter LCD Backlight Always On** (`0`=Auto-Off 60s, `1`=Постійно увімкнено) |
| **209** | `U_WORD` | 0 або 1 | `optionsmap` | **Inverter AC Input Type** (`0`=APL 90–280V, `1`=UPS 170–280V)[span_95](start_span)[span_95](end_span) |
| **210** | `U_WORD` | 0 або 1 | `optionsmap` | **PV Power Balance Priority** (`0`=Battery First, `1`=Load First) |
| **211** | `U_WORD` | 0, 1, 2, 3, 4 | `optionsmap` | **Inverter Parallel Mode** (`0`=SIG, `1`=PAL, `2`=3P1, `3`=3P2, `4`=3P3)[span_96](start_span)[span_96](end_span) |
| **213** | `U_WORD` | 0 або 1 | `optionsmap` | **Inverter Parallel Device Type** (`0`=Master, `1`=Slave)[span_97](start_span)[span_97](end_span) |
| **214** | `U_WORD` | 0, 1, 2 | `optionsmap` | **Inverter BMS Work Mode** (`0`=Disabled, `1`=CAN Bus, `2`=RS485)[span_98](start_span)[span_98](end_span) |
| **215** | `U_WORD` | 1.0–137.0 A | `x / 100.0` | **Zero Export Buffer / Current Offset** (Компенсація підмішування)[span_99](start_span)[span_99](end_span) |
| **216** | `U_WORD` | 0 або 1 | `x > 0` | **Grid Feed-in Enable** (Дозвіл скидання надлишків у зовнішню мережу) |
| **217** | `U_WORD` | За паспортом | `W` | **Max Grid Feed Power** (Максимальна потужність віддачі в мережу) |
| **220** | `U_WORD` | 0–15.0 kW | `x * 0.01` | **Gen Input Rated Power** (Потужність входу генератора)[span_100](start_span)[span_100](end_span) |
| **221** | `U_WORD` | 0 або 1 | `x > 0` | **Generator Auto-Start Enable** (Дозвіл дистанційного пуску через реле) |
| **222** | `U_WORD` | За паспортом | V або % | **Gen Start Battery Threshold** (Поріг замикання реле генератора) |
| **223** | `U_WORD` | За паспортом | V або % | **Gen Stop Battery Threshold** (Поріг розмикання реле генератора) |
| **224** | `U_WORD` | 0, 1, 2 | `optionsmap` | **Smart Load Enable** (`0`=Off, `1`=On, `2`=Auto Cutoff) |
| **225** | `U_WORD` | 20–100 % | `(float)x` | **Smart Load On SOC** (Поріг увімкнення другого виходу AC) |
| **226** | `U_WORD` | 10–95 % | `(float)x` | **Smart Load Off SOC** (Поріг вимкнення другого виходу AC)[span_101](start_span)[span_101](end_span) |
| **231** | `U_WORD` | 0 або 1 | `x > 0` | **Enable Bluetooth** (Керування вбудованим модулем BT)[span_102](start_span)[span_102](end_span) |
| **234** | `U_WORD` | Байт `data[1]` | `0xAA`/`0x55` | **Inverter Cloud Connection Status** (Статус зв'язку з хмарою)[span_103](start_span)[span_103](end_span) |
| **235** | `U_WORD` | Байт `data[1]` | `0xAA`/`0x55` | **Inverter Logger Internal Comm Status** (Шина логер ↔ плата інвертора)[span_104](start_span)[span_104](end_span) |

---

## 3. Розшифровка станів, масок та кодів помилок

### 3.1. Статуси роботи інвертора (Регістр 0 `inverter_status`)[span_105](start_span)[span_105](end_span)
* `0`: **Waiting** (Очікування / Старт)[span_106](start_span)[span_106](end_span)
* `1`: **On-grid** (Робота паралельно з мережею)[span_107](start_span)[span_107](end_span)
* `2`: **Off-grid** (Автономна робота від акумулятора)[span_108](start_span)[span_108](end_span)
* `3`: **Fault** (Аварійне блокування)[span_109](start_span)[span_109](end_span)
* `4`: **Flashing** (Оновлення прошивки / Програмування)[span_110](start_span)[span_110](end_span)
* `5`: **Bypass** (Прямий транзит через байпас)[span_111](start_span)[span_111](end_span)
* `6`: **Self-charge** (Зарядка акумулятора від мережі або сонця)[span_112](start_span)[span_112](end_span)
* `7`: **Generator** (Робота від підключеного генератора)[span_113](start_span)[span_113](end_span)

### 3.2. Маска регістра системних налаштувань 201 (`inverter_reg_201_raw`)[span_114](start_span)[span_114](end_span)
* `Біт 0` (`0x0001`): **ECO Mode Enable**[span_115](start_span)[span_115](end_span)
* `Біт 1` (`0x0002`): **Overload Auto-Restart Enable**[span_116](start_span)[span_116](end_span)
* `Біт 2` (`0x0004`): **Overtemp Auto-Restart Enable**[span_117](start_span)[span_117](end_span)
* `Біт 3` (`0x0008`): **Input Mode Change Reminder Enable**[span_118](start_span)[span_118](end_span)

### 3.3. Таблиця кодів несправностей (Fault Codes з документації платформи)[span_119](start_span)[span_119](end_span)

| Код помилки | Опис з документації виробника | Технічне тлумачення та дія[span_120](start_span)[span_120](end_span) |
| :---: | :--- | :--- |
| **103** | Inverter DC offset is too high | Перекіс постійної складової на виході інвертора[span_121](start_span)[span_121](end_span) |
| **105** | Bypass AC output is overloaded | Перевантаження лінії байпасу[span_122](start_span)[span_122](end_span) |
| **200** | Off-grid output voltage is too low | Вихідна напруга в автономному режимі нижче норми[span_123](start_span)[span_123](end_span) |
| **201** | Off-grid output voltage is too high | Вихідна напруга в автономному режимі вище норми[span_124](start_span)[span_124](end_span) |
| **202** | Off-grid output has a short circuit | Коротке замикання на виході AC інвертора[span_125](start_span)[span_125](end_span) |
| **203** | Off-grid output is overloaded | Перевантаження потужності інвертора за виходом AC[span_126](start_span)[span_126](end_span) |
| **204** | Abnormal off-grid output DC offset | Критичний зсув постійної складової в автономії[span_127](start_span)[span_127](end_span) |
| **301** | Battery open circuit | Акумуляторну лінію розірвано / не підключено[span_128](start_span)[span_128](end_span) |
| **305** | Battery overvoltage | Перевищення граничної напруги батареї[span_129](start_span)[span_129](end_span) |
| **306** | Battery overcurrent | Перевищення максимально дозволеного струму батареї[span_130](start_span)[span_130](end_span) |
| **307** | Battery communication fault | Втрата зв'язку з BMS (таймаут пакетів протоколу)[span_131](start_span)[span_131](end_span) |
| **308** | BMS fault | Внутрішній код аварії переданий від самої плати BMS[span_132](start_span)[span_132](end_span) |
| **400** | PV overvoltage | Перевищення максимальної напруги холостого ходу MPPT[span_133](start_span)[span_133](end_span) |
| **403** | PV short circuit | Коротке замикання по лінії сонячних панелей[span_134](start_span)[span_134](end_span) |
| **404** | PV reverse connection | Помилка полярності підключення сонячних панелей[span_135](start_span)[span_135](end_span) |
| **500** | Abnormal BUS voltage | Вихід напруги високовольтної шини DC-DC за межі[span_136](start_span)[span_136](end_span) |
| **501** | Abnormal BUS voltage sampling | Збій у колі вимірювання напруги високовольтної шини[span_137](start_span)[span_137](end_span) |
| **502** | Abnormal communication in the device | Внутрішня помилка обміну між платами контролера[span_138](start_span)[span_138](end_span) |
| **505** | Abnormal connection of the temp sensor | Обрив або коротке замикання датчика температури[span_139](start_span)[span_139](end_span) |
| **506** | Device over-temperature | Перегрів силових транзисторів або трансформатора[span_140](start_span)[span_140](end_span) |
| **507** | Abnormal relay | Залипання або нерозмикання силового реле мережі/EPS[span_141](start_span)[span_141](end_span) |
| **509** | Anti-counter-current output timeout | Таймаут захисту від зворотного струму в мережу[span_142](start_span)[span_142](end_span) |
| **510** | Mismatched software version | Невідповідність версій прошивок плат або модулів[span_143](start_span)[span_143](end_span) |
| **511** | Fan fault | Зупинка або блокування охолоджувального вентилятора[span_144](start_span)[span_144](end_span) |
| **513** | Parallel abnormality | Збій синхронізації паралельної або 3-фазної конфігурації[span_145](start_span)[span_145](end_span) |

---

## 4. Повний робочий блок YAML для ESPHome (`datouboss.yml`)

Нижче наведено зведений конфігураційний фрагмент для ESPHome[span_146](start_span)[span_146](end_span):

```yaml
uart:
  - id: uart_inverter
    tx_pin: GPIO19
    rx_pin: GPIO20
    baud_rate: 9600
    stop_bits: 1

modbus:
  - id: modbus1
    uart_id: uart_inverter

modbus_controller:
  - id: inverter
    address: 1
    modbus_id: modbus1
    command_throttle: 100ms
    setup_priority: -10
    update_interval: 5s

sensor:
  - platform: modbus_controller
    modbus_controller_id: inverter
    id: inverter_status
    name: "Inverter Status"
    address: 0
    register_type: read
    value_type: U_WORD

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: inverter_voltage
    name: "Inverter Voltage"
    address: 2
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: inverter_current
    name: "Inverter Current"
    address: 5
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "A"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Bus1 Voltage"
    address: 8
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: inverter_temp
    name: "Temp Inverter"
    address: 10
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: boost_temp
    name: "Temp Boost"
    address: 11
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Temp LLC"
    address: 12
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    device_class: temperature
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Temp External NTC"
    address: 13
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "°C"
    accuracy_decimals: 1
    device_class: temperature
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: grid_voltage
    name: "Grid Voltage"
    address: 42
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: grid_current
    name: "Grid Current"
    address: 43
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "A"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: grid_frequency
    name: "Grid Frequency"
    address: 51
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "Hz"
    accuracy_decimals: 2
    filters:
      - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Factor"
    address: 52
    register_type: read
    value_type: S_WORD
    unit_of_measurement: ""
    accuracy_decimals: 2
    device_class: power_factor
    filters:
      - multiply: 0.0001

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "EPS Voltage"
    address: 55
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "EPS Current"
    address: 56
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "A"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Maximum Rated Power"
    address: 63
    register_type: holding
    value_type: U_DWORD
    unit_of_measurement: "W"
    accuracy_decimals: 0
    device_class: power
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: pv1_voltage
    name: "PV1 Voltage"
    address: 64
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: pv1_current
    name: "PV1 Current"
    address: 65
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "A"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Generator Voltage"
    address: 96
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Generator Current"
    address: 97
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "A"
    accuracy_decimals: 1
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Fan Speed"
    address: 106
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "RPM"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Total Operation Time"
    address: 107
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "h"
    accuracy_decimals: 1
    filters:
      - multiply: 0.00833333

  - platform: modbus_controller
    modbus_controller_id: inverter
    id: battery_current
    name: "BMS Battery Current"
    address: 141
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "A"
    device_class: current
    accuracy_decimals: 2
    filters:
      - multiply: 0.01

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Battery Temperature"
    address: 142
    register_type: read
    value_type: S_WORD
    unit_of_measurement: "°C"
    device_class: temperature
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Max Allowed Charge Current"
    address: 143
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "A"
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Max Allowed Discharge Current"
    address: 144
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "A"
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Cell Delta Voltage"
    address: 150
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 3
    filters:
      - multiply: 0.001

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Battery Cycle Count"
    address: 151
    register_type: read
    value_type: U_WORD

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery SOH"
    address: 152
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "%"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Max Cell Voltage"
    address: 157
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 3
    filters:
      - multiply: 0.001

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "BMS Min Cell Voltage"
    address: 158
    register_type: read
    value_type: U_WORD
    unit_of_measurement: "V"
    accuracy_decimals: 3
    filters:
      - multiply: 0.001

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Total Apparent ALL"
    address: 284
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "VA"
    accuracy_decimals: 1
    device_class: apparent_power
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Total Active"
    address: 286
    register_type: read
    value_type: S_DWORD
    unit_of_measurement: "W"
    accuracy_decimals: 1
    device_class: power
    filters:
      - multiply: -0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Total Reactive ALL"
    address: 288
    register_type: read
    value_type: S_DWORD
    unit_of_measurement: "var"
    accuracy_decimals: 1
    device_class: reactive_power
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power To User Total"
    address: 320
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "W"
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Out Load"
    address: 330
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "W"
    device_class: power
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Solar Generation Today"
    address: 379
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Solar Generation Total"
    address: 381
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Energy Charge Today"
    address: 383
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Energy Charge Total"
    address: 385
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Energy Discharge Today"
    address: 387
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Energy Discharge Total"
    address: 389
    register_type: read
    value_type: U_DWORD
    unit_of_measurement: "kWh"
    accuracy_decimals: 1
    device_class: energy
    state_class: total_increasing
    filters:
      - multiply: 0.1

  # Тіньовий сенсор для Read-Modify-Write регістра 201
  - platform: modbus_controller
    modbus_controller_id: inverter
    id: inverter_reg_201_raw
    address: 201
    register_type: holding
    value_type: U_WORD
    internal: true

text_sensor:
  - platform: template
    name: "Inverter Mode"
    lambda: |-
      switch ((int)id(inverter_status).state) {
        case 0: return {"Waiting"};
        case 1: return {"On-grid"};
        case 2: return {"Off-grid"};
        case 3: return {"Fault"};
        case 4: return {"Flashing"};
        case 5: return {"Bypass"};
        case 6: return {"Self-charge"};
        case 7: return {"Generator"};
        default: return {"Unknown"};
      }

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Cloud Connection Status"
    address: 234
    register_type: holding
    entity_category: diagnostic
    icon: "mdi:cloud-check"
    lambda: |-
      if (data.size() < 2) return std::string("Немає даних");
      uint8_t status_byte = data[1];
      if (status_byte == 0xAA) return std::string("Норма (Підключено)");
      if (status_byte == 0x55) return std::string("Помилка хмари");
      return std::string("Невідомий статус");

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Logger Internal Comm Status"
    address: 235
    register_type: holding
    entity_category: diagnostic
    icon: "mdi:connection"
    lambda: |-
      if (data.size() < 2) return std::string("Немає даних");
      uint8_t comm_byte = data[1];
      if (comm_byte == 0xAA) return std::string("Зв'язок OK");
      if (comm_byte == 0x55) return std::string("Помилка зв'язку з платою");
      if (data[0] == 0xAA) return std::string("Зв'язок OK");
      if (data[0] == 0x55) return std::string("Помилка зв'язку з платою");
      return std::string("Невідомий статус");

switch:
  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Power Switch"
    address: 0
    register_type: holding
    bitmask: 1
    entity_category: config
    icon: "mdi:power"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Enable Buzzer"
    address: 207
    register_type: holding
    entity_category: config
    icon: "mdi:volume-mute"
    lambda: "return x > 0;"
    write_lambda: "return x ? 1.0f : 0.0f;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter LCD Backlight Always On"
    address: 208
    register_type: holding
    entity_category: config
    icon: "mdi:lightbulb-outline"
    lambda: "return x > 0;"
    write_lambda: "return x ? 1.0f : 0.0f;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Grid Feed-in (Export)"
    address: 216
    register_type: holding
    entity_category: config
    icon: "mdi:transmission-tower-export"
    lambda: "return x > 0;"
    write_lambda: "return x ? 1.0f : 0.0f;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Enable Bluetooth"
    address: 231
    register_type: holding
    entity_category: config
    icon: "mdi:bluetooth"
    lambda: "return x > 0;"
    write_lambda: "return x ? 1.0f : 0.0f;"

  - platform: template
    name: "ECO Mode Enable"
    icon: "mdi:leaf"
    entity_category: config
    optimistic: false
    lambda: |-
      if (std::isnan(id(inverter_reg_201_raw).state)) return {};
      uint16_t val = (uint16_t)id(inverter_reg_201_raw).state;
      return (val & 0x0001) > 0;
    turn_on_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base | 0x0001;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));
    turn_off_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base & (uint16_t)~0x0001;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));

  - platform: template
    name: "Overload Auto-Restart Enable"
    icon: "mdi:restart-alert"
    entity_category: config
    optimistic: false
    lambda: |-
      if (std::isnan(id(inverter_reg_201_raw).state)) return {};
      uint16_t val = (uint16_t)id(inverter_reg_201_raw).state;
      return (val & 0x0002) > 0;
    turn_on_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base | 0x0002;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));
    turn_off_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base & (uint16_t)~0x0002;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));

  - platform: template
    name: "Overtemp Auto-Restart Enable"
    icon: "mdi:thermometer-alert"
    entity_category: config
    optimistic: false
    lambda: |-
      if (std::isnan(id(inverter_reg_201_raw).state)) return {};
      uint16_t val = (uint16_t)id(inverter_reg_201_raw).state;
      return (val & 0x0004) > 0;
    turn_on_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base | 0x0004;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));
    turn_off_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base & (uint16_t)~0x0004;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));

  - platform: template
    name: "Input Mode Change Reminder Enable"
    icon: "mdi:bell-alert-outline"
    entity_category: config
    optimistic: false
    lambda: |-
      if (std::isnan(id(inverter_reg_201_raw).state)) return {};
      uint16_t val = (uint16_t)id(inverter_reg_201_raw).state;
      return (val & 0x0008) > 0;
    turn_on_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base | 0x0008;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));
    turn_off_action:
      - lambda: |-
          uint16_t base = (uint16_t)id(inverter_reg_201_raw).state;
          uint16_t val = base & (uint16_t)~0x0008;
          id(inverter).queue_command(modbus_controller::ModbusCommandItem::create_write_single_command(id(inverter), 201, val));

number:
  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Max Charge Current"
    address: 129
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "A"
    device_class: current
    entity_category: config
    min_value: 10
    max_value: 120
    step: 1
    mode: BOX
    lambda: "return (float)x * 0.01f;"
    write_lambda: "return (uint16_t)(x / 0.01f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Stop Discharge Voltage"
    address: 130
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 40.0
    max_value: 52.0
    step: 0.01
    mode: BOX
    lambda: "return (float)x / 100.0f;"
    write_lambda: "return (uint16_t)(x * 100.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Constant Charge Voltage"
    address: 131
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 48.0
    max_value: 59.2
    step: 0.01
    mode: BOX
    lambda: "return (float)x / 100.0f;"
    write_lambda: "return (uint16_t)(x * 100.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Charge Stop SOC"
    address: 139
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 10
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "On-Grid Discharge Stop SOC"
    address: 140
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 10
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Off-Grid Discharge Stop SOC"
    address: 141
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 10
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "On-Grid End-of-Discharge Recovery SOC"
    address: 185
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 20
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Off-Grid end-of-Discharge Recovery"
    address: 187
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 10
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Under Voltage Cut-off"
    address: 188
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 40.0
    max_value: 48.0
    step: 0.1
    mode: BOX
    lambda: "return (float)x / 10.0f;"
    write_lambda: "return (uint16_t)(x * 10.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "AC Grid Charge Current"
    address: 189
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "A"
    device_class: current
    entity_category: config
    min_value: 0
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x * 0.1f;"
    write_lambda: "return (uint16_t)(x / 0.1f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Float Voltage"
    address: 190
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 48.0
    max_value: 58.4
    step: 0.1
    mode: BOX
    lambda: "return (float)x / 100.0f;"
    write_lambda: "return (uint16_t)(x * 100.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery to AC Voltage (Discharge limit)"
    address: 191
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 44.0
    max_value: 52.0
    step: 0.1
    mode: BOX
    lambda: "return (float)x / 10.0f;"
    write_lambda: "return (uint16_t)(x * 10.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter AC to Battery Voltage (Charge target)"
    address: 192
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 48.0
    max_value: 58.0
    step: 0.1
    mode: BOX
    lambda: "return (float)x / 10.0f;"
    write_lambda: "return (uint16_t)(x * 10.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Boost Charge Max Time"
    address: 194
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "min"
    entity_category: config
    min_value: 5
    max_value: 900
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Battery Under Voltage Alarm"
    address: 195
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "V"
    device_class: voltage
    entity_category: config
    min_value: 40.0
    max_value: 50.0
    step: 0.1
    mode: BOX
    lambda: "return (float)x / 10.0f;"
    write_lambda: "return (uint16_t)(x * 10.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Gen Input Rated Power"
    address: 220
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "kW"
    entity_category: config
    min_value: 0
    max_value: 15.0
    step: 0.1
    mode: BOX
    lambda: "return (float)x * 0.01f;"
    write_lambda: "return (uint16_t)(x * 100.0f);"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Smart Load On SOC"
    address: 225
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 20
    max_value: 100
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Smart Load Off SOC"
    address: 226
    register_type: holding
    value_type: U_WORD
    unit_of_measurement: "%"
    device_class: battery
    entity_category: config
    min_value: 10
    max_value: 95
    step: 1
    mode: BOX
    lambda: "return (float)x;"
    write_lambda: "return (uint16_t)x;"

select:
  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Battery SubType"
    address: 125
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Lead-Acid": 0
      "Lithium": 1
      "Lithium No Comm": 2

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Charge Source Priority"
    address: 181
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Solar First (CSO)": 0
      "Solar & Utility (SNU)": 1
      "Only Solar (OSO)": 2

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Output Source Priority"
    address: 182
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Solar-Battery-Utility (SOL)": 0
      "Utility-Solar-Battery (UTI)": 1
      "Solar-Utility-Battery (SBU)": 2
      "Grid-Tied Mode": 10

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Output AC Voltage"
    address: 202
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "220V": 220
      "230V": 230
      "240V": 240

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter AC Input Type"
    address: 209
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "APL": 0
      "UPS": 1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "PV Power Balance Priority"
    address: 210
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Battery First": 0
      "Load First": 1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Parallel Mode"
    address: 211
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Single (SIG)": 0
      "Parallel (PAL)": 1
      "3-Phase 1 (3P1)": 2
      "3-Phase 2 (3P2)": 3
      "3-Phase 3 (3P3)": 4

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter Parallel Device Type"
    address: 213
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Master": 0
      "Slave": 1

  - platform: modbus_controller
    modbus_controller_id: inverter
    name: "Inverter BMS Work Mode"
    address: 214
    value_type: U_WORD
    entity_category: config
    optionsmap:
      "Disabled (Voltage Mode)": 0
      "CAN Bus": 1
      "RS485": 2
