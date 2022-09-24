const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const wallet = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

const messageToSign = "I'm human bro";

// Additions:
const app = express();

const PORT = 7000;
const CLIENT_URL = "http://localhost:1234";

require("dotenv").config();

app.use(express.json());

app.use(
  cors({
    origin: CLIENT_URL,
  })
);

app.post("/verifyProof", async (request, response) => {
  const { hash, address } = request.body;
  const signerAddress = ethers.utils.verifyMessage(messageToSign, hash);

  // User address is the signer
  if (address === signerAddress) {
    // Generate timestamp:
    let authenticated_date = new Date();
    let authenticated_dateInISO = authenticated_date.toISOString();

    // Generate hexlified timestamp:
    const timestamp = ethers.utils.hexZeroPad(
      ethers.utils.hexlify(Math.floor(authenticated_date.getTime() / 1000)),
      4
    );

    // Generate hash:
    const generatedHash = ethers.utils.keccak256(
      ethers.utils.hexConcat([hash, timestamp])
    );

    // Generate validator Signature:
    const validatorSignature = await wallet.signMessage(
      ethers.utils.arrayify(generatedHash)
    );

    // Generate proof:
    const proof = ethers.utils.hexConcat([hash, timestamp, validatorSignature]);

    response.json({
      proof,
      timestamp: authenticated_dateInISO,
    });
  } else {
    response.json({
      status: "failure",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
