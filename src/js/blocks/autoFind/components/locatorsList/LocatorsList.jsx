import React from "react";
import { Tabs } from "antd";
import { WaitingTab } from "./WaitingTab";

const { TabPane } = Tabs;

export const LocatorsList = () => {
  const callback = (key) => {
    console.log(key);
  };

  return (
    <React.Fragment>
      <Tabs type="card" onChange={callback}>
        <TabPane tab="All" key="1">
          All list
        </TabPane>
        <TabPane tab="Waiting" key="2">
          <WaitingTab />
        </TabPane>
      </Tabs>
    </React.Fragment>
  );
};
