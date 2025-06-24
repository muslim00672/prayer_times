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
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkTheme();
    } else {
        setLightTheme();
    }
}

if (theme === 'dark') {
    setDarkTheme();
} else if (theme === 'light') {
    setLightTheme();
} else {
    setDefaultTheme();
}

toggleEl.addEventListener('click', () => {
    if (docEl.getAttribute('data-bs-theme') === 'dark') {
        setLightTheme();
    }
    else {
        setDarkTheme();
    }
});
