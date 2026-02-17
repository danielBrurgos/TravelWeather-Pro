const API_KEY = 'eb85533dc6f069f933a1e3f15b829f1f';
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const mainContent = document.getElementById('main-content');
const compareBtn = document.getElementById('compare-mode-btn');

let isComparisonMode = false;
let activeColumn = 1;
let map = null;

// 1. Inicialización
window.addEventListener('DOMContentLoaded', () => {
    updateFavDashboard(); 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            getWeatherDataByCoords(pos.coords.latitude, pos.coords.longitude, 1);
        }, () => getWeatherData("Hermosillo", 1));
    }
});

// 2. Controladores de Eventos
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city, activeColumn);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeatherData(city, activeColumn);
    }
});

if (compareBtn) {
    compareBtn.addEventListener('click', () => {
        isComparisonMode = !isComparisonMode;
        const col2 = document.getElementById('column-2');
        if (isComparisonMode) {
            mainContent.classList.add('comparison-active');
            col2.classList.remove('hidden');
            compareBtn.classList.replace('bg-indigo-600', 'bg-red-500');
            compareBtn.innerHTML = '<i class="fas fa-times mr-2"></i> Salir de Comparar';
            activeColumn = 2;
        } else {
            mainContent.classList.remove('comparison-active');
            col2.classList.add('hidden');
            compareBtn.classList.replace('bg-red-500', 'bg-indigo-600');
            compareBtn.innerHTML = '<i class="fas fa-columns mr-2"></i> Comparar Destinos';
            activeColumn = 1;
            if (map) { map.remove(); map = null; }
        }
    });
}

// 3. Obtención de Datos
async function getWeatherData(city, column) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=es`)
        ]);
        if (!currentRes.ok) throw new Error("Ciudad no encontrada");
        renderColumn(await currentRes.json(), await forecastRes.json(), column);
    } catch (e) { alert(e.message); }
}

async function getWeatherDataByCoords(lat, lon, column) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`)
        ]);
        renderColumn(await currentRes.json(), await forecastRes.json(), column);
    } catch (e) { console.error("Error", e); }
}

// 4. Renderizado Maestro
function renderColumn(current, forecast, column) {
    mainContent.classList.remove('hidden');
    if (column === 1) applyDynamicTheme(current.main.temp, current.sys.sunrise, current.sys.sunset);

    // Lógica de color de estrella dinámica
    const favs = JSON.parse(localStorage.getItem('favs')) || [];
    const isFav = favs.includes(current.name);
    const starColorClass = isFav ? 'text-yellow-400' : 'text-white/40';

    const containerId = column === 1 ? 'column-1' : 'column-2';
    const container = document.getElementById(containerId);
    const rainProb = Math.round(forecast.list[0].pop * 100);

    container.innerHTML = `
        <div class="glass-card p-8 rounded-[3rem] text-center mb-6 animate-fade-in shadow-2xl transition-all border-4 border-transparent relative">
            <button onclick="toggleFavorite('${current.name}', this)" class="absolute top-6 right-8 ${starColorClass} transition-all transform hover:scale-125">
                <i class="fas fa-star text-2xl"></i>
            </button>

            <h2 class="text-3xl font-bold mb-2 uppercase tracking-tighter">${current.name}</h2>
            <img src="https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png" class="mx-auto w-32 drop-shadow-2xl">
            <p class="text-7xl font-black mb-2 tracking-tighter">${Math.round(current.main.temp)}°</p>
            <p class="text-xl capitalize opacity-80 italic font-light">${current.weather[0].description}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-white">
            <div class="glass-widget p-6 rounded-3xl text-center group">
                <i class="fas fa-droplet text-blue-400 mb-2 transition-transform group-hover:scale-125"></i>
                <span class="block text-[10px] uppercase opacity-60 tracking-widest font-bold">Humedad</span>
                <span class="block text-2xl font-black">${current.main.humidity}%</span>
            </div>
            <div class="glass-widget p-6 rounded-3xl text-center group">
                <i class="fas fa-cloud-rain text-indigo-400 mb-2 transition-transform group-hover:scale-125"></i>
                <span class="block text-[10px] uppercase opacity-60 tracking-widest font-bold">Lluvia</span>
                <span class="block text-2xl font-black">${rainProb}%</span>
            </div>
        </div>

        ${column === 1 ? `
            <div id="map" class="h-64 w-full rounded-[2.5rem] shadow-2xl mb-6 border border-white/20 overflow-hidden"></div>
            <div class="glass-card p-8 rounded-[3.5rem] mb-6">
                <h3 class="text-xs font-black uppercase mb-4 tracking-[0.2em] text-yellow-400">Pronóstico de 5 Días</h3>
                <div id="day-selector" class="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide"></div>
                <div id="hourly-forecast" class="flex gap-6 overflow-x-auto py-2"></div>
            </div>
        ` : ''}
    `;

    if (column === 1) {
        initMap(current.coord.lat, current.coord.lon);
        renderExtendedForecast(forecast);
        getAirQuality(current.coord.lat, current.coord.lon);
        updateFoodRecs(current.main.temp, current.weather[0].description);
    }

    if (isComparisonMode) {
        activeColumn = activeColumn === 1 ? 2 : 1;
        document.querySelectorAll('.glass-card').forEach(el => el.classList.remove('border-yellow-400', 'scale-105'));
        container.querySelector('.glass-card').classList.add('border-yellow-400', 'scale-105');
    }
}

