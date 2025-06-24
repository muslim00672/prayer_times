const stampEl = document.getElementById('stamp');
const latEl = document.getElementById('lat');
const longEl = document.getElementById('long');
const elevEl = document.getElementById('elev');

stampEl.value = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

let stamp;
let now;
function updateTimes() {
    stamp = new Date(stampEl.value);
    now = new Date().setFullYear(stamp.getFullYear(), stamp.getMonth(), stamp.getDate());
}

navigator.geolocation.getCurrentPosition(
    function (position) {
        latEl.value = position.coords.latitude;
        longEl.value = position.coords.longitude;
        set_prayer_times();
    }, function (error) {
        const alertEl = document.getElementById('alert');
        alertEl.style.display = 'block';
        alert(alertEl.textContent);
    }
);

function get_prayer_times(n = 0) {
    const lat = parseFloat(latEl.value);
    const long = parseFloat(longEl.value);
    const elev = parseFloat(elevEl.value);
    return prayer_times(lat, long, new Date(stamp.getTime() + 86400000 * n), elev);
}

const tableEl = document.getElementById('table');
function set_prayer_times() {
    tableEl.innerHTML = '';
    updateTimer();

    const infoEl = document.getElementById('info');
    let isBreak = 0;
    for (const prayerTime of get_prayer_times()) {
        if (prayerTime != 'Invalid Date') {
            isBreak = 1;
            break;
        }
    }
    if (!isBreak) {
        infoEl.style.display = 'none';
        return;
    }
    infoEl.style.display = 'block';

    if (day(-1)) {
        appendRow(...day(-1));
        appendRow('<td colspan=3><hr></td>');
        get_prayer_times().forEach(appendRow);
    } else if (day()) {
        get_prayer_times().forEach(appendRow);
    } else {
        get_prayer_times().forEach(appendRow);
        appendRow('<td colspan=3><hr></td>');
        appendRow(...day(1));
    }
}
setInterval(set_prayer_times, 50);

function updateTimer() {
    updateTimes();

    const timerEl = document.getElementById('timer');
    let isBreak = 0;
    for (const prayerTime of get_prayer_times()) {
        if (prayerTime != 'Invalid Date') {
            isBreak = 1;
            break;
        }
    }
    if (!isBreak) {
        timerEl.style.display = 'none';
        return;
    }
    timerEl.style.display = 'block';

    let next, i;
    if (day(-1)) {
        [next, i] = day(-1);
    } else if (day()) {
        [next, i] = day();
    } else {
        [next, i] = day(1);
    }
    let diff = next - now;
    let hours = diff / 3600000;
    let minutes = diff % 3600000 / 60000;
    let seconds = diff % 60000 / 1000;
    [hours, minutes, seconds] = [hours, minutes, seconds].map(t => parseInt(t));
    timerEl.textContent = `باقٍ ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} على ${names[i]}.`;
}

function frmt(prayerTime) {
    return prayerTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace('AM', 'ص').replace('PM', 'م');
}

function appendRow(prayerTime, i) {
    const row = document.createElement('tr');
    if (isNaN(i)) {
        row.innerHTML = `${prayerTime}`;
    } else {
        row.innerHTML = `<td>${names[i]}</td><td>&nbsp:&nbsp</td><td>${frmt(prayerTime)}</td>`;
    }
    tableEl.appendChild(row);
}

function day(n = 0) {
    let i = 0;
    for (const prayerTime of get_prayer_times(n)) {
        if (prayerTime > now) {
            return [prayerTime, i];
        }
        i++;
    }
}
