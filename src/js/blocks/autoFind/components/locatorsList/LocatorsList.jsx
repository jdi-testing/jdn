import React from "react";
import { Collapse } from "antd";
import { WaitingTab } from "./WaitingTab";
import { GeneralTab } from "./GeneralTab";

export const LocatorsList = () => {
  return (
    <React.Fragment>
      <Collapse>
        <Collapse.Panel header="Generated">
          <GeneralTab />
        </Collapse.Panel>
        <Collapse.Panel header="Waiting for generation">
          <WaitingTab />
        </Collapse.Panel>
      </Collapse>
    </React.Fragment>
  );
};
