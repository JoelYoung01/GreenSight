<script setup lang="ts">
import templateUrl from "@/assets/data-template.csv?url";
import CostOverTime from "@/components/charts/CostOverTime.vue";
import { processFile } from "@/lib/fileHelper";
import { useUploadedDataStore } from "@/stores/uploadedData";

const dataStore = useUploadedDataStore();

const readingData = ref(false);
const showAlert = ref(false);
const viewMode = ref("table");

const filteredData = computed(() => {
  return (
    dataStore.uploadedData?.map((item: any) => {
      delete item.__parsed_extra;
      return item;
    }) ?? []
  );
});

function handleResetData() {
  dataStore.resetData();
  showAlert.value = false;
}

async function handleFileUpload(file: File | File[]) {
  readingData.value = true;
  const result = await processFile(file);
  dataStore.uploadedData = result.data;
  dataStore.uploadDataErrors = result.errors;
  readingData.value = false;

  if (result.errors.length > 0) {
    showAlert.value = true;
  }
}
</script>

<template>
  <v-container>
    <v-alert v-model="showAlert" type="error" closable class="mb-4">
      <span class="font-weight-bold">Error:</span> There were issues with the uploaded data:
      <ul>
        <li v-for="(error, index) in dataStore.uploadDataErrors" :key="index">{{ error }}</li>
      </ul>
    </v-alert>

    <template v-if="!dataStore.uploadedData">
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

      <v-btn
        color="primary"
        :href="templateUrl"
        prepend-icon="mdi-download"
        download="greensight-data-template.csv"
      >
        Download Data Template
      </v-btn>
    </template>
    <template v-else>
      <div class="d-flex align-center">
        <v-btn-toggle v-model="viewMode" color="primary" class="mb-4" mandatory>
          <v-btn value="table">Tabular</v-btn>
          <v-btn value="chart">Chart</v-btn>
        </v-btn-toggle>

        <v-spacer />

        <v-btn color="secondary" @click="handleResetData"> Clear Data </v-btn>
      </div>

      <template v-if="viewMode === 'table'">
        <v-data-table :items="filteredData" class="elevation-1">
          <template #top>
            <v-toolbar flat> <v-toolbar-title>Uploaded Data</v-toolbar-title> </v-toolbar>
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
