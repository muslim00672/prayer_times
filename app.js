const stampEl = document.getElementById('stamp');
stampEl.addEventListener('change', set_prayer_times);
const latEl = document.getElementById('lat');
latEl.addEventListener('input', set_prayer_times);
const longEl = document.getElementById('long');
longEl.addEventListener('input', set_prayer_times);
const elevEl = document.getElementById('elev');
elevEl.addEventListener('input', set_prayer_times);

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

const names = ['الفجر 18', 'الفجر 15', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء 15', 'العشاء 18', 'منتصف الليل'];

function get_prayer_times(n = 0) {
    console.trace();
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
    if (isNaN(parseFloat(longEl.value))) {
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

function updateTimer() {
    updateTimes();
    const timerEl = document.getElementById('timer');
    if (isNaN(parseFloat(longEl.value))) {
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
setInterval(updateTimer, 1000);

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

const buttons = document.querySelectorAll('button');
const toggleEl = document.getElementById('toggle');
const docEl = document.documentElement;
const theme = localStorage.getItem('theme');

function setDarkTheme() {
    docEl.setAttribute('data-bs-theme', 'dark');
    toggleEl.textContent = '☀️';
    buttons.forEach(button => {
        button.classList.remove('btn-dark');
        button.classList.add('btn-light');
    });
    localStorage.setItem('theme', 'dark');
}

function setLightTheme() {
    docEl.setAttribute('data-bs-theme', 'light');
    toggleEl.textContent = '🌕';
    buttons.forEach(button => {
        button.classList.remove('btn-light');
        button.classList.add('btn-dark');
    });
    localStorage.setItem('theme', 'light');
}

function setDefaultTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkTheme();
    else setLightTheme();
}

if (theme === 'dark') setDarkTheme();
else if (theme === 'light') setLightTheme();
else setDefaultTheme();

toggleEl.addEventListener('click', () => {
    if (docEl.getAttribute('data-bs-theme') === 'dark') setLightTheme();
    else setDarkTheme();
});
