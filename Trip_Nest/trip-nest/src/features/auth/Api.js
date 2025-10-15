// src/features/auth/Api.js
import axios from "axios";

// CRA uses process.env.REACT_APP_*
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive the httpOnly cookie
});
