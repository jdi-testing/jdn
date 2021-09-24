import { Checkbox } from "antd";
import Text from "antd/lib/typography/Text";
import React from "react";
import { getPageElementCode } from "../../utils/pageObject";

export const Locator = ({ type, name, locator, onChange }) => {
  return (
    <React.Fragment>
      <Checkbox onChange={onChange}>
        <Text className="jdn__xpath_item">
          {locator.taskStatus} {getPageElementCode(type, name, locator)}
        </Text>
      </Checkbox>
    </React.Fragment>
  );
};
