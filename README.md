# Route Forecaster

Route Forecaster is a truck journey planning application that helps drivers and fleet operators evaluate routes before setting out. It generates alternative route options, evaluates weather conditions along each route, and presents checkpoints, estimated arrival times, and risk levels to support safer and more informed travel decisions.

## Features

- **Route planning:** Generate multiple route options between an origin and destination.
- **Weather checkpoints:** View weather conditions at checkpoints along each route.
- **Risk assessment:** Evaluate route conditions using weather-based risk levels.
- **Forecast visualization:** Explore weather risks along the journey with an interactive forecast heatmap and a 0–48-hour forecast slider.
- **Route comparison:** Compare route distances, estimated travel durations, arrival times, and risk summaries.
- **Interactive map:** Visualize alternative routes, checkpoints, and journey locations.
- **Route visibility controls:** Toggle individual routes to focus on the options that matter.

## How to Use

### 1. Visit the Website

Open the deployed Route Forecaster website in your browser:

**Website:** https://route-forecaster-one.vercel.app/

### 2. Enter Journey Details

On the journey planning page, provide the following information:

| Field                   | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| Origin                  | Starting coordinates in `[longitude, latitude]` format    |
| Destination             | Destination coordinates in `[longitude, latitude]` format |
| Departure date and time | The planned departure date and time                       |
| Load weight             | The truck's load weight in pounds (lbs)                   |

Coordinates can be entered in either of these formats:

```text
[3.3790, 6.5150]
3.3790,6.5150
```

For example:

```text
Origin:      [3.3790, 6.5150]
Destination: [3.6010, 6.4690]
Departure:   2026-11-25 08:00
Load weight: 15000 lbs
```

**Important:** Coordinates must be supplied in `[longitude, latitude]` order.

### 3. Submit Your Journey

Submit the form to generate your planned routes.

### 4. Explore the Results

After route generation, you can:

- View the alternative routes on an interactive map.
- Inspect weather checkpoints along each route.
- Review checkpoint ETAs and weather conditions, including wind, rain, and snow.
- Identify risk levels along the journey.
- Compare route summaries, including distance, estimated duration, arrival time, and overall risk.
- Toggle routes on or off to inspect individual alternatives.
- Use the forecast slider to explore weather conditions over the next 48 hours.

## API Limitation

**Route distance is currently capped at 100 km.**

This limitation exists because of restrictions imposed by the OpenRouteService alternative-route API. Consequently, the application currently supports journeys with route distances of up to 100 km.

For reliable results, use origin and destination coordinates that produce routes within this limit.

## Installation and Local Development

### Prerequisites

Ensure you have the following installed:

- Node.js and npm
- Python 3
- pip
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Solobarine/route_forecaster
cd route_forecaster
```

### 2. Set Up the Frontend

Navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL printed in your terminal.

### 3. Set Up the Backend

Open another terminal from the project root and navigate to the backend directory:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create your environment configuration file:

```bash
cp .env.example .env
```

Update the `.env` file with the required configuration values, including any API keys required by the backend.

Start the Django development server:

```bash
python manage.py runserver
```

The backend will run at:

```text
http://127.0.0.1:8000/
```

### 4. Run the Application

Ensure both the frontend and backend development servers are running.

Open the frontend URL in your browser and start planning journeys.

## Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- TanStack Router
- TanStack Query
- React Leaflet

### Backend

- Python
- Django
- OpenRouteService for route generation
- Weather data integration(from Open Meteo) for checkpoint risk assessment

## Project Structure

```text
project/
├── client/          # React frontend
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/         # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
└── README.md
```

## Notes

- Always provide coordinates in `[longitude, latitude]` order.
- Load weight must be entered in pounds (lbs).
- Route distances are subject to the current 100 km API limitation.
- Weather forecasts and route risk assessments are intended as decision-support information, not a guarantee of road safety.
- Keep API keys and other sensitive configuration values in your local `.env` file. Do not commit secrets to version control.

## License

[MIT License](./LICENSE.md "View License")
