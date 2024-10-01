<script setup lang="ts">
import templateUrl from "@/assets/data-template.csv?url";
import CostOverTime from "@/components/charts/CostOverTime.vue";
import { processFile } from "@/lib/fileHelper";
import { useUploadedDataStore } from "@/stores/uploadedData";

const uploadedDataStore = useUploadedDataStore();

const readingData = ref(false);
const viewMode = ref("table");

async function handleFileUpload(file: File | File[]) {
  readingData.value = true;
  uploadedDataStore.uploadedData = await processFile(file);
  readingData.value = false;
}
</script>

<template>
  <v-container>
    <template v-if="!uploadedDataStore.uploadedData">
      <h1>Reporting</h1>
      <p class="mb-5">
        Upload some data to generate a report, or download the file template to get started.
      </p>

      <v-file-input
        variant="outlined"
        accept=".csv,.xlsx"
        label="Upload a CSV file"
        class="file-input"
        :loading="readingData"
        @update:model-value="handleFileUpload"
      />

      <v-btn color="primary" :href="templateUrl" prepend-icon="mdi-download" download>
        Download Data Template
      </v-btn>
    </template>
    <template v-else>
      <div class="d-flex align-center">
        <v-btn-toggle v-model="viewMode" color="primary" class="mb-4">
          <v-btn value="table">Tabular</v-btn>
          <v-btn value="chart">Chart</v-btn>
        </v-btn-toggle>

        <v-spacer />

        <v-btn color="secondary" @click="uploadedDataStore.uploadedData = null"> Clear Data </v-btn>
      </div>

      <template v-if="viewMode === 'table'">
        <v-data-table :items="uploadedDataStore.uploadedData" class="elevation-1">
          <template #top>
            <v-toolbar flat>
              <v-toolbar-title>Uploaded Data</v-toolbar-title>
            </v-toolbar>
          </template>
        </v-data-table>
      </template>
      <template v-else>
        <CostOverTime />
      </template>
    </template>
  </v-container>
</template>

<style scoped>
.file-input {
  max-width: 400px;
}
</style>
