// Convert raw address to user-friendly
function userFriendlyAddress(address) {
  return TON_CONNECT_UI.toUserFriendlyAddress(address);
}

document.addEventListener("DOMContentLoaded", async function () {
  tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://vocal-smakager-e64636.netlify.app/manifest.json",
    buttonRootId: "ton-connect",
  });

  // Listen for connection event
  tonConnectUI.onStatusChange(async (wallet) => {
    if (wallet && wallet.account?.address) {
      const friendly = userFriendlyAddress(wallet.account.address);
      document.getElementById(
        "wallet-address"
      ).innerText = `Address: ${friendly}`;
      console.log("Wallet connected:", friendly);
    } else {
      document.getElementById(
        "wallet-address"
      ).innerText = `Address: Not connected`;
      console.log("Wallet disconnected");
    }
  });
});

async function sendTonTransaction() {
  if (!tonConnectUI) {
    console.error("TON Connect not ready");
    return;
  }

  const transaction = {
    messages: [
      {
        address: "EQBBJBB3HagsujBqVfqeDUPJ0kXjgTPLWPFFffuNXNiJL0aA",
        amount: "20000000", // in nanotons (0.02 TON)
      },
    ],
  };

  try {
    const result = await tonConnectUI.sendTransaction(transaction);
    console.log("Transaction successful", result);
  } catch (error) {
    console.error("Transaction failed", error);
  }
}

document
  .getElementById("sendTransactionBtn")
  .addEventListener("click", sendTonTransaction);
