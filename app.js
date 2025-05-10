const stampEl = document.getElementById('stamp');
stampEl.addEventListener('change', set_prayer_times);
const latEl = document.getElementById('lat');
latEl.addEventListener('input', set_prayer_times);
const longEl = document.getElementById('long');
longEl.addEventListener('input', set_prayer_times);
const elevEl = document.getElementById('elev');
elevEl.addEventListener('input', set_prayer_times);

const names = ['الفجر 18', 'الفجر 15', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء 15', 'العشاء 18'];

stampEl.value = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

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

function prayer_times(lat, long, stamp = new Date(), elev) {
    const [shurooq, maghrib, dhuhr] = timeof('h0', lat, long, stamp, elev);
    const [fajr18, isha18] = timeof(-18, lat, long, stamp).slice(0, 2);
    const [fajr15, isha15] = timeof(-15, lat, long, stamp).slice(0, 2);
    const dhuhr_angle = sundial(lat, long, cnvrt_t(dhuhr, stamp))[0];
    const x = 1;
    const asr_angle = atan2_d(tan_r(dhuhr_angle), 1 + x * tan_r(dhuhr_angle));
    const asr = timeof(asr_angle, lat, long, stamp)[1];
    return [fajr18, fajr15, shurooq, dhuhr, asr, maghrib, isha15, isha18]
    .map(time => cnvrt_t(time, new Date(stamp.getTime()))
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace('AM', 'ص').replace('PM', 'م')
    );
}

function get_prayer_times(n = 0) {
    const stamp = new Date(stampEl.value);
    const lat = parseFloat(latEl.value);
    const long = parseFloat(longEl.value);
    const elev = parseFloat(elevEl.value);
    return prayer_times(lat, long, new Date(stamp.getTime() + 86400000 * n), elev);
}

const tableEl = document.getElementById('table');
function set_prayer_times() {
    tableEl.innerHTML = '';
    update_timer();
    if (isNaN(parseFloat(longEl.value))) {
        return;
    }
    get_prayer_times().forEach(appendRow);
    if (upcoming() === undefined) {
        appendRow('<td colspan=3><hr></td>');
        appendRow(...isValid());
    }
}

function update_timer() {
    const timerEl = document.getElementById('timer');
    if (isNaN(parseFloat(longEl.value))) {
        timerEl.style.display = 'none';
        return;
    }
    timerEl.style.display = 'block';
    let next, i;
    if (upcoming() === undefined) {
        [next, i] = isValid();
        next = parseTime(next) + 86400000;
    } else {
        [next, i] = upcoming();
        next = parseTime(next);
    }
    const diff = (next - new Date()) / 1000;
    let hours = diff / 3600;
    let minutes = hours % 1 * 60;
    let seconds = minutes % 1 * 60;
    [hours, minutes, seconds] = [hours, minutes, seconds].map(t => parseInt(t));
    timerEl.textContent = `باقٍ ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} على ${names[i]}.`;
}
setInterval(update_timer, 1000);

function appendRow(timeStr, i) {
    const row = document.createElement('tr');
    if (i === undefined) {
        row.innerHTML = `${timeStr}`;
    } else {
        row.innerHTML = `<td>${names[i]}</td><td>&nbsp:&nbsp</td><td>${timeStr}</td>`;
    }
    tableEl.appendChild(row);
}

function parseTime(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hour, minute, second] = time.split(':').map(Number);
    if (period === 'م' && hour !== 12) {
        hour += 12;
    } else if (period === 'ص' && hour === 12) {
        hour = 0;
    }
    return new Date().setHours(hour, minute, second, 0);
}

function upcoming() {
    let i = 0;
    for (const timeStr of get_prayer_times()) {
        const currentStamp = parseTime(timeStr);
        if (currentStamp > new Date()) {
            return [timeStr, i];
        }
        i++;
    }
}

function isValid() {
    let i = 0;
    for (const timeStr of get_prayer_times(1)) {
        if (timeStr !== 'Invalid Date') {
            return [timeStr, i];
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
