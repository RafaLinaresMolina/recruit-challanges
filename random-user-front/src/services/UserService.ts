import axios, { AxiosResponse } from 'axios';
import { User } from '../types/User';
import { API_RANDOMUSER_URL } from '../config/constants';

interface APIResponse {
  results: User[];
}

export class UserService {
  static async getRandomUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<APIResponse> = await axios.get(API_RANDOMUSER_URL);
      return response.data.results;

    } catch (error) {
      throw error;
    }
  }
}