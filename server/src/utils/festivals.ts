import axios from 'axios';

interface Holiday {
  uid: string;
  summary: string;
  categories: string[];
  start: string;
  end: string;
}

let holidayCache: { [year: number]: Holiday[] } = {};

export const getHolidayCache = () => holidayCache;

export const loadHolidays = async (year: number) => {
  if (holidayCache[year]) return;

  try {
    const response = await axios.get(`https://raw.githubusercontent.com/Dilshan-H/srilanka-holidays/main/json/${year}.json`);
    holidayCache[year] = response.data;
    console.log(`Successfully loaded ${holidayCache[year].length} Sri Lankan holidays for ${year} from Dilshan-H/srilanka-holidays dataset.`);
  } catch (error) {
    console.error(`Failed to load holidays for ${year}. Falling back to empty array.`, error);
    holidayCache[year] = [];
  }
};

export const isPoyaDay = (date: Date): boolean => {
  const year = date.getFullYear();
  const dateString = date.toISOString().split('T')[0];
  
  if (!holidayCache[year]) {
    return false;
  }
  
  return holidayCache[year].some(h => h.start === dateString && h.categories.includes('Poya'));
};

export const getFestival = (date: Date) => {
  const year = date.getFullYear();
  const dateString = date.toISOString().split('T')[0];
  
  if (!holidayCache[year]) {
    return undefined;
  }
  
  const holiday = holidayCache[year].find(h => h.start === dateString);
  if (holiday) {
    return {
      name: holiday.summary,
      type: holiday.categories.includes('Poya') ? 'poya' : 'holiday'
    };
  }
  
  return undefined;
};
