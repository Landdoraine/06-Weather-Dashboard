var APIKey = "5621860e1a75e9a904c938d73fde12a1";
var searchbtn = $('#searchbtn');
var searchItems = JSON.parse(localStorage.getItem('searchItems')) || [];
var weatherData = JSON.parse(localStorage.getItem('weatherData')) || [];

$(function() {
  searchbtn.on("click", searchCity);
  renderSearchHistory();
  $("button[class*='search-btn']").on("click", function() {
    getWeather($(this).text());
  });
});

function searchCity() {
  var city = $.trim($("#city").val());

  if (city.length === 0) return;

  if (!searchItems.includes(city)) {
    searchItems.unshift(city);
    localStorage.setItem('searchItems', JSON.stringify(searchItems));
    renderSearchHistory();
  }

  getWeather(city);
}

function renderSearchHistory() {
  var div = $("#searchListContainer");
  var ul = $("<ul>");

  searchItems.forEach(function(item) {
    var button = $("<button>").text(item).addClass("search-btn");
    var li = $("<li>").append(button);
    ul.append(li);
  });

  div.empty().append(ul);
}

function getWeather(city) {
  var findCityIndex = weatherData.findIndex(data => data.place.toLowerCase() === city.toLowerCase());

  if (findCityIndex !== -1) {
    displayWeatherInfo(weatherData[findCityIndex]);
    return;
  }

  var weatherAPI = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}&units=imperial`;

  fetch(weatherAPI)
    .then(response => response.json())
    .then(data => {
      var weatherInfo = extractWeatherInfo(data);
      return fetchFiveDayForecast(city, weatherInfo);
    })
    .then(weatherInfo => {
      weatherData.push(weatherInfo);
      localStorage.setItem('weatherData', JSON.stringify(weatherData));
      displayWeatherInfo(weatherInfo);
    })
    .catch(error => console.log('Error:', error));
}

function extractWeatherInfo(data) {
  var temperature = data.main.temp;
  var humidity = data.main.humidity;
  var wind = data.wind.speed;
  var place = data.name;
  var date = dayjs.unix(data.dt).format('MM/DD/YYYY');
  var weatherIcon = data.weather[0].icon;

  return {
    place,
    temperature,
    humidity,
    wind,
    date,
    weatherIcon,
    cityLat: data.coord.lat,
    cityLon: data.coord.lon,
    forecast: [],
  };
}

function displayWeatherInfo(weatherInfo) {
  var weatherDiv = $("#weatherInfo");
  var forecastDiv = $("#forecastInfo");

  weatherDiv.empty().append(createWeatherCard(weatherInfo));

  if (weatherInfo.forecast.length > 0) {
    forecastDiv.empty().append(createForecastCards(weatherInfo.forecast));
  }
}

function createWeatherCard(weatherInfo) {
  var html = `
    <div class="card white darken-1">
      <div class="card-content rgba(0,0,0,0.87)">
        <span class="card-title"><h4>${weatherInfo.place} (${weatherInfo.date})</h4>
        <img id="icon" class="responsive-img" src="https://openweathermap.org/img/w/${weatherInfo.weatherIcon}.png" alt="Weather Icon">
        </span>
        <ul>
          <li>Temp: ${weatherInfo.temperature} &#8457;</li>
          <li>Wind: ${weatherInfo.wind} MPH</li>
          <li>Humidity: ${weatherInfo.humidity} %</li>
        </ul>
      </div>
    </div>`;

  return html;
}

function createForecastCards(forecast) {
  var html = `<div class="col s12 m12"><h5>5 Day Weather Forecast</h5></div>`;

  forecast.forEach(function(weather) {
    html += `
      <div class="col m5ths s6">
        <div class="card blue-grey lighten-1">
          <div class="card-content white-text">
            <span class="card-title"><b>${weather.date}</b>
            <img id="icon" class="responsive-img" src="https://openweathermap.org/img/w/${weather.weatherIcon}.png" alt="Weather Icon">
            </span>
            <ul>
              <li>Temp: ${weather.temperature} &#8457;</li>
              <li>Wind: ${weather.wind} MPH</li>
              <li>Humidity: ${weather.humidity} %</li>
            </ul>
          </div>
        </div>
      </div>`;
  });

  return html;
}

function fetchFiveDayForecast(city, weatherInfo) {
  var forecastAPI = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${APIKey}`;

  return fetch(forecastAPI)
    .then(response => response.json())
    .then(data => {
      var forecastList = data.list;
      for (let i = 0; i < forecastList.length; i += 8) {
        var forecast = forecastList[i];
        var temp = forecast.main.temp;
        var humidity = forecast.main.humidity;
        var wind = forecast.wind.speed;
        var date = dayjs.unix(forecast.dt).format('MM/DD/YYYY');
        var weatherIcon = forecast.weather[0].icon;
        weatherInfo.forecast.push({
          date,
          temperature: temp,
          humidity,
          wind,
          weatherIcon,
        });
      }
      return weatherInfo;
    });
}
