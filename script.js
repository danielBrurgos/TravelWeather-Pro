const API_KEY = 'eb85533dc6f069f933a1e3f15b829f1f';
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const mainContent = document.getElementById('main-content');
const compareBtn = document.getElementById('compare-mode-btn');
const resultsContainer = document.getElementById('autocomplete-results');

let isComparisonMode = false;
let activeColumn = 1;
let map = null;
let debounceTimer;

// --- CONFIGURACIÓN DE RESILIENCIA ---
const RESILIENCE_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    circuitBreakerThreshold: 5,
    cooldownPeriod: 30000 
};

let failureCount = 0;
let circuitOpen = false;

// Wrapper con Retry y Circuit Breaker
async function fetchWithResilience(url) {
    if (circuitOpen) {
        throw new Error("El servicio de clima está temporalmente suspendido. Intenta en 30 segundos.");
    }

    let lastError;
    for (let i = 0; i < RESILIENCE_CONFIG.maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                failureCount = 0;
                return await response.json();
            }
            if (response.status === 404) throw new Error("Ciudad no encontrada");
            throw new Error(`Error ${response.status}`);
        } catch (err) {
            lastError = err;
            if (i < RESILIENCE_CONFIG.maxRetries - 1) {
                await new Promise(res => setTimeout(res, RESILIENCE_CONFIG.retryDelay));
            }
        }
    }

    failureCount++;
    if (failureCount >= RESILIENCE_CONFIG.circuitBreakerThreshold) {
        circuitOpen = true;
        setTimeout(() => { circuitOpen = false; failureCount = 0; }, RESILIENCE_CONFIG.cooldownPeriod);
    }
    throw lastError;
}

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
    if (city) {
        getWeatherData(city, activeColumn);
        resultsContainer.classList.add('hidden');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city, activeColumn);
            resultsContainer.classList.add('hidden');
        }
    }
});

cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    if (query.length >= 3) {
        debounceTimer = setTimeout(() => fetchCitySuggestions(query), 300);
    } else {
        resultsContainer.classList.add('hidden');
    }
});

document.addEventListener('click', (e) => {
    if (!resultsContainer.contains(e.target) && e.target !== cityInput) {
        resultsContainer.classList.add('hidden');
    }
});

// 3. Autocompletado
async function fetchCitySuggestions(query) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`;
    try {
        const data = await fetchWithResilience(url);
        displaySuggestions(data);
    } catch (error) {
        console.error("Error autocomplete:", error);
    }
}

function displaySuggestions(cities) {
    resultsContainer.innerHTML = '';
    if (cities.length === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }
    cities.forEach(city => {
        const div = document.createElement('div');
        div.className = "p-4 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-none text-sm text-white";
        div.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-map-marker-alt mr-3 text-yellow-400"></i>
                <div>
                    <span class="font-bold">${city.name}</span>
                    <span class="text-[10px] opacity-60 ml-1">${city.state ? city.state + ',' : ''} ${city.country}</span>
                </div>
            </div>`;
        div.onclick = () => {
            cityInput.value = city.name;
            resultsContainer.classList.add('hidden');
            getWeatherData(city.name, activeColumn);
        };
        resultsContainer.appendChild(div);
    });
    resultsContainer.classList.remove('hidden');
}

// 4. Obtención de Datos (Ahora Resiliente)
async function getWeatherData(city, column) {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
    try {
        const currentData = await fetchWithResilience(currentUrl);
        const forecastData = await fetchWithResilience(forecastUrl);
        renderColumn(currentData, forecastData, column);
    } catch (e) { 
        alert(`Error: ${e.message}`); 
    }
}

async function getWeatherDataByCoords(lat, lon, column) {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    try {
        const currentData = await fetchWithResilience(currentUrl);
        const forecastData = await fetchWithResilience(forecastUrl);
        renderColumn(currentData, forecastData, column);
    } catch (e) { console.error(e); }
}

// 5. Renderizado Maestro
function renderColumn(current, forecast, column) {
    mainContent.classList.remove('hidden');
    if (column === 1) applyDynamicTheme(current.main.temp, current.sys.sunrise, current.sys.sunset);

    const favs = JSON.parse(localStorage.getItem('favs')) || [];
    const isFav = favs.includes(current.name);
    const starColorClass = isFav ? 'text-yellow-400' : 'text-white/40';

    const containerId = column === 1 ? 'column-1' : 'column-2';
    const container = document.getElementById(containerId);
    const rainProb = forecast.list[0].pop ? Math.round(forecast.list[0].pop * 100) : 0;

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
        ` : ''}`;

    if (column === 1) {
        initMap(current.coord.lat, current.coord.lon);
        renderExtendedForecast(forecast);
        getAirQuality(current.coord.lat, current.coord.lon);
        updateFoodRecs(current.main.temp, current.weather[0].description);
        updateClothingRecs(current.main.temp, current.weather[0].description);
    }
}

// 6. Innovación: Recomendaciones
function updateFoodRecs(temp, desc) {
    const foodList = document.getElementById('food-list-1');
    if (!foodList) return;
    let items = temp > 35 ? [{ t: 'Ceviche o Aguachile', i: 'fa-fish-fins' }, { t: 'Raspados de la Unison', i: 'fa-ice-cream' }] : 
                (temp < 18 || desc.includes('lluvia')) ? [{ t: 'Caldo de Queso', i: 'fa-bowl-food' }, { t: 'Café y Coyotas', i: 'fa-mug-hot' }] :
                [{ t: 'Tacos de Asada', i: 'fa-fire-burner' }, { t: 'Dogos sonorenses', i: 'fa-hotdog' }];
    foodList.innerHTML = items.map(item => `
        <div class="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-sm">
            <i class="fas ${item.i} text-orange-400 text-lg"></i>
            <span class="font-bold text-xs uppercase text-white">${item.t}</span>
        </div>`).join('');
}

