const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const excelPath = path.join(dataDir, 'price_history.xlsx');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Generate mock price history data for 10 stations over 5 weeks
const stations = [
    { stationId: 'ST001', stationName: 'Shell Putik', address: 'Putik, Zamboanga City', distance: 2500 },
    { stationId: 'ST002', stationName: 'Petron Tetuan', address: 'Tetuan, Zamboanga City', distance: 1800 },
    { stationId: 'ST003', stationName: 'Caltex San Jose', address: 'San Jose, Zamboanga City', distance: 3200 },
    { stationId: 'ST004', stationName: 'Phoenix Pasonanca', address: 'Pasonanca, Zamboanga City', distance: 4100 },
    { stationId: 'ST005', stationName: 'Seaoil Baliwasan', address: 'Baliwasan, Zamboanga City', distance: 1500 },
    { stationId: 'ST006', stationName: 'Total Canelar', address: 'Canelar, Zamboanga City', distance: 2800 },
    { stationId: 'ST007', stationName: 'Flying V Sta. Cruz', address: 'Sta. Cruz, Zamboanga City', distance: 2200 },
    { stationId: 'ST008', stationName: 'Unioil Tumaga', address: 'Tumaga, Zamboanga City', distance: 3600 },
    { stationId: 'ST009', stationName: 'PTT Mercedes', address: 'Mercedes, Zamboanga City', distance: 4500 },
    { stationId: 'ST010', stationName: 'Philippine Energy Divisoria', address: 'Divisoria, Zamboanga City', distance: 1200 }
];

const basePrice = 5875; // ₱58.75 in centavos

const priceHistoryData = stations.map(station => {
    const week1 = basePrice - 100 + Math.floor(Math.random() * 50);
    const week2 = basePrice - 75 + Math.floor(Math.random() * 50);
    const week3 = basePrice - 50 + Math.floor(Math.random() * 50);
    const week4 = basePrice - 25 + Math.floor(Math.random() * 50);
    const week5 = basePrice + Math.floor(Math.random() * 50);

    return {
        stationId: station.stationId,
        stationName: station.stationName,
        address: station.address,
        distance: station.distance,
        week1: week1,
        week2: week2,
        week3: week3,
        week4: week4,
        week5: week5
    };
});

// Create workbook
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(priceHistoryData);
XLSX.utils.book_append_sheet(workbook, worksheet, 'PriceHistory');

// Write Excel file
XLSX.writeFile(workbook, excelPath);

console.log(`Excel file created successfully at: ${excelPath}`);
console.log(`Generated price history for ${stations.length} stations`);
