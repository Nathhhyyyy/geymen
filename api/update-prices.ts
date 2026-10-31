import { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";
import OpenAI from "openai";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface StationPrice {
  stationId: string;
  stationName: string;
  address: string;
  unleaded: number; // in centavos
  premium: number; // in centavos
  diesel: number; // in centavos
  distance: number; // in meters
  trend: "▲" | "▼" | "→";
  priceHistory: number[]; // last 5 weeks in centavos
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "price_history.xlsx");
    
    let workbook: XLSX.WorkBook;
    let priceData: any[] = [];

    const csvPath = dataPath.replace('.xlsx', '.csv');
    
    if (fs.existsSync(dataPath)) {
      workbook = XLSX.readFile(dataPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      priceData = XLSX.utils.sheet_to_json(worksheet);
    } else if (fs.existsSync(csvPath)) {
      workbook = XLSX.readFile(csvPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      priceData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      priceData = generateMockPriceHistory();
    }

    const updatedPrices = await fetchUpdatedPricesFromGroq(priceData);

    const stations = processPriceData(updatedPrices);

    if (fs.existsSync(dataPath)) {
      appendNewPricesToExcel(dataPath, updatedPrices);
    } else {
      createExcelFile(dataPath, updatedPrices);
    }

    return res.status(200).json({
      success: true,
      stations,
      timestamp: new Date().toISOString(),
      message: "Prices updated successfully"
    });

  } catch (error) {
    console.error("Error updating prices:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update prices",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function fetchUpdatedPricesFromGroq(existingData: any[]): Promise<any[]> {
  const prompt = `
You are a fuel price data provider for Zamboanga City, Philippines. 
Return the latest weekly fuel price adjustments as a JSON array.

Format:
[
  {
    "stationId": "ST001",
    "stationName": "Shell Putik",
    "address": "Putik, Zamboanga City",
    "unleaded": 5875,
    "premium": 6125,
    "diesel": 5450,
    "distance": 2500
  },
  ...
]

Prices must be in centavos (integers). Include at least 10 stations.
If you cannot fetch real-time data, return realistic simulated weekly adjustments.
Include these stations: Shell Putik, Petron Tetuan, Caltex San Jose, Phoenix Pasonanca, 
Seaoil Baliwasan, Total Canelar, Flying V Sta. Cruz, Unioil Tumaga, PTT Mercedes, 
Philippine Energy Divisoria.
`;

  // Try OpenAI GPT-4o first if API key is available
  if (openai) {
    try {
      console.log("Using OpenAI GPT-4o for price data");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a fuel price data API. Return only valid JSON arrays with no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0]?.message?.content || "[]";
      const parsedData = JSON.parse(content);

      if (Array.isArray(parsedData)) {
        return parsedData;
      }
    } catch (error) {
      console.error("OpenAI API error, falling back to Groq:", error);
    }
  }

  // Fallback to Groq
  try {
    console.log("Using Groq Llama-3.1-70b for price data");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a fuel price data API. Return only valid JSON arrays with no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content || "[]";
    const parsedData = JSON.parse(content);

    if (Array.isArray(parsedData)) {
      return parsedData;
    }

    return generateSimulatedPrices(existingData);

  } catch (error) {
    console.error("Groq API error, using simulated data:", error);
    return generateSimulatedPrices(existingData);
  }
}

function generateSimulatedPrices(existingData: any[]): any[] {
  const baseStations = [
    { stationId: "ST001", stationName: "Shell Putik", address: "Putik, Zamboanga City", distance: 2500 },
    { stationId: "ST002", stationName: "Petron Tetuan", address: "Tetuan, Zamboanga City", distance: 1800 },
    { stationId: "ST003", stationName: "Caltex San Jose", address: "San Jose, Zamboanga City", distance: 3200 },
    { stationId: "ST004", stationName: "Phoenix Pasonanca", address: "Pasonanca, Zamboanga City", distance: 4100 },
    { stationId: "ST005", stationName: "Seaoil Baliwasan", address: "Baliwasan, Zamboanga City", distance: 1500 },
    { stationId: "ST006", stationName: "Total Canelar", address: "Canelar, Zamboanga City", distance: 2800 },
    { stationId: "ST007", stationName: "Flying V Sta. Cruz", address: "Sta. Cruz, Zamboanga City", distance: 2200 },
    { stationId: "ST008", stationName: "Unioil Tumaga", address: "Tumaga, Zamboanga City", distance: 3600 },
    { stationId: "ST009", stationName: "PTT Mercedes", address: "Mercedes, Zamboanga City", distance: 4500 },
    { stationId: "ST010", stationName: "Philippine Energy Divisoria", address: "Divisoria, Zamboanga City", distance: 1200 }
  ];

  const basePrices = {
    unleaded: 5875,
    premium: 6125,
    diesel: 5450
  };

  return baseStations.map(station => {
    const variation = Math.floor(Math.random() * 100) - 50;
    return {
      ...station,
      unleaded: basePrices.unleaded + variation,
      premium: basePrices.premium + variation,
      diesel: basePrices.diesel + variation
    };
  });
}

function generateMockPriceHistory(): any[] {
  const stations = generateSimulatedPrices([]);
  return stations.map(station => ({
    ...station,
    week1: station.unleaded - 75,
    week2: station.unleaded - 50,
    week3: station.unleaded - 25,
    week4: station.unleaded,
    week5: station.unleaded + Math.floor(Math.random() * 50)
  }));
}

function processPriceData(priceData: any[]): StationPrice[] {
  return priceData.map((data, index) => {
    const currentPrice = data.unleaded || 5875;
    const history = [
      data.week1 || currentPrice - 75,
      data.week2 || currentPrice - 50,
      data.week3 || currentPrice - 25,
      data.week4 || currentPrice,
      data.week5 || currentPrice
    ];

    const trend = calculateTrend(history);

    return {
      stationId: data.stationId || `ST00${index + 1}`,
      stationName: data.stationName || `Station ${index + 1}`,
      address: data.address || "Zamboanga City",
      unleaded: data.unleaded || 5875,
      premium: data.premium || 6125,
      diesel: data.diesel || 5450,
      distance: data.distance || 2000,
      trend,
      priceHistory: history
    };
  });
}

function calculateTrend(history: number[]): "▲" | "▼" | "→" {
  if (history.length < 2) return "→";
  
  const first = history[0];
  const last = history[history.length - 1];
  const diff = last - first;
  
  if (Math.abs(diff) < 10) return "→";
  return diff > 0 ? "▲" : "▼";
}

function appendNewPricesToExcel(filePath: string, newData: any[]): void {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const existingData = XLSX.utils.sheet_to_json(worksheet);

    const updatedData = existingData.map((row: any) => {
      const matchingNew = newData.find((n: any) => n.stationId === row.stationId);
      if (matchingNew) {
        return {
          ...row,
          week1: row.week2,
          week2: row.week3,
          week3: row.week4,
          week4: row.week5,
          week5: matchingNew.unleaded
        };
      }
      return row;
    });

    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
    workbook.Sheets[sheetName] = newWorksheet;
    XLSX.writeFile(workbook, filePath);
  } catch (error) {
    console.error("Error appending to Excel:", error);
  }
}

function createExcelFile(filePath: string, data: any[]): void {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheetData = data.map(item => ({
      stationId: item.stationId,
      stationName: item.stationName,
      address: item.address,
      distance: item.distance,
      week1: item.unleaded - 100,
      week2: item.unleaded - 75,
      week3: item.unleaded - 50,
      week4: item.unleaded - 25,
      week5: item.unleaded
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "PriceHistory");
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    XLSX.writeFile(workbook, filePath);
  } catch (error) {
    console.error("Error creating Excel file:", error);
  }
}
