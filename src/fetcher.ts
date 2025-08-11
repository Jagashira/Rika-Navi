//Analyze and fetch Kadai data from LETUS
import { consoleError } from "./_lib/consoleLog";
import { scrapeKadaiFromDocument } from "./_lib/scrapeKadai";
import type { Kadai } from "./types/types";

async function fetcher() {
  console.log("Fetcher: 課題ページの取得と解析を開始します。");

  //get my Kadai from LETUS
  const kadaiList: Kadai[] = await scrapeKadaiFromDocument(60).catch(
    (error) => {
      consoleError("Fetcher: 課題ページの取得に失敗:" + error.message);
      return [];
    }
  );

  //send the fetched data to background
  chrome.runtime
    .sendMessage({
      type: "SAVE_KADAI_DATA_FROM_FETCHER",
      data: kadaiList,
      time: new Date().toISOString(),
      error: null,
    })
    .catch((e) =>
      console.error("Fetcher: Error sending successful data message:", e)
    );
}

fetcher();
