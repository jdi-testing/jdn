import { observable, action } from "mobx";
import { JavaJDIUITemplate } from "../json/JavaJDIUITemplate";
import { JavaJDILightTemplate } from "../json/JavaJDILightTemplate";
import { saveAs } from "file-saver";
import Log from "./Log";
import {JavaJDINovaTemplate} from "../json/JavaJDINovaTemplate";

export default class SettingsModel {
  @observable downloadAfterGeneration = false;
  // @observable jdi = true;
  //TODO: check rules when possible
  @observable rules = "";
  @observable rule = "";
  @observable extension = "";
  @observable framework = "";
  @observable template = {};
  @observable log = {};

  constructor() {
    const settingsStorage = window.localStorage;

    this.log = new Log();
    this.downloadAfterGeneration =
      settingsStorage.getItem("DownloadAfterGeneration") === "true";
    this.rule = settingsStorage.getItem("DefaultRule") || "angular";
    this.extension = settingsStorage.getItem("DefaultLanguage") || ".java";
    this.framework = settingsStorage.getItem("DefaultFramework") || "jdiNova";

    this.setTemplate();
  }

  updateSiteImportSettings(name) {
    const rulesStorage = window.localStorage;
    rulesStorage.setItem(name, this.customSiteImports);
  }

  @action
  clearSiteStorage(nameToRemove, defaultSettings) {
    const settingsStorage = window.localStorage;
    settingsStorage.removeItem(nameToRemove);
    settingsStorage.setItem(name, defaultSettings);
  }

  @action
  triggerDownloadAfterGen(mainModel) {
    this.downloadAfterGeneration = !this.downloadAfterGeneration;
    mainModel.settingsModel.downloadAfterGeneration = this.downloadAfterGeneration;
    window.localStorage.setItem(
      "DownloadAfterGeneration",
      this.downloadAfterGeneration.toString()
    );
  }

  @action
  changeLanguage(lang) {
    this.extension = lang;

    window.localStorage.setItem("DefaultLanguage", this.extension);
    this.setTemplate();
  }

  @action
  changeRule(lang) {
    this.rule = lang;

    window.localStorage.setItem("DefaultRule", this.rule);
    // this.setTemplate();
  }

  @action
  changeFramework(frame) {
    this.framework = frame;

    window.localStorage.setItem("DefaultFramework", this.framework);
    this.setTemplate();
  }

  @action
  changePackage(newPackage, libraryPackage) {
    this.template.package = newPackage;
    this.template.libraryPackage = libraryPackage;
  }

  @action
  setTemplate() {
    const settingsStorage = window.localStorage;

    if (this.extension === ".java" && this.framework === "jdiUI") {
      this.template = this.saveTemplate(
        "DefaultTemplateJdiUI",
        JavaJDIUITemplate,
        settingsStorage);
    }

    if (this.extension === ".java" && this.framework === "jdiLight") {
      this.template = this.saveTemplate(
        "DefaultTemplateJdiLight",
        JavaJDILightTemplate,
        settingsStorage);
    }

    if (this.extension === ".java" && this.framework === "jdiNova") {
      this.template = this.saveTemplate(
        "DefaultTemplateJdiNova",
        JavaJDINovaTemplate,
        settingsStorage);
    }
  }

  @action
  updateTemplate() {
    const settingsStorage = window.localStorage;
    if (this.extension === ".java" && this.framework === "jdiUI") {
      settingsStorage.setItem(
        "DefaultTemplateJdiUI",
        JSON.stringify(this.template)
      );
    }

    if (this.extension === ".java" && this.framework === "jdiLight") {
      settingsStorage.setItem(
        "DefaultTemplateJdiLight",
        JSON.stringify(this.template)
      );
    }

    if (this.extension === ".java" && this.framework === "jdiNova") {
      settingsStorage.setItem(
        "DefaultTemplateJdiNova",
        JSON.stringify(this.template)
      );
    }
  }

  saveTemplate(templateName, template, settingsStorage) {
    const defaultTemplate = settingsStorage.getItem(templateName);
    return defaultTemplate
      ? JSON.parse(defaultTemplate)
      : this.saveTemplateToStorage(templateName, template, settingsStorage);
  }

  saveTemplateToStorage(templateName, template, settingsStorage) {
    settingsStorage.setItem(
      templateName,
      JSON.stringify(template));
    return template;
  }

  downloadCurrentTemplate() {
    let objToSave = {
      content: JSON.stringify(this.template, null, "\t"),
      //content: JSON.stringify(this.template, null, '\t').replace(/\\n|\\t/g, "\n"),
      name: `${this.framework}Template.json`,
      // name: `${this.framework}Template.js`
    };
    if (objToSave.content && objToSave.name) {
      let blob = new Blob([objToSave.content], {
        type: "text/plain;charset=utf-8",
      });
      saveAs(blob, objToSave.name);
    }
  }

  @action
  importNewTemplate(file, mainModel) {
    this.log.clearLog();

    function FieldException(field) {
      this.message = `Template does not have required field ${field}`;
      this.name = "Template Error.";
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
          let isErrorContent = false;
          try {
            const newTemplate = JSON.parse(contents);

            for (let field in this.template) {
              if ({}.hasOwnProperty.call(this.template, field)) {
                try {
                  if (
                    !["siteName", "package"].includes(field) &&
                    !newTemplate[field]
                  ) {
                    isErrorContent = true;
                    throw new FieldException(field);
                  }
                } catch (e) {
                  this.log.addToLog({
                    message: `${e.name} ${e.message}`,
                    type: "error",
                  });
                  mainModel.fillLog(this.log.log);
                }
              }
            }

            if (!isErrorContent) {
              this.template = newTemplate;
              this.updateTemplate();
              this.log.addToLog({
                message: `Success! New template uploaded`,
                type: "success",
              });
              mainModel.fillLog(this.log.log);
            }
          } catch (e) {
            this.log.addToLog({
              message: `Error occurs parsing json file: ${e}. JSON is invalid. Check JSON.`,
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
