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

    const labels = props.question.data.map((d) => d.option_text)
    const data = props.question.data.map((d) => d.count)
    const percentages = props.question.data.map((d) => d.percent)

    chartInstance = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Количество ответов',
            data,
            backgroundColor: '#52b788',
            borderColor: '#40916c',
            borderWidth: 2,
            borderRadius: 6,
            tension: 0.4,
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
              afterLabel: (context) => `${percentages[context.dataIndex]}%`,
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
              display: false,
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
