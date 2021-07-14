import React, { useState, useEffect } from "react";
import { inject, observer } from "mobx-react";
import { useContext } from "react";
import {
  getElements,
  highlightElements,
  highlightUnreached,
  removeHighlightFromPage,
  runDocumentListeners,
} from "./pageDataHandlers";
import { generatePageObject } from "./pageDataHandlers";
import { getPageId, runContentScript, insertCSS } from "./pageScriptHandlers";
import { JDIclasses } from "./generationClassesMap";
import { reportProblemPopup } from "./contentScripts/reportProblemPopup/reportProblemPopup";
import { saveJson } from './contentScripts/saveJson';

/*global chrome*/

const autoFindStatus = {
  noStatus: "",
  loading: "Loading...",
  success: "Successful!",
  removed: "Removed",
  error: "An error occured",
};

const AutoFindContext = React.createContext();

const AutoFindProvider = inject("mainModel")(
  observer(({ mainModel, children }) => {
    const [pageElements, setPageElements] = useState(null);
    const [predictedElements, setPredictedElements] = useState(null);
    const [status, setStatus] = useState(autoFindStatus.noStatus);
    const [allowIdetifyElements, setAllowIdetifyElements] = useState(true);
    const [allowRemoveElements, setAllowRemoveElements] = useState(false);
    const [perception, setPerception] = useState(0.5);
    const [unreachableNodes, setUnreachableNodes] = useState(null);

    const clearElementsState = () => {
      setPageElements(null);
      setPredictedElements(null);
      setStatus(autoFindStatus.noStatus);
      setAllowIdetifyElements(true);
      setAllowRemoveElements(false);
      setUnreachableNodes([]);
    };

    const toggleElementGeneration = (id) => {
      setPredictedElements((previousValue) => {
        const toggled = previousValue.map((el) => {
          if (el.element_id === id) {
            el.skipGeneration = !el.skipGeneration;
            getPageId((id) =>
              chrome.tabs.sendMessage(id, {
                message: "HIGHLIGHT_TOGGLED",
                param: el,
              })
            );
          }
          return el;
        });
        return toggled;
      });
    };

    const hideElement = (id) => {
      setPredictedElements((previousValue) => {
        const hidden = previousValue.map((el) => {
          if (el.element_id === id) {
            el.hidden = true;
            getPageId((id) =>
              chrome.tabs.sendMessage(id, {
                message: "HIDE_ELEMENT",
                param: el,
              })
            );
          }
          return el;
        });
        return hidden;
      });
    };

    const changeType = ({id, newType}) => {
      setPredictedElements((previousValue) => {
        const changed = previousValue.map((el) => {
          if (el.element_id === id) {
            el.predicted_label = newType;
            getPageId((id) =>
              chrome.tabs.sendMessage(id, {
                message: "ASSIGN_TYPE",
                param: el,
              })
            );
          }
          return el;
        });
        return changed;
      });
    };

    const reportProblem = (predictedElements) => {
      insertCSS("reportproblempopup.css");
      runContentScript(reportProblemPopup);
      runContentScript(saveJson(JSON.stringify(predictedElements)));
    };

    const identifyElements = () => {
      setAllowIdetifyElements(!allowIdetifyElements);
      setStatus(autoFindStatus.loading);

      const updateElements = ([predicted, page]) => {
        const rounded = predicted.map((el) => ({
          ...el,
          predicted_probability:
            Math.round(el.predicted_probability * 100) / 100,
        }));
        setPredictedElements(rounded);
        setPageElements(page);        
        setAllowRemoveElements(!allowRemoveElements);
      };

      getElements(updateElements);
    };

    const removeHighlighs = () => {
      const callback = () => {
        clearElementsState();
        setStatus(autoFindStatus.removed);
      };

      removeHighlightFromPage(callback);
    };

    const generateAndDownload = (perception) => {
      generatePageObject(predictedElements, perception, mainModel, (result) => {
        setUnreachableNodes(result.unreachableNodes);
        highlightUnreached(result.unreachableNodes);
      });
    };

    const onChangePerception = (value) => {
      setPerception(value);
    };

    const getPredictedElement = (id) => {
      const element = predictedElements.find((e) => e.element_id === id);
      getPageId((id) =>
        chrome.tabs.sendMessage(id, {
          message: "ELEMENT_DATA",
          param: { element, types: Object.keys(JDIclasses) },
        })
      );
    };

    const actions = {
      GET_ELEMENT: getPredictedElement,
      TOGGLE_ELEMENT: toggleElementGeneration,
      HIGHLIGHT_OFF: clearElementsState,
      REMOVE_ELEMENT: hideElement,
      CHANGE_TYPE: changeType,
    };

    useEffect(() => {
      if (predictedElements) {
        highlightElements(
          predictedElements,
          () => setStatus(autoFindStatus.success),
          perception,
          () => setStatus(autoFindStatus.error)
        );
      }
    }, [predictedElements, perception]);

    useEffect(() => {
      if (status === autoFindStatus.success) {
        runDocumentListeners(actions);
      }
    }, [status]);

    const data = [
      {
        pageElements,
        predictedElements,
        status,
        allowIdetifyElements,
        allowRemoveElements,
        perception,
        unreachableNodes,
      },
      {
        identifyElements,
        removeHighlighs,
        generateAndDownload,
        onChangePerception,
        reportProblem,
      },
    ];

    return (
      <AutoFindContext.Provider value={data}>
        {children}
      </AutoFindContext.Provider>
    );
  })
);

const useAutoFind = () => {
  const context = useContext(AutoFindContext);
  if (context === void 0) {
    throw new Error("useAutoFind can only be used inside AutoFindProvider");
  }
  return context;
};

export { AutoFindProvider, useAutoFind };
