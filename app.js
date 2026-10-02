// ============================================
//  Weather App — Tugas Rutin 5
//  ES6+ | async/await | Fetch API | Error Handling
// ============================================

// ===== KONFIGURASI =====
const API_KEY = "f472e368105f3b24245ec0cf9891fd27";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ===== STATE =====
let currentUnit = "C";
let lastWeatherData = null;
let lastForecastData = null;

// ===== DOM ELEMENTS =====
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const toggleUnitBtn = document.getElementById("toggleUnit");
const toggleUnitFBtn = document.getElementById("toggleUnitF");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const weatherResult = document.getElementById("weatherResult");
const cityNameEl = document.getElementById("cityName");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastSection = document.getElementById("forecastSection");
const forecastList = document.getElementById("forecastList");
const historySection = document.getElementById("historySection");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// ===== FUNGSI UTAMA =====

/**
 * Fetch data cuaca saat ini berdasarkan nama kota
 * Requirement: async/await + Fetch API
 */
const fetchWeather = async (city) => {
  const url = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);

    // Error handling: kota tidak ditemukan (404)
    if (response.status === 404) {
      throw new Error(`Kota "${city}" tidak ditemukan. Periksa kembali nama kota.`);
    }

    // Error handling: server error
    if (!response.ok) {
      throw new Error(`Server error (${response.status}). Coba lagi nanti.`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Error handling: network error
    if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
      throw new Error("Koneksi jaringan bermasalah. Periksa internet Anda.");
    }
    throw error;
  }
};

/**
 * Fetch forecast 5 hari (3 jam interval)
 */
const fetchForecast = async (city) => {
  const url = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);

    if (response.status === 404) {
      throw new Error(`Kota "${city}" tidak ditemukan.`);
    }

    if (!response.ok) {
      throw new Error(`Server error (${response.status}).`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Koneksi jaringan bermasalah.");
    }
    throw error;
  }
};

/**
 * Konversi suhu Celsius ke Fahrenheit
 */
const celsiusToFahrenheit = (celsius) => {
  return (celsius * 9) / 5 + 32;
};

/**
 * Format suhu berdasarkan unit yang dipilih
 */
const formatTemp = (tempCelsius) => {
  if (currentUnit === "F") {
    return `${Math.round(celsiusToFahrenheit(tempCelsius))}°F`;
  }
  return `${Math.round(tempCelsius)}°C`;
};

/**
 * Tampilkan data cuaca saat ini
 * Requirement: Tampilkan kota, suhu, deskripsi, ikon, kelembaban
 */
const displayWeather = (data) => {
  lastWeatherData = data;

  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIconEl.alt = data.weather[0].description;
  temperatureEl.textContent = formatTemp(data.main.temp);
  descriptionEl.textContent = data.weather[0].description;
  humidityEl.textContent = `💧 Kelembaban: ${data.main.humidity}%`;
  windEl.textContent = `💨 Angin: ${data.wind.speed} m/s`;

  weatherResult.classList.remove("hidden");
};

/**
 * Tampilkan forecast 5 hari
 * Requirement: Minimal 1 array method (map/filter/reduce)
 * Menggunakan .filter() untuk ambil 1 data per hari (siang hari)
 * dan .map() untuk render
 */
const displayForecast = (data) => {
  lastForecastData = data;

  // Filter: ambil data setiap hari pada jam ~12:00 (siang)
  // API memberikan data per 3 jam, jadi kita filter yang jam 12:00
  const dailyForecasts = data.list.filter((item) => {
    return item.dt_txt.includes("12:00:00");
  });

  // Map: render setiap forecast item
  const forecastHTML = dailyForecasts
    .map((item) => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });
      const dateStr = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      return `
        <div class="forecast-item">
          <p class="day">${dayName}, ${dateStr}</p>
          <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" />
          <p class="f-temp">${formatTemp(item.main.temp)}</p>
          <p class="f-desc">${item.weather[0].description}</p>
        </div>
      `;
    })
    .join("");

  forecastList.innerHTML = forecastHTML;
  forecastSection.classList.remove("hidden");
};

