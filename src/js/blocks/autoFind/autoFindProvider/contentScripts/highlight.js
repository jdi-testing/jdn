/*
    avoid using any outer scope variables inside this function
 */
/* global chrome */
export const highlightOnPage = () => {
  let highlightElements = [];
  let isHighlightElementsReverse = false;
  let port;

  const isInViewport = (element) => {
    const { top, right, bottom, left } = element.getBoundingClientRect();

    // at least a part of an element should be in the viewport
    const val =
      ((top >= 0 && top <= window.innerHeight) ||
        (bottom > 0 && bottom < window.innerHeight)) &&
      ((left >= 0 && left < window.innerWidth) ||
        (right >= 0 && right < window.innerWidth));

    return val;
  };

  const toggleElement = (element) => {
    const div = document.getElementById(element.element_id);
    div.className = `jdn-highlight ${element.skipGeneration ? 'jdn-secondary' : 'jdn-primary'}`;
  };

  const removeElement = (element) => {
    predictedElements.find((e) => {
      if (e.element_id === element.element_id) e.hidden = element.hidden;
    });

    const div = document.getElementById(element.element_id);
    div.remove();
  };

  const assignType = (element) => {
    const div = document.getElementById(element.element_id);
    div.querySelector(".jdn-class").textContent = element.jdi_class_name;
  };

  const drawRectangle = (
    element,
    { element_id, jdi_class_name, predicted_probability }
  ) => {
    const divDefaultStyle = (rect) => {
      const { top, left, height, width } = rect || {};
      return rect
        ? {
          left: `${left + window.pageXOffset}px`,
          top: `${top + window.pageYOffset}px`,
          height: `${height}px`,
          width: `${width}px`,
        }
        : {};
    };

    const div = document.createElement("div");
    div.id = element_id;
    div.className = "jdn-highlight jdn-primary"
    div.setAttribute("jdn-highlight", true);
    div.innerHTML = `<div><span class="jdn-label"><span class="jdn-class">${jdi_class_name}</span> ${predicted_probability}</span></div>`;
    Object.assign(div.style, divDefaultStyle(element.getBoundingClientRect()));

    div.onclick = () => {
      chrome.runtime.sendMessage({
        message: "TOGGLE_ELEMENT",
        param: element_id,
      });
    };

    document.body.appendChild(div);
    highlightElements.push(element);
  };

  let nodes; // not to run querySelector() on every scroll/resize
  let predictedElements;
  let perception;
  const findAndHighlight = (param) => {
    if (param) {
      predictedElements = param.elements;
      perception = param.perception;
    }
    let query = "";
    predictedElements.forEach(({ element_id, hidden }) => {
      if (hidden) return;
      query += `${!!query.length ? ", " : ""}[jdn-hash='${element_id}']`;
    });
    nodes = document.querySelectorAll(query);
    nodes.forEach((element) => {
      if (isInViewport(element)) {
        const hash = element.getAttribute("jdn-hash");
        const highlightElement = document.getElementById(hash);
        const isAbovePerceptionTreshold = predictedElements.find((e) => {
          return hash === e.element_id && e.predicted_probability >= perception;
        });
        if (!!highlightElement && !isAbovePerceptionTreshold) {
          highlightElement.remove();
        } else if (!highlightElement && isAbovePerceptionTreshold) {
          const predicted = predictedElements.find(
            (e) => e.element_id === hash
          );
          drawRectangle(element, predicted, perception);
        }
      }
    });
  };

  let timer;
  const scrollListenerCallback = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      findAndHighlight();
    }, 300);
  };

  const selectAllElementsOnClick = (event) => {
    if (!isHighlightElementsReverse) {
      highlightElements.reverse();
      isHighlightElementsReverse = true;
    }

    let isCurrentElement = false;

    highlightElements.forEach((element) => {
      const { top, right, bottom, left } = element.getBoundingClientRect();

      if (
        event.clientX > left &&
        event.clientX < right &&
        event.clientY > top &&
        event.clientY < bottom
      ) {
        if (!isCurrentElement) {
          isCurrentElement = true;
          return;
        } else {
          document.getElementById(element.getAttribute("jdn-hash")).click();
        }
      }
    });
  };

  const removeHighlightElements = (callback) => {
    if (predictedElements) {
      predictedElements.forEach(({ element_id: elementId }) => {
        const el = document.getElementById(elementId);
        if (el) el.remove();
      });
      highlightElements = [];
      callback();
    }
  };

  const events = ["scroll", "resize"];
  const removeEventListeners = () => {
    events.forEach((eventName) => {
      document.removeEventListener(eventName, scrollListenerCallback);
    });
    document.removeEventListener("click", clickListener);
  };

  const removeHighlight = (callback) => () => {
    removeEventListeners(removeHighlightElements(callback));
  };

  const clickListener = (event) => {
    if (!event.clientX && !event.clientY) return;
    selectAllElementsOnClick(event);
  };

  const setDocumentListeners = () => {
    events.forEach((eventName) => {
      document.addEventListener(eventName, scrollListenerCallback);
    });

    document.addEventListener("click", clickListener);
  };

  const highlightErrors = (ids) => {
    ids.forEach((id) => {
      const div = document.getElementById(id);
      div.onclick = () => { };
      div.className = "jdn-highlight jdn-error";
    });
  };

  const messageHandler = ({ message, param }, sender, sendResponse) => {
    if (message === "SET_HIGHLIGHT") {
      if (!highlightElements.length) setDocumentListeners();
      findAndHighlight(param);
    }

    if (message === "KILL_HIGHLIGHT") {
      removeHighlight(sendResponse)();
    }

    if (message === "HIGHLIGHT_ERRORS") {
      highlightErrors(param);
    }

    if (message === "HIGHLIGHT_TOGGLED") {
      toggleElement(param);
    }

    if (message === "HIDE_ELEMENT") {
      removeElement(param);
    }

    if (message === "ASSIGN_TYPE") {
      assignType(param);
    }

    if (message === "PING_SCRIPT" && (param.scriptName === "highlightOnPage")) {
      sendResponse({ message: true });
    }
  };

  const disconnectHandler = () => {
    removeHighlight(() => console.log("JDN highlight has been killed"))();
  };

  chrome.runtime.onConnect.addListener((p) => {
    port = p;
    port.onDisconnect.addListener(disconnectHandler);
    chrome.runtime.onMessage.addListener(messageHandler);
  });
};
