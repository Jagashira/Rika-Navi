export const consoleError = (message: string) => {
  chrome.runtime.sendMessage({
    type: "CONSOLE_LOG",
    message: "[Error] " + message,
  });
};

export const consoleLog = (message: string) => {
  chrome.runtime.sendMessage({
    type: "CONSOLE_LOG",
    message: "[Log] " + message,
  });
};
