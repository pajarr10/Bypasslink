import process from "node:process";

const API = "https://trw.lat/api/bypass";
const API_KEY = "TRW_FREE-GAY-15a92945-9b04-4c75-8337-f2a6007281e9";
const INPUT = process.argv.slice(2).join(" ") || "https://linkvertise.com/519136/resource-pack-hd?o=sharing";

function parseResult(result) {
  if (typeof result !== "string") return result;

  const tupleMatch = result.match(/^\(['"](.+?)['"],\s*(True|False)\)$/);
  if (tupleMatch) return tupleMatch[1];

  const quoteMatch = result.match(/^["'](.+?)["']$/);
  if (quoteMatch) return quoteMatch[1];

  return result;
}

export async function bypass(url) {
  const targetUrl = url || INPUT;
  const apiUrl = new URL(API);
  apiUrl.searchParams.set("apikey", API_KEY);
  apiUrl.searchParams.set("url", targetUrl);

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "accept": "*/*",
      "origin": "https://bypassunlock.com",
      "referer": "https://bypassunlock.com/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "\"Android\"",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      "accept-language": "id-ID,id;q=0.9",
      "priority": "u=1, i"
    }
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw {
      code: response.status,
      message: text || response.statusText
    };
  }

  if (!response.ok || !data.success || !data.result) {
    throw {
      code: response.status,
      message: data.message || data.error || "Bypass failed",
      raw: data
    };
  }

  return {
    Status: true,
    Code: response.status,
    Input: targetUrl,
    Result_url: parseResult(data.result)
  };
}

// CLI compatibility when run directly via node
if (import.meta.url === `file://${process.argv[1]}`) {
  bypass(INPUT)
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.log(JSON.stringify({
        Status: false,
        Code: error.code || 500,
        Input: INPUT,
        Result_url: null,
        Error: error.message || String(error),
        Raw: error.raw || null
      }, null, 2));
    });
}

export default bypass;
