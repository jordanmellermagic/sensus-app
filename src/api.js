import axios from 'axios'

const api = axios.create({
  baseURL: 'https://sensus-api-wd2o.onrender.com',
  timeout: 10000,
})

export default api
