/* ==========================================================
   ROUTER DASHBOARD
   script.js
   PART 1
========================================================== */

//==========================================================
// CONFIGURATION
//==========================================================

const API_URL =
"https://script.google.com/macros/s/AKfycbwWXwrwkQWWaPDdCNrb-bEDVwOAT36veI4FkOCCoiMMbRtPfr_lusKvqGRv717qN7JqPw/exec?type=dashboard";

const REFRESH_INTERVAL = 10000; //10 seconds

let chart7 = null;
let chart30 = null;

let expiryTime = null;

let lastStatus = "";

let dashboard = null;


//==========================================================
// ELEMENTS
//==========================================================

const loader =
document.getElementById("loader");

const app =
document.getElementById("app");

const offlineBanner =
document.getElementById("offlineBanner");

const toast =
document.getElementById("toast");


//==========================================================
// SHORTCUT
//==========================================================

function $(id){

    return document.getElementById(id);

}




//==========================================================
// SHOW LOADER
//==========================================================

function showLoader(){

    loader.style.display="flex";

    app.classList.remove("show");

}

function startLoadingAnimation(){

const text=document.getElementById("loadingText");
const progress=document.getElementById("loadingProgress");
const percent=document.getElementById("loadingPercent");

const steps=[

"Starting Dashboard...",
"Checking Internet...",
"Reading Router...",
"Loading Statistics...",
"Building Charts...",
"Almost Ready..."

];

let p=0;

const timer=setInterval(()=>{

p+=20;

progress.style.width=p+"%";

percent.innerHTML=p+"%";

if(p<=100){

text.innerHTML=
steps[Math.min(p/20-1,steps.length-1)];

}

if(p>=100){

clearInterval(timer);

}

},250);

}


//==========================================================
// FORMAT NUMBER
//==========================================================

function formatNumber(value){

    if(value===undefined || value===null)
        return "--";

    return value;

}


//==========================================================
// STATUS
//==========================================================

function updateStatus(data){

    if(data.online){

        $("status").innerHTML="ONLINE";

        $("status").className=
        "card-value online";

        $("statusText").innerHTML=
        "Router responding normally";

        offlineBanner.classList.remove("show");

    }

    else{

        $("status").innerHTML="OFFLINE";

        $("status").className=
        "card-value offline";

        $("statusText").innerHTML=
        "Router not responding";

        offlineBanner.classList.add("show");

    }

    if(lastStatus===""){

        lastStatus=data.online?"ONLINE":"OFFLINE";

    }

    else{

        let current =
        data.online?"ONLINE":"OFFLINE";

        if(current!==lastStatus){

            showToast(
            "Router is now " + current
            );

            lastStatus=current;

        }

    }

}


//==========================================================
// UPDATE BASIC CARDS
//==========================================================

function updateCards(data){

    $("todayUptime").innerHTML =
    data.todayUptime + "%";

    $("todayDowntime").innerHTML =
    data.todayDowntime;

    $("todayRestarts").innerHTML =
    data.todayRestarts;

    $("lastBoot").innerHTML =
    data.lastBoot;

    $("heap").innerHTML =
    data.heap;

    $("ispIP").innerHTML =
    data.ispIP;

    $("ispUpload").innerHTML =
    data.ispUpload;

    $("ispDownload").innerHTML =
    data.ispDownload;

    $("ispConnected").innerHTML =
    data.ispConnected;

    $("ispLeft").innerHTML =
    data.ispLeft;

    $("liveOutage").innerHTML =
    data.liveOutage || "None";

    $("lastOnline").innerHTML =
    data.lastOnline;

    $("slaStatus").innerHTML =
    data.todayUptime + "%";

    $("lastRefresh").innerHTML =
    "Last Refresh : " +
    new Date().toLocaleTimeString();

}


//==========================================================
// UPDATE UPTIME BAR
//==========================================================

function updateProgress(data){

    const value =
    Number(data.todayUptime);

    $("uptimeBar").style.width =
    value + "%";

    if(value>=99){

        $("connectionHealth").innerHTML =
        "Excellent";

        $("connectionHealth").className =
        "card-value green";

    }

    else if(value>=95){

        $("connectionHealth").innerHTML =
        "Good";

        $("connectionHealth").className =
        "card-value yellow";

    }

    else{

        $("connectionHealth").innerHTML =
        "Poor";

        $("connectionHealth").className =
        "card-value red";

    }

}




/* ==========================================================
   SCRIPT.JS
   PART 2
   LOAD DASHBOARD
========================================================== */

