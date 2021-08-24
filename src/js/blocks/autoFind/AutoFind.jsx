import React, { useEffect, useState } from "react";
import injectSheet from "react-jss";
import { Slider, Row, Alert } from "antd";
import {
  useAutoFind,
  xpathGenerationStatus,
} from "./autoFindProvider/AutoFindProvider";

import "./slider.less";
import Layout, { Content, Footer } from "antd/lib/layout/layout";
import { styles } from "./styles";

let sliderTimer;
const AutoFind = ({ classes }) => {
  const [perceptionOutput, setPerceptionOutput] = useState(0.5);
  const [backendVer, setBackendVer] = useState("");
  const [
    {
      status,
      predictedElements,
      pageElements,
      allowIdentifyElements,
      allowRemoveElements,
      perception,
      unreachableNodes,
      availableForGeneration,
      xpathStatus,
      unactualPrediction,
    },
    {
      identifyElements,
      removeHighlighs,
      generateAndDownload,
      onChangePerception,
      reportProblem
    },
  ] = useAutoFind();

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetch("http:localhost:5000/build", {
        method: "GET",
      });
      const r = await result.json();
      setBackendVer(r);
    };

    fetchData();
  }, []);

  const handleGetElements = () => {
    identifyElements();
  };

  const handleRemove = () => {
    removeHighlighs();
  };

  const handleGenerate = () => {
    generateAndDownload(perception);
  };

  const handlePerceptionChange = (value) => {
    setPerceptionOutput(value);
    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => {
      onChangePerception(value);
    }, 300);
  };

  const getPredictedElements = () => {
    return predictedElements && allowRemoveElements
      ? predictedElements.length
      : 0;
  };

  const handleReportProblem = () => {
    reportProblem(predictedElements);
  };

  return (
    <Layout>
      <Content>
        <Row>
          <button
            className="jdn__button jdn__button--identify"
            disabled={!allowIdentifyElements}
            onClick={handleGetElements}
          >
            Identify
          </button>
          <button
            className="jdn__button jdn__button--reset"
            hidden={!allowRemoveElements} onClick={handleRemove}>
            Reset
          </button>
          <button
            className="jdn__button jdn__button--generate"
            hidden={xpathStatus !== xpathGenerationStatus.complete}
            onClick={handleGenerate}
          >
            Generate And Download
          </button>
        </Row>
        <div className="jdn__perception-treshold">
          <label className="jdn__perception-title">Perception treshold: {perception}</label>
          <div className="jdn__slider">
            <label className="jdn__perception-min">0.0</label>
            <Slider
              style={{ width: "100%" }}
              min={0.0}
              max={1}
              step={0.01}
              onChange={handlePerceptionChange}
              value={perceptionOutput}
            />
            <label className="jdn__perception-max">1.0</label>
          </div>
        </div>
        
        <div hidden={!status} className="jdn__result">
          <div className="jdn__result-status">{status}</div>
          <div className="jdn__result-indicators">
            <div className="jdn__result-indicator">
              <span className="jdn__result-count">{pageElements || 0}</span>
              found on page
            </div>
            <div className="jdn__result-indicator">
              <span className="jdn__result-count">{getPredictedElements()}</span> 
              predicted
            </div>
            <div className="jdn__result-indicator">
              <span className="jdn__result-count">{availableForGeneration.length}</span>
              available for generation
            </div>
            <div className="jdn__result-indicator">
              <span className="jdn__result-count">-</span>
              {xpathStatus} {unreachableNodes && unreachableNodes.length ? (
                <Alert
                  type="warning"
                  showIcon
                  description={`${unreachableNodes.length} controls are unreachable due to DOM updates.`}
                />
              ) : null}
              {unactualPrediction ?
                (<Alert
                  type="warning"
                  showIcon
                  description={`Prediction is not actual anymore. Please, remove highlight and re-run identification.`}
                />)
                : null
              }
            </div>
          </div>
        </div>

      </Content>
      <Footer className={classes.footer}>
        <div>
          <a
            hidden={!allowRemoveElements}
            onClick={handleReportProblem}>
            Report Problem
          </a>
        </div>
        backend ver. {backendVer}
      </Footer>
    </Layout>
  );
};

const AutoFindWrapper = injectSheet(styles)(AutoFind);
export default AutoFindWrapper;
