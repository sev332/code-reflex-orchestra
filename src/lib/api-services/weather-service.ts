import { apiRegistry } from '../api-registry';

export interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility: number;
  uv_index: number;
  condition: string;
  description: string;
  icon: string;
  wind: {
    speed: number;
    direction: number;
    gust?: number;
  };
  timestamp: string;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly: WeatherData[];
  daily: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    description: string;
    icon: string;
    precipitation: number;
    humidity: number;
  }>;
}

export class WeatherService {
  private static instance: WeatherService;
  
  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getCurrentWeather(location: string): Promise<WeatherData> {
    const api = apiRegistry.getBestAPIForTask(['weather']);
    if (!api) {
      throw new Error('No weather API available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      let weather: WeatherData;

      switch (api.id) {
        case 'openweathermap':
          weather = await this.fetchFromOpenWeatherMap(location);
          break;
        default:
          throw new Error(`Unsupported weather API: ${api.id}`);
      }

      success = true;
      return weather;
    } catch (error) {
      console.error(`Error fetching weather from ${api.id}:`, error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getForecast(location: string, days: number = 7): Promise<WeatherForecast> {
    const api = apiRegistry.getBestAPIForTask(['weather', 'forecast']);
    if (!api) {
      throw new Error('No weather forecast API available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation - would integrate with actual APIs
      const current = await this.getCurrentWeather(location);
      const forecast: WeatherForecast = {
        current,
        hourly: Array.from({ length: 24 }, (_, i) => ({
          ...current,
          temperature: current.temperature + Math.random() * 4 - 2,
          timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString()
        })),
        daily: Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          high: current.temperature + Math.random() * 6,
          low: current.temperature - Math.random() * 6,
          condition: current.condition,
          description: current.description,
          icon: current.icon,
          precipitation: Math.random() * 100,
          humidity: current.humidity + Math.random() * 20 - 10
        }))
      };

      success = true;
      return forecast;
    } catch (error) {
      console.error(`Error fetching forecast from ${api.id}:`, error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  private async fetchFromOpenWeatherMap(location: string): Promise<WeatherData> {
    // Mock implementation - would use actual OpenWeatherMap API
    return {
      location,
      temperature: 22 + Math.random() * 10,
      feels_like: 25 + Math.random() * 8,
      humidity: 60 + Math.random() * 30,
      pressure: 1013 + Math.random() * 20,
      visibility: 10,
      uv_index: Math.random() * 11,
      condition: 'Clear',
      description: 'Clear sky',
      icon: '01d',
      wind: {
        speed: Math.random() * 20,
        direction: Math.random() * 360,
        gust: Math.random() * 30
      },
      timestamp: new Date().toISOString()
    };
  }

  async getWeatherAlerts(location: string): Promise<Array<{
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    start: string;
    end: string;
  }>> {
    // Mock implementation for weather alerts
    return [];
  }
}