function updateClothingRecs(temp, desc) {
    const clothingList = document.getElementById('clothing-list-1');
    if (!clothingList) return;
    let items = temp > 30 ? [{ t: 'Ropa ligera y fresca', i: 'fa-shirt' }, { t: 'Lentes y protector solar', i: 'fa-sun' }] :
                temp > 18 ? [{ t: 'Pantalones y camisa ligera', i: 'fa-user-tie' }, { t: 'Suéter por la tarde', i: 'fa-vest' }] :
                [{ t: 'Chamarra abrigadora', i: 'fa-mitten' }, { t: 'Pantalón grueso', i: 'fa-socks' }];
    if (desc.includes('lluvia')) items.push({ t: 'Paraguas o Impermeable', i: 'fa-umbrella' });
    clothingList.innerHTML = items.map(item => `
        <div class="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-sm">
            <i class="fas ${item.i} text-indigo-400 text-lg"></i>
            <span class="font-bold text-xs uppercase text-white">${item.t}</span>
        </div>`).join('');
}

// 7. Calidad del Aire (AQI)
async function getAirQuality(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const data = await fetchWithResilience(url);
        const aqi = data.list[0].main.aqi;
        const levels = {
            1: { t: 'Excelente', c: 'text-emerald-400', b: 'border-emerald-400' },
            2: { t: 'Buena', c: 'text-green-400', b: 'border-green-400' },
            3: { t: 'Moderada', c: 'text-yellow-400', b: 'border-yellow-400' },
            4: { t: 'Pobre', c: 'text-orange-400', b: 'border-orange-400' },
            5: { t: 'Muy Pobre', c: 'text-red-400', b: 'border-red-400' }
        };
        document.getElementById('aqi-status-1').textContent = levels[aqi].t;
        document.getElementById('aqi-status-1').className = `font-bold text-lg ${levels[aqi].c}`;
        document.getElementById('aqi-val-1').textContent = aqi;
        document.getElementById('aqi-val-1').className = `w-14 h-14 rounded-full border-4 flex items-center justify-center font-black ${levels[aqi].b} ${levels[aqi].c}`;
    } catch (e) { console.error(e); }
}

// 8. Favoritos y Mapas
function toggleFavorite(cityName, btnElement) {
    let favs = JSON.parse(localStorage.getItem('favs')) || [];
    const index = favs.indexOf(cityName);
    index === -1 ? (favs.push(cityName), favs.length > 3 && favs.shift()) : favs.splice(index, 1);
    localStorage.setItem('favs', JSON.stringify(favs));
    updateFavDashboard();
    btnElement.classList.toggle('text-yellow-400', index === -1);
    btnElement.classList.toggle('text-white/40', index !== -1);
}

async function updateFavDashboard() {
    const favDashboard = document.getElementById('fav-dashboard');
    if (!favDashboard) return;
    const favs = JSON.parse(localStorage.getItem('favs')) || [];
    favDashboard.innerHTML = '';
    for (const city of favs) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
            const d = await fetchWithResilience(url);
            favDashboard.innerHTML += `
                <div class="glass-card p-4 rounded-3xl text-center cursor-pointer hover:bg-white/10 transition-all min-w-[120px]" onclick="getWeatherData('${city}', 1)">
                    <p class="text-[9px] font-black uppercase opacity-60 mb-1">${city}</p>
                    <p class="text-xl font-black text-white">${Math.round(d.main.temp)}°</p>
                    <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png" class="w-8 mx-auto">
                </div>`;
        } catch (e) { console.error(e); }
    }
}

function initMap(lat, lon) {
    if (map) { map.remove(); map = null; }
    map = L.map('map', { zoomControl: false }).setView([lat, lon], 10);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`).addTo(map);
    L.circleMarker([lat, lon], { color: '#fbbf24', radius: 10, fillOpacity: 0.8 }).addTo(map);
}

function renderExtendedForecast(forecastData) {
    const daySelector = document.getElementById('day-selector');
    const hourlyContainer = document.getElementById('hourly-forecast');
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
            document.querySelectorAll('#day-selector button').forEach(b => { b.className = 'px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all flex-shrink-0 bg-white/10 text-white'; });
            btn.className = 'px-6 py-2 rounded-2xl text-[10px] font-black uppercase transition-all flex-shrink-0 bg-yellow-400 text-slate-900';
            showHours(days[date]);
        };
        daySelector.appendChild(btn);
    });
    const showHours = (hours) => {
        hourlyContainer.innerHTML = hours.map(h => `
            <div class="text-center min-w-[70px] text-white">
                <p class="text-[9px] font-bold opacity-40 mb-1">${h.dt_txt.split(' ')[1].substring(0, 5)}</p>
                <img src="https://openweathermap.org/img/wn/${h.weather[0].icon}.png" class="mx-auto w-12">
                <p class="font-black text-sm">${Math.round(h.main.temp)}°</p>
            </div>`).join('');
    };
    showHours(days[Object.keys(days)[0]]);
}

function applyDynamicTheme(temp, sunrise, sunset) {
    const body = document.body;
    const now = Math.floor(Date.now() / 1000);
    body.className = "bg-main min-h-screen p-4 md:p-10 text-white font-sans transition-all duration-700";
    if (now < sunrise || now > sunset) body.classList.add('night-mode');
    else if (temp >= 35) body.classList.add('theme-hot');
    else if (temp >= 22) body.classList.add('theme-warm');
    else if (temp >= 10) body.classList.add('theme-cold');
    else body.classList.add('theme-frozen');
}