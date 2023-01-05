# Proof-of-Humanity using Ledger signature

## Idea Scope

Creating an additional way for verifying humanity using Ledger Nano X/S devices as Proof-of-Humanity.

## How It Works:

The user is invited to connect his ledger in USB, then we open a WebSocket session with the device and process the genuine check (Informations are verified via the Ledger official HSM [more informations about genuine check here](https://support.ledger.com/hc/en-us/articles/4404382029329-Check-hardware-integrity?support=true)) . All libraries used are the officials from ledger repository.

## Install Dependencies & Run Backend/Frontend

```bash
yarn install
yarn start
```

The application will run on http://localhost:1234, which you can navigate to in your browser.

## And next ?

The genuine check of the ledger is done on the client side (browser + device) and with the HSM server of Ledger.

But it's impossible for us to verify in our server side that the device is really a genuine.
To do that, several possibilities can be explore :

- Create our own HSM server to verify the genuine informations
- Create our own certificate and authority and push it into the ledger
- Create an official Human-Protocol Ledger application to handle the signature and process the verifications
