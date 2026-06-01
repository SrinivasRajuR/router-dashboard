// =====================================
// ESP ROUTER MONITOR
// GOOGLE SHEETS WEB APP
// Advanced Stable Version
// =====================================


// =====================================
// MAIN WEB APP
// =====================================
var lock = LockService.getScriptLock();

function doGet(e) {

  lock.waitLock(30000);

  try {

    // DASHBOARD API

    if (e.parameter.type == "dashboard") {
      return getDashboardData();
    }

    // HEARTBEAT API

    if (e.parameter.type == "heartbeat") {
      return heartbeat(e);
    }

    var ss =
      SpreadsheetApp.getActiveSpreadsheet();

    var event =
      e.parameter.event || "";

    // =================================
    // PREVENT DUPLICATE DAILY REPORTS
    // =================================

    if (event == "DAILY_REPORT") {

      var props =
        PropertiesService.getScriptProperties();

      var today =
        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          "dd-MM-yyyy"
        );

      var lastReport =
        props.getProperty(
          "LAST_DAILY_REPORT"
        );

      if (lastReport == today) {

        return ContentService
          .createTextOutput(
            "Daily Report Already Logged"
          );
      }

      props.setProperty(
        "LAST_DAILY_REPORT",
        today
      );
    }

    var sheet;

    if (event == "DAILY_REPORT") {

      sheet =
        ss.getSheetByName(
          "Daily Reports"
        );

    } else {

      sheet =
        ss.getSheetByName(
          "Outages"
        );
    }

    if (!sheet) {

      return ContentService
        .createTextOutput(
          "Sheet Missing"
        );
    }

    var now = new Date();

    var date =
      Utilities.formatDate(
        now,
        Session.getScriptTimeZone(),
        "dd-MM-yyyy"
      );

    var time =
      Utilities.formatDate(
        now,
        Session.getScriptTimeZone(),
        "HH:mm:ss"
      );

      if (event == "BOOT") {

  var props =
    PropertiesService.getScriptProperties();

  var lastBoot =
    Number(
      props.getProperty("LAST_BOOT")
    ) || 0;

  var nowMs =
    new Date().getTime();

  // Ignore BOOT within 60 seconds

  if (
    nowMs - lastBoot < 60000
  ) {

    return ContentService
      .createTextOutput(
        "Duplicate BOOT Ignored"
      );
  }

  props.setProperty(
    "LAST_BOOT",
    nowMs
  );
}

    sheet.appendRow([

      date,

      time,

      event,

      e.parameter.downtime || "",

      e.parameter.restarts || "",

      e.parameter.uptime || "",

      e.parameter.heap || ""

    ]);

    return ContentService
      .createTextOutput("OK");

  } finally {

    lock.releaseLock();
  }
}


// =====================================
// HEARTBEAT SYSTEM
// =====================================

function heartbeat(e) {

  var ss =
    SpreadsheetApp
    .getActiveSpreadsheet();

  var sheet =
    ss.getSheetByName(
      "Heartbeat"
    );

  // =================================
  // SAFETY
  // =================================

  if (!sheet) {

    return ContentService
      .createTextOutput(
        "Heartbeat Sheet Missing"
      );
  }

  var now = new Date();

  var date =
    Utilities.formatDate(

      now,

      Session.getScriptTimeZone(),

      "dd-MM-yyyy"
    );

  var time =
    Utilities.formatDate(

      now,

      Session.getScriptTimeZone(),

      "HH:mm:ss"
    );

  // =================================
  // APPEND HEARTBEAT
  // =================================

  sheet.appendRow([

    date,

    time,

    e.parameter.heap || ""
  ]);

  // =================================
  // AUTO CLEANUP
  // =================================

  var lastRow =
    sheet.getLastRow();

  if (lastRow > 100) {

    sheet.deleteRows(2, 40);
  }

  return ContentService
    .createTextOutput("OK");
}


