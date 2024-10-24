require('dotenv').config();
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const express = require('express');
const axios = require('axios');
const moment = require('moment');
const cron = require('node-cron');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// Middleware to parse JSON bodies
app.use(express.json()); 

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
  let maxKey = 0;
  let ans = null;
  conditions.forEach((value, key) => {
    if (value > maxKey)
    {
      maxKey = value
      ans = key;
    }
  });

  return ans;
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
      // console.log(city)
      summary.dominantWeather =await calculateDominantWeather(summary.weatherConditions);
      // console.log(summary.dominantWeather)
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
      dt: data.dt,  // Timestamp
    };
  } catch (err) {
    console.error(`Error fetching weather for ${city}:`, err);
    return null;
  }
}

app.get('/', (req, res) => {
  res.render('index');  // This renders 'index.ejs' located in the 'views' folder
});
// Route to get weather data for a specific city
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Delhi'; // Default to Delhi if no city is provided

  const weatherData = await fetchWeather(city);
  // Fetch daily summary from MongoDB
  const date = moment().format('YYYY-MM-DD');
  const summaries = await WeatherSummary.find({ city, date });

  res.json({ weatherData: [weatherData], summaries });
});


// Schedule weather data fetching every 5 minutes for selected cities
cron.schedule('*/1 * * * *', async () => {
  const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
  for (const city of cities) {
    await fetchWeather(city);
  }
});



// Email alert function
async function sendAlertEmail(city, threshold,triggerMail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: triggerMail,  // Email to send alerts to
    subject: `Weather Alert for ${city}`,
    text: `The temperature in ${city} has exceeded the threshold of ${threshold}°C for the given consecutive updates.`,
  };

  try {
    // await transporter.sendMail(mailOptions);
    console.log(`Alert email sent for ${city}`);
  } catch (err) {
    console.error('Error sending alert email:', err);
  }
}

// API route to trigger email alert
app.post('/api/alert', async (req, res) => {
  const { city, threshold ,triggerMail} = req.body;
  try {
    console.log("got the trigger")
    await sendAlertEmail(city, threshold,triggerMail);
    res.json({ message: `Alert triggered for ${city} exceeding ${threshold}°C` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger alert' });
  }
});


// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
  console.log(`Weather monitoring app listening on port ${port}`);
});
