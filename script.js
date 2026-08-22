/* =========================================================
   ROUTER MONITORING DASHBOARD
   script.js
   ========================================================= */

const API_URL = ""; 
// Example when ESP8266 provides an API:
// const API_URL = "http://192.168.1.1";


// =========================================================
// GLOBAL DATA
// =========================================================

let dashboardData = {
    status: "ONLINE",
    todayUptime: 0,
    todayDowntime: 0,
    todayRestarts: 0,

    lastBoot: "--",
    heap: "--",

    ispIP: "--",
    ispUpload: "--",
    ispDownload: "--",
    ispConnected: "--",
    ispLeft: "--",

    expiryDate: "--",

    connectionHealth: 100,
    liveOutage: false,
    lastOnline: "--",

    slaStatus: "GOOD",

    logs: []
};


// =========================================================
// PAGE LOADER
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    initializeDashboard();

    updateClock();

    setInterval(updateClock, 1000);

    // Refresh dashboard every 5 seconds
    setInterval(fetchRouterData, 5000);

    fetchRouterData();
});


// =========================================================
// INITIALIZE DASHBOARD
// =========================================================

function initializeDashboard() {

    showLoader();

    updateDashboard();

    setTimeout(() => {
        hideLoader();
    }, 800);
}


// =========================================================
// FETCH DATA FROM ESP8266
// =========================================================

