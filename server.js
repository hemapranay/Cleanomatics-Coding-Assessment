import express from 'express';
import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors'; // To allow frontend requests

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const HOST = process.env.HOST ?? 'localhost';
const app = express();

// Middleware
app.use(express.static('public/'));
app.use(express.json());
app.use(cors());

// Vehicle data table
const vehicles = [
  { name: 'Maruti Suzuki Alto', speed: 140, efficiency: 22.05, capacity: 35 },
  { name: 'Hyundai i20', speed: 180, efficiency: 20.35, capacity: 37 },
  { name: 'Tata Nexon', speed: 180, efficiency: 17.57, capacity: 44 },
  { name: 'Honda City', speed: 180, efficiency: 17.8, capacity: 40 },
  { name: 'Mahindra Thar', speed: 155, efficiency: 15.2, capacity: 57 },
  { name: 'Toyota Innova Crysta', speed: 179, efficiency: 11.25, capacity: 55 },
  { name: 'Kia Seltos', speed: 170, efficiency: 16.8, capacity: 50 },
  { name: 'Renault Kwid', speed: 150, efficiency: 22.3, capacity: 28 },
  { name: 'Ford EcoSport', speed: 182, efficiency: 15.9, capacity: 52 },
  { name: 'Tata Tiago', speed: 150, efficiency: 23.84, capacity: 35 },
];

// Compute derived values for max range
vehicles.forEach(v => (v.maxRange = v.efficiency * v.capacity));

/* =======================
   ROUTES FOR FRONTEND
========================= */

// Base route
app.get('/', async (req, res) => {
  const html = await fs.readFile('public/index.html');
  res.status(200).send(html.toString());
});

/**
 * 🧭 POST /calculate-time
 * Request: { distance: number, vehicle: string }
 * Response: travel time + comparisons for all vehicles
 */
app.post('/calculate-time', (req, res) => {
  const { distance, transport } = req.body;
  const selected = vehicles.find(v => v.name === transport);
  if (!selected) return res.status(400).json({ error: 'Vehicle not found' });

  const result = calculateTime(distance, selected);
  const comparison = vehicles.map(v => ({
    name: v.name,
    ...calculateTime(distance, v),
  }));

  res.json({ selected: result, comparison });
});

/**
 * 🕓 POST /calculate-distance
 * Request: { hours: number, minutes: number, vehicle: string }
 * Response: distance + comparisons for all vehicles
 */
app.post('/calculate-distance', (req, res) => {
  const { hours, minutes, vehicle } = req.body;
  const selected = vehicles.find(v => v.name === vehicle);
  if (!selected) return res.status(400).json({ error: 'Vehicle not found' });

  const totalHours = hours + minutes / 60;
  const result = calculateDistance(totalHours, selected);
  const comparison = vehicles.map(v => ({
    name: v.name,
    ...calculateDistance(totalHours, v),
  }));

  res.json({ selected: result, comparison });
});

/* =======================
   UTILITY FUNCTIONS
========================= */
function calculateTime(distance, vehicle) {
  const timeHours = distance / vehicle.speed;
  const fuelUsed = distance / vehicle.efficiency;
  const outOfRange = distance > vehicle.maxRange;

  return {
    vehicle: vehicle.name,
    distance: distance.toFixed(2),
    time: timeHours.toFixed(2),
    fuelUsed: fuelUsed.toFixed(2),
    maxRange: vehicle.maxRange.toFixed(2),
    status: outOfRange ? 'Out of Range ' : 'Within Range ',
  };
}

function calculateDistance(hours, vehicle) {
  const distance = vehicle.speed * hours;
  const fuelUsed = distance / vehicle.efficiency;
  const outOfRange = distance > vehicle.maxRange;

  return {
    vehicle: vehicle.name,
    hours: hours.toFixed(2),
    distance: distance.toFixed(2),
    fuelUsed: fuelUsed.toFixed(2),
    maxRange: vehicle.maxRange.toFixed(2),
    status: outOfRange ? 'Out of Range ' : 'Within Range ',
  };
}

/* =======================
   START SERVER
========================= */
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});