/* eslint-disable indent */
import React, { useState, useEffect } from "react";
import { inject, observer } from "mobx-react";
import { useContext } from "react";
import {
  getElements,
  highlightElements,
  highlightUnreached,
  runDocumentListeners,
  generatePageObject,
  requestXpathes,
} from "./pageDataHandlers";

import { JDIclasses, getJdiClassName } from "./generationClassesMap";
import { connector, sendMessage } from "./connector";

/*global chrome*/

const autoFindStatus = {
  noStatus: "",
  loading: "Loading...",
  success: "Successful!",
  removed: "Removed",
  error: "An error occured",
};

export const xpathGenerationStatus = {
  noStatus: "",
  started: "XPath generation is running in background...",
  complete: "XPathes generation is successfully completed",
};

const AutoFindContext = React.createContext();

const AutoFindProvider = inject("mainModel")(
  observer(({ mainModel, children }) => {
    const [pageElements, setPageElements] = useState(null);
    const [predictedElements, setPredictedElements] = useState(null);
    const [status, setStatus] = useState(autoFindStatus.noStatus);
    const [allowIdentifyElements, setAllowIdentifyElements] = useState(true);
    const [allowRemoveElements, setAllowRemoveElements] = useState(false);
    const [perception, setPerception] = useState(0.5);
    const [unreachableNodes, setUnreachableNodes] = useState([]);
    const [availableForGeneration, setAvailableForGeneration] = useState([]);
    const [xpathStatus, setXpathStatus] = useState(
      xpathGenerationStatus.noStatus
    );

    connector.onerror = () => {
      setStatus(autoFindStatus.error);
    };

    const clearElementsState = () => {
      setPageElements(null);
      setPredictedElements(null);
      setStatus(autoFindStatus.noStatus);
      setAllowIdentifyElements(true);
      setAllowRemoveElements(false);
      setUnreachableNodes([]);
      setAvailableForGeneration([]);
      setXpathStatus(xpathGenerationStatus.noStatus);
    };

    const toggleElementGeneration = (id) => {
      setPredictedElements((previousValue) => {
        const toggled = previousValue.map((el) => {
          if (el.element_id === id) {
            el.skipGeneration = !el.skipGeneration;
            sendMessage.toggle(el);
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
            sendMessage.hide(el);
          }
          return el;
        });
        return hidden;
      });
    };

    const changeType = ({ id, newType }) => {
      setPredictedElements((previousValue) => {
        const changed = previousValue.map((el) => {
          if (el.element_id === id) {
            el.predicted_label = newType;
            el.jdi_class_name = getJdiClassName(newType);
            sendMessage.changeType(el);
          }
          return el;
        });
        return changed;
      });
    };

    const updateElements = ([predicted, page]) => {
      const rounded = predicted.map((el) => ({
        ...el,
        jdi_class_name: getJdiClassName(el.predicted_label),
        predicted_probability: Math.round(el.predicted_probability * 100) / 100,
      }));
      setPredictedElements(rounded);
      setPageElements(page);
      setAllowRemoveElements(!allowRemoveElements);
    };

    const identifyElements = () => {
      setAllowIdentifyElements(!allowIdentifyElements);
      setStatus(autoFindStatus.loading);
      getElements(updateElements);
    };

    const removeHighlighs = () => {
      const callback = () => {
        clearElementsState();
        setStatus(autoFindStatus.removed);
      };

      sendMessage.killHighlight(null, callback);
    };

    const generateAndDownload = () => {
      generatePageObject(availableForGeneration, mainModel);
    };

    const onChangePerception = (value) => {
      setPerception(value);
    };

    const getPredictedElement = (id) => {
      const element = predictedElements.find((e) => e.element_id === id);
      sendMessage.elementData({
        element,
        types: Object.keys(JDIclasses).map(getJdiClassName),
      });
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
          perception
        );
        setAvailableForGeneration(
          predictedElements.filter(
            (e) =>
              e.predicted_probability >= perception &&
              !e.skipGeneration &&
              !e.hidden
          )
        );
      }
    }, [predictedElements, perception]);

    useEffect(() => {
      if (status === autoFindStatus.success) {
        runDocumentListeners(actions);
      }
    }, [status]);

    useEffect(() => {
      if (!availableForGeneration) return;
      const noXpath = availableForGeneration.filter(
        (element) => !element.xpath
      );
      if (!noXpath.length) return;
      setXpathStatus(xpathGenerationStatus.started);
      requestXpathes(noXpath, ({ xpathElements, unreachableNodes }) => {
        setAvailableForGeneration(xpathElements);
        setUnreachableNodes(unreachableNodes);
        const updated = predictedElements.map((predictedElement) => {
          const xPathEl = xpathElements.find(
            (x) => x.element_id === predictedElement.element_id
          );
          return {
            ...predictedElement,
            ...xPathEl,
          };
        });
        setPredictedElements(updated);
        setXpathStatus(xpathGenerationStatus.complete);
      });
    }, [availableForGeneration]);

    useEffect(() => {
      if (!unreachableNodes.length) return;
      highlightUnreached(unreachableNodes);
    }, [unreachableNodes]);

    const data = [
      {
        pageElements,
        predictedElements,
        status,
        allowIdentifyElements,
        allowRemoveElements,
        perception,
        unreachableNodes,
        availableForGeneration,
        xpathStatus,
      },
      {
        identifyElements,
        removeHighlighs,
        generateAndDownload,
        onChangePerception,
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
