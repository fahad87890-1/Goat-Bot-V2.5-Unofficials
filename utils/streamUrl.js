const axios = require("axios");

async function streamUrl(url, options = {}) {
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
    ...options
  });
  return res.data;
}

module.exports = streamUrl;