/**
 * Tampilkan error message
 */
const showError = (message) => {
  errorEl.textContent = `️ ${message}`;
  errorEl.classList.remove("hidden");
};

/**
 * Sembunyikan semua pesan
 */
const hideMessages = () => {
  errorEl.classList.add("hidden");
  loadingEl.classList.add("hidden");
};

/**
 * Tampilkan loading
 */
const showLoading = () => {
  hideMessages();
  loadingEl.classList.remove("hidden");
  weatherResult.classList.add("hidden");
  forecastSection.classList.add("hidden");
};

/**
 * Fungsi utama: cari cuaca berdasarkan kota
 */
const searchWeather = async (city) => {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    showError("Silakan masukkan nama kota.");
    return;
  }

  showLoading();

  try {
    // Fetch cuaca saat ini & forecast secara paralel
    const [weatherData, forecastData] = await Promise.all([
      fetchWeather(trimmedCity),
      fetchForecast(trimmedCity),
    ]);

    hideMessages();
    displayWeather(weatherData);
    displayForecast(forecastData);

    // Bonus: Simpan ke riwayat pencarian (LocalStorage)
    addToHistory(trimmedCity);
  } catch (error) {
    hideMessages();
    showError(error.message);
  }
};

// ===== BONUS: RIWAYAT PENCARIAN (LocalStorage) =====

const getHistory = () => {
  const stored = localStorage.getItem("weatherHistory");
  return stored ? JSON.parse(stored) : [];
};

const saveHistory = (history) => {
  localStorage.setItem("weatherHistory", JSON.stringify(history));
};

const addToHistory = (city) => {
  let history = getHistory();

  // Hapus duplikat (case-insensitive)
  history = history.filter((item) => item.toLowerCase() !== city.toLowerCase());

  // Tambahkan ke awal array
  history.unshift(city);

  // Batasi maksimal 10 entri
  history = history.slice(0, 10);

  saveHistory(history);
  renderHistory();
};

const removeFromHistory = (city) => {
  let history = getHistory();
  history = history.filter((item) => item !== city);
  saveHistory(history);
  renderHistory();
};

const clearHistory = () => {
  localStorage.removeItem("weatherHistory");
  renderHistory();
};

const renderHistory = () => {
  const history = getHistory();

  if (history.length === 0) {
    historySection.classList.add("hidden");
    return;
  }

  historySection.classList.remove("hidden");

  // Map: render list riwayat
  historyList.innerHTML = history
    .map(
      (city) => `
      <li>
        <span onclick="searchWeather('${city}')">🔍 ${city}</span>
        <button class="remove-btn" onclick="removeFromHistory('${city}')">✕</button>
      </li>
    `
    )
    .join("");
};

// ===== BONUS: TOGGLE °C / °F =====

const toggleUnit = (unit) => {
  currentUnit = unit;

  if (unit === "C") {
    toggleUnitBtn.classList.add("active");
    toggleUnitFBtn.classList.remove("active");
  } else {
    toggleUnitFBtn.classList.add("active");
    toggleUnitBtn.classList.remove("active");
  }

  // Re-render jika ada data
  if (lastWeatherData) {
    displayWeather(lastWeatherData);
  }
  if (lastForecastData) {
    displayForecast(lastForecastData);
  }
};

// ===== EVENT LISTENERS =====

searchBtn.addEventListener("click", () => {
  searchWeather(cityInput.value);
});

cityInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchWeather(cityInput.value);
  }
});

toggleUnitBtn.addEventListener("click", () => toggleUnit("C"));
toggleUnitFBtn.addEventListener("click", () => toggleUnit("F"));
clearHistoryBtn.addEventListener("click", clearHistory);

// ===== INISIALISASI =====
renderHistory();