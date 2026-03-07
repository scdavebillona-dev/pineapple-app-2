// Persistent storage for user data - survives app closure and logout
import AsyncStorageImpl from '@react-native-async-storage/async-storage';

export const AsyncStorage = AsyncStorageImpl;

export const StorageService = {
  async getRecentScans(limit = 50) {
    try {
      const existingScans = await AsyncStorage.getItem('scanHistory');
      if (existingScans) {
        return JSON.parse(existingScans).slice(0, limit);
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async saveScan(scan: any) {
    try {
      const existingScansString = await AsyncStorage.getItem('scanHistory');
      let scans = [];
      if (existingScansString) {
        scans = JSON.parse(existingScansString);
      }
      scans.unshift(scan);
      await AsyncStorage.setItem('scanHistory', JSON.stringify(scans));
    } catch (e) {
      console.error(e);
    }
  },

  async clearScans() {
    try {
      await AsyncStorage.removeItem('scanHistory');
    } catch (e) {
      console.error(e);
    }
  },

  async deleteScan(id: string, timestamp?: string) {
    try {
      const existingScansString = await AsyncStorage.getItem('scanHistory');
      if (existingScansString) {
        let scans = JSON.parse(existingScansString);
        scans = scans.filter((scan: any) => {
          if (scan.id && scan.id === id) return false;
          if (!scan.id && timestamp && scan.timestamp === timestamp) return false;
          return true;
        });
        await AsyncStorage.setItem('scanHistory', JSON.stringify(scans));
      }
    } catch (e) {
      console.error(e);
    }
  }
};