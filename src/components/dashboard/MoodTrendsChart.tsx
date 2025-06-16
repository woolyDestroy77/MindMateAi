import React from 'react';
import { Line } from 'react-chartjs-2';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { MoodDataPoint, WeeklyTrend } from '../../hooks/useMoodTrends';

interface MoodTrendsChartProps {
  data: MoodDataPoint[];
  weeklyTrends: WeeklyTrend[];
  timeRange: 'week' | 'month' | 'quarter';
}

const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({ data, weeklyTrends, timeRange }) => {
  // Prepare chart data
  const chartData = {
    labels: data.map(point => {
      const date = parseISO(point.date);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      
      switch (timeRange) {
        case 'week':
          return format(date, 'EEE'); // Mon, Tue, etc.
        case 'month':
          return format(date, 'MMM d'); // Jan 1, Jan 2, etc.
        case 'quarter':
          return format(date, 'MMM d'); // Jan 1, Feb 15, etc.
        default:
          return format(date, 'MMM d');
      }
    }),
    datasets: [
      {
        label: 'Wellness Score',
        data: data.map(point => point.wellnessScore),
        borderColor: 'rgb(157, 138, 199)',
        backgroundColor: 'rgba(157, 138, 199, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: data.map(point => {
          switch (point.sentiment) {
            case 'positive': return '#10B981'; // green
            case 'negative': return '#EF4444'; // red
            default: return '#6B7280'; // gray
          }
        }),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Message Activity',
        data: data.map(point => point.messageCount * 10), // Scale for visibility
        borderColor: 'rgb(169, 197, 160)',
        backgroundColor: 'rgba(169, 197, 160, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(169, 197, 160)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(157, 138, 199, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const point = data[dataIndex];
            const date = parseISO(point.date);
            
            if (isToday(date)) return 'Today';
            if (isYesterday(date)) return 'Yesterday';
            return format(date, 'EEEE, MMMM d, yyyy');
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const point = data[dataIndex];
            
            if (context.datasetIndex === 0) {
              return `Wellness Score: ${point.wellnessScore}/100 (${point.moodName} ${point.mood})`;
            } else {
              return `Messages: ${point.messageCount}`;
            }
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const point = data[dataIndex];
            return [
              '',
              `Mood: ${point.moodName} ${point.mood}`,
              `Sentiment: ${point.sentiment}`,
              `Activity: ${point.messageCount} messages`
            ];
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '%';
          },
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        title: {
          display: true,
          text: 'Wellness Score',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        min: 0,
        max: Math.max(...data.map(p => p.messageCount)) * 12 || 50,
        ticks: {
          callback: function(value: any) {
            return Math.round(value / 10);
          },
          font: {
            size: 11,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Messages',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default MoodTrendsChart;