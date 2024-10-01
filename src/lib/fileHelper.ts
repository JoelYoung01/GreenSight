import type UploadedDataItem from "@/types/UploadedData";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface FileProcessingResult {
  data: UploadedDataItem[];
  errors: string[];
}

export async function processFile(input: File | File[]): Promise<FileProcessingResult> {
  const file = Array.isArray(input) ? input[0] : input;
  const fileType = file.name.split(".").pop()?.toLowerCase();

  try {
    let data: UploadedDataItem[] = [];
    if (fileType === "csv") {
      data = await parseCSV(file);
      console.debug("Parsed CSV data:", data);
      // Process CSV data
    } else if (fileType === "xls" || fileType === "xlsx") {
      data = await parseExcel(file);
      console.debug("Parsed Excel data:", data);
      // Process Excel data
    } else {
      console.error("Unsupported file type");
    }

    const errors = validateData(data);

    if (errors.length) {
      console.error("Validation errors:", errors);
    }

    return { data, errors };
  } catch (error) {
    const msg = "Error parsing file: " + (error instanceof Error ? error.message : `${error}`);
    console.error(msg);
    return { data: [], errors: [msg] };
  }
}

function parseCSV(file: File): Promise<UploadedDataItem[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results: Papa.ParseResult<any>) => {
        const data = results.data.map((row: any) =>
          Object.keys(row).reduce((acc: any, key: string) => {
            const camelCaseKey = key
              .trim()
              .toLowerCase()
              .replace(/ ([a-zA-Z])/g, (_, char) => char.toUpperCase());
            acc[camelCaseKey] = row[key];
            return acc;
          }, {})
        );
        resolve(data);
      },
      error: reject,
      header: true
    });
  });
}

function parseExcel(file: File): Promise<UploadedDataItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target?.result) {
        reject("Failed to read file");
        return;
      }

      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const camelCaseData = jsonData.map((row: any) =>
          Object.keys(row).reduce((acc: any, key: string) => {
            const camelCaseKey = key
              .trim()
              .toLowerCase()
              .replace(/ ([a-zA-Z])/g, (_, char) => char.toUpperCase());
            acc[camelCaseKey] = row[key];
            return acc;
          }, {})
        );

        resolve(camelCaseData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}

function validateData(data?: UploadedDataItem[]): string[] {
  const errors: string[] = [];

  if (!data || !data.length) {
    errors.push("No data found");
    return errors;
  }

  const requiredKeys: (keyof UploadedDataItem)[] = ["dateSold", "sellPrice"];
  data.forEach((item, index) => {
    requiredKeys.forEach((key) => {
      if (!item[key]) {
        errors.push(`Missing required field "${key}" in row ${index + 1}`);
      }
    });
  });

  return errors;
}
