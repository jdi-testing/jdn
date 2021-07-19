import { connector, sendMessage } from "./connector";
import { runContextMenu } from "./contentScripts/contextMenu/contextmenu";
import { generateXpathes } from "./contentScripts/generationData";
import { highlightOnPage } from "./contentScripts/highlight";
import { getPageData } from "./contentScripts/pageData";
import { urlListener } from "./contentScripts/urlListener";
import { getPage, predictedToConvert } from "./pageObject";
import { autoFindStatus } from "./AutoFindProvider";
/* global chrome*/

let documentListenersStarted;
let overlayID;

const removeOverlay = () => {
  if (overlayID) {
    chrome.storage.sync.set({ overlayID });

    connector.attachContentScript(() => {
      chrome.storage.sync.get(["overlayID"], ({ overlayID }) => {
        document.getElementById(overlayID).remove();
      });
    });
  }
};

const clearState = () => {
  documentListenersStarted = false;
  removeOverlay();
};

const uploadElements = async ([{ result }]) => {
  const [payload, length] = result;
  const response = await fetch("http:localhost:5000/predict", {
    method: "POST",
    body: payload,
  });

  if (response.ok) {
    const r = await response.json();
    return [r, length];
  } else {
    throw new Error(response);
  }
};

const setUrlListener = (onHighlightOff) => {
  connector.onTabUpdate(() => {
    clearState();
    onHighlightOff();
  });

  connector.attachContentScript(urlListener);
};

export const getElements = (callback, setStatus) => {
  const pageAccessTimeout = setTimeout(() => {
    setStatus(autoFindStatus.blocked);
  }, 5000 );

  connector.updateMessageListener((payload) => {
    if (payload.message === "START_COLLECT_DATA") {
      clearTimeout(pageAccessTimeout);
      setStatus(autoFindStatus.loading);
      overlayID = payload.param.overlayID;
    }
  });

  return connector.attachContentScript(getPageData)
      .then(uploadElements)
      .then((data) => {
        removeOverlay();
        callback(data);
      });
};

export const highlightElements = (elements, successCallback, perception) => {
  const setHighlight = () => {
    sendMessage.setHighlight({ elements, perception });
    successCallback();
  };

  connector.attachContentScript(highlightOnPage).then(() =>
    connector.createPort().then(setHighlight)
  );
};

const messageHandler = ({ message, param }, actions) => {
  if (actions[message]) {
    actions[message](param);
  }
};

export const runDocumentListeners = (actions) => {
  connector.updateMessageListener((payload) =>
    messageHandler(payload, actions)
  );

  if (!documentListenersStarted) {
    setUrlListener(actions["HIGHLIGHT_OFF"]);
    connector.attachContentScript(runContextMenu);
    documentListenersStarted = true;
  }
};

export const requestXpathes = (elements, callback) => {
  connector
      .attachContentScript(generateXpathes)
      .then(() => sendMessage.generateXpathes(elements, callback));
};

export const generatePageObject = (elements, mainModel) => {
  const elToConvert = predictedToConvert(elements);
  getPage(elToConvert, (page) => {
    mainModel.conversionModel.genPageCode(page, mainModel, true);
    mainModel.conversionModel.downloadPageCode(page, ".java");
  });
};

export const highlightUnreached = (ids) => {
  connector.port.postMessage({
    message: "HIGHLIGHT_ERRORS",
    param: ids,
  });
};
