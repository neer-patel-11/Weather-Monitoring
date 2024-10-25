# Real-Time Weather Monitoring System with Rollups and Aggregates

## Overview
This project is a real-time weather monitoring and alerting system that retrieves weather data from the OpenWeatherMap API, processes it, and provides summarized insights through rollups and aggregates. Designed for Indian metro cities, it includes daily summaries, alerting based on temperature thresholds, and visualizations of historical weather data.

## Features
1. **Real-Time Data Retrieval**: Fetches weather data every 5 minutes from the OpenWeatherMap API for specified metro cities in India.
2. **Temperature Conversion**: Converts temperature from Kelvin to Celsius or Fahrenheit, depending on user preference.
3. **Daily Weather Summary**:
   - Average, maximum, and minimum temperature
   - Dominant weather condition for each day
4. **Alerting**: Customizable alerts for high temperatures or specific weather conditions, with email notifications.
5. **Visualizations**: Displays temperature trends and daily summaries with Chart.js.

## Project Structure
- **`app.js`**: Main server file, defines the application’s routes, alerting mechanism, and weather data processing.
- **`index.ejs`**: Frontend template for displaying live data, summaries, and charts.
- **Database**: MongoDB used for storing daily summaries and alert thresholds.

## Getting Started

### Prerequisites
To run this application, you need:
1. **Node.js** (>= v14)
2. **MongoDB** for data storage

### Dependencies
Install project dependencies using:
```bash
npm install
```

### Environment Setup

1. Create a .env file in the project root with the following variables:

``` 
API_KEY=<Your_OpenWeatherMap_API_Key>
EMAIL_USER=<Your_Email_Address>
EMAIL_PASS=<Your_Email_Password>
```

2. Replace ``` <Your_OpenWeatherMap_API_Key> ```, ``` <Your_Email_Address> ```, and ``` <Your_Email_Password> ``` with your actual credentials.


## Running the Application

1. Start the Node.js server:
``` 
node app.js
```
2. Open your browser and go to ``` http://localhost:3000 ``` to view the application.


## Application Design
### Core Functionalities

1. Real-Time Data Retrieval
<ul>
<li>Fetches data every 1(user can change) minutes from OpenWeatherMap API for cities: Delhi, Mumbai, Chennai, Bangalore, Kolkata, Hyderabad.</li>
<li>Data fields: temperature, feels-like temperature, main weather condition, and timestamp.</li>
</ul>

2. Daily summaries calculated with:
<ul>
<li><strong>Average Temperature</strong>: Aggregates temperature for each day.</li>
<li><strong>Max/Min Temperature</strong>: Identifies daily temperature extremes.</li>
<li><strong>Dominant Weather Condition</strong>: The most frequent condition per day (Rain, Clear, etc.).</li>
</ul>

3. Alerting Mechanism:
<ul><li>Triggers an alert if a user-defined temperature threshold is exceeded for a configurable number of updates.</li>
<li>Alerts are sent via email using nodemailer.</li></ul>

4. Visualizations
<ul>
<li>Uses Chart.js to display 7-day temperature trends and summaries.</li>
</ul>

### Design Choices
<ul>
<li><strong>MongoDB</strong>: Chosen for its flexible schema design, making it ideal for storing daily weather summaries.</li>
<li><strong>Express &amp; Node.js</strong>: Handles backend logic and routes efficiently with a minimalistic approach.</li>
<li><strong>EJS</strong>: Provides templating for dynamic data on the frontend.</li>
<li><strong>Cron Jobs</strong>: Node-Cron schedules data fetching at fixed intervals.</li>
</ul>
