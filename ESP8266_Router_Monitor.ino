// =====================================================
// ESP-01 Router Monitor
// Advanced Stable Version
// Google Sheets + Heartbeat + Live Heap
// Multi-Day Outage Safe
// =====================================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <EEPROM.h>
#include <time.h>

// =====================================================
// WIFI
// =====================================================

const char* ssid = "Home";
const char* password = "Home*automation*by*1998";

// =====================================================
// GOOGLE SCRIPT
// =====================================================

const char* googleScriptID =
"AKfycbwWXwrwkQWWaPDdCNrb-bEDVwOAT36veI4FkOCCoiMMbRtPfr_lusKvqGRv717qN7JqPw";

// =====================================================
// RELAY
// =====================================================

#define RELAY_PIN 0

// =====================================================
// EEPROM ADDRESSES
// =====================================================

#define EEPROM_DOWN_ADDR          0
#define EEPROM_RESTART_ADDR       20
#define EEPROM_OUTAGE_FLAG_ADDR   40
#define EEPROM_OUTAGE_EPOCH_ADDR  60

// =====================================================
// TIMERS
// =====================================================

unsigned long lastCheck = 0;

const unsigned long checkInterval = 10000;

unsigned long lastRestart = 0;

bool waitingForNextTry = false;

// =====================================================
// HEARTBEAT
// =====================================================

unsigned long lastHeartbeat = 0;

const unsigned long heartbeatInterval = 5000;

// =====================================================
// WIFI RECOVERY
// =====================================================

bool wifiWaiting = false;

unsigned long wifiLostTime = 0;

const unsigned long wifiTimeout = 180000;

unsigned long lastWifiRetry = 0;

const unsigned long wifiRetryInterval = 10000;

// =====================================================
// ROUTER BOOT WAIT
// =====================================================

bool bootWait = false;

unsigned long bootStart = 0;

// =====================================================
// OUTAGE
// =====================================================

bool outageActive = false;

unsigned long outageStartMillis = 0;

time_t outageStartEpoch = 0;

int restartCount = 0;

int totalRouterRestarts = 0;

unsigned long totalDownSeconds = 0;

String lastDowntime = "None";

// =====================================================
// DAILY STATS
// =====================================================

unsigned long todayDownSeconds = 0;

int todayRestartCount = 0;

int lastDailyReportDay = -1;

// =====================================================
// SYSTEM
// =====================================================

unsigned long lastHeapCheck = 0;

bool internetOK = false;

// =====================================================
// NTP
// =====================================================

const long gmtOffset_sec = 19800;

const int daylightOffset_sec = 0;

// =====================================================
// SAVE FUNCTIONS
// =====================================================

void saveDowntime() {

  EEPROM.put(
    EEPROM_DOWN_ADDR,
    totalDownSeconds
  );

  EEPROM.commit();
}

void loadDowntime() {

  EEPROM.get(
    EEPROM_DOWN_ADDR,
    totalDownSeconds
  );

  if (
    totalDownSeconds >
    31536000
  ) {

    totalDownSeconds = 0;
  }
}

void saveRestartCount() {

  EEPROM.put(
    EEPROM_RESTART_ADDR,
    totalRouterRestarts
  );

  EEPROM.commit();
}

void loadRestartCount() {

  EEPROM.get(
    EEPROM_RESTART_ADDR,
    totalRouterRestarts
  );

  if (
    totalRouterRestarts >
    100000
  ) {

    totalRouterRestarts = 0;
  }
}

// =====================================================
// OUTAGE EEPROM
// =====================================================

void saveOutageState() {

  EEPROM.put(
    EEPROM_OUTAGE_FLAG_ADDR,
    outageActive
  );

  EEPROM.put(
    EEPROM_OUTAGE_EPOCH_ADDR,
    outageStartEpoch
  );

  EEPROM.commit();
}

void loadOutageState() {

  EEPROM.get(
    EEPROM_OUTAGE_FLAG_ADDR,
    outageActive
  );

  EEPROM.get(
    EEPROM_OUTAGE_EPOCH_ADDR,
    outageStartEpoch
  );

  if (
    outageStartEpoch <
    100000
  ) {

    outageActive = false;

    outageStartEpoch = 0;
  }
}

// =====================================================
// FORMAT TIME
// =====================================================

String formatDuration(
  unsigned long totalSeconds
) {

  unsigned long h =
    totalSeconds / 3600;

  unsigned long m =
    (totalSeconds % 3600) / 60;

  unsigned long s =
    totalSeconds % 60;

  String out;

  if (h > 0)
    out += String(h) + "h ";

  if (m > 0 || h > 0)
    out += String(m) + "m ";

  out += String(s) + "sec";

  return out;
}