// 6. Lógica de Favoritos (Toggled)
function toggleFavorite(cityName, btnElement) {
    let favs = JSON.parse(localStorage.getItem('favs')) || [];
    const index = favs.indexOf(cityName);

    if (index === -1) {
        // AGREGAR
        favs.push(cityName);
        if (favs.length > 3) favs.shift(); 
        btnElement.classList.replace('text-white/40', 'text-yellow-400');
    } else {
        // QUITAR
        favs.splice(index, 1);
        btnElement.classList.replace('text-yellow-400', 'text-white/40');
    }

    localStorage.setItem('favs', JSON.stringify(favs));
    updateFavDashboard();
}

async function updateFavDashboard() {
    const favDashboard = document.getElementById('fav-dashboard');
    if (!favDashboard) return;
    const favs = JSON.parse(localStorage.getItem('favs')) || [];
    favDashboard.innerHTML = '';

    for (const city of favs) {
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`);
            const d = await res.json();
            favDashboard.innerHTML += `
                <div class="glass-card p-4 rounded-3xl text-center cursor-pointer hover:bg-white/10 transition-all min-w-[120px]" onclick="getWeatherData('${city}', 1)">
                    <p class="text-[9px] font-black uppercase opacity-60 mb-1">${city}</p>
                    <p class="text-xl font-black text-white">${Math.round(d.main.temp)}°</p>
                    <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" class="w-8 mx-auto">
                </div>
            `;
        } catch (e) { console.error(e); }
    }
}

// 5. Gastronomía
function updateFoodRecs(temp, desc) {
    const foodList = document.getElementById('food-list-1');
    if (!foodList) return;
    let items = [];
    if (temp > 35) {
        items = [{ t: 'Ceviche o Aguachile', i: 'fa-fish-fins' }, { t: 'Raspados de la Unison', i: 'fa-ice-cream' }, { t: 'Cerveza fría', i: 'fa-beer-mug-empty' }];
    } else if (temp < 18 || desc.includes('lluvia')) {
        items = [{ t: 'Caldo de Queso', i: 'fa-bowl-food' }, { t: 'Café y Coyotas', i: 'fa-mug-hot' }, { t: 'Pan Dulce', i: 'fa-bread-slice' }];
    } else {
        items = [{ t: 'Tacos de Asada', i: 'fa-fire-burner' }, { t: 'Dogos sonorenses', i: 'fa-hotdog' }];
    }
    foodList.innerHTML = items.map(item => `
        <div class="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-sm">
            <i class="fas ${item.i} text-orange-400 text-lg"></i>
            <span class="font-bold text-xs uppercase text-white">${item.t}</span>
        </div>
    `).join('');
}

// 7. Calidad del Aire
async function getAirQuality(lat, lon) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const data = await res.json();
        const aqi = data.list[0].main.aqi;
        const levels = {
            1: { t: 'Excelente', c: 'text-emerald-400', b: 'border-emerald-400' },
            2: { t: 'Buena', c: 'text-green-400', b: 'border-green-400' },
            3: { t: 'Moderada', c: 'text-yellow-400', b: 'border-yellow-400' },
            4: { t: 'Pobre', c: 'text-orange-400', b: 'border-orange-400' },
            5: { t: 'Muy Pobre', c: 'text-red-400', b: 'border-red-400' }
        };
        const statusEl = document.getElementById('aqi-status-1');
        const valEl = document.getElementById('aqi-val-1');
        if(statusEl && valEl) {
            statusEl.textContent = levels[aqi].t;
            statusEl.className = `font-bold text-lg ${levels[aqi].c}`;
            valEl.textContent = aqi;
            valEl.className = `w-16 h-16 rounded-full border-4 flex items-center justify-center font-black ${levels[aqi].b} ${levels[aqi].c}`;
        }
    } catch (e) { console.error(e); }
}

// Mapas y Pronóstico
function initMap(lat, lon) {
    if (map) { map.remove(); map = null; }
    const mapElement = document.getElementById('map');
    if (mapElement) {
        map = L.map('map', { zoomControl: false }).setView([lat, lon], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`).addTo(map);
        L.circleMarker([lat, lon], { color: '#fbbf24', radius: 10, fillOpacity: 0.8 }).addTo(map);
    }
}