async function loadDashboard(){

try{

const response=
await fetch(API_URL + "&t=" + Date.now(),{
cache:"no-store"
});

if(!response.ok)
throw new Error("API Error");

const data=
await response.json();

dashboard=data;

/* ===========================
   STATUS
=========================== */

const status=document.getElementById("status");
const statusText=document.getElementById("statusText");

if(data.online){

status.innerHTML="ONLINE";
status.className="card-value online";

statusText.innerHTML="Router Connected";

hideOfflineBanner();

}
else{

status.innerHTML="OFFLINE";
status.className="card-value offline";

statusText.innerHTML="Router Disconnected";

showOfflineBanner();

}

/* ===========================
   TODAY UPTIME
=========================== */

document.getElementById("todayUptime").innerHTML=
data.todayUptime+"%";

document.getElementById("uptimeBar").style.width=
data.todayUptime+"%";

/* ===========================
   DOWNTIME
=========================== */

document.getElementById("todayDowntime").innerHTML=
data.todayDowntime;

/* ===========================
   RESTARTS
=========================== */

document.getElementById("todayRestarts").innerHTML=
data.todayRestarts;

/* ===========================
   LAST BOOT
=========================== */

document.getElementById("lastBoot").innerHTML=
data.lastBoot;

/* ===========================
   FREE HEAP
=========================== */

document.getElementById("heap").innerHTML=
Number(data.heap).toLocaleString();

/* ===========================
   ISP INFO
=========================== */

document.getElementById("ispIP").innerHTML=
data.ispIP;

document.getElementById("ispUpload").innerHTML=
data.ispUpload;

document.getElementById("ispDownload").innerHTML=
data.ispDownload;

document.getElementById("ispConnected").innerHTML=
data.ispConnected;

document.getElementById("ispLeft").innerHTML=
data.ispLeft;
   
/* ===========================
   TODAY'S USAGE
=========================== */

document.getElementById("todayDownload").innerHTML =
data.todayDownload || "--";

document.getElementById("todayUpload").innerHTML =
data.todayUpload || "--";


/* ===========================
   LIVE STATUS
=========================== */

document.getElementById("liveOutage").innerHTML=
data.liveOutage==""?
"None":
data.liveOutage;

document.getElementById("lastOnline").innerHTML=
data.lastOnline;

document.getElementById("slaStatus").innerHTML=
data.todayUptime+"%";

/* ===========================
   CONNECTION HEALTH
=========================== */

let uptime=
parseFloat(data.todayUptime);

let health="Excellent";
let cls="green";

if(uptime<99.9){

health="Good";
cls="green";

}

if(uptime<99){

health="Average";
cls="yellow";

}

if(uptime<95){

health="Poor";
cls="red";

}

const healthBox=
document.getElementById("connectionHealth");

healthBox.innerHTML=health;

healthBox.className=
"card-value "+cls;

/* ===========================
   RECHARGE DATE
=========================== */

calculateExpiry(
data.ispLeft
);

/* ===========================
   LOG TABLE
=========================== */

buildLogs(data.logs);

/* ===========================
   CHARTS
=========================== */

buildCharts(data);

/* ===========================
   LAST REFRESH
=========================== */

document.getElementById("lastRefresh").innerHTML=
"Last Refresh : "+
new Date().toLocaleTimeString();

/* ===========================
   LOADER
=========================== */

hideLoader();

}
catch(e){

    console.error(e);

    $("status").innerHTML = "ERROR";
    $("status").className = "card-value red";

    $("statusText").innerHTML =
    "Unable to connect";

    showToast("Cannot reach server");

}
}
/* ==========================================================
   SCRIPT.JS
   PART 3
   LOGS & CHARTS
========================================================== */

/* ===========================
   BUILD LOG TABLE
=========================== */

function buildLogs(logs){

const tbody=
document.getElementById("logs");

tbody.innerHTML="";

logs.forEach(log=>{

const row=document.createElement("tr");

row.innerHTML=`

<td>${log.date}</td>

<td>${log.time}</td>

<td>${log.event}</td>

<td>${log.downtime}</td>

<td>${log.restarts}</td>

<td>${log.uptime}%</td>

`;

tbody.appendChild(row);

});

}

/* ===========================
   BUILD CHARTS
=========================== */

function buildCharts(data){

build7DayChart(data.last7days);

build30DayChart(data.last30days);

}

/* ===========================
   7 DAY CHART
=========================== */

function build7DayChart(days){

    const labels = days.map(x => x.date);

    const values = days.map(x => Number(x.uptime));

    if(!chart7){

        chart7 = new Chart(

            document.getElementById("chart7"),

            {

                type:"line",

                data:{

                    labels:labels,

                    datasets:[{

                        label:"Uptime %",

                        data:values,

                        borderColor:"#3b82f6",

                        backgroundColor:"rgba(59,130,246,.15)",

                        fill:true,

                        borderWidth:3,

                        pointRadius:4,

                        pointHoverRadius:6,

                        tension:.35

                    }]

                },

                options:{

                    responsive:true,

                    maintainAspectRatio:false,

                    animation:true,

                    plugins:{

                        legend:{

                            display:false

                        }

                    },

                    scales:{

                        y:{

                            min:0,

                            max:100,

                            ticks:{

                                color:"#ffffff"

                            },

                            grid:{

                                color:"rgba(255,255,255,.08)"

                            }

                        },

                        x:{

                            ticks:{

                                color:"#ffffff"

                            },

                            grid:{

                                display:false

                            }

                        }

                    }

                }

            }

        );

    }

    else{

        chart7.data.labels = labels;

        chart7.data.datasets[0].data = values;

        chart7.update();

    }

}



