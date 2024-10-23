require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const axios = require('axios');
const moment = require('moment');
const cron = require('node-cron');
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/weatherDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the weather summary schema
const weatherSummarySchema = new mongoose.Schema({
  city: String,
  date: { type: String },  // Unique for each city per day
  avgTemp: Number,
  maxTemp: Number,
  minTemp: Number,
  dominantWeather: String,
  totalCount: Number,
  weatherConditions: { type: Map, of: Number }  // Store weather condition frequencies
});

const WeatherSummary = mongoose.model('WeatherSummary', weatherSummarySchema);

// Function to calculate dominant weather condition
function calculateDominantWeather(conditions) {
  return Object.keys(conditions).reduce((a, b) => conditions[a] > conditions[b] ? a : b);
}

// Function to update or insert daily weather summary
async function updateDailySummary(city, temp, mainWeather) {
  const date = moment().format('YYYY-MM-DD');
  
  try {
    let summary = await WeatherSummary.findOne({ city, date });
    
    if (summary) {
      // Update existing summary
      summary.avgTemp = ((summary.avgTemp * summary.totalCount) + temp) / (summary.totalCount + 1);
      summary.maxTemp = Math.max(summary.maxTemp, temp);
      summary.minTemp = Math.min(summary.minTemp, temp);
      summary.totalCount += 1;

      summary.weatherConditions.set(mainWeather, (summary.weatherConditions.get(mainWeather) || 0) + 1);
      summary.dominantWeather = calculateDominantWeather(summary.weatherConditions);

      await summary.save();
    } else {
      // Insert a new summary if not found
      const newSummary = new WeatherSummary({
        city,
        date,
        avgTemp: temp,
        maxTemp: temp,
        minTemp: temp,
        dominantWeather: mainWeather,
        totalCount: 1,
        weatherConditions: { [mainWeather]: 1 },
      });
      await newSummary.save();
    }

    console.log(`Daily summary updated for ${city} on ${date}`);
  } catch (err) {
    console.error(`Error updating daily summary for ${city}:`, err);
  }
}

// Function to fetch weather data from OpenWeatherMap API
async function fetchWeather(city) {
  const apiKey = process.env.API_KEY; 
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${apiKey}&units=metric`;
  
  try {
    const response = await axios.get(url);
    const data = response.data;
    const temp = data.main.temp;
    const mainWeather = data.weather[0].main;

    await updateDailySummary(city, temp, mainWeather);
    
    return {
      city,
      temp,
      main_weather: mainWeather,
      feels_like: data.main.feels_like,
      dt: data.dt,
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${city}:`, error);
    return null;
  }
}

// Fetch weather data for multiple cities
async function fetchWeatherForCities(cities) {
  const weatherData = await Promise.all(cities.map(city => fetchWeather(city)));
  return weatherData.filter(data => data !== null);
}

// Cron job to fetch weather data every minute
cron.schedule('*/1 * * * *', async () => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
  await fetchWeatherForCities(cities);
  console.log('Weather data updated');
});

// Express route to render the EJS page
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
  const weatherData = await fetchWeatherForCities(cities);
  const summaries = await WeatherSummary.find({ date: moment().format('YYYY-MM-DD') });

  res.render('index', { weatherData, summaries });
});

// API endpoint to fetch current weather data
app.get('/api/weather', async (req, res) => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
  const weatherData = await fetchWeatherForCities(cities);
  const summaries = await WeatherSummary.find({ date: moment().format('YYYY-MM-DD') });

  res.json({ weatherData, summaries });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
