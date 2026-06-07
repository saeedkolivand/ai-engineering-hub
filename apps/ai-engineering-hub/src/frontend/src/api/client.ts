import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:0', // placeholder – actual port is injected at runtime
  timeout: 5000,
});