import React, { useState, useEffect } from "react";
import type { RuntimeMessage, Kadai } from "../types/types";

function Popup() {
  const [tasks, setTasks] = useState<Kadai[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_KADAI_DATA" });

    const handleMessage = (message: RuntimeMessage) => {
      if (message.type === "KADAI_DATA_UPDATED") {
        setTasks(message.data);
        setLoading(false);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleFetchClick = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "TEST_FETCH" });
  };

  return (
    <div style={{ width: "300px", padding: "10px" }}>
      <h1>直近の課題</h1>
      <button onClick={handleFetchClick} disabled={loading}>
        {loading ? "更新中..." : "手動で課題を更新"}
      </button>
      <hr style={{ margin: "10px 0" }} />
      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <li
                key={index}
                style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}
              >
                <strong>{task.title}</strong>
                <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                  {task.deadline}
                </p>
              </li>
            ))
          ) : (
            <li>課題は見つかりませんでした。</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default Popup;
