require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
let weatherData = [];
let intervalId;
let pollingInterval = 300000; // Default to 5 minutes (in ms)

// Helper function to fetch weather data for a city in Celsius
const getWeatherData = async (city) => {
  const apiKey = process.env.API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    const { main, dt, weather } = response.data;
    return {
      city,
      temp: main.temp, // In Celsius by default
      feels_like: main.feels_like, // In Celsius by default
      main_weather: weather[0].main,
      dt,
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error);
    return null;
  }
};

// Function to fetch weather for all cities
const fetchWeatherForAllCities = async () => {
  weatherData = await Promise.all(cities.map(city => getWeatherData(city)));
  console.log('Weather data updated');
};

// Function to start polling with the correct interval
const startPolling = (interval) => {
  if (intervalId) {
    clearInterval(intervalId); // Clear the existing interval if it exists
  }
  intervalId = setInterval(fetchWeatherForAllCities, interval);
};

// Initial call to fetch data
fetchWeatherForAllCities();
startPolling(pollingInterval); // Start polling with default interval

// Route to display the main page
app.get('/', (req, res) => {
  const interval = req.query.interval;

  if (interval) {
    pollingInterval = parseInt(interval) * 60000; // Convert minutes to milliseconds
    console.log(`Polling interval updated to ${pollingInterval / 60000} minutes`);

    // Restart the polling with the new interval
    startPolling(pollingInterval);
  }

  res.render('index', { weatherData, interval: pollingInterval / 60000 });
});

// Route to get the latest weather data
app.get('/api/weather', (req, res) => {
  res.json(weatherData);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
