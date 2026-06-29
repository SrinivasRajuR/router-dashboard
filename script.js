/*=========================================================
 ROUTER DASHBOARD
 SCRIPT.JS
 PART 1
=========================================================*/


"use strict";

/*=========================================================
 CONFIGURATION
=========================================================*/

const API_URL =
"https://script.google.com/macros/s/YOUR_WEBAPP_ID/exec?type=dashboard";

const REFRESH_INTERVAL = 1000;

const CHART_REFRESH = 5000;

const CONNECTION_TIMEOUT = 15000;


/*=========================================================
 GLOBAL VARIABLES
=========================================================*/

let dashboardData = {};

let chart7 = null;

let chart30 = null;

let refreshTimer = null;

let chartTimer = null;

let clockTimer = null;

let countdownTimer = null;

let reconnectTimer = null;

let expiryTime = null;

let loading = false;

let connected = false;

let reconnecting = false;

let previousOnlineState = null;


/*=========================================================
 DOM ELEMENTS
=========================================================*/

const app = document.getElementById("app");

const loader = document.getElementById("loader");

const status = document.getElementById("status");

const uptime = document.getElementById("uptime");

const downtime = document.getElementById("downtime");

const restarts = document.getElementById("restarts");

const heap = document.getElementById("heap");

const lastBoot = document.getElementById("lastBoot");

const lastOnline = document.getElementById("lastOnline");

const liveOutage = document.getElementById("liveOutage");

const refreshTime = document.getElementById("refreshTime");

const ispIP = document.getElementById("ispIP");

const ispUpload = document.getElementById("ispUpload");

const ispDownload = document.getElementById("ispDownload");

const ispConnected = document.getElementById("ispConnected");

const expiryDate = document.getElementById("expiryDate");

const logsBody = document.getElementById("logs");

const chart7Canvas =
document.getElementById("chart7");

const chart30Canvas =
document.getElementById("chart30");

const currentDate =
document.getElementById("currentDate");

const currentTime =
document.getElementById("currentTime");


/*=========================================================
 LOADER
=========================================================*/

function showLoader(){

    if(loader)
        loader.style.display="flex";

}

function hideLoader(){

    if(loader)
        loader.style.display="none";

    if(app)
        app.classList.add("show");

}


/*=========================================================
 CLOCK
=========================================================*/

function updateClock(){

    const now=new Date();

    if(currentDate){

        currentDate.innerHTML=
        now.toLocaleDateString(
            undefined,
            {
                weekday:"long",
                day:"2-digit",
                month:"long",
                year:"numeric"
            }
        );

    }

    if(currentTime){

        currentTime.innerHTML=
        now.toLocaleTimeString();

    }

}


/*=========================================================
 LAST REFRESH
=========================================================*/

function updateRefreshTime(){

    if(!refreshTime)
        return;

    refreshTime.innerHTML=

        "Last Refresh : "

        +

        new Date().toLocaleTimeString();

}


/*=========================================================
 HELPERS
=========================================================*/

function setText(id,value){

    const el=document.getElementById(id);

    if(!el)
        return;

    el.innerHTML=value;

}


function safeValue(value,fallback="--"){

    if(value===undefined)
        return fallback;

    if(value===null)
        return fallback;

    if(value==="")
        return fallback;

    return value;

}


function formatNumber(value){

    if(isNaN(value))
        return "0";

    return Number(value).toLocaleString();

}


/*=========================================================
 STARTUP
=========================================================*/

function initialiseDashboard(){

    showLoader();

    updateClock();

    clockTimer=

        setInterval(

            updateClock,

            1000

        );

}


/*=========================================================
 PAGE LOAD
=========================================================*/

window.addEventListener(

    "load",

    initialiseDashboard

);
