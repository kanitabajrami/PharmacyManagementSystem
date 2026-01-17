import axios from "axios";

const API_URL = "https://localhost:7201/api/Auth";

export async function login(userNameOrEmail, password) {
  const response = await axios.post(`${API_URL}/login`, {
    userNameOrEmail,
    password,
  });

  return response.data; // { token: "..." }
}
