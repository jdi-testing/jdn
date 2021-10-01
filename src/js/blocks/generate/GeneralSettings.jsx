import React from "react";
import {inject, observer} from "mobx-react";
import {Frameworks, Languages, PageNameRule} from "../../json/settings";
import {Button, Checkbox, Input, Select} from "antd";
import ReactFileReader from "react-file-reader";
import {DownloadOutlined, UploadOutlined} from '@ant-design/icons';
import HtmlRules from "../../json/HtmlRules";
import RetailBankRules from "../../json/RetailBankRules";

@inject("mainModel")
@observer
export default class GeneralSettings extends React.Component {
  constructor(props) {
    super(props);
    const template = props.mainModel.settingsModel?.template;
    this.state = {
      appName: template?.appName || 'Awesome test project',
      package: template?.package || 'com.jdiai',
      libPackage: template?.libPackage || 'com.jdiai.elements',
      pageName: template?.pageName || 'hash'
    };
    props.mainModel.settingsModel.changePackage(this.state.appName, this.state.package,
      this.state.libPackage, this.state.pageName);
  }

  handleCheckboxChange = (e) => {
    const { mainModel } = this.props;

    mainModel.settingsModel.triggerDownloadAfterGen(mainModel);
    console.log(e);
    this.setState({"generateAndDownload": e});
  };

  handleChangeRule = (option) => {
    const { mainModel } = this.props;

    mainModel.ruleBlockModel.rules = mainModel.registeredRules.find(rule => rule.Name.toLowerCase() === option.toLowerCase());
    mainModel.ruleBlockModel.updateRules();
  };

  handleChangeLanguage = (option) => {
    const { mainModel } = this.props;

    mainModel.settingsModel.changeLanguage(option);
    mainModel.generateBlockModel.clearGeneration();
  };

  handleChangeFramework = (option) => {
    const { mainModel } = this.props;

    mainModel.settingsModel.changeFramework(option);
    mainModel.generateBlockModel.clearGeneration();
  };

  handleAppName = (e) => {
    const value = e?.target?.value || '';
    const { mainModel } = this.props;

    mainModel.settingsModel.appName = value;
  }

  handleChangePackage = (e) => {
    const value = e?.target?.value || '';
    const { mainModel } = this.props;

    mainModel.settingsModel.package = value;
  }

  handleLibraryPackage = (e) => {
    const value = e?.target?.value || '';
    const { mainModel } = this.props;

    mainModel.settingsModel.libPackage = value;
  }

  handlePageName = (e) => {
    const value = e?.target?.value || '';
    const { mainModel } = this.props;

    mainModel.settingsModel.pageName = value;
  }

  handleSaveToStorage = () => {
    const { mainModel } = this.props;
    mainModel.settingsModel.changePackage(this.state.appName, this.state.package, this.state.libPackage, this.state.pageName);
  }

  handleExportSettings = () => {
    const { mainModel } = this.props;

    mainModel.settingsModel.downloadCurrentSettings(mainModel.ruleBlockModel.rules);
  };

  handleImportSettings = (file) => {
    const { mainModel } = this.props;

    mainModel.generateBlockModel.clearGeneration();
    mainModel.settingsModel.importSettings(file, mainModel);
  };

  render() {
    const { mainModel } = this.props;
    const defaultRule = mainModel.ruleBlockModel?.rules?.Name ?? "HtmlRules";
    const template = mainModel.settingsModel?.template;
    const defaultAppName = template?.appName ?? "Awesome test project";
    const defaultPackage = template?.package ?? "com.jdiai";
    const defaultLibPackage = template?.libPackage ?? "com.jdiai.elements";
    const defaultPageName = template?.pageName ?? "hash";

    if (!mainModel.registeredRules) {
      mainModel.registeredRules = [ HtmlRules, RetailBankRules ];
    }
    const ruleOptions = mainModel.registeredRules.map(rule => ({ value: rule.Name, label: rule.Name }));
    const defaultLanguage = Languages.find(
      (l) => l.value === mainModel.settingsModel.extension
    );
    const defaultFramework = Frameworks.find(
      (f) => f.value === mainModel.settingsModel.framework
    );

    // TODO: Use for default value of Rule or delete that property
    // {mainModel.ruleBlockModel.ruleName}
    return (
      <div className={'generate-style'}>
        <div className={'select-wrapper'}>

          <span style={{ margin: "0 10px 0 0" }}>Rules:</span>
          <Select
            size="small"
            defaultValue={defaultRule}
            placeholder="Please select"
            onChange={this.handleChangeRule}
            style={{ width: "100%" }}
            options={ruleOptions}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Language:</span>
          <Select
            size="small"
            defaultValue={defaultLanguage && defaultLanguage.value}
            placeholder="Please select"
            onChange={this.handleChangeLanguage}
            style={{ width: "100%" }}
            options={Languages}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Frameworks:</span>
          <Select
            size="small"
            defaultValue={defaultFramework && defaultFramework.value}
            placeholder="Please select"
            onChange={this.handleChangeFramework}
            style={{ width: "100%" }}
            options={Frameworks}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Application name:</span>
          <Input
            defaultValue={ defaultAppName }
            onChange={this.handleAppName}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Package:</span>
          <Input
            defaultValue={ defaultPackage }
            onChange={this.handleChangePackage}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Elements Library Package:</span>
          <Input
            defaultValue={ defaultLibPackage }
            onChange={this.handleLibraryPackage}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Generate page name from:</span>
          <Select
            size="small"
            defaultValue={ defaultPageName }
            placeholder="Please select"
            onChange={this.handlePageName}
            style={{ width: "100%" }}
            options={PageNameRule}
          />
        </div>
        <div className={"select-wrapper"}>
          <Button shape="round" onClick={this.handleSaveToStorage}>Save</Button>
          <ReactFileReader
            handleFiles={(file) => {
              this.handleImportSettings(file);
            }}
            fileTypes={[".json"]}
            multipleFiles={false}
          >
            <Button
              shape="round"
              icon={<DownloadOutlined />}
            >Import</Button>
          </ReactFileReader>
          <Button
            shape="round"
            onClick={this.handleExportSettings}
            icon={<UploadOutlined />}
          >Export</Button>
        </div>

        <div className={"checkbox-wrapper"}>
          <Checkbox
            checked={mainModel.settingsModel.downloadAfterGeneration}
            onChange={this.handleCheckboxChange}
          >
            Generate & Download
          </Checkbox>
        </div>
      </div>
    );
  }
}
