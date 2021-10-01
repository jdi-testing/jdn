import React from "react";

import "./slider.less";
import "./../autoFind.less";

import Layout, {Header} from "antd/lib/layout/layout";
import {GenerationButtons} from "../GenerationButtons";
import {PerceptionTreshold} from "../PerceptionTreshold";
import {Result} from "../Result";
import {Divider, Space} from "antd";
import {ControlBar} from "../ControlBar";
import {XPathSettings} from "../XPathSettings";

const AutoFind = () => {
  return (
    <Layout className="jdn__autofind">
      <Header className="jdn__header">
        <ControlBar />
      </Header>
      <Space
        size={0}
        direction="vertical"
        split={<Divider type="horizontal" className="jdn__divider" />}
        className="jdn__content"
      >
        <GenerationButtons />
        <PerceptionTreshold />
        <XPathSettings />
        <Result />
      </Space>
    </Layout>
  );
};

export default AutoFind;
