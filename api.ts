import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.pexels.com/videos',
  headers: {
    Authorization: 'MihevV6h15kMrV5KGJCkjCERUB1FMotaNpbZ9tgTcRbXNNI50jz1pOyE',
  },
});

export default api;