/* ===========================
   30 DAY CHART
=========================== */

function build30DayChart(days){

    const labels = days.map(x => x.date);

    const values = days.map(x => Number(x.uptime));

    if(!chart30){

        chart30 = new Chart(

            document.getElementById("chart30"),

            {

                type:"line",

                data:{

                    labels:labels,

                    datasets:[{

                        label:"Uptime %",

                        data:values,

                        borderColor:"#18d26e",

                        backgroundColor:"rgba(24,210,110,.15)",

                        fill:true,

                        borderWidth:3,

                        pointRadius:2,

                        pointHoverRadius:5,

                        tension:.35

                    }]

                },

                options:{

                    responsive:true,

                    maintainAspectRatio:false,

                    animation:true,

                    plugins:{

                        legend:{

                            display:false

                        }

                    },

                    scales:{

                        y:{

                            min:0,

                            max:100,

                            ticks:{

                                color:"#ffffff"

                            },

                            grid:{

                                color:"rgba(255,255,255,.08)"

                            }

                        },

                        x:{

                            ticks:{

                                color:"#ffffff",

                                maxRotation:90,

                                minRotation:90

                            },

                            grid:{

                                display:false

                            }

                        }

                    }

                }

            }

        );

    }

    else{

        chart30.data.labels = labels;

        chart30.data.datasets[0].data = values;

        chart30.update();

    }

}
/* ==========================================================
   SCRIPT.JS
   PART 4
   FINAL
========================================================== */


/* ===========================
   CALCULATE RECHARGE DATE
=========================== */

function calculateExpiry(leftString){

if(!leftString){

document.getElementById("expiryDate").innerHTML="--";
document.getElementById("countdown").innerHTML="--";

return;

}

let total=0;

const d=leftString.match(/(\d+)d/);
const h=leftString.match(/(\d+)h/);
const m=leftString.match(/(\d+)m/);
const s=leftString.match(/(\d+)s/);

if(d) total+=Number(d[1])*86400;
if(h) total+=Number(h[1])*3600;
if(m) total+=Number(m[1])*60;
if(s) total+=Number(s[1]);

expiryTime=
new Date(
Date.now()+total*1000
);

document.getElementById("expiryDate").innerHTML=
expiryTime.toLocaleString();

updateCountdown();

}


/* ===========================
   LIVE COUNTDOWN
=========================== */

function updateCountdown(){

if(!expiryTime)
return;

let diff=
Math.floor(
(expiryTime-new Date())/1000
);

if(diff<0)
diff=0;

let days=
Math.floor(diff/86400);

diff%=86400;

let hours=
Math.floor(diff/3600);

diff%=3600;

let mins=
Math.floor(diff/60);

let secs=
diff%60;

const text=
`${days}d ${hours}h ${mins}m ${secs}s`;

const box=
document.getElementById("countdown");

box.innerHTML=text;

box.className="card-value";

if(days>7){

box.classList.add("green");

}

else if(days>3){

box.classList.add("yellow");

}

else{

box.classList.add("red");

}

}


/* ===========================
   OFFLINE BANNER
=========================== */

function showOfflineBanner(){

document
.getElementById("offlineBanner")
.classList.add("show");

}

function hideOfflineBanner(){

document
.getElementById("offlineBanner")
.classList.remove("show");

}


/* ===========================
   LOADER
=========================== */

function hideLoader(){

loader.style.opacity="0";

setTimeout(()=>{

loader.style.display="none";

app.classList.add("show");

},600);

}


/* ===========================
   TOAST
=========================== */

function showToast(message){

const toast=
document.getElementById("toast");

toast.innerHTML=
message;

toast.classList.add("show");

setTimeout(()=>{

toast.classList.remove("show");

},2500);

}


/* ===========================
   CLOCK
=========================== */

function updateClock(){

const now=
new Date();

document.getElementById("currentDate").innerHTML=
now.toLocaleDateString();

document.getElementById("currentTime").innerHTML=
now.toLocaleTimeString();

}


/* ===========================
   INITIALIZATION
=========================== */

document.addEventListener("DOMContentLoaded",()=>{

showLoader();

startLoadingAnimation();

updateClock();

loadDashboard();

setInterval(updateClock,1000);

setInterval(updateCountdown,1000);

setInterval(loadDashboard,REFRESH_INTERVAL);

});
