/*eslint-env browser*/

import {cssToXPath, genRand} from "../utils/helpers";
import {action, observable} from "mobx";
import Log from "./Log";
import {SiteUrls} from "../json/siteUrls";
import {saveAs} from "file-saver";

function isXpath(locator) {
  return locator[1] === "/";
}

function getElementsByXpath(dom, locator) {
  let results = [];
  let result = document.evaluate(
    locator,
    dom,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < result.snapshotLength; i++) {
    results.push(result.snapshotItem(i));
  }
  return results;
}

const getElements = ({ log }, dom, locatorType) => {
  let elements = [];
  try {
    elements = locatorType.xpath
      ? getElementsByXpath(dom, locatorType.locator)
      : dom.querySelectorAll(locatorType.locator);
  } catch (e) {
    log.addToLog({
      message: `Error!: cannot get elements by ${locatorType.locator}`,
      type: "error",
    });
    // objCopy.warningLog = [...objCopy.warningLog, getLog()];
    document.querySelector("#refresh").click();
  }
  return {
    elements,
    locatorType,
  };
};

function generateLocator(xpath, locator) {
  return xpath === isXpath(locator) ? locator : cssToXPath(locator);
}

function getCorrectLocator(dom, locator, uniqueness) {
  let results = {
    xpath:
      isXpath(locator) ||
      isXpath(uniqueness.locator) ||
      uniqueness.value === "text",
    locator: "",
  };
  const genLocator = generateLocator(results.xpath, locator);
  results.locator = genLocator.indexOf("//") === 0
      ? "." + genLocator
      : genLocator;
  if (uniqueness.locator) {
    results.locator += generateLocator(results.xpath, uniqueness.locator);
  }
  return results;
}

function searchByWithoutValue({ log }, dom, locator, uniqueness) {
  let locatorType = getCorrectLocator(dom, locator, uniqueness);
  return getElements({ log }, dom, locatorType);
}

export function PascalCaseTillLast(text, symbol) {
  return PascalCase(text.substring(0, text.lastIndexOf(symbol)));
}

export function PascalCase(text) {
  if (!text) return "";

  let name = "";
  let arrayName = text.split(/[^a-zA-Zа-яёА-ЯЁ0-9]/);
  for (let j = 0; j < arrayName.length; j++) {
    if (arrayName[j]) {
      name += arrayName[j][0].toUpperCase() + arrayName[j].slice(1);
    }
  }
  return name;
}

export function camelCase(text) {
  let name = PascalCase(text);
  return name[0].toLowerCase() + name.slice(1);
}

function nameElement(locator, uniqueness, value, content) {
  if (uniqueness === "text" || uniqueness.includes("#text")) {
    return value || (content.innerText || content.textContent).trim();
  }
  if (uniqueness.includes("tag")) {
    return content.tagName.toLowerCase();
  }
  if (uniqueness.indexOf("[") === 0) {
    return locator.replace(/[\.\/\*\[\]@]/g, "");
  }
  if (uniqueness === "class") {
    return content.classList.value.split(" ")[0];
  }
  return content.getAttribute(uniqueness);
}

function createCorrectXpath(originalLocator, uniqueness, value, locator) {
  let result =
    uniqueness === "text"
      ? `contains(.,'${value /*.split(/\n/)[0]*/}')`
      : `@${uniqueness}='${value}')`;
  if (locator) {
    return `${originalLocator}${locator}${result}`;
  }
  if (originalLocator) {
    if (originalLocator.indexOf("]") === originalLocator.length - 1) {
      return `${originalLocator.slice(0, -1)} and ${result}]`;
    } else {
      return `${originalLocator}[${result}]`;
    }
  } else {
    return `.//*[${result}]`;
  }
}

function valueToXpath(originalLocator, uniqueness, value) {
  if (value) {
    if (uniqueness.locator) {
      return createCorrectXpath(
        originalLocator,
        uniqueness,
        value,
        uniqueness.locator
      );
    }
    if (isXpath(uniqueness.value)) {
      return createCorrectXpath(originalLocator, uniqueness, value);
    } else {
      return createCorrectXpath(originalLocator, uniqueness.value, value);
    }
  }
  return originalLocator;
}

function valueToCss(uniqueness, value) {
  if (value) {
    switch (uniqueness.value) {
      case "class":
        return `.${value.replace(/\s/g, ".")}`;
      case "id":
        return `#${value}`;
      default:
        return `[${uniqueness.value}='${value}']`;
    }
  }
  return "";
}

