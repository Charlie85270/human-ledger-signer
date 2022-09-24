# Proof-of-Humanity using Ledger signature

## Idea Scope

Creating an additional way for verifying humanity using Ledger Nano X/S devices as Proof-of-Humanity.

## How It Works:

When using the Plugin, users are invited to sign a message with their Nano device.

After signing the message, the hash of the message and the address of the device are sent to the backend, which checks if the hash and the address match the signed message.

The backend then returns a hash and a timestamp that proves that the message has been signed by the ledger owner.

## Install Dependencies & Run Backend/Frontend

Backend dependencies

```bash

cd backend/

npm install

node server.js


```

Frontend dependencies

```bash

cd front/

npm install

npm run start

cd ..

```

The application will run on http://localhost:1234, which you can navigate to in your browser.

## How to use 

Go to http://localhost:1234
<img width="1086" alt="image" src="https://user-images.githubusercontent.com/34569321/192106082-544a1826-412e-41ff-a955-025720768ca2.png">
1. Connect your ledger to your computer
2. Launch the Etherum App on your ledger
3. Choose your connection type (USB or HID)
4. Click on "hash the message"
5. Accept and sign the message on your Ledger




## What next ?

Frontend:

Create a NPM module/component that can be easy integrated on React application

Backend:

Creating a smart contract to verify on-chain the signature.