// =====================================
// DASHBOARD DATA
// =====================================

function getDashboardData() {

  var ss =
    SpreadsheetApp
    .getActiveSpreadsheet();

  var outageSheet =
    ss.getSheetByName(
      "Outages"
    );

  var dailySheet =
    ss.getSheetByName(
      "Daily Reports"
    );

  var heartbeatSheet =
    ss.getSheetByName(
      "Heartbeat"
    );

  // =================================
  // SAFETY
  // =================================

  if (
    !outageSheet ||
    !dailySheet ||
    !heartbeatSheet
  ) {

    return ContentService
      .createTextOutput(

        JSON.stringify({

          error:
            "Missing Sheets"
        })
      )

      .setMimeType(
        ContentService
        .MimeType
        .JSON
      );
  }

  // =================================
  // LOAD DATA
  // =================================

  var outages =
    outageSheet
    .getDataRange()
    .getValues();

  var daily =
    dailySheet
    .getDataRange()
    .getValues();

  var heartbeat =
    heartbeatSheet
    .getDataRange()
    .getValues();

  var now =
    new Date();

  var today =
    Utilities.formatDate(

      now,

      Session.getScriptTimeZone(),

      "yyyy/MM/dd"
    );

  // =================================
  // VARIABLES
  // =================================

  var logs = [];

  var totalDown = 0;

  var totalRestarts = 0;

  var lastBoot = "-";

  var heap = "-";

  var online = false;

  var lastOnline = "-";

  var liveDown = 0;

  // =================================
  // HEARTBEAT STATUS
  // =================================

  if (heartbeat.length > 1) {

    var last =
      heartbeat[
        heartbeat.length - 1
      ];

    var hbDate =
      Utilities.formatDate(

        new Date(last[0]),

        Session.getScriptTimeZone(),

        "dd-MM-yyyy"
      );

    var hbTime =
      Utilities.formatDate(

        new Date(last[1]),

        Session.getScriptTimeZone(),

        "HH:mm:ss"
      );

    heap = last[2] || "-";

    lastOnline =
      hbDate +
      " " +
      hbTime;

    var dateParts =
      hbDate.split("-");

    var timeParts =
      hbTime.split(":");

    var lastHeartbeat =
      new Date(

        Number(dateParts[2]),

        Number(dateParts[1]) - 1,

        Number(dateParts[0]),

        Number(timeParts[0]),

        Number(timeParts[1]),

        Number(timeParts[2])
      );

    if (
      !isNaN(
        lastHeartbeat.getTime()
      )
    ) {

      var diff =
        Math.floor(

          (now -
           lastHeartbeat)

          / 1000
        );

      online = diff <= 20;

      if (!online) {

        liveDown = diff;
      }
    }
  }

  // =================================
  // OUTAGE LOGS
  // =================================

  for (
    var i = 1;
    i < outages.length;
    i++
  ) {

    var row =
      outages[i];

    logs.unshift({

      date:
        formatDate(row[0]),

      time:
        formatTime(row[1]),

      event:
        row[2],

      downtime:
        row[3],

      restarts:
        row[4],

      uptime:
        row[5]
    });

    // =================================
    // TODAY TOTALS
    // =================================

    var rowDate =
      Utilities.formatDate(

        new Date(row[0]),

        Session.getScriptTimeZone(),

        "yyyy/MM/dd"
      );

    if (

      rowDate == today &&

      row[2] == "RESTORED"
    ) {

      totalRestarts +=
        Number(row[4]) || 0;

      totalDown +=
        parseDowntime(
          row[3]
        );
    }

    // =================================
    // LAST BOOT
    // =================================

    if (
      row[2] == "BOOT"
    ) {

      lastBoot =

        formatDate(row[0]) +

        " " +

        formatTime(row[1]);
    }
  }

  // =================================
  // TOTAL CURRENT DOWNTIME
  // =================================

  var currentTotalDown =

    Number(totalDown) +

    Number(liveDown);

  if (
    isNaN(currentTotalDown)
  ) {

    currentTotalDown = 0;
  }

  // =================================
  // SECONDS TODAY
  // =================================

  var midnight =
    new Date(

      now.getFullYear(),

      now.getMonth(),

      now.getDate()
    );

  var secondsToday =
    Math.floor(
      (now - midnight) / 1000
    );

  if (secondsToday <= 0)
    secondsToday = 1;

  // =================================
  // UPTIME %
  // =================================

  var uptime =

    100 -

    (
      currentTotalDown *
      100 /
      secondsToday
    );

  if (isNaN(uptime))
    uptime = 100;

  if (uptime < 0)
    uptime = 0;

  if (uptime > 100)
    uptime = 100;

  // =================================
  // SLA COLOR
  // =================================

  var slaColor = "green";

  if (uptime < 95) {

    slaColor = "red";
  }

  else if (uptime < 99.9) {

    slaColor = "yellow";
  }

  // =================================
  // LIVE OUTAGE TEXT
  // =================================

  var liveOutageText =
    liveDown > 0

    ? "Offline for " +
      formatDowntime(liveDown)

    : "";

  // =================================
  // GRAPH DATA
  // =================================

  var last7days = [];

  var last30days = [];

  for (
    var j = 1;
    j < daily.length;
    j++
  ) {

    var d =
      daily[j];

    var item = {

      date:
        formatDate(d[0]),

      uptime:
        Number(d[5])
    };

    last30days.push(item);
  }

  last7days =
    last30days.slice(-7);

  last30days =
    last30days.slice(-30);

  // =================================
  // RETURN JSON
  // =================================

  return ContentService
    .createTextOutput(

      JSON.stringify({

        online:
          online,

        lastOnline:
          lastOnline,

        todayUptime:
          uptime.toFixed(2),

        todayDowntime:
          formatDowntime(
            currentTotalDown
          ),

        todayRestarts:
          totalRestarts,

        lastBoot:
          lastBoot,

        heap:
          heap,

        slaColor:
          slaColor,

        liveOutage:
          liveOutageText,

        logs:
          logs.slice(0,20),

        last7days:
          last7days,

        last30days:
          last30days
      })
    )

    .setMimeType(

      ContentService
      .MimeType
      .JSON
    );
}