const checkIfItIsUnique = ({ sections }, element) => {
  let locator = element.Locator || element.Root;
  let check = true;
  if (!element.parentId) {
    sections.forEach((section) => {
      section.children.forEach((child) => {
        let loc = child.Locator || child.Root;
        if (loc === locator) {
          check = false;
        }
      });
    });
  }
  return check;
};

function hashCode(str) {
  if (str === 0) {
    return 0;
  }
  let hash = 0, i, chr;

  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const findInParent = ({ sections, page }, element, parent) => {
  let loc = element.Locator ? "Locator" : "Root";
  //let found = objCopy.sections.find((section) => parent.Locator === section.Locator && parent.Type === section.Type);
  let found, find;
  sections.forEach((value, key) => {
    if (value.elId === parent.elId && value.Name === parent.Name) {
      found = key;
    }
  });

  if (found) {
    let sec = sections.get(found);
    let children = sec.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i][loc] === element[loc]) {
        element.elId = children[i].elId;
        find = true;
        break;
      }
    }
    if (!find) {
      children.push(element);
      sections.set(found, sec);
    }
  }
  page.elements.push(element);
};

const applyFoundResult = ({ mainModel }, e, parent, ruleId) => {
  const { ruleBlockModel, generateBlockModel } = mainModel;
  const rulesObj = ruleBlockModel.rules;
  const composites = Object.keys(rulesObj.CompositeRules);
  const complex = Object.keys(rulesObj.ComplexRules);
  const simple = Object.keys(rulesObj.SimpleRules);

  let element = {
    Name: e.Name || genRand(e.Type),
    Type: e.Type,
    parent: e.parent || null,
    parentId: e.parentId,
    elId: e.elId,
    isList: e.isList
  };
  if (simple.indexOf(e.Type) > -1) {
    element.Locator = e.Locator;
    findInParent(
      { sections: generateBlockModel.sections, page: generateBlockModel.page },
      element,
      parent
    );
    return;
  }
  if (complex.indexOf(e.Type) > -1) {
    let fields = rulesObj.ComplexRules[e.Type].find((r) => r.id === ruleId);
    element.Root = e.Locator;
    for (let f in fields) {
      if (!element.hasOwnProperty(f) && f !== "Root") {
        element[f] = fields[f];
      }
    }
    findInParent(
      { sections: generateBlockModel.sections, page: generateBlockModel.page },
      element,
      parent
    );
    return;
  }
  let fields = ruleBlockModel.elementFields[e.Type];
  if (composites.indexOf(e.Type) > -1) {
    element.Locator = e.Locator;
    element.isSection = true;
    element.children = e.children || [];
    if (e.entityFields) {
      element.entityFields = e.entityFields;
    }
    let found = generateBlockModel.sections.get(element.elId);

    if (found) {
      generateBlockModel.page.elements.push(found.elId);
    } else {
      for (let f in fields) {
        if (!element.hasOwnProperty(f)) {
          element[f] = "";
        }
      }
      generateBlockModel.page.elements.push(element.elId);
      generateBlockModel.sections.set(element.elId, element);
    }
    return;
  }
};

function fillEl({ results, mainModel }, element, type, parent, ruleId, isList = false) {
  const { ruleBlockModel, generateBlockModel } = mainModel;
  const rulesObj = ruleBlockModel.rules;
  const composites = Object.keys(rulesObj.CompositeRules);
  let result = { ...element, Type: type, isList };
  if (composites.includes(type)) {
    result.parent = null;
    result.parentId = null;
    result.elId = hashCode(element.Locator + type);
    results.push(result);
  } else {
    result.parentId = parent.elId;
    result.parent = parent.Name;
    result.elId = genRand("El");
    if (checkIfItIsUnique({ sections: generateBlockModel.sections }, result)) {
      applyFoundResult({ mainModel }, result, parent, ruleId);
    }
  }
}

function getValue(content, uniqueness) {
  switch (uniqueness.value) {
    case "text":
      return (content.innerText || content.textContent).trim().split(/\n/)[0];
    default:
      if (content.attributes[uniqueness.value]) {
        return content.attributes[uniqueness.value].value;
      }
      return;
  }
}

