import axios, { AxiosResponse } from 'axios';
import { User } from '../interfaces/User';

interface APIResponse {
  results: User[];
}

export class UserService {
  static async getRandomUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<APIResponse> = await axios.get('https://randomuser.me/api/?results=20');
      return response.data.results;

    } catch (error) {
      throw error;
    }
  }
}