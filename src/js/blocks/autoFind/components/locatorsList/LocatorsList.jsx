import React, { useState, useEffect } from "react";
import { Collapse } from "antd";
import { WaitingList } from "./WaitingList";
import { GeneratedList } from "./GeneratedList";
import { useAutoFind } from "../../autoFindProvider/AutoFindProvider";
import { locatorProgressStatus, locatorTaskStatus } from "../../utils/locatorGenerationController";
import { chain } from "lodash";

export const LocatorsList = () => {
  const [{ locators }, { filterByProbability }] = useAutoFind();
  const [waiting, setWaiting] = useState([]);
  const [generated, setGenerated] = useState([]);

  useEffect(() => {
    setWaiting(
        chain(filterByProbability(locators))
            .filter((el) => locatorProgressStatus.hasOwnProperty(el.locator.taskStatus))
            .value()
    );

    setGenerated(
        chain(filterByProbability(locators))
            .filter((el) => el.locator.taskStatus === locatorTaskStatus.SUCCESS)
            .value()
    );
  }, [locators]);

  return (
    <React.Fragment>
      <Collapse defaultActiveKey={['1', '2']}>
        <Collapse.Panel key="1" header="Generated">
          <GeneratedList elements={generated} />
        </Collapse.Panel>
        <Collapse.Panel key="2" header="Waiting for generation">
          <WaitingList elements={waiting} />
        </Collapse.Panel>
      </Collapse>
    </React.Fragment>
  );
};
