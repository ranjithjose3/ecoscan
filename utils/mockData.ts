// ✅ 1. Master JSON: All collection schedules
export const collectionData = [
  { date: '2025-07-30', type: 'recycling', time: '09:00' },
  { date: '2025-07-30', type: 'green_bin', time: '11:00' },
  { date: '2025-07-31', type: 'yard_waste', time: '10:00' },
  { date: '2025-08-01', type: 'green_bin', time: '08:30' },
  { date: '2025-08-01', type: 'recycling', time: '14:00' },
  { date: '2025-08-02', type: 'yard_waste', time: '16:00' },
  { date: '2025-08-03', type: 'green_bin', time: '09:15' },
  { date: '2025-08-03', type: 'yard_waste', time: '17:30' },
  { date: '2025-08-04', type: 'recycling', time: '12:00' },
  { date: '2025-08-05', type: 'green_bin', time: '07:00' },
  { date: '2025-08-05', type: 'yard_waste', time: '19:00' },
  { date: '2025-08-06', type: 'recycling', time: '15:00' },
  { date: '2025-08-07', type: 'green_bin', time: '11:30' },
  { date: '2025-08-07', type: 'yard_waste', time: '13:00' },
  { date: '2025-08-08', type: 'recycling', time: '10:00' },
  { date: '2025-08-09', type: 'green_bin', time: '09:00' },
  { date: '2025-08-09', type: 'yard_waste', time: '18:30' },
  { date: '2025-08-10', type: 'recycling', time: '08:45' },
  { date: '2025-08-10', type: 'green_bin', time: '14:30' },
  { date: '2025-08-11', type: 'yard_waste', time: '10:00' },
  { date: '2025-08-12', type: 'green_bin', time: '07:30' },
  { date: '2025-08-12', type: 'recycling', time: '16:00' },
  { date: '2025-08-13', type: 'yard_waste', time: '15:30' },
  { date: '2025-08-14', type: 'green_bin', time: '09:00' },
  { date: '2025-08-15', type: 'recycling', time: '11:00' },
  { date: '2025-08-16', type: 'yard_waste', time: '17:00' },
  { date: '2025-08-17', type: 'green_bin', time: '13:00' },
  { date: '2025-08-18', type: 'recycling', time: '08:00' },
  { date: '2025-08-19', type: 'yard_waste', time: '19:30' },
  { date: '2025-08-20', type: 'green_bin', time: '10:30' },
  { date: '2025-08-21', type: 'recycling', time: '12:15' },
  { date: '2025-08-22', type: 'yard_waste', time: '18:00' },
  { date: '2025-08-23', type: 'green_bin', time: '09:00' },
  { date: '2025-08-24', type: 'recycling', time: '17:30' },
  { date: '2025-08-25', type: 'yard_waste', time: '07:45' },
  { date: '2025-08-26', type: 'green_bin', time: '15:15' },
  { date: '2025-08-27', type: 'recycling', time: '10:00' },
  { date: '2025-08-28', type: 'yard_waste', time: '16:30' }
];

// ✅ 2. Color mapping for types
const typeColors: Record<string, string> = {
  yard_waste: '#FF9800',
  green_bin: '#4CAF50',
  recycling: '#00adf5'
};

// ✅ 3. Generate AgendaList-friendly data
export function getAgendaItemsOld() {
  const grouped: Record<string, any[]> = {};

  collectionData.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push({
      hour: item.time,
      title: `${capitalizeType(item.type)} Collection`
    });
  });

  return Object.keys(grouped).map((date) => ({
    title: date,
    data: grouped[date]
  }));
}

// ✅ 4. Generate Calendar Marked Dates
export function getMarkedDatesOld() {
  const dates: any = {};

  collectionData.forEach((item) => {
    if (!dates[item.date]) {
      dates[item.date] = { dots: [], marked: true };
    }

    // Add color dots (avoid duplicate same-type dots)
    if (!dates[item.date].dots.some((d: any) => d.color === typeColors[item.type])) {
      dates[item.date].dots.push({ color: typeColors[item.type] });
    }
  });

  return dates;
}

// ✅ Helper to make titles pretty
function capitalizeType(type: string) {
  return type
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
