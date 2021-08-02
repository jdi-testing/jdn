import { connector, sendMessage } from "./connector";
import { runContextMenu } from "./contentScripts/contextMenu/contextmenu";
import { getGenerationAttributes } from "./contentScripts/generationData";
import { highlightOnPage } from "./contentScripts/highlight";
import { getPageData } from "./contentScripts/pageData";
import { urlListener } from "./contentScripts/urlListener";
import { getPage, predictedToConvert } from "./pageObject";

/* global chrome*/

let documentListenersStarted;

const clearState = () => {
  documentListenersStarted = false;
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

export const getElements = (callback) => {
  return connector.attachContentScript(getPageData)
    .then(uploadElements)
    .then(callback);
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

const requestGenerationAttributes = async (elements) => {
  await connector.attachContentScript(getGenerationAttributes);

  return new Promise((resolve) => {
    sendMessage.generateAttributes(elements, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
      }
      if (response) {
        resolve(response);
      } else resolve(false);
    });
  })
}

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

export const requestXpathes = async (elements) => {
  const documentResult = await connector.attachContentScript(
    (() => JSON.stringify(document.documentElement.innerHTML))
  );

  const document = await documentResult[0].result;
  const ids = elements.map(el => el.element_id);

  const xPathResponse = await fetch("http:localhost:5000/generate_xpath", {
    method: "POST",
    body: JSON.stringify({
      ids,
      document,
    }),
  });

  if (xPathResponse.ok) {
    const xPathes = await xPathResponse.json();
    const r = elements.map(el => ({ ...el, xpath: xPathes[el.element_id] }));
    const unreachableNodes = r.filter(el => !el.xpath);
    return { xpathes: r.filter(el => !!el.xpath), unreachableNodes };
  } else {
    throw new Error(response);
  }
};

export const requestGenerationData = async (elements, callback) => {
  const { xpathes, unreachableNodes } = await (await requestXpathes(elements));
  const generationAttributes = await requestGenerationAttributes(elements);
  const generationData = xpathes.map(el => {
    const attr = generationAttributes.find(g => g.element_id === el.element_id);
    return {
      ...el,
      ...attr,
    }
  });
  callback({ generationData, unreachableNodes });
}

export const generatePageObject = (elements, mainModel) => {
  const elToConvert = predictedToConvert(elements);
  getPage(elToConvert, (page) => {
    mainModel.conversionModel.genPageCode(page, mainModel, true);
    mainModel.conversionModel.downloadPageCode(page, ".java");
  });
};
