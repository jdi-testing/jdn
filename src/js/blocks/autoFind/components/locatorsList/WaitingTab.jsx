import Text from "antd/lib/typography/Text";
import { chain } from "lodash";
import React from "react";
import { useAutoFind } from "../../autoFindProvider/AutoFindProvider";
import { locatorProgressStatus } from "../../utils/locatorGenerationController";
import { getPageElementCode } from "../../utils/pageObject";

export const WaitingTab = () => {
  const [{ locators }, { filterByProbability }] = useAutoFind();

  const renderList = () => {
    if (!locators) return null;
    return chain(filterByProbability(locators))
        .filter((el) => locatorProgressStatus.hasOwnProperty(el.locator.taskStatus))
        .map(({ element_id, type, name, locator }) => {
          return (
            <div key={element_id}>
              <Text className="jdn__xpath_item">
                {locator.taskStatus} {getPageElementCode(type, name, locator)}
              </Text>
            </div>
          );
        })
        .value();
  };

  return <React.Fragment>{renderList()}</React.Fragment>;
};
