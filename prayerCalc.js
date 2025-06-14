function cnvrt_t(frct, stamp = new Date()) {
    stamp.setHours(0, 0, 0, 0);
    stamp = new Date(stamp.getTime() - stamp.getTimezoneOffset() * 60000);
    stamp = new Date(stamp.getTime() + frct * 86400000);
    if (stamp.getMilliseconds() >= 500) {
        stamp = new Date(stamp.getTime() + 1000);
    }
    return new Date(stamp.setMilliseconds(0));
}

function sundial(lat, long, stamp = new Date()) {
    const JD = stamp.getTime() / 86400000 + 2440587.5;
    const JC = (JD - 2451545) / 36525;
    const JM = JC / 10;
    const U = JM / 10;

    const ε0 = 84381.448 - 4680.93 * U - 1.55 * U**2 + 1999.25 * U**3 - 51.38 * U**4 - 249.67 * U**5 - 39.05 * U**6 + 7.12 * U**7 + 27.87 * U**8 + 5.79 * U**9 + 2.45 * U**10;
    const ε = ε0 / 3600;
    const z = 360.98564736629 * 36525;
    const ν = 280.46061837 + z * JC + 0.000387933 * JC**2 - JC**3 / 38710000;

    let L = [L0, L1, L2, L3, L4, L5];
    const lst = [];
    for (const arr of L) {
        let sm = 0;
        for (const row of arr) {
            sm += row[0] * Math.cos(row[1] + row[2] * JM);
        }
        lst.push(sm);
    }
    L = poly(JM, lst) / 100000000;
    L = degrees(L);

    const λ = L + 180;
    const α = atan2_d(sin_r(λ) * cos_r(ε), cos_r(λ));
    const δ = asin_d(sin_r(ε) * sin_r(λ));
    const H = ν - α + long;
    const e = asin_d(sin_r(lat) * sin_r(δ) + cos_r(lat) * cos_r(δ) * cos_r(H));
    return [e, ν, H, α, δ];
}

function timeof(angle, lat, long, stamp = new Date(), elev = 0) {
    stamp.setHours(0, 0, 0, 0);
    stamp = new Date(stamp.getTime() - stamp.getTimezoneOffset() * 60000);
    let [ν, m0, α0, δ0] = sundial(lat, long, stamp).slice(1);
    const [α1, δ1] = sundial(lat, long, new Date(stamp.getTime() + 86400000)).slice(3);
    const [α_1, δ_1] = sundial(lat, long, new Date(stamp.getTime() - 86400000)).slice(3);

    if (angle === 'h0') {
        const r = 6378140;
        let dip = acos_d(r / (r + Math.abs(elev)));
        if (elev < 0) {
            dip *= -1;
        }
        angle = -0.8333 - dip;
    }

    const H0 = acos_d((sin_r(angle) - sin_r(lat) * sin_r(δ0)) / (cos_r(lat) * cos_r(δ0)));
    m0 *= -1;
    const m1 = m0 - H0;
    const m2 = m0 + H0;

    function intr(x) {
        if (Math.abs(x) > 2) {
            return mod(x);
        }
        return x;
    }

    const a = intr(α0 - α_1);
    const b = intr(α1 - α0);
    const a_ = intr(δ0 - δ_1);
    const b_ = intr(δ1 - δ0);
    const δ = [];
    const H = [];
    const h = [];
    let i = 0;
    for (let m of [m0, m1, m2]) {
        m = mod(m / 360);
        const ν_i = ν + 360.985647 * m;
        const α = α0 + m / 2 * (a + b + m * (b - a));
        δ.push(δ0 + m / 2 * (a_ + b_ + m * (b_ - a_)));
        H.push(ν_i - α + long);
        h.push(asin_d(sin_r(lat) * sin_r(δ[i]) + cos_r(lat) * cos_r(δ[i]) * cos_r(H[i])));
        i++;
    }
    let T = m0 - H[0];
    let R = m1 + (h[1] - angle) / (cos_r(δ[1]) * cos_r(lat) * sin_r(H[1]));
    let S = m2 + (h[2] - angle) / (cos_r(δ[2]) * cos_r(lat) * sin_r(H[2]));
    [R, S, T] = [R, S, T].map(m => mod(m / 360));
    if (R > T) {
        R--;
    }
    if (S < T) {
        S++;
    }
    return [R, S, T];
}

function prayer_times(lat, long, stamp = new Date(), elev) {
    if (isNaN(elev)) {
        elev = 0;
    }
    const [shurooq, maghrib, dhuhr] = timeof('h0', lat, long, stamp, elev);
    const [fajr18, isha18] = timeof(-18, lat, long, stamp).slice(0, 2);
    const [fajr15, isha15] = timeof(-15, lat, long, stamp).slice(0, 2);
    const dhuhr_angle = sundial(lat, long, cnvrt_t(dhuhr, stamp))[0];
    const x = 1;
    const asr_angle = atan2_d(tan_r(dhuhr_angle), 1 + x * tan_r(dhuhr_angle));
    const asr = timeof(asr_angle, lat, long, stamp)[1];
    const muntasaf = timeof('h0', lat, long, new Date(stamp.getTime() + 86400000)).at(-1) + 0.5;
    return [fajr18, fajr15, shurooq, dhuhr, asr, maghrib, isha15, isha18, muntasaf].map(time => cnvrt_t(time, new Date(stamp.getTime())));
}

const names = ['الفجر 18', 'الفجر 15', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء 15', 'العشاء 18', 'منتصف الليل'];
