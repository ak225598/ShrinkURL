const characters =  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const endpoint_length = 5;

function generateUrlEndpoint() {
  let endpoint = "";
  for (let i = 0; i < endpoint_length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    endpoint += characters[randomIndex];
  }
  return endpoint;
}

module.exports = generateUrlEndpoint;
