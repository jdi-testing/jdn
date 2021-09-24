import React from "react";
import { Locator } from "./Locator";

export const WaitingList = ({ elements }) => {
  console.log(elements);
  const renderList = () => {
    return elements.map((element) => {
      const { element_id, type, name, locator } = element;
      return (
        <Locator key={element_id} type={type} name={name} locator={locator} />
      );
    });
  };

  return <React.Fragment>{renderList()}</React.Fragment>;
};
