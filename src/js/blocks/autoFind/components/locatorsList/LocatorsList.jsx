import React, { useState, useEffect } from "react";
import { Collapse } from "antd";
import { WaitingList } from "./WaitingList";
import { GeneratedList } from "./GeneratedList";
import { useAutoFind } from "../../autoFindProvider/AutoFindProvider";
import { locatorProgressStatus, locatorTaskStatus } from "../../utils/locatorGenerationController";
import { DeletedList } from "./DeletedList";

export const LocatorsList = () => {
  const [{ locators }, { filterByProbability, toggleElementGeneration }] = useAutoFind();
  const [waiting, setWaiting] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [deleted, setDeleted] = useState([]);

  useEffect(() => {
    const byProbability = filterByProbability(locators);

    setWaiting(byProbability.filter((el) => locatorProgressStatus.hasOwnProperty(el.locator.taskStatus)));

    setGenerated(byProbability.filter((el) => el.locator.taskStatus === locatorTaskStatus.SUCCESS));

    setDeleted(byProbability.filter((el) => el.deleted));
  }, [locators]);

  return (
    <React.Fragment>
      <Collapse defaultActiveKey={["1", "2"]}>
        <Collapse.Panel key="1" header="Generated">
          <GeneratedList elements={generated} {...{ toggleElementGeneration }} />
        </Collapse.Panel>
        <Collapse.Panel key="2" header="Waiting for generation">
          <WaitingList elements={waiting} {...{ toggleElementGeneration }} />
        </Collapse.Panel>
        <Collapse.Panel key="3" header="Deleted">
          <DeletedList elements={deleted} />
        </Collapse.Panel>
      </Collapse>
    </React.Fragment>
  );
};
