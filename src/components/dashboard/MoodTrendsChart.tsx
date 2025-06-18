import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, parseISO, isToday, isYesterday, subDays, eachDayOfInterval } from 'date-fns';
import { MoodDataPoint, WeeklyTrend } from '../../hooks/useMoodTrends';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MoodTrendsChartProps {
  data: MoodDataPoint[];
  weeklyTrends: WeeklyTrend[];
  timeRange: 'week' | 'month' | 'quarter';
}

const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({ data, weeklyTrends, timeRange }) => {
  // Fill in missing days with null values to ensure continuous timeline
  const fillMissingDays = (moodData: MoodDataPoint[]): MoodDataPoint[] => {
    if (moodData.length === 0) return [];
    
    // Sort data by date
    const sortedData = [...moodData].sort((a, b) => a.date.localeCompare(b.date));
    
    // Determine start and end dates
    const startDate = parseISO(sortedData[0].date);
    const endDate = parseISO(sortedData[sortedData.length - 1].date);
    
    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a map of existing data points
    const dataMap = new Map<string, MoodDataPoint>();
    sortedData.forEach(point => {
      dataMap.set(point.date, point);
    });
    
    // Create a complete dataset with null values for missing days
    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (dataMap.has(dateStr)) {
        return dataMap.get(dateStr)!;
      } else {
        // Create placeholder data for missing days
        return {
          date: dateStr,
          mood: '😐',
          moodName: 'neutral',
          sentiment: 'neutral',
          wellnessScore: null, // Use null for missing data points
          messageCount: 0,
          timestamp: date.toISOString()
        };
      }
    });
  };

  // Get filled data
  const filledData = fillMissingDays(data);

  // Prepare chart data
  const chartData = {
    labels: filledData.map(point => {
      const date = parseISO(point.date);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      
      switch (timeRange) {
        case 'week':
          return format(date, 'EEE, MMM d'); // Mon, Jan 1
        case 'month':
          return format(date, 'MMM d'); // Jan 1
        case 'quarter':
          return format(date, 'MMM d'); // Jan 1
        default:
          return format(date, 'MMM d');
      }
    }),
    datasets: [
      {
        label: 'Wellness Score',
        data: filledData.map(point => point.wellnessScore),
        borderColor: 'rgb(157, 138, 199)',
        backgroundColor: 'rgba(157, 138, 199, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: filledData.map(point => {
          if (point.wellnessScore === null) return 'rgba(0,0,0,0)'; // Hide points for missing data
          
          switch (point.sentiment) {
            case 'positive': return '#10B981'; // green
            case 'negative': return '#EF4444'; // red
            default: return '#6B7280'; // gray
          }
        }),
        pointBorderColor: filledData.map(point => 
          point.wellnessScore === null ? 'rgba(0,0,0,0)' : '#ffffff'
        ),
        pointBorderWidth: 2,
        pointRadius: filledData.map(point => point.wellnessScore === null ? 0 : 6),
        pointHoverRadius: filledData.map(point => point.wellnessScore === null ? 0 : 8),
        spanGaps: true, // Connect lines across null values
      },
      {
        label: 'Message Activity',
        data: filledData.map(point => point.messageCount * 10), // Scale for visibility
        borderColor: 'rgb(169, 197, 160)',
        backgroundColor: 'rgba(169, 197, 160, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: filledData.map(point => 
          point.messageCount === 0 ? 'rgba(0,0,0,0)' : 'rgb(169, 197, 160)'
        ),
        pointBorderColor: filledData.map(point => 
          point.messageCount === 0 ? 'rgba(0,0,0,0)' : '#ffffff'
        ),
        pointBorderWidth: 2,
        pointRadius: filledData.map(point => point.messageCount === 0 ? 0 : 4),
        pointHoverRadius: filledData.map(point => point.messageCount === 0 ? 0 : 6),
        yAxisID: 'y1',
        spanGaps: true,
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
            const point = filledData[dataIndex];
            const date = parseISO(point.date);
            
            if (isToday(date)) return 'Today';
            if (isYesterday(date)) return 'Yesterday';
            return format(date, 'EEEE, MMMM d, yyyy');
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const point = filledData[dataIndex];
            
            if (context.datasetIndex === 0) {
              if (point.wellnessScore === null) return 'No data available';
              return `Wellness Score: ${point.wellnessScore}/100 (${point.moodName} ${point.mood})`;
            } else {
              return `Messages: ${point.messageCount}`;
            }
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const point = filledData[dataIndex];
            
            if (point.wellnessScore === null) return ['No mood data recorded for this day'];
            
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
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          font: {
            size: 11,
          },
          autoSkip: false, // Show all labels
          maxTicksLimit: 31, // Maximum number of ticks to display
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
        max: Math.max(...filledData.map(p => p.messageCount)) * 12 || 50,
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