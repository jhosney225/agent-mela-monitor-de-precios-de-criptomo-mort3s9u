
```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Store cryptocurrency prices and alert thresholds
const cryptoData = {
  BTC: { currentPrice: 45234.5, history: [45000, 45100, 45234.5] },
  ETH: { currentPrice: 2523.75, history: [2500, 2510, 2523.75] },
  XRP: { currentPrice: 2.1, history: [2.0, 2.05, 2.1] },
};

const alertThresholds = {
  BTC: { high: 46000, low: 44000 },
  ETH: { high: 2600, low: 2400 },
  XRP: { high: 2.5, low: 1.8 },
};

// Track conversation history for multi-turn interactions
let conversationHistory = [];

// Helper function to get crypto data
function getCryptoData() {
  const data = {};
  for (const [symbol, info] of Object.entries(cryptoData)) {
    data[symbol] = {
      currentPrice: info.currentPrice,
      priceChange: (
        (
          ((info.currentPrice - info.history[0]) / info.history[0]) *
          100
        ).toFixed(2)
      ),
      alertThresholds: alertThresholds[symbol],
    };
  }
  return data;
}

// Helper function to update crypto prices (simulate price changes)
function updateCryptoPrices() {
  const changes = {
    BTC: (Math.random() - 0.5) * 500,
    ETH: (Math.random() - 0.5) * 50,
    XRP: (Math.random() - 0.5) * 0.1,
  };

  for (const [symbol, change] of Object.entries(changes)) {
    const oldPrice = cryptoData[symbol].currentPrice;
    const newPrice = Math.max(100, oldPrice + change); // Keep price positive
    cryptoData[symbol].history.push(newPrice);
    if (cryptoData[symbol].history.length > 10) {
      cryptoData[symbol].history.shift(); // Keep only last 10 prices
    }
    cryptoData[symbol].currentPrice = parseFloat(newPrice.toFixed(2));
  }
}

// Helper function to get current alerts
function getActiveAlerts() {
  const alerts = [];
  for (const [symbol, thresholds] of Object.entries(alertThresholds)) {
    const current = cryptoData[symbol].currentPrice;
    if (current >= thresholds.high) {
      alerts.push(
        `⚠️ ${symbol} PRICE HIGH: $${current} (threshold: $${thresholds.high})`
      );
    }
    if (current <= thresholds.low) {
      alerts.push(
        `⚠️ ${symbol} PRICE LOW: $${current} (threshold: $${thresholds.low})`
      );
    }
  }
  return alerts.length > 0 ? alerts : ["✓ No active alerts"];
}

// Helper function to set alert thresholds
function setAlertThreshold(symbol, threshold, type) {
  if (!alertThresholds[symbol]) {
    return `Error: Symbol ${symbol} not found`;
  }
  alertThresholds[symbol][type.toLowerCase()] = parseFloat(threshold);
  return `Alert threshold for ${symbol} ${type} set to $${threshold}`;
}

// Process tool calls from Claude
function processToolCall(toolName, toolInput) {
  if (toolName === "get_crypto_data") {
    return JSON.stringify(getCryptoData(), null, 2);
  } else if (toolName === "update_prices") {
    updateCryptoPrices();
    return "Crypto prices updated successfully. New prices: " +
      JSON.stringify(getCryptoData(), null, 2);
  } else if (toolName === "get_alerts") {
    return getActiveAlerts().join("\n");
  } else if (toolName === "set_alert_threshold") {
    return setAlertThreshold(
      toolInput.symbol,
      toolInput.threshold,
      toolInput.type
    );
  } else if (toolName === "get_price_history") {
    const symbol = toolInput.symbol;
    if (!cryptoData[symbol]) {
      return `Error: Symbol ${symbol} not found`;
    }
    return `${symbol} price history: ${cryptoData[symbol].history.join(", ")}`;
  } else {
    return `Unknown tool: ${toolName}`;
  }
}

// Main function to interact with Claude
async function interactWithClaude(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  const tools = [
    {
      name: "get_crypto_data",
      description:
        "Get current cryptocurrency prices and price changes. Returns data for BTC, ETH, and XRP.",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "update_prices",
      description:
        "Update cryptocurrency prices with random fluctuations to simulate market changes.",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_alerts",
      description: "Get current active price alerts based on thresholds.",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "set_alert_threshold",
      description: "Set high or low price alert thresholds for a cryptocurrency.",
      input_schema: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Cryptocurrency symbol (BTC, ETH, XRP)",
          },
          threshold