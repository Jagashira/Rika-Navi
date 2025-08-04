export function parseLetusDate(dateString: string): string {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // 時刻部分を抽出 (例: "18:00")
  const timeMatch = dateString.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return dateString;
  }
  const [, hour, minute] = timeMatch;

  if (dateString.includes("本日")) {
    //
  } else if (dateString.includes("明日")) {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    year = tomorrow.getFullYear();
    month = tomorrow.getMonth();
    day = tomorrow.getDate();
  } else {
    const dateMatch = dateString.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (dateMatch) {
      const [, parsedYear, parsedMonth, parsedDay] = dateMatch;
      year = parseInt(parsedYear, 10);
      month = parseInt(parsedMonth, 10) - 1;
      day = parseInt(parsedDay, 10);
    } else {
      return dateString;
    }
  }

  const jstDate = new Date(
    year,
    month,
    day,
    parseInt(hour, 10),
    parseInt(minute, 10)
  );

  if (isNaN(jstDate.getTime())) {
    return dateString;
  }

  return jstDate.toISOString();
}

export function getDeadlineFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    const timestampString = url.searchParams.get("time");

    if (timestampString) {
      const timestampInMs = parseInt(timestampString, 10) * 1000;
      return new Date(timestampInMs).toISOString();
    }
    return null;
  } catch (error) {
    console.error("URLの解析に失敗:", error);
    return null;
  }
}

export const formatDeadline = (deadline: string) => {
  const isISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(deadline);
  if (isISO) {
    const date = new Date(deadline);
    const now = new Date();
    const diffMilliseconds = date.getTime() - now.getTime();
    const diffHours = diffMilliseconds / (1000 * 60 * 60);

    let timeRemaining = "";

    if (diffHours < 0) {
      timeRemaining = " (期限切れ)";
    } else if (diffHours < 24) {
      timeRemaining = ` (残り${Math.floor(diffHours)}時間)`;
    } else {
      const days = Math.floor(diffHours / 24);
      const hours = Math.floor(diffHours % 24);

      if (hours === 0) {
        timeRemaining = ` (あと約${days}日)`;
      } else {
        timeRemaining = ` (あと約${days}日${hours}時間)`;
      }
    }

    return (
      date.toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }) + timeRemaining
    );
  }
  return deadline;
};
