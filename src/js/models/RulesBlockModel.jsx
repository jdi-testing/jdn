import {action, observable} from "mobx";
import {saveAs} from "file-saver";
import Log from "./Log";
import HtmlRules from "../json/HtmlRules";

export default class RulesBlockModel {
  @observable rules;
  rulesStorageName = "JDNElementRules";
  @observable elementFields = {};
  @observable log = {};
  @observable registeredRules = [ HtmlRules ];

  commonFields = {
    //		"Name": "TextField",
    //		"Type": "Combobox",
    parent: "internal",
    parentId: "internal",
    elId: "internal",
  };

  getRules() {
    return this.registeredRules.find((r) => r.Name.toLowerCase() === this.rules.Name.toLowerCase());
  }


  constructor() {
    const rulesStorage = window.localStorage;
    const rulesFromStorage = rulesStorage.getItem(this.rulesStorageName);
    this.log = new Log();

    if (rulesFromStorage) {
      this.rules = JSON.parse(rulesFromStorage);
    } else {
      if (!this.rules) {
        this.rules = HtmlRules;
      }
      const json = JSON.stringify(this.getRules());
      this.rules = JSON.parse(json);
      rulesStorage.setItem(this.rulesStorageName, json);
    }

    const composites = Object.keys(this.rules.CompositeRules);
    const complex = Object.keys(this.rules.ComplexRules);
    const simple = Object.keys(this.rules.SimpleRules);

    simple.forEach((rule) => {
      this.elementFields[rule] = {
        ...this.commonFields,
        Locator: "TextField",
      };
    });

    composites.forEach((rule) => {
      this.elementFields[rule] = {
        ...this.commonFields,
        Locator: "TextField",
        isSection: "internal",
        expanded: "internal",
        children: "internal",
      };
      if (rule.toLowerCase() === "form") {
        this.elementFields[rule].Entity = "TextField";
      }
    });

    complex.forEach((rule) => {
      this.elementFields[rule] = {
        ...this.commonFields,
        Root: "TextField",
      };
      if (rule.toLowerCase().includes("table")) {
        this.elementFields[rule] = {
          ...this.elementFields[rule],
          ...{
            Headers: "TextField",
            RowHeaders: "TextField",
            Header: "TextField",
            RowHeader: "TextField",
            Cell: "TextField",
            Column: "TextField",
            Row: "TextField",
            Footer: "TextField",
            Height: "TextField",
            Width: "TextField",
            RowStartIndex: "TextField",
            UseCache: "Checkbox",
            HeaderTypes: "Combobox",
            HeaderTypesValues: [
              "All",
              "Headers",
              "No Headers",
              "Columns Headers",
              "Rows Headers",
            ],
          },
        };
      } else {
        this.elementFields[rule] = {
          ...this.elementFields[rule],
          ...{
            Value: "TextField",
            List: "TextField",
            Expand: "TextField",
            Enum: "TextField",
          },
        };
      }
    });
  }

  // TODO update localStorage if update rules

  @action
  clearRuleStorage() {
    const rulesStorage = window.localStorage;
    rulesStorage.removeItem(this.rulesStorageName);
    const jsonRule = JSON.stringify(this.getRules());
    this.rules = JSON.parse(jsonRule);
    rulesStorage.setItem(this.rulesStorageName, jsonRule);
  }

  @action
  changeListOfAttr(value, index) {
    const copy = this.rules.ListOfSearchAttributes.slice();
    copy[index] = value;
    this.rules.ListOfSearchAttributes = copy;
    this.updateRules();
  }

  @action
  deleteItemFromListOfAttr(index) {
    const copy = this.rules.ListOfSearchAttributes.slice();
    copy.splice(index, 1);
    this.rules.ListOfSearchAttributes = copy;
    this.updateRules();
  }

  @action
  addItemToListOfAttr(value) {
    const copy = this.rules.ListOfSearchAttributes.slice();
    copy.push(value);
    this.rules.ListOfSearchAttributes = copy;
    this.updateRules();
  }

  updateRules() {
    window.localStorage.setItem(this.rulesStorageName, JSON.stringify(this.rules));
  }

  @action
  handleAddRuleItem(value, { ruleSet, title, index }) {
    const currentRules = this.rules[ruleSet][title].slice();
    const rule = currentRules.slice(-1)[0];
    const newRule = {};

    if (rule.Locator || rule.Root) {
      Object.keys(rule).forEach((prop) => {
        newRule[prop] = "";
      });
      newRule.id = rule.id + 1;
      currentRules.push(newRule);
      this.rules[ruleSet][title] = currentRules;
      this.updateRules();
    }
  }

  @action
  handleDeleteRuleItem(value, { ruleSet, title, index }) {
    const currentRules = this.rules[ruleSet][title].slice();
    if (currentRules.length > 1) {
      currentRules.splice(index, 1);
      this.rules[ruleSet][title] = currentRules.slice();
      this.updateRules();
    }
  }

  @action
  handleEditRuleName(value, { ruleSet, title, field, index }) {
    const currentRules = this.rules[ruleSet][title].slice();
    currentRules[index][field] = value;
    this.rules[ruleSet][title][field] = currentRules.slice();
    this.updateRules();
  }

  // TODO edit rule name e.g Button
  // TODO copy rule e.g Button
  // TODO delete rule e.g Button
  // TODO add new rule for unknown item next generation

  downloadCurrentRules() {
    let objToSave = {
      content: JSON.stringify(this.rules, null, "\t"),
      name: this.rules.Name + "Rules.json",
    };
    if (objToSave.content && objToSave.name) {
      let blob = new Blob([objToSave.content], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, objToSave.name);
    }
  }

  @action
  importRules(file, mainModel) {
    this.log.clearLog();

    function setRightIndex(ruleset) {
      for (let rules in ruleset) {
        if ({}.hasOwnProperty.call(ruleset, rules)) {
          ruleset[rules] = ruleset[rules].slice().map((rule, index) => {
            rule.id = index;
            return rule;
          });
        }
      }
    }

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
            const newRules = JSON.parse(contents);

            if (!newRules.ListOfSearchAttributes) {
              newRules.ListOfSearchAttributes = [];
            }
            if (!newRules.SimpleRules) {
              newRules.SimpleRules = {};
            } else {
              setRightIndex(newRules.SimpleRules);
            }
            if (!newRules.ComplexRules) {
              newRules.ComplexRules = {};
            } else {
              setRightIndex(newRules.ComplexRules);
            }
            if (!newRules.CompositeRules) {
              newRules.CompositeRules = {};
            } else {
              setRightIndex(newRules.CompositeRules);
            }
            this.rules = newRules;
            this.updateRules();
            this.log.addToLog({
              message: `Success! New rules uploaded`,
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
}
