import React from "react";

import { Button, Space } from "antd";
import Icon from "@ant-design/icons";
import { Content } from "antd/lib/layout/layout";

import SettingsSVG from "../../../../../icons/settings.svg";
import TrashBinSVG from "../../../../../icons/trash-bin.svg";
import PauseSVG from "../../../../../icons/pause.svg";
import DownloadSvg from "../../../../../icons/download.svg";
import PlaySvg from "../../../../../icons/play.svg";
import RestoreSvg from "../../../../../icons/restore.svg";
import CloseSVG from "../../../../../icons/close.svg";

export const LocatorListHeader = () => {
  return (
    <Content className="jdn__locatorsList-header">
      <span>Locators list</span>
      <Space>
        <div className="ant-select ant-select-multiple">
          <div className="ant-select-selection-overflow-item" style={{ opacity: 1 }}>
            <span className="ant-select-selection-item" title="c12">
              <span className="ant-select-selection-item-content">
                2 <span className="">selected</span>
              </span>
              <span
                className="ant-select-selection-item-remove"
                unselectable="on"
                aria-hidden="true"
                style={{ userSelect: "none" }}
              >
                <span role="img" aria-label="close" className="anticon anticon-close">
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="close"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <CloseSVG />
                  </svg>
                </span>
              </span>
            </span>
          </div>
        </div>
        <Button className="jdn__buttons">
          <Icon component={RestoreSvg} />
          Restore
        </Button>
        <Button>
          <Icon component={PlaySvg} />
        </Button>
        <Button danger>
          <Icon component={PauseSVG} />
        </Button>
        <Button danger>
          <Icon fill="#D82C15" component={TrashBinSVG} />
        </Button>
        <Button>
          <Icon component={SettingsSVG} />
        </Button>
        <Button type="primary" className="jdn__buttons">
          <Icon component={DownloadSvg} fill="#c15f0f" className="jdn__buttons-icons" />
          Download
        </Button>
      </Space>
    </Content>
  );
};
