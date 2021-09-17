import React from "react";
import { useAutoFind } from "../../autoFindProvider/AutoFindProvider";

export const WaitingTab = () => {
  const [{ availableForGeneration }] = useAutoFind();

  const renderList = () => {
    if (!availableForGeneration) return null;
    return availableForGeneration.map((element) => {
      return <div key={element.element_id}>{element.elementCode}</div>;
    });
  };

  return <React.Fragment>{renderList()}</React.Fragment>;
};
