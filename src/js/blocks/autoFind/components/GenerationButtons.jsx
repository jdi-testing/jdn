import Icon, { SearchOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import React from "react";
import { autoFindStatus, useAutoFind, xpathGenerationStatus } from "../autoFindProvider/AutoFindProvider";

// import "./GenerationButtons.less";
import ClearAllSvg from "../../../../icons/clear-all.svg";
import DownloadSvg from "../../../../icons/download.svg";
import { Content } from "antd/lib/layout/layout";

export const GenerationButtons = () => {
  const [
    { status, allowIdentifyElements, allowRemoveElements, xpathStatus },
    { identifyElements, removeHighlighs, generateAndDownload },
  ] = useAutoFind();

  return (
    <Content>
      <Space direction="horizontal" size={16}>
        <Button
          icon={<SearchOutlined />}
          type="primary"
          loading={status == autoFindStatus.loading}
          disabled={!allowIdentifyElements}
          onClick={identifyElements}
        >
          Identify
        </Button>
        <Button hidden={!allowRemoveElements} onClick={removeHighlighs}>
          <Icon component={ClearAllSvg} />
          Clear all
        </Button>
        <Button hidden={xpathStatus !== xpathGenerationStatus.complete} onClick={generateAndDownload}>
          <Icon component={DownloadSvg} fill="#c15f0f" />
          Generate
        </Button>
      </Space>
    </Content>
  );
};
