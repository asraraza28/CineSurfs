// server.js
import express from "express";
import cors from "cors";
import axios from "axios";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Parser } from "m3u8-parser";

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.type("text/plain").send(
    [
      "CineSurfs Media Proxy",
      "---------------------",
      "Usage examples:",
      "",
      "Fetch video variants:",
      "  /api/video-links?source=vidsrc&id=tt0133093",
      "  /api/video-links?source=vidlink&id=603",
      "",
      "Download proxy:",
      "  /api/download?url=<m3u8-or-media-url>&filename=MyVideo.mp4",
    ].join("\n")
  );
});

// ---------------------------------------------------------------------------
// Utility: Normalize IMDb/TMDB ID
// ---------------------------------------------------------------------------
function normalizeId(idRaw) {
  if (!idRaw) return "";
  const s = String(idRaw).trim();
  return s.startsWith("tt") ? s.slice(2) : s;
}

// ---------------------------------------------------------------------------
// Parse M3U8
// ---------------------------------------------------------------------------
function parseM3u8ToVariants(m3u8Text, baseUrl) {
  const parser = new Parser();
  parser.push(m3u8Text);
  parser.end();

  const pls = parser.manifest.playlists || [];
  if (!pls.length) return [];
  return pls.map((pl) => {
    const height =
      pl.attributes?.RESOLUTION?.height ||
      pl.attributes?.RESOLUTION?.HEIGHT ||
      "Auto";
    return {
      quality: `${height}p`,
      url: new URL(pl.uri, baseUrl).href,
    };
  });
}

// ---------------------------------------------------------------------------
// Puppeteer Scraper for .m3u8 (handles dynamic iframe loading)
// ---------------------------------------------------------------------------
async function scrapeM3u8(embedUrl) {
  console.log(`[puppeteer] Launching browser for: ${embedUrl}`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
  );

  // Step 1: Go to the main embed page
  await page.goto(embedUrl, { waitUntil: "networkidle2", timeout: 30000 });

  // Step 2: Wait for iframe#player_iframe to be inserted by JS (max 15s)
  try {
    await page.waitForSelector("iframe#player_iframe", { timeout: 15000 });
  } catch {
    console.warn("No player_iframe found on page after waiting");
    await browser.close();
    return null;
  }

  const iframeHandle = await page.$('iframe#player_iframe');
  const iframeSrc = await iframeHandle.evaluate(el => el.getAttribute("src"));
  const iframeUrl = iframeSrc.startsWith("http") ? iframeSrc : `https:${iframeSrc}`;

  // Step 3: Navigate to the iframe's actual src
  await page.goto(iframeUrl, { waitUntil: "networkidle2", timeout: 30000 });

  // Step 4: Listen for .m3u8 network requests on this page
  let m3u8Url = null;
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes(".m3u8")) {
      console.log("Found .m3u8 URL:", url);
      m3u8Url = url;
    }
  });

  // Step 5: Wait longer for the player to issue video requests
  await page.waitForTimeout(25000);

  await browser.close();
  return m3u8Url;
}

// ---------------------------------------------------------------------------
// API: /api/video-links
// ---------------------------------------------------------------------------
app.get("/api/video-links", async (req, res) => {
  let { source = "vidsrc", id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  source = String(source).toLowerCase();
  const clean = normalizeId(id);

  let embedUrl;
  if (source === "vidsrc") {
    embedUrl = `https://vidsrc.xyz/embed/movie?imdb=tt${clean}`;
  } else if (source === "vidlink") {
    embedUrl = `https://vidlink.pro/movie/${clean}`;
  } else if (source === "godrive") {
    embedUrl = `https://godriveplayer.com/movie/${clean}`;
  } else {
    return res.status(400).json({ error: "Unknown source" });
  }

  try {
    const m3u8Url = await scrapeM3u8(embedUrl);
    if (!m3u8Url) {
      // Fallback: Return all embed links
      return res.json([
        { quality: "Embed-vidsrc", url: `https://vidsrc.xyz/embed/movie?imdb=tt${clean}` },
        { quality: "Embed-vidlink", url: `https://vidlink.pro/movie/${clean}` },
        { quality: "Embed-godrive", url: `https://godriveplayer.com/movie/${clean}` },
      ]);
    }

    // Fetch M3U8
    const m3u8Resp = await axios.get(m3u8Url, {
      responseType: "text",
      headers: { Referer: embedUrl },
    });

    let variants = parseM3u8ToVariants(m3u8Resp.data, m3u8Url);
    if (!variants.length) variants = [{ quality: "Auto", url: m3u8Url }];

    res.json(variants);
  } catch (err) {
    console.error("Error fetching video links:", err.message);
    res.status(500).json({ error: "Failed to fetch video links." });
  }
});

// ---------------------------------------------------------------------------
// API: /api/download
// ---------------------------------------------------------------------------
app.get("/api/download", async (req, res) => {
  const { url, filename = "video-stream.m3u8" } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const response = await axios.get(url, { responseType: "stream" });
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );
    response.data.pipe(res);
  } catch (err) {
    console.error("Download error:", err.message);
    res.status(500).json({ error: "Download failed." });
  }
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CineSurfs Media Proxy running on http://localhost:${PORT}`);
});