const showEmptyLocator = (mainModel, uniq) => {
  const { ruleBlockModel, settingsModel } = mainModel;

  if (settingsModel.framework === "jdiLight" || settingsModel.framework === "jdiNova") {
    const searchAttributes = ruleBlockModel.rules.ListOfSearchAttributes || [];
    if (searchAttributes.includes(uniq)) {
      return true;
    }
  }
  return false;
};

const isSimpleRule = (type, uniq, mainModel) => {
  const { ruleBlockModel } = mainModel;
  const simples = Object.keys(ruleBlockModel.rules.SimpleRules);

  return simples.includes(type) && showEmptyLocator(mainModel, uniq);
};

const defineElements = ({ results, mainModel }, dom, Locator, uniq, t) => {
  try {
    const {generateBlockModel} = mainModel;
    let uniqueness = getUniqueness(uniq);
    let firstSearch = searchByWithoutValue( {log: generateBlockModel.log}, dom, Locator, uniqueness);
    let isXpath = firstSearch.locatorType.xpath;
    let elements = firstSearch.elements;
    if (elements.length === 0) {
      return [];
    }
    if (uniqueness.value === "tag" || uniqueness.value === "[") {
      generateBlockModel.log.addToLog({
        message: `Warning! Too much elements found by locator ${firstSearch.locatorType.locator}; uniqueness ${uniqueness.value}; ${elements.length} elements`,
        type: "warning",
      });
    }
    const result = [];
    for (let i = 0; i < elements.length; i++) {
      let val = getValue(elements[i], uniqueness, Locator);
      if (!val) continue;
      let finalLocator = getComplexLocator(isXpath, firstSearch.locatorType.locator, uniqueness, val);
      let s2 = getElements({log: generateBlockModel.log}, dom, {
        locator: finalLocator,
        xpath: isXpath,
      });
      if (s2.elements.length === 1) {
        let e = getOneElement(t, uniq, mainModel, finalLocator, s2.elements[0], val);
        if (!showEmptyLocator(mainModel, uniq)) {
          let smallFinalLocator = getComplexLocator(isXpath, "", uniqueness, val);
          let s3 = getElements({log: generateBlockModel.log}, dom, {
            locator: smallFinalLocator,
            xpath: isXpath,
          });
          if (s3.elements.length === 1) {
            e.Locator = smallFinalLocator;
          }
        }
        result.push({ e, isList: false });
      } else {
        let e = {
          Locator: isSimpleRule(t, uniq, mainModel)
            ? `EMPTY_LOCATOR_${finalLocator}`
            : finalLocator,
          content: s2.elements[0],
          Name: nameElement(finalLocator, uniq, val, s2.elements[0]).slice(
            0,
            20
          ),
        };
        result.push({ e, isList: true });
      }
    }
    return result;
  } catch (e) { }
};

function getComplexLocator(isXpath, locator, uniqueness, val) {
  return isXpath
    ? valueToXpath(locator, uniqueness, val)
    : locator + valueToCss(uniqueness, val)
}

function getUniqueness(uniq) {
  let split = uniq.split("#");
  return {
    locator: split.length === 2 ? split[0] : "",
    value: split.length === 2 ? split[1] : uniq,
  };
}

function getOneElement(t, uniq, mainModel, locator, element, val) {
  return {
    Locator: isSimpleRule(t, uniq, mainModel)
      ? `EMPTY_LOCATOR_${locator}`
      : locator,
    // Locator: firstSearch.locatorType.locator,
    content: element,
    Name: camelCase(nameElement(locator, uniq, val, element).slice(0, 30))
  }
}

function getComposite({ mainModel, results }, dom, t) {
  const { ruleBlockModel } = mainModel;
  const rulesObj = ruleBlockModel.rules;
  const relatives = new Map();
  const rules = rulesObj.CompositeRules[t];

  rules.forEach((rule) => {
    if (rule.Locator) {
      const elements = defineElements({ mainModel, results }, dom, rule.Locator, rule.uniqueness, t);
      for (let element of elements) {
        if (rule.entityFields) {
          element.e.entityFields = rule.entityFields;
        }
        fillEl({results, mainModel}, element.e, t, null, rule.id, element.isList)
      }
    }
  });

  for (let k = 0; k < results.length; k++) {
    relatives.set(results[k].elId, 0);
    let child = results[k];
    for (let j = 0; j < results.length; j++) {
      const parent = results[j];
      let r = isXpath(child.Locator)
        ? getElementsByXpath(parent.content, child.Locator)
        : parent.content.querySelectorAll(child.Locator);
      for (let i = 0; i < r.length; i++) {
        if (r[i] === child.content) {
          let v = relatives.get(child.elId);
          relatives.set(child.elId, ++v);
        }
      }
    }
  }

  for (let k = 0; k < results.length; k++) {
    let child = results[k];
    for (let j = 0; j < results.length; j++) {
      const parent = results[j];
      let r = isXpath(child.Locator)
        ? getElementsByXpath(parent.content, child.Locator)
        : parent.content.querySelectorAll(child.Locator);
      for (let i = 0; i < r.length; i++) {
        if (r[i] === child.content) {
          let c = relatives.get(child.elId);
          let p = relatives.get(parent.elId);
          if (c - p === 1) {
            child.parent = parent.Type;
            child.parentId = parent.elId;
          }
        }
      }
    }
  }
}

