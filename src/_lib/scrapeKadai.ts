import type { Kadai } from "../types/types";
import { consoleError, consoleLog } from "./consoleLog";

const DASHBOARD_URL = "https://letus.ed.tus.ac.jp/my/";
export async function scrapeKadaiFromDocument(
  durationDay: number
): Promise<Kadai[]> {
  try {
    /*
    ここにログインチェックを入れる
    */

    //get sessKey
    const dashboardResponse = await fetch(DASHBOARD_URL);
    const htmlText = await dashboardResponse.text();

    const sesskeyMatch = htmlText.match(/"sesskey":"([A-Za-z0-9]+)"/);
    if (!sesskeyMatch || !sesskeyMatch[1]) {
      consoleError("ScrapeKadai: sesskeyが見つかりません。処理を中断します。");
      throw new Error("Could not find sesskey.");
    }
    const sesskey = sesskeyMatch[1];

    //get Kadai data from LETUS API
    const apiUrl = `https://letus.ed.tus.ac.jp/lib/ajax/service.php?sesskey=${sesskey}&info=core_calendar_get_action_events_by_timesort`;

    const nowTimestamp = Math.floor(Date.now() / 1000);
    const defaultDuration = 30 * 24 * 60 * 60;
    const duration = durationDay * 24 * 60 * 60 || defaultDuration;

    const payload = [
      {
        index: 0,
        methodname: "core_calendar_get_action_events_by_timesort",
        args: {
          timesortfrom: nowTimestamp,
          timesortto: nowTimestamp + duration,
        },
      },
    ];

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const apiData = await apiResponse.json();
    if (apiData[0]?.error) {
      consoleError("ScrapeKadai: APIエラー:" + apiData[0].error.message);
      throw new Error(`API Error: ${apiData[0].error.message}`);
    }

    const events = apiData[0]?.data?.events || [];
    const kadaiList: Kadai[] = events.map((event: any) => {
      const courseName = event.course.fullname
        .replace(/\s*\([^)]*\)$/, "")
        .trim();

      return {
        id: event.course.id + "-" + event.instance,
        title: event.name.replace("」の提出期限", "」"),
        courseUrl: event.url,
        deadline: new Date(event.timestart * 1000).toISOString(),
        courseName: courseName,
      };
    });
    consoleLog(
      `ScrapeKadai: ${JSON.stringify(kadaiList)}件の課題を見つけました。`
    );

    return kadaiList;
  } catch (error) {
    consoleError("Fetcher: APIリクエスト中にエラー:" + error);
    return [];
  }
}
