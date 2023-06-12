import axios from 'axios';
import { User } from '../interfaces/User';

export class UserService {
  static async getRandomUsers(): Promise<User[]> {
    const response = await axios.get('https://randomuser.me/api/?results=50');
    return response.data.results;
  }
}