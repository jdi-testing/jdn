import { Divider, Space } from "antd";
import React, { useState, useEffect } from "react";
import { useAutoFind } from "../autoFindProvider/AutoFindProvider";
import { reportProblem } from "../utils/pageDataHandlers";

export const ControlBar = () => {
  const [backendVer, setBackendVer] = useState("");
  const [pluginVer, setPluginVer] = useState("");
  const [{ predictedElements, allowRemoveElements }] = useAutoFind();

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetch("http:localhost:5000/build", {
        method: "GET",
      });
      const r = await result.json();
      setBackendVer(r);
    };

    fetchData();

    const manifest = chrome.runtime.getManifest();
    setPluginVer(manifest.version);
  }, []);

  const handleReportProblem = () => {
    reportProblem(predictedElements);
  };

  return (
    <React.Fragment>
      <div className="jdn__header-title">
        <h1 className="jdn__header-text">JDN</h1>
        <div className="jdn__header-version">
          <Space
            size={0}
            direction="horizontal"
            split={<Divider type="vertical" style={{ backgroundColor: "#fff" }} />}
          >
            <span>version {pluginVer}</span>
            <span>backend {backendVer}</span>
          </Space>
        </div>
      </div>
      <Space size={[18, 0]}>
        <a className="jdn__header-link" href="#" hidden={!allowRemoveElements} onClick={handleReportProblem}>
          Report a problem
        </a>
        <a className="jdn__header-link" href="https://github.com/jdi-testing/jdn" target="_blank" rel="noreferrer">
          Readme
        </a>
        <a className="jdn__header-link" href="#">
          Upgrade
        </a>
      </Space>
    </React.Fragment>
  );
};
