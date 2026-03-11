require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const fs       = require("fs");
const path     = require("path");
const fetch    = require("node-fetch");
const FormData = require("form-data");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ─── Root route to prevent platform 404 ────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({
    service: "Research Terminal Backend",
    status: "running",
    endpoints: [
      "/api/health",
      "/api/test-yahoo/:symbol",
      "/api/transcribe",
      "/api/analyze"
    ]
  });
});


const tmpDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("audio/") ||
      file.mimetype === "video/webm" ||
      /\.(mp3|wav|ogg|webm|m4a|flac|aac)$/i.test(file.originalname);
    cb(ok ? null : new Error("Unsupported audio format"), ok);
  },
});

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY    = process.env.OPENAI_API_KEY;

if (!ANTHROPIC_KEY || ANTHROPIC_KEY === "your_anthropic_api_key_here") {
  console.warn("\nWARNING: ANTHROPIC_API_KEY not set.");
}
if (!OPENAI_KEY || OPENAI_KEY === "your_openai_api_key_here") {
  console.warn("WARNING: OPENAI_API_KEY not set.\n");
}

// ─── Yahoo Finance (multi-endpoint, cookie+crumb) ─────────────────────────────

let _cookie = "";
let _crumb  = "";
let _crumbTs = 0;

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
};

// Extract cookies from a node-fetch response (works for both v2 and v3)
function extractCookies(response) {
  try {
    // node-fetch v2: headers.raw()['set-cookie'] is an array
    if (typeof response.headers.raw === "function") {
      const raw = response.headers.raw();
      const arr = raw["set-cookie"] || [];
      return arr.map(c => c.split(";")[0]).filter(Boolean).join("; ");
    }
    // native fetch / node-fetch v3: headers.getSetCookie()
    if (typeof response.headers.getSetCookie === "function") {
      return response.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
    }
    // fallback: single set-cookie header
    const sc = response.headers.get("set-cookie");
    return sc ? sc.split(";")[0] : "";
  } catch { return ""; }
}

async function refreshCrumb() {
  // Refresh at most once per 30 minutes
  if (_crumb && (Date.now() - _crumbTs) < 30 * 60 * 1000) return;

  try {
    // 1. Hit finance.yahoo.com to get session cookies
    const homeRes = await fetch("https://finance.yahoo.com/quote/AAPL/", {
      headers: YF_HEADERS,
      redirect: "follow",
    });
    _cookie = extractCookies(homeRes);

    // 2. Get crumb
    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { ...YF_HEADERS, "Cookie": _cookie },
    });

    if (crumbRes.ok) {
      const text = await crumbRes.text();
      if (text && text.length < 50 && !text.includes("<")) {
        _crumb  = text.trim();
        _crumbTs = Date.now();
        console.log(`  Crumb OK: ${_crumb.slice(0,8)}… | Cookie len: ${_cookie.length}`);
        return;
      }
    }

    // 3. Fallback: try the EU endpoint for consent cookie
    const euRes = await fetch("https://consent.yahoo.com/v2/collectConsent?sessionId=1", {
      headers: YF_HEADERS, redirect: "follow",
    });
    const euCookie = extractCookies(euRes);
    if (euCookie) _cookie = _cookie ? `${_cookie}; ${euCookie}` : euCookie;

    const crumbRes2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { ...YF_HEADERS, "Cookie": _cookie },
    });
    if (crumbRes2.ok) {
      const text2 = await crumbRes2.text();
      if (text2 && text2.length < 50) {
        _crumb = text2.trim();
        _crumbTs = Date.now();
        console.log(`  Crumb OK (fallback): ${_crumb.slice(0,8)}…`);
      }
    }
  } catch (err) {
    console.warn(`  Crumb refresh error: ${err.message}`);
  }
}

