<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Chart as ChartJS, registerables } from 'chart.js'

ChartJS.register(...registerables)

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
})

const chartRef = ref(null)
let chartInstance = null

onMounted(() => {
  if (chartRef.value) {
    const ctx = chartRef.value.getContext('2d')

    const labels = props.question.data.map((d) => String(d.value))
    const data = props.question.data.map((d) => d.count)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, 'rgba(82, 183, 136, 0.8)')
    gradient.addColorStop(1, 'rgba(82, 183, 136, 0.2)')

    chartInstance = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Распределение ответов',
            data,
            borderColor: '#52b788',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            pointBackgroundColor: '#52b788',
            pointBorderColor: '#40916c',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2d2d2d',
            padding: 12,
            titleColor: '#e0e0e0',
            bodyColor: '#b0b0b0',
            callbacks: {
              label: (context) => `Ответов: ${context.parsed.y}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#808080',
              font: {
                size: 12,
              },
            },
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#808080',
              font: {
                size: 12,
              },
            },
          },
        },
      },
    })
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  margin: 1rem 0;
}
</style>