function getComplex({ mainModel, results }, parent, t) {
  const { ruleBlockModel } = mainModel;
  const rulesObj = ruleBlockModel.rules;

  let dom = parent.content;
  let rules = rulesObj.ComplexRules[t];
  rules.forEach((rule) => {
    if (rule.Root) {
      const elements = defineElements({ mainModel, results }, dom, rule.Root, rule.uniqueness, t);
      for (let element of elements) {
        fillEl({results, mainModel}, element.e, t, parent, rule.id, element.isList)
      }
    }
  });
}

function getSimple({ mainModel, results }, parent, t) {
  const { ruleBlockModel } = mainModel;
  const rulesObj = ruleBlockModel.rules;

  let dom = parent.content;
  let rules = rulesObj.SimpleRules[t];
  rules.forEach((rule) => {
    if (rule.Locator) {
      const elements = defineElements({ mainModel, results }, dom, rule.Locator, rule.uniqueness, t);
      for (let element of elements) {
        fillEl({results, mainModel}, element.e, t, parent, rule.id, element.isList)
      }
    }
  });
}

export const generationCallBack = ({ mainModel }, r, err, generateSeveralPages) => {
  const parser = new DOMParser();
  const rDom = parser.parseFromString(r, "text/html");

  const observedDOM = rDom.body;
  const {
    ruleBlockModel,
    settingsModel,
    conversionModel,
    generateBlockModel,
  } = mainModel;
  const rulesObj = ruleBlockModel.rules;
  const composites = Object.keys(rulesObj.CompositeRules);
  const complex = Object.keys(rulesObj.ComplexRules);
  const simple = Object.keys(rulesObj.SimpleRules);
  const results = [];

  if (err) {
    generateBlockModel.log.addToLog({
      message: `Error, loading data from active page! ${err}`,
      type: "error",
    });
  }

  if (r) {
    composites.forEach((rule) => {
      try {
        getComposite({ mainModel, results }, observedDOM, rule);
      } catch (e) {
        generateBlockModel.log.addToLog({
          message: `Error! Getting composite element: ${e}`,
          type: "error",
        });
      }
    });

    for (let i = 0; i < results.length; i++) {
      let findParent = results.find(
        (section) =>
          section.elId === results[i].parentId && results[i].parentId !== null
      );
      if (findParent) {
        if (findParent.children) {
          findParent.children.push(results[i]);
        } else {
          findParent.children = [];
          findParent.children.push(results[i]);
        }
      }
    }

    results.push({
      Locator: "body",
      Type: null,
      content: observedDOM,
      elId: null,
      parentId: null,
      parent: null,
    });

    for (let i = 0; i < results.length - 1; i++) {
      applyFoundResult({ mainModel }, results[i]);
    }

    for (let i = 0; i < results.length; i++) {
      results[i].content.parentNode.removeChild(results[i].content);
    }

    results.forEach((section) => {
      complex.forEach((rule) => {
        try {
          getComplex({ mainModel, results }, section, rule);
        } catch (e) {
          generateBlockModel.log.addToLog({
            message: `Error! Getting complex element: ${e}`,
            type: "error",
          });
          // objCopy.warningLog = [...objCopy.warningLog, getLog()];
          // document.querySelector('#refresh').click();
        }
      });
    });

    results.forEach((section) => {
      simple.forEach((rule) => {
        try {
          getSimple({ mainModel, results }, section, rule);
        } catch (e) {
          generateBlockModel.log.addToLog({
            message: `Error! Getting simple element: ${e}. Rule ${rule}`,
            type: "error",
          });
          // objCopy.warningLog = [...objCopy.warningLog, getLog()];
          // document.querySelector('#refresh').click();
        }
      });
    });

    const pageAlreadyGenerated = generateBlockModel.pages.find(
      (page) => page.id === generateBlockModel.page.id
    );

    if (!pageAlreadyGenerated) {
      generateBlockModel.pages = [
        ...generateBlockModel.pages,
        { ...generateBlockModel.page },
      ];
      conversionModel.genPageCode(generateBlockModel.page, mainModel);

      if (settingsModel.downloadAfterGeneration && !generateSeveralPages) {
        conversionModel.downloadPageCode(
          generateBlockModel.page,
          mainModel.settingsModel.extension
        );
      }
      generateBlockModel.log.addToLog({
        message: `Success! Generates ${generateBlockModel.page.name}`,
        type: "success",
      });
      mainModel.fillLog(generateBlockModel.log.log);
    }
    // TODO create beautiful popup
  }
};