function toYahooSymbol(ticker, exchange) {
  const t  = (ticker || "").toUpperCase().trim().replace(/\s+/g, "");
  const ex = (exchange || "").toUpperCase().trim();
  if (t.includes(".")) return t;
  if (["NIFTY50","NIFTY","NIFTYINDEX"].includes(t)) return "^NSEI";
  if (t === "SENSEX")    return "^BSESN";
  if (t === "BANKNIFTY") return "^NSEBANK";
  if (ex === "NSE" || ex === "NSE INDIA") return `${t}.NS`;
  if (ex === "BSE" || ex === "BSE INDIA") return `${t}.BO`;
  if (["NYSE","NASDAQ","NYSEARCA","AMEX","BATS"].includes(ex)) return t;
  const nse = new Set([
    "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","KOTAKBANK",
    "SBIN","BHARTIARTL","ITC","LT","ASIANPAINT","AXISBANK","MARUTI","WIPRO",
    "HCLTECH","BAJFINANCE","ULTRACEMCO","NESTLEIND","POWERGRID","NTPC","ONGC",
    "TATAMOTORS","TATASTEEL","ADANIENT","ADANIPORTS","SUNPHARMA","DRREDDY",
    "CIPLA","DIVISLAB","TECHM","TITAN","BAJAJFINSV","COALINDIA","GRASIM",
    "BPCL","INDUSINDBK","EICHERMOT","HEROMOTOCO","HINDALCO","JSWSTEEL",
    "TATACONSUM","APOLLOHOSP","PIDILITIND","DABUR","MARICO","HAVELLS",
    "ZOMATO","NAUKRI","IRCTC","DMART","BAJAJ-AUTO","TVSMOTORS","M&M",
    "TATAPOWER","CONCOR","VOLTAS","ABB","SIEMENS","CHOLAFIN","VEDL",
    "NHPC","RECLTD","PFC","BHEL","BEL","HAL","IRFC","RVNL","NBCC","HUDCO",
    "SJVN","CESC","TORNTPHARM","LUPIN","AUROPHARMA","ZYDUSLIFE","GODREJCP",
    "COLPAL","EMAMILTD","BERGEPAINT","TATACOMM","MPHASIS","LTIM","PERSISTENT",
    "COFORGE","OFSS","WIPRO","HCLTECH","TECHM","KPITTECH","TATAELXSI",
  ]);
  if (nse.has(t)) return `${t}.NS`;
  return t;
}

