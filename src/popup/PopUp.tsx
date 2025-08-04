import { useState, useEffect } from "react";
import { onAuthStateChanged, auth, type User } from "../_lib/firebase";
import type { Kadai, RuntimeMessage, SignInResponse } from "../types/types";
import { formatDeadline } from "../_lib/formatDate";
import { KadaiItem } from "./_conponents/KadaiList";

const LETUS_LOGIN_URL = "https://letus.ed.tus.ac.jp/auth/shibboleth/index.php";

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.399 12.38C34.331 8.79 29.49 6.5 24 6.5C13.254 6.5 4.5 15.254 4.5 26S13.254 45.5 24 45.5s19.5-8.746 19.5-19.5c0-1.334-.132-2.634-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039L38.399 12.38C34.331 8.79 29.49 6.5 24 6.5C16.318 6.5 9.771 10.338 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 45.5c5.491 0 10.331-2.29 13.694-6.118l-6.571-4.819C29.039 38.846 26.685 40.5 24 40.5c-5.045 0-9.346-2.608-11.694-6.418l-6.571 4.819C9.771 41.162 16.318 45.5 24 45.5z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.572 4.82c3.515-3.265 5.81-7.973 5.81-13.391c0-1.334-.132-2.634-.389-3.917z"
    />
  </svg>
);

