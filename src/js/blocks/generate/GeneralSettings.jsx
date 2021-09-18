import React from "react";
import { inject, observer } from "mobx-react";
import { Rules, Languages, Frameworks } from "../../json/settings";
import { Select, Checkbox, Button, Input } from "antd";

@inject("mainModel")
@observer
export default class GeneralSettings extends React.Component {
  constructor(props) {
    super(props);
    const template = props.mainModel.settingsModel?.template;
    this.state = {
      appName: template?.appName || 'Awesome test project',
      package: template?.package || 'com.jdiai',
      libraryPackage: template?.libraryPackage || 'com.jdiai.elements'
    };
    props.mainModel.settingsModel.changePackage(this.state.appName, this.state.package, this.state.libraryPackage);
  }

  handleCheckboxChange = (e) => {
    const { mainModel } = this.props;

    mainModel.settingsModel.triggerDownloadAfterGen(mainModel);
    console.log(e);
    this.setState({"generateAndDownload": e});
  };

  handleChangeRule = (option) => {
    const { mainModel } = this.props;

    mainModel.settingsModel.changeRule(option);
    mainModel.generateBlockModel.clearGeneration();
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
    this.setState({ appName: value } )
  }

  handleChangePackage = (e) => {
    const value = e?.target?.value || '';
    this.setState({ package: value } )
  }

  handleLibraryPackage = (e) => {
    const value = e?.target?.value || '';
    this.setState({ libraryPackage: value } )
  }

  handleSaveToStorage = () => {
    const { mainModel } = this.props;
    mainModel.settingsModel.changePackage(this.state.appName, this.state.package, this.state.libraryPackage);
  }

  render() {
    const { classes, mainModel } = this.props;
    const defaultRule = Rules.find(
      (lang) => lang.value === mainModel.settingsModel.rule
    );
    const defaultLanguage = Languages.find(
      (lang) => lang.value === mainModel.settingsModel.extension
    );
    const defaultFramework = Frameworks.find(
      (frame) => frame.value === mainModel.settingsModel.framework
    );

    // TODO: Use for default value of Rule or delete that property
    // {mainModel.ruleBlockModel.ruleName}
    return (
      <div className={'generate-style'}>
        <div className={'select-wrapper'}>
          <span style={{ margin: "0 10px 0 0" }}>Rules:</span>
          <Select
            size="small"
            defaultValue={defaultRule && defaultRule.value}
            placeholder="Please select"
            onChange={this.handleChangeRule}
            style={{ width: "100%" }}
            options={Rules}
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
            defaultValue={ this.state.appName }
            onChange={this.handleAppName}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Package:</span>
          <Input
            defaultValue={ this.state.package }
            onChange={this.handleChangePackage}
          />
        </div>
        <div className={"select-wrapper"}>
          <span style={{ margin: "0 10px 0 0" }}>Elements Library Package:</span>
          <Input
            defaultValue={ this.state.libraryPackage }
            onChange={this.handleLibraryPackage}
          />
        </div>
        <div className={"select-wrapper"}>
          <Button shape="round" onClick={this.handleSaveToStorage}>Save</Button>
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
