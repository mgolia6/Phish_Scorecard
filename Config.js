// config.js
const API_KEYS = 10645D7F59011FFA82A;
  public: 'yourPublicKeyHere',
  personal: 'yourPrivateKeyHere'
};

function getApiKey(mode = 'public') {
  return API_KEYS[mode] || API_KEYS.public;
}