async function fetchYahooData(ticker, exchange, retry = true) {
  const symbol = toYahooSymbol(ticker, exchange);
  console.log(`  Fetching: ${symbol}`);

  await refreshCrumb();

  const crumbQ = _crumb ? `&crumb=${encodeURIComponent(_crumb)}` : "";
  const hdrs   = { ...YF_HEADERS, "Cookie": _cookie };

  try {
    // ── Primary: v8 chart (always has price) ──
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d${crumbQ}`;
    const chartRes = await fetch(chartUrl, { headers: hdrs });
    const chartJson = chartRes.ok ? await chartRes.json() : null;

    if (chartJson?.chart?.error?.code === "Unauthorized") {
      console.log("  Crumb expired — refreshing…");
      _crumb = ""; _crumbTs = 0;
      await refreshCrumb();
      // one more try
      const chartRes2 = await fetch(chartUrl.replace(crumbQ, `&crumb=${encodeURIComponent(_crumb)}`), { headers: hdrs });
      const j2 = chartRes2.ok ? await chartRes2.json() : null;
      if (j2?.chart?.result?.[0]) return parseChart(j2, symbol, exchange);
    }

    if (chartJson?.chart?.result?.[0]) {
      // ── Also fetch summary for fundamentals ──
      const sumUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail%2CdefaultKeyStatistics%2Cprice${crumbQ}`;
      const sumRes  = await fetch(sumUrl, { headers: hdrs });
      const sumJson = sumRes.ok ? await sumRes.json() : null;
      return parseChart(chartJson, symbol, exchange, sumJson);
    }

    // ── Fallback: v7 quote endpoint ──
    console.log(`  Trying v7 quote fallback for ${symbol}…`);
    const v7Url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice,previousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,marketCap,trailingPE,dividendYield,beta,regularMarketVolume,longName,currency,fullExchangeName${crumbQ}`;
    const v7Res  = await fetch(v7Url, { headers: hdrs });
    const v7Json = v7Res.ok ? await v7Res.json() : null;
    const q = v7Json?.quoteResponse?.result?.[0];

    if (q) return parseV7(q, symbol, exchange);

    // ── Nothing worked ──
    console.warn(`  No data from Yahoo for ${symbol} (chart: ${chartRes.status}, v7: ${v7Res?.status})`);
    if (retry && !symbol.includes(".")) {
      console.log(`  Last resort: retrying as ${ticker}.NS`);
      return fetchYahooData(ticker, "NSE", false);
    }
    return null;

  } catch (err) {
    console.warn(`  Yahoo fetch error (${symbol}): ${err.message}`);
    if (retry && !symbol.includes(".")) return fetchYahooData(ticker, "NSE", false);
    return null;
  }
}

function parseChart(chartJson, symbol, exchange, sumJson) {
  const meta = chartJson.chart.result[0].meta || {};
  const sd   = sumJson?.quoteSummary?.result?.[0]?.summaryDetail       || {};
  const dks  = sumJson?.quoteSummary?.result?.[0]?.defaultKeyStatistics || {};
  const pr   = sumJson?.quoteSummary?.result?.[0]?.price               || {};

  const price   = meta.regularMarketPrice ?? meta.chartPreviousClose;
  const prev    = meta.previousClose ?? meta.chartPreviousClose ?? price;
  const chgPct  = (prev && price) ? ((price - prev) / prev * 100) : 0;
  const currency= meta.currency || "USD";
  const isINR   = currency === "INR";
  const curr    = isINR ? "₹" : (currency === "USD" ? "$" : currency);

  const raw = (obj, key) => {
    if (!obj || obj[key] == null) return null;
    return typeof obj[key] === "object" ? (obj[key].raw ?? null) : obj[key];
  };

  return buildResult(symbol, exchange, {
    price, prev, chgPct, currency, isINR, curr,
    pe:   raw(sd,"trailingPE")      ?? meta.trailingPE,
    div:  raw(sd,"dividendYield"),
    beta: raw(sd,"beta"),
    hi52: raw(sd,"fiftyTwoWeekHigh") ?? meta.fiftyTwoWeekHigh,
    lo52: raw(sd,"fiftyTwoWeekLow")  ?? meta.fiftyTwoWeekLow,
    mcap: raw(sd,"marketCap")        ?? raw(pr,"marketCap"),
    eps:  raw(dks,"trailingEps"),
    vol:  meta.regularMarketVolume,
    avgVol: meta.averageDailyVolume10Day,
    name: raw(pr,"longName") || raw(pr,"shortName") || meta.instrumentType,
    exch: meta.fullExchangeName || meta.exchangeName,
  });
}

function parseV7(q, symbol, exchange) {
  const price   = q.regularMarketPrice;
  const prev    = q.regularMarketPreviousClose ?? price;
  const chgPct  = (prev && price) ? ((price - prev) / prev * 100) : 0;
  const currency= q.currency || "USD";
  const isINR   = currency === "INR";
  const curr    = isINR ? "₹" : "$";

  return buildResult(symbol, exchange, {
    price, prev, chgPct, currency, isINR, curr,
    pe:   q.trailingPE, div: q.dividendYield, beta: q.beta,
    hi52: q.fiftyTwoWeekHigh, lo52: q.fiftyTwoWeekLow,
    mcap: q.marketCap, eps: null,
    vol:  q.regularMarketVolume, avgVol: q.averageDailyVolume3Month,
    name: q.longName || q.shortName, exch: q.fullExchangeName,
  });
}

function buildResult(symbol, exchange, d) {
  const { price, chgPct, isINR, curr } = d;

  const fmtCap = (n) => {
    if (!n) return null;
    if (isINR) {
      if (n >= 1e12) return `${curr}${(n/1e12).toFixed(2)}L Cr`;
      if (n >= 1e9)  return `${curr}${(n/1e9).toFixed(1)} KCr`;
      return `${curr}${(n/1e7).toFixed(0)} Cr`;
    }
    if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
    if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
    return `$${(n/1e6).toFixed(2)}M`;
  };

  const fmtVol = (n) => {
    if (!n) return null;
    if (isINR) {
      if (n >= 1e7) return `${(n/1e7).toFixed(2)} Cr`;
      if (n >= 1e5) return `${(n/1e5).toFixed(2)} L`;
    }
    if (n >= 1e9) return `${(n/1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n/1e6).toFixed(2)}M`;
    return n.toLocaleString();
  };

  return {
    symbol,
    price:          price  != null ? `${curr}${price.toFixed(2)}`          : null,
    priceRaw:        price,
    change:         `${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
    changePositive:  chgPct >= 0,
    peRatio:         d.pe   != null ? `${Number(d.pe).toFixed(1)}x`        : null,
    marketCap:       fmtCap(d.mcap),
    weekHigh52:      d.hi52 != null ? `${curr}${Number(d.hi52).toFixed(2)}`  : null,
    weekLow52:       d.lo52 != null ? `${curr}${Number(d.lo52).toFixed(2)}`  : null,
    dividendYield:   d.div  != null ? `${(Number(d.div)*100).toFixed(2)}%`   : null,
    beta:            d.beta != null ? Number(d.beta).toFixed(2)              : null,
    eps:             d.eps  != null ? `${curr}${Number(d.eps).toFixed(2)}`   : null,
    volume:          fmtVol(d.vol),
    avgVolume:       fmtVol(d.avgVol),
    companyName:     d.name   || null,
    exchange:        d.exch   || exchange,
    currency:        curr,
  };
}

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status:    "ok",
    anthropic: !!(ANTHROPIC_KEY && ANTHROPIC_KEY !== "your_anthropic_api_key_here"),
    openai:    !!(OPENAI_KEY    && OPENAI_KEY    !== "your_openai_api_key_here"),
  });
});