function Popup() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Kadai[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        console.log("Popup: User logged in, requesting cached KADAI_DATA.");
        setIsTaskLoading(true);
        chrome.runtime.sendMessage({
          type: "GET_KADAI_DATA_FROM_CHROME_STORAGE",
        });
      } else {
        setTasks([]);
        setLastFetchTime(null);
        setIsTaskLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleMessage = (message: RuntimeMessage) => {
      if (message.type === "KADAI_DATA_UPDATED") {
        console.log("Popup: Received KADAI_DATA_UPDATED.", message.data);
        setTasks(message.data || []);
        setLastFetchTime(message.time || null);
        setIsTaskLoading(false);
        if (message.error) {
          console.error(
            "Popup: KADAI_DATA_UPDATED with error:",
            message.error.message
          );
        }
      } else if (message.type === "SIGN_IN_RESPONSE") {
        console.log("Popup: Received SIGN_IN_RESPONSE.", message);
        if (message.user) {
          setUser(message.user);
          // chrome.runtime.sendMessage({ type: "GET_KADAI_DATA_FROM_CHROME_STORAGE" });
        } else if (message.error) {
          console.error("Popup: Sign-in failed:", message.error.message);
          alert(`サインインに失敗しました: ${message.error.message}`);
          setUser(null);
        }
        setLoading(false);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const response: SignInResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "SIGN_IN" }, (res) => {
          resolve(res);
        });
      });

      if (response.user) {
        console.log(
          "Popup: Sign-in request sent, user will be set by onAuthStateChanged."
        );
      } else if (response.error) {
        console.error("Popup: Sign-in process error:", response.error.message);
        alert(
          `サインイン処理中にエラーが発生しました: ${response.error.message}`
        );
        setUser(null);
      }
    } catch (error: any) {
      console.error("Popup: Error sending SIGN_IN message:", error);
      alert(`サインインエラー: ${error.message}`);
      setUser(null);
    } finally {
      // setLoading(false);
    }
  };

  const handleOpenLetusLogin = () => {
    chrome.tabs.create({ url: LETUS_LOGIN_URL });
  };

  const handleLogout = async () => {
    await auth.signOut();
    console.log("Popup: User logged out.");
  };

  const handleManualFetch = async () => {
    console.log("Popup: Manual fetch requested.");
    setIsTaskLoading(true);
    setTasks([]);
    setLastFetchTime(null);

    try {
      await chrome.runtime.sendMessage({ type: "MANUAL_FETCH_REQUEST" });
      console.log(
        "Popup: MANUAL_FETCH_REQUEST sent. Waiting for KADAI_DATA_UPDATED."
      );
    } catch (error: any) {
      console.error("Popup: Error sending MANUAL_FETCH_REQUEST:", error);
      setIsTaskLoading(false);
      alert(`課題の更新に失敗しました: ${error.message}`);
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "未取得";
    return new Date(isoString).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="w-[320px] h-[180px] flex flex-col justify-center items-center bg-white rounded-lg shadow-lg p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-b-blue-700 border-gray-200 mb-4"></div>
        <p className="text-gray-600 font-semibold text-base">
          認証状態を確認中...
        </p>
        <p className="text-gray-400 text-xs mt-1">少々お待ちください</p>
      </div>
    );
  }

  // 未ログイン時
  if (!user) {
    return (
      <div className="w-[320px] p-6 flex flex-col items-center justify-center text-center bg-white rounded-lg shadow-xl border border-gray-100">
        <img
          src="/icons/icon_128.png"
          alt="Rika Navi Icon"
          className="w-16 h-16 mb-4"
        />{" "}
        {/* アイコンを追加 */}
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
          Rika Navi へようこそ
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-6">
          LETUSの課題をスマートに管理し、見逃しを防ぎます。
          <br />
          開始するには、LETUSにログインし、Googleアカウントで連携してください。
        </p>
        <button
          onClick={handleOpenLetusLogin}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md mb-3 text-base"
        >
          LETUS ログインページへ
        </button>
        <div className="relative w-full my-4">
          <hr className="border-gray-300" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500 text-xs">
            または
          </span>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 shadow-md flex items-center justify-center text-base border border-gray-200"
        >
          <GoogleIcon />
          <span>Googleアカウントで連携</span>
        </button>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          ※
          ログイン後、再度このポップアップを開き、上記の連携ボタンをクリックしてください。
        </p>
      </div>
    );
  }

  // ログイン済み
  return (
    <div className="w-[350px] p-4 bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h1 className="text-lg font-bold">Rika Navi</h1>
        <button
          onClick={handleManualFetch}
          disabled={loading}
          className="text-xl p-1 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
          title="手動更新"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </header>

      {/* {letusLoginStatus === 'LOGGED_OUT' && (
        <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          {/* ... 未ログイン時の警告表示 ... 
        </div>
      )} */}

      <main className="mt-3">
        <div className="text-xs text-slate-400 text-right mb-2">
          最終更新: {formatTime(lastFetchTime)}
        </div>

        {loading && tasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            課題を更新中...
          </p>
        ) : (
          <ul className="list-none p-0 space-y-2 max-h-[400px] overflow-y-auto">
            {tasks.length > 0 ? (
              tasks.map((task, index) => <KadaiItem key={index} task={task} />)
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                課題データがありません。
                <br />
                手動更新ボタンを押してください。
              </p>
            )}
          </ul>
        )}
      </main>
    </div>
    // <div className="w-[350px] p-4 bg-slate-50">
    //   <header className="flex items-center justify-between pb-3 border-b border-slate-200">
    //     <div className="flex items-center">
    //       {user.photoURL && (
    //         <img
    //           src={user.photoURL}
    //           alt="User"
    //           className="w-9 h-9 rounded-full mr-3"
    //         />
    //       )}
    //       <div>
    //         <p className="font-bold text-sm text-slate-800 leading-tight">
    //           {user.displayName}
    //         </p>
    //         <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
    //       </div>
    //     </div>
    //     <button
    //       onClick={handleLogout}
    //       className="text-xs text-slate-500 hover:text-red-600 hover:underline transition-colors"
    //     >
    //       ログアウト
    //     </button>
    //   </header>

    //   <main className="mt-3">
    //     <div className="flex justify-between items-center mb-2">
    //       <h3 className="text-base font-bold text-slate-700">直近の課題</h3>
    //       <button
    //         onClick={handleManualFetch}
    //         disabled={isTaskLoading}
    //         className="text-xl p-1 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50"
    //         title="手動更新"
    //       >
    //         {isTaskLoading ? "⏳" : "🔄"}
    //       </button>
    //     </div>

    //     <div className="text-xs text-slate-400 text-right -mt-2 mb-2">
    //       {isTaskLoading ? null : `最終更新: ${formatTime(lastFetchTime)}`}
    //     </div>

    //     {isTaskLoading ? (
    //       <p className="text-sm text-slate-400 text-center py-4">更新中...</p>
    //     ) : (
    //       <ul className="list-none p-0 space-y-2">
    //         {tasks.length > 0 ? (
    //           tasks.map((task, index) => (
    //             <li
    //               key={index} // キーはユニークなIDを使用するのがベスト（例: task.id）
    //               className="text-left bg-white p-2 rounded-md shadow-sm border border-slate-100"
    //             >
    //               <strong className="text-sm text-slate-900">
    //                 {task.title}
    //               </strong>
    //               <p className="m-0 text-xs text-slate-500">
    //                 {formatDeadline(task.deadline)}
    //               </p>
    //             </li>
    //           ))
    //         ) : (
    //           <p className="text-sm text-slate-400 text-center py-4">
    //             課題は見つかりませんでした。
    //           </p>
    //         )}
    //       </ul>
    //     )}
    //   </main>
    // </div>
  );
}

export default Popup;
