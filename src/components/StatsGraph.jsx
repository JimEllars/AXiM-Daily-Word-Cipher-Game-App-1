import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const StatsGraph = ({ currentAttempts }) => {
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "6+": 0 });

  useEffect(() => {
    const dist = JSON.parse(localStorage.getItem('axim_guess_distribution'));
    if (dist) {
      setDistribution(dist);
    }
  }, []);

  const data = ["1", "2", "3", "4", "5", "6+"].map(key => ({
    value: distribution[key] || 0,
    itemStyle: {
      // Highlight current attempts bucket with pink, else neon green
      color: (currentAttempts !== null && (currentAttempts === parseInt(key) || (currentAttempts >= 6 && key === "6+")))
        ? '#ff007f'
        : '#00ff66'
    }
  }));

  const options = {
    backgroundColor: '#0d0d13',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#00ff66',
      textStyle: { color: '#00ff66', fontFamily: 'monospace' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      show: false, // hide axis
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: ["1", "2", "3", "4", "5", "6+"],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        color: '#00ff66',
        fontFamily: 'monospace',
        fontWeight: 'bold'
      }
    },
    series: [
      {
        type: 'bar',
        data: data,
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          formatter: '{c}'
        },
        barWidth: '60%',
        animationDuration: 1000
      }
    ]
  };

  return (
    <div className="w-full mt-4 border-t-2 border-neon-green/30 pt-4">
      <h3 className="text-neon-green text-xs mb-2 text-center uppercase tracking-wider font-mono">Guess Distribution</h3>
      <ReactECharts option={options} style={{ height: '150px', width: '100%' }} />
    </div>
  );
};

export default StatsGraph;