// ─── DEBUG: test Yahoo Finance directly ───────────────────────────────────────
app.get("/api/test-yahoo/:symbol", async (req, res) => {
  const sym = req.params.symbol || "NHPC.NS";
  console.log(`\nDEBUG: Testing Yahoo for ${sym}`);
  try {
    await refreshCrumb();
    const hdrs = { ...YF_HEADERS, "Cookie": _cookie };
    const crumbQ = _crumb ? `&crumb=${encodeURIComponent(_crumb)}` : "";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d${crumbQ}`;
    const r = await fetch(url, { headers: hdrs });
    const j = await r.json();
    res.json({
      status: r.status,
      crumb: _crumb?.slice(0,10) + "…",
      cookieLen: _cookie?.length,
      chartError: j?.chart?.error || null,
      price: j?.chart?.result?.[0]?.meta?.regularMarketPrice || null,
      currency: j?.chart?.result?.[0]?.meta?.currency || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRANSCRIBE ────────────────────────────────────────────────────────────────
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  let filePath = null;
  try {
    if (!OPENAI_KEY || OPENAI_KEY === "your_openai_api_key_here") {
      return res.status(400).json({ error: "OPENAI_API_KEY not configured in .env" });
    }

    if (!req.file && req.body.audioBase64) {
      const b64 = req.body.audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
      const ext = req.body.mimeType?.includes("ogg") ? "ogg"
                : req.body.mimeType?.includes("mp4") ? "mp4" : "webm";
      filePath  = path.join(tmpDir, `rec_${Date.now()}.${ext}`);
      fs.writeFileSync(filePath, Buffer.from(b64, "base64"));
    } else if (req.file) {
      filePath = req.file.path;
    } else {
      return res.status(400).json({ error: "No audio provided" });
    }

    const fd = new FormData();
    fd.append("file", fs.createReadStream(filePath), {
      filename:    path.basename(filePath),
      contentType: req.file?.mimetype || req.body.mimeType || "audio/webm",
    });
    fd.append("model",           "whisper-1");
    fd.append("language",        "en");
    fd.append("response_format", "text");

    const wr = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method:  "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, ...fd.getHeaders() },
      body:    fd,
    });
    if (!wr.ok) throw new Error(`Whisper ${wr.status}: ${await wr.text()}`);
    res.json({ transcript: (await wr.text()).trim() });

  } catch (err) {
    console.error("Transcription error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

// ─── ANALYZE — two-step pipeline ──────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    if (!ANTHROPIC_KEY || ANTHROPIC_KEY === "your_anthropic_api_key_here") {
      return res.status(400).json({ error: "ANTHROPIC_API_KEY not configured in .env" });
    }

    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "No transcript provided" });

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1 — Claude: extract ticker + analysis (no price guessing)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\nSTEP 1 — Claude analysis…");

    const system = `You are a senior equity research analyst AI. Given a client conversation transcript, return ONLY a valid JSON object — no markdown, no prose, no code fences.

DO NOT invent or estimate: price, P/E ratio, market cap, 52-week range, dividend yield, beta. Real live data will be fetched separately.

Required JSON:
{
  "ticker": "Stock ticker only. Indian stocks: e.g. RELIANCE, TCS, HDFCBANK, BAJFINANCE. US stocks: e.g. AAPL, MSFT. Nifty 50 index: NIFTY50.",
  "exchange": "NSE or BSE or NASDAQ or NYSE",
  "companyName": "Full legal company name",
  "signal": "BULLISH or BEARISH or NEUTRAL",
  "confidence": 78,
  "recommendation": "BUY or SELL or HOLD or ACCUMULATE or REDUCE",
  "targetPrice": "12-month analyst target price with currency symbol e.g. ₹2800 or $210",
  "support": "Key technical support level e.g. ₹2200",
  "resistance": "Key technical resistance level e.g. ₹2700",
  "momentumScore": 74,
  "sentimentScore": 68,
  "volumeScore": 55,
  "institutionalScore": 81,
  "technicalScore": 72,
  "fundamentalScore": 80,
  "keyRisk": "One specific risk, max 12 words",
  "catalyst": "One specific upside catalyst, max 12 words",
  "summary": "2-3 sentences describing what the client is asking and their goal.",
  "response": "4-6 sentence professional analyst response for the broker to read to the client. Cover: signal/trend, key catalyst, key risk, recommendation + target, and one clear action step. Do NOT quote live prices — those will be shown in the card."
}

All scores are integers 0–100. Be specific and grounded for the specific stock mentioned.`;

    const cr = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system,
        messages: [{ role: "user", content: `Transcript:\n"${transcript}"\n\nJSON only:` }],
      }),
    });

    if (!cr.ok) throw new Error(`Claude API ${cr.status}: ${await cr.text()}`);
    const cd  = await cr.json();
    if (cd.error) throw new Error(cd.error.message || JSON.stringify(cd.error));

    const rawText = (cd.content || []).map(b => b.text || "").join("");
    const match   = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned no valid JSON");

    const analysis = JSON.parse(match[0]);
    console.log(`  Claude: ${analysis.ticker} (${analysis.exchange}) — ${analysis.signal} / ${analysis.recommendation}`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2 — Yahoo Finance: real live market data
    // ──────────────────────────────────────────────────────────────────────────
    console.log("STEP 2 — Yahoo Finance live data…");
    const live = await fetchYahooData(analysis.ticker, analysis.exchange);

    if (live) {
      console.log(`  Live: ${live.price} (${live.change})`);
    } else {
      console.log("  No live data found — fields will show '—'");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3 — Merge and respond
    // ──────────────────────────────────────────────────────────────────────────
    const isINR = ["NSE","BSE"].includes((analysis.exchange || "").toUpperCase());
    const curr  = isINR ? "₹" : "$";

    const result = {
      ticker:        analysis.ticker,
      companyName:   live?.companyName   || analysis.companyName,
      exchange:      analysis.exchange,

      // Live price data (real)
      price:          live?.price          || `${curr}—`,
      change:         live?.change         || "—",
      changePositive: live?.changePositive ?? true,

      // Analysis (Claude)
      signal:         analysis.signal,
      confidence:     Number(analysis.confidence) || 70,
      recommendation: analysis.recommendation,
      targetPrice:    analysis.targetPrice,
      support:        analysis.support,
      resistance:     analysis.resistance,

      // Fundamentals (real from Yahoo)
      peRatio:       live?.peRatio       || "N/A",
      marketCap:     live?.marketCap     || "N/A",
      weekHigh52:    live?.weekHigh52    || "N/A",
      weekLow52:     live?.weekLow52     || "N/A",
      dividendYield: live?.dividendYield || "N/A",
      beta:          live?.beta          || "N/A",
      eps:           live?.eps           || "N/A",
      volume:        live?.volume        || "N/A",
      avgVolume:     live?.avgVolume     || "N/A",

      // AI indicator scores
      momentumScore:      Number(analysis.momentumScore)      || 50,
      sentimentScore:     Number(analysis.sentimentScore)      || 50,
      volumeScore:        Number(analysis.volumeScore)         || 50,
      institutionalScore: Number(analysis.institutionalScore)  || 50,
      technicalScore:     Number(analysis.technicalScore)      || 50,
      fundamentalScore:   Number(analysis.fundamentalScore)    || 50,

      // Narrative
      keyRisk:  analysis.keyRisk,
      catalyst: analysis.catalyst,
      summary:  analysis.summary,
      response: analysis.response,

      // Meta
      dataSource:  live ? "Yahoo Finance (live)" : "Data unavailable",
      lastUpdated: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
      }),
    };

    console.log("DONE\n");
    res.json(result);

  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nResearch Terminal Backend  —  http://localhost:${PORT}`);
  console.log(`  Claude:        ${ANTHROPIC_KEY && ANTHROPIC_KEY !== "your_anthropic_api_key_here" ? "OK" : "MISSING — add to .env"}`);
  console.log(`  Whisper:       ${OPENAI_KEY    && OPENAI_KEY    !== "your_openai_api_key_here"    ? "OK" : "MISSING — add to .env"}`);
  console.log(`  Yahoo Finance: OK (no key needed)\n`);
});