export const getLocationCallBack = ({ mainModel }, location, title, h1, err) => {
  const {generateBlockModel, settingsModel } = mainModel;
  if (err) {
    generateBlockModel.log.addToLog({
      message: `Error, getting location from active page! ${err}`,
      type: "error",
    });
  }
  const uri = location.pathname + location.hash ?? '';
  generateBlockModel.page.url = uri;
  const hashId = hashCode(uri + title ?? '');
  generateBlockModel.page.id = hashId;
  generateBlockModel.siteInfo.hostName = location.hostname;
  let sitePackage = getSitePackage(location.host);
  generateBlockModel.page.package = sitePackage;
  generateBlockModel.page.libPackage = sitePackage + ".elements";
  generateBlockModel.siteInfo.siteTitle = settingsModel.template.appName
    ? settingsModel.template.appName
    : PascalCaseTillLast(location.hostname, ".");
  generateBlockModel.siteInfo.origin = location.origin;
  generateBlockModel.currentPageId = hashId;
  generateBlockModel.siteInfo.domainName = location.host;
  generateBlockModel.siteInfo.pack = sitePackage;

  if (title) {
    generateBlockModel.page.title = title;
  }
  if (settingsModel.pageName) {
    switch (settingsModel.pageName) {
      case "title":
        if (title) {
          generateBlockModel.page.name = PascalCase(title);
        } else if (h1) {
          generateBlockModel.page.name = PascalCase(h1);
        } else if (location.hash) {
          generateBlockModel.page.name = PascalCase(location.hash);
        } else {
          generateBlockModel.page.name = PascalCase(uri);
        }
        break;
      case "h1":
        if (h1) {
          generateBlockModel.page.name = PascalCase(h1);
        } else if (location.hash) {
          generateBlockModel.page.name = PascalCase(location.hash);
        } else if (title) {
          generateBlockModel.page.name = PascalCase(title);
        } else {
          generateBlockModel.page.name = PascalCase(uri);
        }
        break;
      case "hash":
        if (location.hash) {
          generateBlockModel.page.name = PascalCase(location.hash);
        } else if (h1) {
          generateBlockModel.page.name = PascalCase(h1);
        } else if (title) {
          generateBlockModel.page.name = PascalCase(title);
        } else {
          generateBlockModel.page.name = PascalCase(uri);
        }
        break;
      case "uri":
        generateBlockModel.page.name = PascalCase(uri);
    }
  } else {
    if (title) {
      generateBlockModel.page.name = PascalCase(title);
    }
  }
};

export const getSitePackage = (host) => {
  return host
    ? host.split(".").reverse() .map((e) => e.replace(/[^a-zA-Z0-9]+/g, "")).join(".")
    : ""
};

export default class GenerateBlockModel {
  @observable log;
  @observable sections;
  @observable pages = [];
  @observable page = {
    id: "",
    name: "",
    title: "",
    url: "",
    package: "",
    elements: [],
  };
  @observable siteInfo = {};
  @observable currentPageId;
  @observable urlsList = [];
  @observable exportUrlsList = [];

  constructor() {
    this.log = new Log();
    this.sections = new Map();

    const generateStorage = window.localStorage;
    const urlsListFromStorage = generateStorage.getItem("SiteMapUrlsList");
    this.log = new Log();

    if (urlsListFromStorage) {
      const urlsObject = JSON.parse(urlsListFromStorage);
      this.urlsList = urlsObject.urlsList || [];
    } else {
      this.urlsList = SiteUrls.urlList;
      generateStorage.setItem("SiteMapUrlsList", JSON.stringify(this.urlsList));
    }
    this.exportUrlsList = [];
  }

