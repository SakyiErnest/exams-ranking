'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type GradeDistributionChartProps = {
  distribution: { [grade: string]: number };
};

export default function GradeDistributionChart({ distribution }: GradeDistributionChartProps) {
  const options: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Grade Distribution',
        font: {
          size: 16,
        },
      },
    },
  };

  const chartData = {
    labels: Object.keys(distribution),
    datasets: [
      {
        data: Object.values(distribution),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',  // A - Blue
          'rgba(75, 192, 192, 0.6)',   // B - Green
          'rgba(255, 206, 86, 0.6)',   // C - Yellow
          'rgba(255, 159, 64, 0.6)',   // D - Orange
          'rgba(255, 99, 132, 0.6)',   // F - Red
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
      <Pie options={options} data={chartData} />
    </div>
  );
}