async function fetchRouterData() {

    if (!API_URL) {
        // Demo mode
        generateDemoData();
        updateDashboard();
        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/status`, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Router API unavailable");
        }

        const data = await response.json();

        dashboardData = {
            ...dashboardData,
            ...data
        };

        updateDashboard();

        setOnlineState(true);

    } catch (error) {

        console.error("Router connection error:", error);

        setOnlineState(false);
    }
}


// =========================================================
// UPDATE COMPLETE DASHBOARD
// =========================================================

function updateDashboard() {

    updateRouterStatus();

    updateRouterStatistics();

    updateISPInformation();

    updateRouterHealth();

    updateConnectionHealth();

    updateOutageStatus();

    updateSLA();

    updateLogs();
}


// =========================================================
// ROUTER STATUS
// =========================================================

function updateRouterStatus() {

    const status = document.getElementById("status");
    const statusText = document.getElementById("statusText");

    if (!status || !statusText) return;

    const online =
        String(dashboardData.status).toUpperCase() === "ONLINE";

    status.classList.remove("online", "offline");

    if (online) {

        status.classList.add("online");

        statusText.textContent = "Router Online";

    } else {

        status.classList.add("offline");

        statusText.textContent = "Router Offline";
    }
}


// =========================================================
// ROUTER STATISTICS
// =========================================================

function updateRouterStatistics() {

    setText(
        "todayUptime",
        formatDuration(dashboardData.todayUptime)
    );

    setText(
        "todayDowntime",
        formatDuration(dashboardData.todayDowntime)
    );

    setText(
        "todayRestarts",
        dashboardData.todayRestarts
    );

    setText(
        "lastBoot",
        dashboardData.lastBoot
    );
}


// =========================================================
// ISP INFORMATION
// =========================================================

function updateISPInformation() {

    setText("ispIP", dashboardData.ispIP);

    setText(
        "ispUpload",
        formatSpeed(dashboardData.ispUpload)
    );

    setText(
        "ispDownload",
        formatSpeed(dashboardData.ispDownload)
    );

    setText(
        "ispConnected",
        dashboardData.ispConnected
    );

    setText(
        "ispLeft",
        dashboardData.ispLeft
    );

    setText(
        "expiryDate",
        dashboardData.expiryDate
    );

    updateCountdown();
}


// =========================================================
// ROUTER HEALTH
// =========================================================

function updateRouterHealth() {

    setText(
        "heap",
        dashboardData.heap
    );
}


// =========================================================
// CONNECTION HEALTH
// =========================================================

function updateConnectionHealth() {

    const element =
        document.getElementById("connectionHealth");

    if (!element) return;

    let health =
        Number(dashboardData.connectionHealth);

    if (isNaN(health)) {
        health = 0;
    }

    health = Math.max(0, Math.min(100, health));

    element.textContent = `${health}%`;

    element.classList.remove(
        "excellent",
        "good",
        "warning",
        "critical"
    );

    if (health >= 90) {

        element.classList.add("excellent");

    } else if (health >= 70) {

        element.classList.add("good");

    } else if (health >= 40) {

        element.classList.add("warning");

    } else {

        element.classList.add("critical");
    }
}


// =========================================================
// LIVE OUTAGE
// =========================================================

function updateOutageStatus() {

    const outage =
        document.getElementById("liveOutage");

    const lastOnline =
        document.getElementById("lastOnline");

    if (outage) {

        if (dashboardData.liveOutage) {

            outage.textContent = "LIVE OUTAGE";
            outage.classList.add("active");

        } else {

            outage.textContent = "NO OUTAGE";
            outage.classList.remove("active");
        }
    }

    if (lastOnline) {

        lastOnline.textContent =
            dashboardData.lastOnline || "--";
    }
}


// =========================================================
// SLA STATUS
// =========================================================

function updateSLA() {

    const element =
        document.getElementById("slaStatus");

    if (!element) return;

    const status =
        String(dashboardData.slaStatus || "GOOD")
            .toUpperCase();

    element.textContent = status;

    element.classList.remove(
        "good",
        "warning",
        "bad"
    );

    if (status === "GOOD") {

        element.classList.add("good");

    } else if (status === "WARNING") {

        element.classList.add("warning");

    } else {

        element.classList.add("bad");
    }
}


// =========================================================
// COUNTDOWN
// =========================================================

function updateCountdown() {

    const countdown =
        document.getElementById("countdown");

    if (!countdown) return;

    if (!dashboardData.expiryDate ||
        dashboardData.expiryDate === "--") {

        countdown.textContent = "--";
        return;
    }

    const expiry =
        new Date(dashboardData.expiryDate);

    if (isNaN(expiry.getTime())) {

        countdown.textContent = "--";
        return;
    }

    const now = new Date();

    const difference =
        expiry.getTime() - now.getTime();

    if (difference <= 0) {

        countdown.textContent = "Expired";
        countdown.classList.add("expired");

        return;
    }

    countdown.classList.remove("expired");

    const days =
        Math.floor(
            difference / (1000 * 60 * 60 * 24)
        );

    const hours =
        Math.floor(
            (difference / (1000 * 60 * 60)) % 24
        );

    const minutes =
        Math.floor(
            (difference / (1000 * 60)) % 60
        );

    countdown.textContent =
        `${days}d ${hours}h ${minutes}m`;
}


// =========================================================
// LOGS
// =========================================================

function updateLogs() {

    const logs =
        document.getElementById("logs");

    if (!logs) return;

    if (!Array.isArray(dashboardData.logs) ||
        dashboardData.logs.length === 0) {

        logs.innerHTML = `
            <div class="empty-log">
                No recent events
            </div>
        `;

        return;
    }

    logs.innerHTML = "";

    dashboardData.logs.forEach(log => {

        const row =
            document.createElement("div");

        row.className = "log-item";

        const time =
            escapeHTML(log.time || "--");

        const event =
            escapeHTML(log.event || "--");

        const type =
            escapeHTML(log.type || "info");

        row.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-event">${event}</span>
            <span class="log-type ${type}">
                ${type.toUpperCase()}
            </span>
        `;

        logs.appendChild(row);
    });
}


// =========================================================
// ONLINE / OFFLINE STATE
// =========================================================

