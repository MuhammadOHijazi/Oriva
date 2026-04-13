/*
 * Pill Guardian — ESP32 Arduino Sketch
 *
 * Hardware wiring:
 *   LED     → GPIO 2  (through 220Ω resistor to GND)
 *   Buzzer  → GPIO 4  (active buzzer, positive leg to pin, negative to GND)
 *   Button  → GPIO 15 (one leg to pin, other to GND; internal pull-up enabled)
 *
 * Required libraries (install via Arduino Library Manager):
 *   - ArduinoWebsockets  (by Gil Maimon)  — search "ArduinoWebsockets"
 *   - WiFi.h             (built-in with ESP32 board package)
 *
 * Board setup:
 *   1. Install ESP32 board package in Arduino IDE:
 *      File → Preferences → Additional Board Manager URLs:
 *      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *   2. Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
 *
 * Usage:
 *   1. Set your WiFi credentials and backend WebSocket URL below.
 *   2. Flash this sketch to your ESP32.
 *   3. The ESP32 will connect to WiFi and then open a WebSocket to the server.
 *   4. When the server sends START_ALARM, the LED and buzzer activate.
 *   5. Press the button to send PILL_TAKEN; the server will stop the alarm.
 */

#include <WiFi.h>
#include <ArduinoWebsockets.h>

using namespace websockets;

// ── Configuration ─────────────────────────────────────────────────────────────
const char* SSID       = "YOUR_WIFI_SSID";
const char* PASSWORD   = "YOUR_WIFI_PASSWORD";

// Replace with your backend WebSocket URL, e.g.:
//   wss://your-domain.com/esp32
const char* WS_URL     = "wss://YOUR_BACKEND_URL/esp32";

// ── Pin definitions ────────────────────────────────────────────────────────────
const int LED_PIN    = 2;
const int BUZZER_PIN = 4;
const int BUTTON_PIN = 15;

// ── State ─────────────────────────────────────────────────────────────────────
WebsocketsClient client;
bool alarmActive     = false;
bool lastButtonState = HIGH;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000;

// ── Function prototypes ───────────────────────────────────────────────────────
void connectWiFi();
void connectWebSocket();
void startAlarm();
void stopAlarm();

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  connectWiFi();

  client.onMessage([](WebsocketsMessage msg) {
    String data = msg.data();
    Serial.print("[WS] Received: ");
    Serial.println(data);

    if (data == "START_ALARM") {
      startAlarm();
    } else if (data == "STOP_ALARM") {
      stopAlarm();
    }
  });

  client.onEvent([](WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionOpened) {
      Serial.println("[WS] Connected to server");
    } else if (event == WebsocketsEvent::ConnectionClosed) {
      Serial.println("[WS] Disconnected from server");
    } else if (event == WebsocketsEvent::GotPing) {
      client.pong();
    }
  });

  connectWebSocket();
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  if (client.available()) {
    client.poll();
  } else {
    unsigned long now = millis();
    if (now - lastReconnectAttempt >= RECONNECT_INTERVAL) {
      lastReconnectAttempt = now;
      Serial.println("[WS] Attempting reconnect...");
      connectWebSocket();
    }
  }

  bool buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW && lastButtonState == HIGH) {
    Serial.println("[BTN] Button pressed — sending PILL_TAKEN");
    client.send("PILL_TAKEN\n");
    delay(50);
  }
  lastButtonState = buttonState;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(SSID);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("[WiFi] Connected — IP: ");
  Serial.println(WiFi.localIP());
}

void connectWebSocket() {
  Serial.print("[WS] Connecting to ");
  Serial.println(WS_URL);
  bool connected = client.connect(WS_URL);
  if (connected) {
    Serial.println("[WS] Handshake successful");
  } else {
    Serial.println("[WS] Connection failed");
  }
}

void startAlarm() {
  alarmActive = true;
  digitalWrite(LED_PIN,    HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  Serial.println("[ALARM] Started");
}

void stopAlarm() {
  alarmActive = false;
  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("[ALARM] Stopped");
}