function renderExtendedForecast(forecastData) {
    const daySelector = document.getElementById('day-selector');
    const hourlyContainer = document.getElementById('hourly-forecast');
    if (!daySelector || !hourlyContainer) return;
    const days = {};
    forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!days[date]) days[date] = [];
        days[date].push(item);
    });
    daySelector.innerHTML = '';
    Object.keys(days).slice(0, 5).forEach((date, index) => {
        const btn = document.createElement('button');
        btn.className = `px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all flex-shrink-0 ${index === 0 ? 'bg-yellow-400 text-slate-900' : 'bg-white/10 text-white'}`;
        btn.textContent = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' });
        btn.onclick = () => {
            document.querySelectorAll('#day-selector button').forEach(b => { b.classList.remove('bg-yellow-400', 'text-slate-900'); b.classList.add('bg-white/10', 'text-white'); });
            btn.classList.replace('bg-white/10', 'bg-yellow-400'); btn.classList.replace('text-white', 'text-slate-900');
            showHours(days[date]);
        };
        daySelector.appendChild(btn);
    });
    function showHours(hours) {
        hourlyContainer.innerHTML = hours.map(h => `
            <div class="text-center min-w-[70px] text-white">
                <p class="text-[9px] font-bold opacity-40 mb-1">${h.dt_txt.split(' ')[1].substring(0, 5)}</p>
                <img src="https://openweathermap.org/img/wn/${h.weather[0].icon}.png" class="mx-auto w-12">
                <p class="font-black text-sm">${Math.round(h.main.temp)}°</p>
            </div>`).join('');
    }
    showHours(days[Object.keys(days)[0]]);
}

function applyDynamicTheme(temp, sunrise, sunset) {
    const body = document.body;
    const now = Math.floor(Date.now() / 1000);
    body.classList.remove('theme-hot', 'theme-warm', 'theme-cold', 'theme-frozen', 'night-mode');
    if (now < sunrise || now > sunset) { body.classList.add('night-mode'); return; }
    if (temp >= 35) body.classList.add('theme-hot');
    else if (temp >= 22) body.classList.add('theme-warm');
    else if (temp >= 10) body.classList.add('theme-cold');
    else body.classList.add('theme-frozen');
}