function setOnlineState(isOnline) {

    const status =
        document.getElementById("status");

    const statusText =
        document.getElementById("statusText");

    if (!status || !statusText) return;

    status.classList.remove(
        "online",
        "offline"
    );

    if (isOnline) {

        status.classList.add("online");

        statusText.textContent =
            "Router Online";

        removeOfflineBanner();

    } else {

        status.classList.add("offline");

        statusText.textContent =
            "Router Offline";

        showOfflineBanner();
    }
}


// =========================================================
// OFFLINE BANNER
// =========================================================

function showOfflineBanner() {

    if (document.getElementById("offlineBanner")) {
        return;
    }

    const banner =
        document.createElement("div");

    banner.id = "offlineBanner";

    banner.innerHTML = `
        <span>⚠</span>
        Router connection unavailable
    `;

    document.body.prepend(banner);
}


function removeOfflineBanner() {

    const banner =
        document.getElementById("offlineBanner");

    if (banner) {
        banner.remove();
    }
}


// =========================================================
// CLOCK
// =========================================================

function updateClock() {

    const clock =
        document.getElementById("clock");

    if (!clock) return;

    const now = new Date();

    clock.textContent =
        now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
}


// =========================================================
// HELPERS
// =========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "--";
}


function formatDuration(seconds) {

    seconds = Number(seconds);

    if (isNaN(seconds) || seconds < 0) {
        return "--";
    }

    const days =
        Math.floor(seconds / 86400);

    seconds %= 86400;

    const hours =
        Math.floor(seconds / 3600);

    seconds %= 3600;

    const minutes =
        Math.floor(seconds / 60);

    if (days > 0) {

        return `${days}d ${hours}h`;
    }

    if (hours > 0) {

        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}


function formatSpeed(value) {

    if (value === undefined ||
        value === null ||
        value === "") {

        return "--";
    }

    const number =
        Number(value);

    if (isNaN(number)) {
        return value;
    }

    if (number >= 1000) {

        return `${(number / 1000).toFixed(1)} Mbps`;
    }

    return `${number} Kbps`;
}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =========================================================
// DEMO DATA
// Used until ESP8266 API is connected
// =========================================================

function generateDemoData() {

    const now =
        new Date();

    dashboardData.status = "ONLINE";

    dashboardData.todayUptime = 37842;

    dashboardData.todayDowntime = 428;

    dashboardData.todayRestarts = 2;

    dashboardData.lastBoot =
        "Today, 04:32 AM";

    dashboardData.heap =
        "31.4 KB";

    dashboardData.ispIP =
        "103.212.45.XX";

    dashboardData.ispUpload =
        8.4;

    dashboardData.ispDownload =
        42.7;

    dashboardData.ispConnected =
        "6h 24m";

    dashboardData.ispLeft =
        "12 Days";

    dashboardData.expiryDate =
        "2026-09-03T23:59:59";

    dashboardData.connectionHealth =
        98;

    dashboardData.liveOutage =
        false;

    dashboardData.lastOnline =
        now.toLocaleTimeString("en-IN");

    dashboardData.slaStatus =
        "GOOD";

    dashboardData.logs = [

        {
            time: "08:32 AM",
            event: "Internet connection stable",
            type: "success"
        },

        {
            time: "07:15 AM",
            event: "Speed test completed",
            type: "info"
        },

        {
            time: "04:32 AM",
            event: "Router restarted",
            type: "warning"
        },

        {
            time: "02:18 AM",
            event: "Internet outage detected",
            type: "error"
        }
    ];
}


// =========================================================
// OPTIONAL ESP8266 COMMANDS
// =========================================================

async function restartRouter() {

    if (!API_URL) {

        console.log(
            "Demo mode: router restart unavailable."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/api/restart`,
                {
                    method: "POST"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Restart command failed"
            );
        }

        console.log(
            "Router restart command sent."
        );

    } catch (error) {

        console.error(error);
    }
}


// =========================================================
// EXPORT FUNCTIONS
// =========================================================

window.RouterDashboard = {

    refresh: fetchRouterData,

    restart: restartRouter,

    getData: () => dashboardData
};