// =====================================================
// DAILY UPTIME
// =====================================================

String getDailyUptimePercentage() {

  time_t now =
    time(nullptr);

  struct tm* p_tm =
    localtime(&now);

  int secondsToday =

    (p_tm->tm_hour * 3600) +

    (p_tm->tm_min * 60) +

    p_tm->tm_sec;

  if (secondsToday <= 0)
    secondsToday = 1;

  float uptimePercent =

    100.0 -

    (
      (float)todayDownSeconds *
      100.0 /
      secondsToday
    );

  if (uptimePercent < 0)
    uptimePercent = 0;

  if (uptimePercent > 100)
    uptimePercent = 100;

  return String(
    uptimePercent,
    2
  );
}

// =====================================================
// INTERNET CHECK
// =====================================================

bool checkInternet() {

  WiFiClient client;

  Serial.println(
    F("Checking internet")
  );

  if (
    client.connect(
      "8.8.8.8",
      53
    )
  ) {

    client.stop();

    Serial.println(
      F("DNS OK")
    );

    return true;
  }

  delay(100);

  yield();

  if (
    client.connect(
      "1.1.1.1",
      53
    )
  ) {

    client.stop();

    Serial.println(
      F("Backup DNS OK")
    );

    return true;
  }

  Serial.println(
    F("Internet FAILED")
  );

  return false;
}

// =====================================================
// GOOGLE SHEETS UPLOAD
// =====================================================

void uploadToSheets(
  String event,
  String downtime,
  String restarts,
  String uptime
) {

  if (
    WiFi.status() !=
    WL_CONNECTED
  ) return;

  event.replace(" ", "%20");

  downtime.replace(
    " ",
    "%20"
  );

  WiFiClientSecure client;

  client.setInsecure();

  HTTPClient https;

  char url[512];

  snprintf(
    url,
    sizeof(url),

    "https://script.google.com/macros/s/%s/exec?event=%s&downtime=%s&restarts=%s&uptime=%s&heap=%d",

    googleScriptID,

    event.c_str(),

    downtime.c_str(),

    restarts.c_str(),

    uptime.c_str(),

    ESP.getFreeHeap()
  );

  if (
    !https.begin(
      client,
      url
    )
  ) {

    return;
  }

  https.useHTTP10(true);

  https.setTimeout(10000);

  https.GET();

  https.end();

  client.stop();
}

// =====================================================
// HEARTBEAT
// =====================================================

void sendHeartbeat() {

  if (
    WiFi.status() !=
    WL_CONNECTED
  ) return;

  WiFiClientSecure client;

  client.setInsecure();

  HTTPClient https;

  char url[256];

  snprintf(
    url,
    sizeof(url),

    "https://script.google.com/macros/s/%s/exec?type=heartbeat&heap=%d",

    googleScriptID,

    ESP.getFreeHeap()
  );

  if (
    !https.begin(
      client,
      url
    )
  ) {

    return;
  }

  https.useHTTP10(true);

  https.setTimeout(5000);

  https.GET();

  https.end();

  client.stop();
}

// =====================================================
// DAILY REPORT
// =====================================================

void uploadDailyReport() {

  uploadToSheets(

    "DAILY_REPORT",

    formatDuration(
      todayDownSeconds
    ),

    String(
      todayRestartCount
    ),

    getDailyUptimePercentage()
  );

  todayDownSeconds = 0;

  todayRestartCount = 0;

  Serial.println(
    F("Daily report uploaded")
  );
}

// =====================================================
// RESTART ROUTER
// =====================================================

