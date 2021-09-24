import React from "react";
import { Locator } from "./Locator";

export const GeneratedList = ({ elements }) => {
  const handleSelectChange = (element) => (value) => {
    console.log([element, value]);
  };

  const renderList = () => {
    if (!elements) return null;
    return elements.map((element) => {
      const { element_id, type, name, locator } = element;
      return (
        <Locator key={element_id} type={type} name={name} locator={locator} onChange={handleSelectChange(element)} />
      );
    });
  };

  return <React.Fragment>{renderList()}</React.Fragment>;
};
