#include <LiquidCrystal.h>

LiquidCrystal lcd(7, 6, 5, 4, 3, 2);

// ===== Pins =====
const int led1   = 8;
const int led2   = 9;
const int led3   = 10;
const int buzzer = 11;
const int button = 12;

// ===== Stats =====
int taken  = 0;
int missed = 0;
int total  = 0;
int consecutiveMissed = 0;

bool medicineTaken = false;
bool lastButtonState = HIGH;

const int BASE_WAIT = 10;

// ================================================
void setup() {
  Serial.begin(9600);   // ← Added: enable serial communication

  lcd.begin(16, 2);
  pinMode(led1,   OUTPUT);
  pinMode(led2,   OUTPUT);
  pinMode(led3,   OUTPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(button, INPUT_PULLUP);

  lcd.clear();
  String name = "ORVIA";
  for (int i = 0; i < (int)name.length(); i++) {
    lcd.setCursor(0, 0);
    lcd.print(name.substring(0, i + 1));
    delay(400);
  }
  lcd.setCursor(0, 1);
  lcd.print("Care That Learn");
  delay(2000);

  Serial.println("ORVIA:READY");   // Signal ready to host over serial
}

// ================================================
void loop() {

  // Listen for commands from host over serial
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "RESET") {
      taken = missed = total = consecutiveMissed = 0;
      Serial.println("RESET:OK");
    }
  }

  for (int box = 1; box <= 3; box++) {

    medicineTaken = false;
    total++;

    int earlySeconds = consecutiveMissed * 2;
    int waitTime = BASE_WAIT - earlySeconds;
    if (waitTime < 4) waitTime = 4;

    if (box > 1) {
      smartWait(waitTime, earlySeconds);
    }

    showBox(box);
    runAlerts();

    if (medicineTaken) {
      taken++;
      consecutiveMissed = 0;
      Serial.println("TAKEN");       // ← Added
      successAnimation();
    } else {
      missed++;
      consecutiveMissed++;
      if (consecutiveMissed > 3) consecutiveMissed = 3;
      Serial.println("MISSED");      // ← Added
      missedAnimation();
    }

    showDoseResult(box);
    delay(2000);
  }

  showResult();

  taken  = 0;
  missed = 0;
  total  = 0;
  consecutiveMissed = 0;

  delay(3000);
}

// ================================================
// FUNCTIONS
// ================================================

void showBox(int box) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Open Box:");
  lcd.setCursor(0, 1);
  lcd.print(box);

  if (box == 1) digitalWrite(led1, HIGH);
  if (box == 2) digitalWrite(led2, HIGH);
  if (box == 3) digitalWrite(led3, HIGH);

  Serial.print("BOX:");             // ← Added
  Serial.println(box);              // ← Added  (e.g. "BOX:1")

  delay(1000);
}

void runAlerts() {
  for (int i = 0; i < 3; i++) {

    int freq = 800 + (i * 400);
    tone(buzzer, freq);

    for (int t = 0; t < 10; t++) {

      lcd.setCursor(10, 1);
      if      (t % 3 == 0) lcd.print(".  ");
      else if (t % 3 == 1) lcd.print(".. ");
      else                  lcd.print("...");

      delay(500);

      bool currentState = digitalRead(button);
      if (lastButtonState == HIGH && currentState == LOW) {
        medicineTaken = true;
        Serial.println("BUTTON_PRESS");   // ← Added
        noTone(buzzer);
        turnOffLEDs();
        delay(200);
        return;
      }
      lastButtonState = currentState;
      delay(500);
    }

    noTone(buzzer);
    delay(300);
  }

  turnOffLEDs();
}

void smartWait(int waitSec, int earlySeconds) {
  lcd.clear();
  lcd.setCursor(0, 0);

  if (earlySeconds > 0) {
    lcd.print("Smart Reminder!");
    lcd.setCursor(0, 1);
    lcd.print("Earlier: -");
    lcd.print(earlySeconds);
    lcd.print("s");
    Serial.print("EARLY:");           // ← Added
    Serial.println(earlySeconds);     // ← Added

    tone(buzzer, 600); delay(200); noTone(buzzer);
    delay(200);
    tone(buzzer, 600); delay(200); noTone(buzzer);
    delay(1500);
  } else {
    lcd.print("Next dose soon");
  }

  for (int s = waitSec; s > 0; s--) {
    lcd.setCursor(0, 1);
    lcd.print("Wait: ");
    lcd.print(s);
    lcd.print("s   ");
    delay(1000);
  }
}

void showDoseResult(int box) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Box ");
  lcd.print(box);
  lcd.print(": ");
  lcd.print(medicineTaken ? "Taken" : "Missed");

  lcd.setCursor(0, 1);
  lcd.print("T:");
  lcd.print(taken);
  lcd.print("  M:");
  lcd.print(missed);

  delay(2500);
}

void successAnimation() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Taking.");
  delay(400); lcd.print("."); delay(400); lcd.print(".");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Done!");
  lcd.setCursor(0, 1);
  lcd.print("Good Job!");
  tone(buzzer, 1500); delay(400); noTone(buzzer);
  tone(buzzer, 2000); delay(400); noTone(buzzer);
  delay(1000);
}

void missedAnimation() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Missed!");
  delay(500);
  lcd.setCursor(0, 1);
  lcd.print("...");
  delay(500);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Missed Dose!");
  lcd.setCursor(0, 1);
  lcd.print("Be Careful!");
  delay(2000);
}

void turnOffLEDs() {
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);
}

void showResult() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Calculating");
  for (int i = 0; i < 3; i++) { lcd.print("."); delay(400); }

  float percent = (total == 0) ? 0 : ((float)taken / total) * 100;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Result:");
  lcd.setCursor(0, 1);
  lcd.print(percent, 1);
  lcd.print("%");

  Serial.print("RESULT:");           // ← Added
  Serial.println(percent, 1);        // ← Added  (e.g. "RESULT:66.7")

  delay(3000);
  lcd.clear();

  if (percent <= 60) {
    lcd.setCursor(0, 0);
    lcd.print("Warning!");
    lcd.setCursor(0, 1);
    lcd.print("Improve!");
    Serial.println("ALERT:LOW");     // ← Added
    for (int i = 0; i < 4; i++) { tone(buzzer, 400); delay(300); noTone(buzzer); delay(300); }
  } else {
    lcd.setCursor(0, 0);
    lcd.print("Excellent!");
    lcd.setCursor(0, 1);
    lcd.print("Great Job!");
    Serial.println("ALERT:GOOD");    // ← Added
    tone(buzzer, 1500); delay(600); noTone(buzzer);
    tone(buzzer, 2000); delay(600); noTone(buzzer);
  }

  delay(2500);
}
