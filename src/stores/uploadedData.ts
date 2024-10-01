import { ref } from "vue";
import { defineStore } from "pinia";
import type UploadedDataItem from "@/types/UploadedData";

export const useUploadedDataStore = defineStore("uploadedData", () => {
  const uploadedData = ref<UploadedDataItem[] | null>(null);

  return { uploadedData };
});
