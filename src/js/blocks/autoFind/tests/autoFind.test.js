import React from "react";
import { AutoFindProvider, autoFindStatus, useAutoFind } from "../autoFindProvider/AutoFindProvider";
import { connector } from "../autoFindProvider/connector";
import { act } from "react-dom/test-utils";
import { render, unmountComponentAtNode } from "react-dom";
import * as pageDataHandlers from "../autoFindProvider/pageDataHandlers";
import { abovePerception, generationData, interactedGenerationData, mockResponseData, perceptiontreshold, perceptiontresholdLow, predictedAfterInteraction, updatedElements } from "./mockedData";
import { chrome } from "jest-chrome";


const MainModel = {};

describe("AutoFind Identify functionality", () => {
    let getPageIdSpy;
    let container;
    let getElementsSpy;
    let highlightElementsSpy;
    let requestGenerationDataSpy;

    const TestComponent = () => {
        const [
            {
                status,
                predictedElements,
                pageElements,
                availableForGeneration,
            },
            {
                identifyElements,
                onChangePerception
            },
        ] = useAutoFind();

        return (
            <React.Fragment>
                <button id="idetify" onClick={identifyElements}></button>
                <button id="perception" onClick={() => onChangePerception(perceptiontreshold)}></button>
                <button id="perceptionLow" onClick={() => onChangePerception(perceptiontresholdLow)}></button>
                <div id="status">{status}</div>
                <div id="predictedElements">{JSON.stringify(predictedElements)}</div>
                <div id="pageElements">{pageElements}</div>
                <div id="availableForGeneration">{JSON.stringify(availableForGeneration)}</div>
            </React.Fragment>
        )
    };

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);

        render(<AutoFindProvider mainModel={MainModel}><TestComponent></TestComponent></AutoFindProvider>, container);

        jest.clearAllMocks();
        getPageIdSpy = jest.spyOn(connector, 'getPageId').mockReturnValue((() => { connector.tab = { id: '42' } })());
        getElementsSpy = jest.spyOn(pageDataHandlers, 'getElements').mockImplementation((callback) => callback([mockResponseData, 234]));
        highlightElementsSpy = jest.spyOn(pageDataHandlers, 'highlightElements').mockImplementation((arg1, successCallback, arg3) => successCallback());
        requestGenerationDataSpy = jest.spyOn(pageDataHandlers, 'requestGenerationData').mockImplementation((elements, callback) => callback({ generationData: generationData, unreachableNodes: [] }));
    });

    afterEach(() => {
        // cleanup on exiting
        unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    test("changes status to Loading", () => {
        const button = container.querySelector('#idetify');
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(container.querySelector('#status').textContent).toBe(autoFindStatus.loading);
    })

    test("predicted elements are received, updated properly and passed to component", async () => {
        const button = container.querySelector('#idetify');
        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(container.querySelector('#status').textContent).toBe(autoFindStatus.success);
        expect(container.querySelector('#pageElements').textContent).toBe("234");
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(updatedElements));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(generationData));
    })

    test("elements under perception treshold are unavailable at first call", async () => {
        const perception = container.querySelector('#perception');
        perception.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        const identify = container.querySelector('#idetify');
        await act(async () => {
            identify.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(updatedElements));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(abovePerception));
    })

    test("elements under perception treshold are unavailable after change", async () => {
        const identify = container.querySelector('#idetify');
        await act(async () => {
            identify.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        const perception = container.querySelector('#perception');
        act(() => {
            perception.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(updatedElements));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(abovePerception));
    })

    test("elements are available after change treshold to lower", async () => {
        const perception = container.querySelector('#perception');
        act(() => {
            perception.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })
        const identify = container.querySelector('#idetify');
        await act(async () => {
            identify.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(updatedElements));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(abovePerception));
        const perceptionLow = container.querySelector('#perceptionLow');
        act(() => {
            perceptionLow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        })
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(updatedElements));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(generationData));
    })

    test("toggled and hidden elements are unavailable for generation", async () => {
        const getElementsSpy1 = jest.spyOn(pageDataHandlers, 'getElements').mockImplementation((callback) => callback([predictedAfterInteraction, 234]));
        const button = container.querySelector('#idetify');
        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(container.querySelector('#status').textContent).toBe(autoFindStatus.success);
        expect(container.querySelector('#predictedElements').textContent).toBe(JSON.stringify(predictedAfterInteraction));
        expect(container.querySelector('#availableForGeneration').textContent).toBe(JSON.stringify(interactedGenerationData));
    })
})