const jose = require('node-jose');

(async () => {
  // Create an empty keystore
  const keystore = jose.JWK.createKeyStore();

  // Generate an RSA key (RS256)
  const key = await keystore.generate('RSA', 2048, {
    alg: 'RS256',
    use: 'sig', // use for signature
  });

  // Output the keystore as JSON
  console.log(JSON.stringify(keystore.toJSON(true)));
})();
