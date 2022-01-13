const axios = require('axios');

const instance = axios.create({
  baseURL: 'https://api.github.com/',
});

const map = new Map();

module.exports = {
  ...instance,
  get: (...args) => {
    if (map.has(args[0])) {
      return map.get(args[0]);
    }
    console.log(`=================================`);
    console.log(`MAKING REQUEST STOP NOW THAT SHIT`);
    console.log(...args);
    console.log(`=================================`);
    const p = instance.get(...args);
    map.set(args[0], p);
    return p;
  },
};
