import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function groupByRating(players) {
  const buckets = {};

  players.forEach((p) => {
    const bucket = Math.floor(p.rating / 100) * 100;

    if (!buckets[bucket]) {
      buckets[bucket] = { rating: bucket, NL: 0, BE: 0, DE: 0 };
    }

    buckets[bucket][p.country]++;
  });

  return Object.values(buckets).sort((a, b) => a.rating - b.rating);
}

export default function RatingChart({ players }) {
  const data = groupByRating(players);

  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid stroke="#ccc" />
      <XAxis dataKey="rating" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="NL" stroke="#ff7300" />
      <Line type="monotone" dataKey="BE" stroke="#387908" />
      <Line type="monotone" dataKey="DE" stroke="#0033cc" />
    </LineChart>
  );
}