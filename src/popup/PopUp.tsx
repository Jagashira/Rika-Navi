import React, { useState, useEffect } from "react";
import { onAuthStateChanged, auth, type User } from "../_lib/firebase";

const LETUS_LOGIN_URL = "https://letus.ed.tus.ac.jp/auth/shibboleth/index.php";

function Popup() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // 拡張機能のログイン処理を開始
    chrome.runtime.sendMessage({ type: "START_LOGIN" });
  };

  const handleOpenLetusLogin = () => {
    // LETUSのログインページを新しいタブで開く
    chrome.tabs.create({ url: LETUS_LOGIN_URL });
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // --- UI部分 ---

  if (loading) {
    return (
      <div className="w-[320px] h-[150px] flex justify-center items-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // 未ログイン時のUI
  if (!user) {
    return (
      <div className="w-[320px] p-4 flex flex-col items-center justify-center text-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Rika Navi</h2>
        <p className="text-sm text-gray-600 mb-4">
          LETUSの課題を管理するには、
          <br />
          まずLETUSにログインしてください。
        </p>
        <button
          onClick={handleOpenLetusLogin}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors mb-2"
        >
          LETUS ログインページへ
        </button>
        <p className="text-xs text-gray-500">
          ログイン後、再度このポップアップを開き、
          <br />
          「Googleで連携」をクリックしてください。
        </p>
        <button
          onClick={handleLogin}
          className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 transition-colors mt-2"
        >
          Googleアカウントで連携
        </button>
      </div>
    );
  }

  // ログイン済みのUI
  return (
    <div className="w-[320px] p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="User"
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <div>
            <p className="font-bold text-gray-800">{user.displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white font-bold py-1 px-3 rounded text-sm hover:bg-red-600 transition-colors"
        >
          ログアウト
        </button>
      </div>
      {/* 今後ここに課題リストなどを表示していく */}
      <div className="text-center text-gray-400 mt-6">
        <p>（課題リストはここに表示されます）</p>
      </div>
    </div>
  );
}

export default Popup;