// =====================================
// PARSE DOWNTIME
// =====================================

function parseDowntime(str) {

  if (!str)
    return 0;

  str =
    String(str).trim();

  var total = 0;

  var h =
    str.match(/(\d+)h/);

  var m =
    str.match(/(\d+)m/);

  var s =
    str.match(/(\d+)sec/);

  if (h)
    total +=
      parseInt(h[1]) * 3600;

  if (m)
    total +=
      parseInt(m[1]) * 60;

  if (s)
    total +=
      parseInt(s[1]);

  return total;
}


// =====================================
// FORMAT DOWNTIME
// =====================================

function formatDowntime(sec) {

  sec = Number(sec);

  if (isNaN(sec))
    sec = 0;

  var h =
    Math.floor(sec / 3600);

  var m =
    Math.floor(
      (sec % 3600) / 60
    );

  var s =
    Math.floor(sec % 60);

  var str = "";

  if (h > 0)
    str += h + "h ";

  if (m > 0 || h > 0)
    str += m + "m ";

  str += s + "sec";

  return str;
}


// =====================================
// FORMAT DATE
// =====================================

function formatDate(dateObj) {

  return Utilities.formatDate(

    new Date(dateObj),

    Session.getScriptTimeZone(),

    "dd-MM-yyyy"
  );
}


// =====================================
// FORMAT TIME
// =====================================

function formatTime(timeObj) {

  return Utilities.formatDate(

    new Date(timeObj),

    Session.getScriptTimeZone(),

    "HH:mm:ss"
  );
}
