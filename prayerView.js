const stamp = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000);
const stampEl = document.getElementById('stamp');
stampEl.textContent = stamp.toISOString().split('T')[0];

let now;
function updateTimes() {
    now = new Date().setFullYear(stamp.getFullYear(), stamp.getMonth(), stamp.getDate());
}

let lat;
let long;
navigator.geolocation.getCurrentPosition(
    function (position) {
        lat = position.coords.latitude;
        long = position.coords.longitude;
        set_prayer_times();
    }, function (error) {
        const alertEl = document.getElementById('alert');
        alertEl.style.display = 'block';
        alert(alertEl.textContent);
    }
);

const names = ['الفجر 18', 'الفجر 15', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء 15', 'العشاء 18', 'منتصف الليل'];

function get_prayer_times(n = 0) {
    return prayer_times(parseFloat(lat), parseFloat(long), new Date(stamp.getTime() + 86400000 * n));
}

const tableEl = document.getElementById('table');
function set_prayer_times() {
    tableEl.innerHTML = '';
    getLocation();
    updateTimer();

    const infoEl = document.getElementById('info');
    if (get_prayer_times()[3] == 'Invalid Date') {
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

    setInterval(updateTimer, 1000);
}

function updateTimer() {
    updateTimes();
    const timerEl = document.getElementById('timer');
    if (get_prayer_times()[3] == 'Invalid Date') {
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
    const diff = (next - now) / 1000;
    let hours = diff / 3600;
    let minutes = hours % 1 * 60;
    let seconds = minutes % 1 * 60;
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

function getLocation() {
    const locEl = document.getElementById('loc');
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`)
    .then(reponse => reponse.json())
    .then(data => locEl.textContent = data.display_name);
}
