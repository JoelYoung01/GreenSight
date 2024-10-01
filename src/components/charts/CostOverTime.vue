<script setup lang="ts">
import { ref } from "vue";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  CategoryScale,
  LineElement,
  Title
} from "chart.js";
import { Line } from "vue-chartjs";
import { useUploadedDataStore } from "@/stores/uploadedData";

type TimePeriod = "Daily" | "Monthly" | "Quarterly" | "Yearly";
const availableTimePeriods: TimePeriod[] = ["Daily", "Monthly", "Quarterly", "Yearly"];

const uploadedDataStore = useUploadedDataStore();
const timePeriod = ref<TimePeriod>("Monthly");

const chartData = computed(() => {
  if (!uploadedDataStore.uploadedData) {
    return {
      labels: [],
      datasets: []
    };
  }

  const sortedData = uploadedDataStore.uploadedData.toSorted((a, b) => {
    if (!a.dateSold || !b.dateSold) {
      return 0;
    }

    return new Date(a.dateSold).getTime() - new Date(b.dateSold).getTime();
  });

  // Set the start and end date based on the first and last records to contain the dateSold field
  const startDate = new Date(sortedData.find((d) => d.dateSold)?.dateSold ?? new Date());
  const endDate = new Date(sortedData.toReversed().find((d) => d.dateSold)?.dateSold ?? new Date());

  const data: Record<string, { revenue: number }> = sortedData.reduce(
    (acc, curr) => {
      // if either dateSold or sellPrice is missing, skip this record
      if (!curr.dateSold || !curr.sellPrice) {
        return acc;
      }

      const date = new Date(curr.dateSold);
      const revenue = Number(curr.sellPrice);

      if (timePeriod.value === "Daily") {
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month + 1}-${day}`;

        if (acc[key]) {
          acc[key].revenue += revenue;
        } else {
          acc[key] = { revenue };
        }
      } else if (timePeriod.value === "Monthly") {
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month + 1}`;

        if (acc[key]) {
          acc[key].revenue += revenue;
        } else {
          acc[key] = { revenue };
        }
      } else if (timePeriod.value === "Quarterly") {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const year = date.getFullYear();
        const key = `${year}-Q${quarter}`;

        if (acc[key]) {
          acc[key].revenue += revenue;
        } else {
          acc[key] = { revenue };
        }
      } else if (timePeriod.value === "Yearly") {
        const year = date.getFullYear();
        const key = `${year}`;

        if (acc[key]) {
          acc[key].revenue += revenue;
        } else {
          acc[key] = { revenue };
        }
      }

      return acc;
    },
    {} as Record<string, { revenue: number }>
  );

  const paddedData: Record<string, { revenue: number }> = {};
  const keys = Object.keys(data);
  if (keys.length > 0) {
    if (timePeriod.value === "Daily") {
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear();
        const key = `${year}-${month + 1}-${day}`;
        paddedData[key] = data[key] || { revenue: 0 };
      }
    } else if (timePeriod.value === "Monthly") {
      for (let d = startDate; d <= endDate; d.setMonth(d.getMonth() + 1)) {
        const month = d.getMonth();
        const year = d.getFullYear();
        const key = `${year}-${month + 1}`;
        paddedData[key] = data[key] || { revenue: 0 };
      }
    } else if (timePeriod.value === "Quarterly") {
      for (let d = startDate; d <= endDate; d.setMonth(d.getMonth() + 3)) {
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        const year = d.getFullYear();
        const key = `${year}-Q${quarter}`;
        paddedData[key] = data[key] || { revenue: 0 };
      }
    } else if (timePeriod.value === "Yearly") {
      for (let d = startDate; d <= endDate; d.setFullYear(d.getFullYear() + 1)) {
        const year = d.getFullYear();
        const key = `${year}`;
        paddedData[key] = data[key] || { revenue: 0 };
      }
    }
  }

  return {
    labels: Object.keys(paddedData),
    datasets: [
      {
        label: "Revenue Over Time",
        data: Object.values(paddedData).map((d) => Number(d.revenue)),
        backgroundColor: "#36a2eb"
      }
    ]
  };
});

const chartOptions = ref<any>({
  scales: {
    x: {
      title: {
        display: true,
        text: `Time (${timePeriod.value})`
      },
      ticks: {
        stepSize: 1
      }
    }
  }
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Revenue Over Time ({{ timePeriod }})

      <v-spacer />

      <v-select
        v-model="timePeriod"
        :items="availableTimePeriods"
        label="Time Period"
        variant="outlined"
        density="compact"
        max-width="200"
        hide-details
      />
    </v-card-title>
    <v-card-text>
      <Line :data="chartData" :options="chartOptions" />
    </v-card-text>
  </v-card>
</template>
