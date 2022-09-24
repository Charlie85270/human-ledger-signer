import "core-js/actual";
import { listen } from "@ledgerhq/logs";
import Eth from "@ledgerhq/hw-app-eth";
import axios from "axios";
// Keep this import if you want to use a Ledger Nano S/X/S Plus with the USB protocol and delete the @ledgerhq/hw-transport-webhid import
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
// Keep this import if you want to use a Ledger Nano S/X/S Plus with the HID protocol and delete the @ledgerhq/hw-transport-webusb import
import TransportWebHID from "@ledgerhq/hw-transport-webhid";

const messageToSign = "I'm human bro";
//Display the header in the div which has the ID "main"
const initial =
  "<h1>Connect your Nano and open the Ethereum app. Click on “Hash my message”</h1>";
const $main = document.getElementById("main");

$main.innerHTML = initial;

document.querySelector("#hashMessage").addEventListener("click", async () => {
  $main.innerHTML = initial;
  try {
    let transport;
    if (document.getElementById("usb").checked == true) {
      //trying to connect to your Ledger device with USB protocol
      transport = await TransportWebUSB.create();
    } else {
      //trying to connect to your Ledger device with HID protocol
      transport = await TransportWebHID.create();
    }

    //listen to the events which are sent by the Ledger packages in order to debug the app
    listen(log => console.log(log));

    //When the Ledger device connected it is trying to display the bitcoin address
    const eth = new Eth(transport);
    const signature = await eth.signPersonalMessage(
      "44'/60'/0'/0/0",
      Buffer.from(messageToSign).toString("hex")
    );
    const signedHash =
      "0x" + signature.r + signature.s + signature.v.toString(16);

    //Display the hash
    const h2 = document.createElement("h2");
    h2.textContent = signedHash;
    $main.innerHTML = "<h1>Your signed message:</h1>";
    $main.appendChild(h2);

    //Display the address on the Ledger device and ask to verify the address
    const { address } = await eth.getAddress("44'/60'/0'/0/0");
    const add = document.createElement("div");
    add.textContent = address;
    $main.appendChild(add);
    axios
      .post(
        `http://localhost:7000/verifyProof`,
        { address, hash: signedHash },
        {}
      )
      .then(response => {
        console.log(response.data.proof);
        alert(`Hash verified and valid, proof : ${response.data.proof}`);
      });
  } catch (e) {
    //Catch any error thrown and displays it on the screen
    const $err = document.createElement("code");
    $err.style.color = "#f66";
    $err.textContent = String(e.message || e);
    $main.appendChild($err);
  }
});
