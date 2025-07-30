// config.js
const API_KEYS = {
  public: 'yourPublicKeyHere',
  personal: 'yourPrivateKeyHere'
};

function getApiKey(mode = 'public') {
  return API_KEYS[mode] || API_KEYS.public;
}