void restartRouter() {

  Serial.println(
    F("Restarting Router")
  );

  if (!outageActive) {

    outageActive = true;

    outageStartMillis =
      millis();

    outageStartEpoch =
      time(nullptr);

    saveOutageState();
  }

  restartCount++;

  totalRouterRestarts++;

  saveRestartCount();

  digitalWrite(
    RELAY_PIN,
    LOW
  );

  Serial.println(
    F("Relay OFF")
  );

  delay(5000);

  yield();

  digitalWrite(
    RELAY_PIN,
    HIGH
  );

  Serial.println(
    F("Relay ON")
  );

  WiFi.disconnect();

  delay(100);

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    ssid,
    password
  );

  bootWait = true;

  bootStart = millis();
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(9600);

  EEPROM.begin(512);

  loadDowntime();

  loadRestartCount();

  loadOutageState();

  pinMode(
    RELAY_PIN,
    OUTPUT
  );

  digitalWrite(
    RELAY_PIN,
    HIGH
  );

  Serial.println(
    F("Relay ON")
  );

  WiFi.mode(WIFI_STA);

  WiFi.setSleepMode(
    WIFI_NONE_SLEEP
  );

  WiFi.setAutoReconnect(
    true
  );

  WiFi.persistent(true);

  WiFi.begin(
    ssid,
    password
  );

  Serial.print(
    F("Connecting")
  );

  while (
    WiFi.status() !=
    WL_CONNECTED
  ) {

    delay(500);

    yield();

    Serial.print(".");
  }

  Serial.println();

  Serial.println(
    F("WiFi Connected")
  );

  configTime(
    gmtOffset_sec,
    daylightOffset_sec,
    "pool.ntp.org",
    "time.nist.gov"
  );

  int retry = 0;

  while (
    time(nullptr) <
    100000 &&
    retry < 30
  ) {

    delay(500);

    yield();

    retry++;
  }

  uploadToSheets(

    "BOOT",

    "0sec",

    "0",

    getDailyUptimePercentage()
  );
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  yield();

  // =====================================================
  // HEARTBEAT
  // =====================================================

  if (
    millis() -
    lastHeartbeat >
    heartbeatInterval
  ) {

    lastHeartbeat =
      millis();

    sendHeartbeat();
  }

  // =====================================================
  // LOW MEMORY
  // =====================================================

  if (
    millis() -
    lastHeapCheck >
    60000
  ) {

    lastHeapCheck =
      millis();

    Serial.print(
      F("Heap: ")
    );

    Serial.println(
      ESP.getFreeHeap()
    );

    if (
      ESP.getFreeHeap() <
      12000
    ) {

      ESP.restart();
    }
  }

  // =====================================================
  // WEEKLY REBOOT
  // =====================================================

  if (
    millis() >
    604800000
  ) {

    ESP.restart();
  }

  // =====================================================
  // DAILY REPORT + SAFE MIDNIGHT REBOOT
  // =====================================================

  time_t now =
    time(nullptr);

  struct tm* p_tm =
    localtime(&now);

  if (
    p_tm->tm_hour == 23 &&
    p_tm->tm_min == 59 &&
    lastDailyReportDay !=
    p_tm->tm_mday
  ) {

    if (
      internetOK &&
      !outageActive
    ) {

      uploadDailyReport();

      lastDailyReportDay =
        p_tm->tm_mday;

      delay(5000);

      ESP.restart();
    }
  }

  // =====================================================
  // WIFI LOST
  // =====================================================

  if (
    WiFi.status() !=
    WL_CONNECTED
  ) {

    if (!wifiWaiting) {

      wifiWaiting = true;

      wifiLostTime =
        millis();

      lastWifiRetry = 0;
    }

    if (
      millis() -
      lastWifiRetry >
      wifiRetryInterval
    ) {

      lastWifiRetry =
        millis();

      WiFi.disconnect();

      delay(100);

      WiFi.begin(
        ssid,
        password
      );
    }

    if (
      millis() -
      wifiLostTime >
      wifiTimeout
    ) {

      restartRouter();

      lastRestart =
        millis();

      waitingForNextTry =
        true;

      wifiWaiting = false;
    }

    return;
  }

  wifiWaiting = false;

  // =====================================================
  // INTERNET CHECK
  // =====================================================

  if (
    !waitingForNextTry &&
    millis() -
    lastCheck >
    checkInterval
  ) {

    lastCheck =
      millis();

    internetOK =
      checkInternet();

    if (!internetOK) {

      restartRouter();

      lastRestart =
        millis();

      waitingForNextTry =
        true;
    }

    else {

      // =================================================
      // RESTORED
      // =================================================

      if (outageActive) {

        unsigned long totalSeconds;

        if (
          outageStartEpoch >
          100000
        ) {

          totalSeconds =

            time(nullptr) -
            outageStartEpoch;
        }

        else {

          totalSeconds =

            (
              millis() -
              outageStartMillis
            ) / 1000;
        }

        totalDownSeconds +=
          totalSeconds;

        todayDownSeconds +=
          totalSeconds;

        todayRestartCount +=
          restartCount;

        saveDowntime();

        lastDowntime =
          formatDuration(
            totalSeconds
          );

        uploadToSheets(

          "RESTORED",

          lastDowntime,

          String(restartCount),

          getDailyUptimePercentage()
        );

        restartCount = 0;

        outageActive = false;

        outageStartEpoch = 0;

        saveOutageState();
      }

      Serial.println(
        F("Internet OK")
      );
    }
  }

  // =====================================================
  // RETRY TIMER
  // =====================================================

  if (waitingForNextTry) {

    if (
      millis() -
      lastRestart >
      120000
    ) {

      waitingForNextTry =
        false;
    }
  }
}