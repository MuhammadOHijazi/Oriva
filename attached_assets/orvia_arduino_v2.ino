// ================================================================
//  ORVIA – Arduino Uno  (Command-Driven, App-Triggered Alarms)
//  The app sends ALARM:1 / ALARM:2 / ALARM:3 when pill time hits.
//  Arduino activates the LED + buzzer for that box and waits for
//  the button.  No internal timer loop – the clock lives in the app.
// ================================================================

#include <LiquidCrystal.h>
#include <SoftwareSerial.h>

// ── LCD ──────────────────────────────────────────────────────────
LiquidCrystal lcd(7, 6, 5, 4, 3, 2);

// ── Bluetooth (HM-10 BLE module) ─────────────────────────────────
SoftwareSerial BT(13, A0);   // RX=13, TX=A0

// ── Pins ─────────────────────────────────────────────────────────
const int LED1   = 8;
const int LED2   = 9;
const int LED3   = 10;
const int BUZZER = 11;
const int BUTTON = 12;

// ── Alarm state ──────────────────────────────────────────────────
int  activeBox      = 0;       // 0 = idle; 1-3 = waiting for button
bool buttonHandled  = false;
bool lastBtnState   = HIGH;

const unsigned long ALARM_TIMEOUT_MS = 30000;  // 30 s to press button
unsigned long alarmStartMs = 0;

// ── Stats ─────────────────────────────────────────────────────────
int taken  = 0;
int missed = 0;
int total  = 0;

// ── Buzzer pattern state ──────────────────────────────────────────
unsigned long lastBuzzerToggle = 0;
bool buzzerOn = false;
const unsigned long BUZZER_PERIOD = 600;   // ms per on/off cycle

// =================================================================
void setup() {
  Serial.begin(9600);
  BT.begin(9600);

  lcd.begin(16, 2);

  pinMode(LED1,   OUTPUT);
  pinMode(LED2,   OUTPUT);
  pinMode(LED3,   OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);

  // Splash screen
  lcd.clear();
  String name = "ORVIA";
  for (int i = 0; i < (int)name.length(); i++) {
    lcd.setCursor(0, 0);
    lcd.print(name.substring(0, i + 1));
    delay(350);
  }
  lcd.setCursor(0, 1);
  lcd.print("Care That Learns");
  delay(2000);

  showIdle();

  sendBoth("ORVIA:READY");
}

// =================================================================
void loop() {

  // ── Read commands from USB Serial ──────────────────────────────
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    handleCommand(cmd);
  }

  // ── Read commands from Bluetooth ───────────────────────────────
  if (BT.available() > 0) {
    String cmd = BT.readStringUntil('\n');
    cmd.trim();
    handleCommand(cmd);
  }

  // ── If an alarm is active, handle it ───────────────────────────
  if (activeBox > 0) {

    // Check button
    bool currentBtn = digitalRead(BUTTON);
    if (lastBtnState == HIGH && currentBtn == LOW && !buttonHandled) {
      buttonHandled = true;
      pillTaken();
    }
    lastBtnState = currentBtn;

    // Check timeout → missed
    if (!buttonHandled && (millis() - alarmStartMs >= ALARM_TIMEOUT_MS)) {
      pillMissed();
    }

    // Keep buzzer pulsing while waiting
    if (activeBox > 0) {
      unsigned long now = millis();
      if (now - lastBuzzerToggle >= BUZZER_PERIOD) {
        lastBuzzerToggle = now;
        buzzerOn = !buzzerOn;
        if (buzzerOn) tone(BUZZER, 900);
        else          noTone(BUZZER);
      }
    }
  }
}

// =================================================================
void handleCommand(String cmd) {

  if (cmd == "ALARM:1") { startAlarm(1); }
  else if (cmd == "ALARM:2") { startAlarm(2); }
  else if (cmd == "ALARM:3") { startAlarm(3); }
  else if (cmd == "RESET") {
    taken = missed = total = 0;
    activeBox = 0;
    noTone(BUZZER);
    turnOffLEDs();
    showIdle();
    sendBoth("RESET:OK");
  }
}

// =================================================================
void startAlarm(int box) {
  if (activeBox != 0) return;   // ignore if already handling an alarm

  activeBox     = box;
  buttonHandled = false;
  alarmStartMs  = millis();
  lastBuzzerToggle = millis();
  buzzerOn      = false;
  total++;

  // Light up the correct LED
  turnOffLEDs();
  if (box == 1) digitalWrite(LED1, HIGH);
  if (box == 2) digitalWrite(LED2, HIGH);
  if (box == 3) digitalWrite(LED3, HIGH);

  // LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Time for Box ");
  lcd.print(box);
  lcd.setCursor(0, 1);
  lcd.print("Press button now");

  // Short alert beep to wake patient
  tone(BUZZER, 1200); delay(200); noTone(BUZZER);
  delay(100);
  tone(BUZZER, 1200); delay(200); noTone(BUZZER);
  delay(100);
  tone(BUZZER, 1200); delay(200); noTone(BUZZER);

  sendBoth("BOX:" + String(box));
}

// =================================================================
void pillTaken() {
  taken++;
  activeBox = 0;

  noTone(BUZZER);
  turnOffLEDs();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Done!");
  lcd.setCursor(0, 1);
  lcd.print("Good Job!");

  tone(BUZZER, 1500); delay(300); noTone(BUZZER);
  tone(BUZZER, 2000); delay(300); noTone(BUZZER);

  sendBoth("TAKEN");
  sendResult();

  delay(2000);
  showIdle();
}

// =================================================================
void pillMissed() {
  missed++;
  activeBox = 0;

  noTone(BUZZER);
  turnOffLEDs();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Missed Dose!");
  lcd.setCursor(0, 1);
  lcd.print("Be Careful!");

  tone(BUZZER, 400); delay(400); noTone(BUZZER);
  delay(200);
  tone(BUZZER, 400); delay(400); noTone(BUZZER);

  sendBoth("MISSED");
  sendResult();

  delay(2000);
  showIdle();
}

// =================================================================
void sendResult() {
  float percent = (total == 0) ? 0.0 : ((float)taken / total) * 100.0;

  char buf[10];
  dtostrf(percent, 4, 1, buf);
  sendBoth("RESULT:" + String(buf));

  if (percent <= 60.0) sendBoth("ALERT:LOW");
  else                 sendBoth("ALERT:GOOD");
}

// =================================================================
void showIdle() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ORVIA");
  lcd.setCursor(0, 1);
  lcd.print("Waiting...");
}

// =================================================================
void turnOffLEDs() {
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);
}

// ── Send to both USB Serial and Bluetooth ────────────────────────
void sendBoth(String msg) {
  Serial.println(msg);
  BT.println(msg);
}