  addToExportUrlsList(e) {
    if (this.exportUrlsList.indexOf(e) >= 0) {
      this.exportUrlsList = this.exportUrlsList.filter((url) => url !== e);
    } else {
      this.exportUrlsList.push(e);
    }
  }

  clearExportUrlsList() {
    this.exportUrlsList = [];
  }

  @action
  generate(mainModel, callback) {
    this.page = {
      id: "",
      name: "",
      title: "",
      url: "",
      package: "",
      elements: [],
    };

    this.log.clearLog();
    this.processDomCallback(mainModel, callback);
  }

  @action
  clearGeneration() {
    this.sections = new Map();
    this.pages = [];
    this.siteInfo = {};
    this.page = {
      id: "",
      name: "",
      title: "",
      url: "",
      package: "",
      elements: [],
    };
    this.log.clearLog();
  }

  downloadUrlsList() {
    const objToSave = {
      content: JSON.stringify(
        {
          urlsList: this.exportUrlsList,
        },
        null,
        "\t"
      ),
      name: `UrlsListExample.json`,
    };
    if (objToSave.content && objToSave.name) {
      let blob = new Blob([objToSave.content], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, objToSave.name);
    }
  }

  @action
  importUrlList(file, mainModel) {
    this.log.clearLog();

    if (window.File && window.FileReader && window.FileList && window.Blob) {
      try {
        const f = file[0];

        if (!f) {
          return;
        }
        const reader = new FileReader();

        reader.onload = (e) => {
          const contents = e.target.result;
          try {
            const newUrlObject = JSON.parse(contents);
            const generateStorage = window.localStorage;

            this.urlsList = newUrlObject.urlsList || [];
            generateStorage.setItem(
              "SiteMapUrlsList",
              JSON.stringify(newUrlObject)
            );

            this.log.addToLog({
              message: `Success! New url list uploaded`,
              type: "success",
            });
            mainModel.fillLog(this.log.log);
          } catch (e) {
            this.log.addToLog({
              message: `Error occurs parsing json file: ${e}. JSON is invalid. Check import JSON.`,
              type: "error",
            });
            mainModel.fillLog(this.log.log);
          }
        };
        reader.readAsText(f);
      } catch (e) {
        this.log.addToLog({
          message: `Error occurs reading file ${e}.`,
          type: "error",
        });
        mainModel.fillLog(this.log.log);
      }
    } else {
      this.log.addToLog({
        message:
          "Warning! The File APIs are not fully supported in this browser.",
        type: "warning",
      });
      mainModel.fillLog(this.log.log);
    }
  }

  @action
  generateSeveralPages(mainModel) {
    this.clearGeneration();

    const urlList = this.urlsList.slice();

    const getDOMByUrl = async (mainModel, url, index) => {
      this.page = {
        id: "",
        name: "",
        title: "",
        url: "",
        package: "",
        elements: [],
      };

      const callback = function() {
        index++;
        if (index < urlList.length) {
          getDOMByUrl(mainModel, urlList[index], index);
        } else {
          mainModel.conversionModel.zipAllCode(mainModel);
        }
        chrome.devtools.inspectedWindow.eval(
          `window.location='${url}'`,
          (result, err) => {
            setTimeout(() => {
              domReady();
            }, 1000);
          }
        );
      }
      const domReady = () => {
        this.processDomCallback(mainModel, callback);
      };

      // const u = new URL(url);
      //
      // getLocationCallBack({mainModel}, u);
      //
      // const response = await fetch(url);
      // const textDom = await response.text();
      // generationCallBack({ mainModel }, textDom);
      //
      // if (index < urlList.length) {
      // 	await getDOMByUrl(mainModel, urlList[index], index);
      // }
    };

    getDOMByUrl(mainModel, urlList[0], 0);

    // await getDOMByUrl(mainModel, urlList[0], 0);
  }

  processDomCallback(mainModel, callback) {
    chrome.devtools.inspectedWindow.eval(
      "(function () { return { " +
      "'location': document.location," +
      "'title': document.title," +
      "'h1': document.querySelector('h1')?.innerText," +
      "'html': document.lastChild.outerHTML" +
      "}})()",
      (r, err) => {
        getLocationCallBack({ mainModel }, r.location, r.title, r.h1,  err);
        generationCallBack({ mainModel }, r.html, err);
        callback();
      });
  }
}
