export const settingsPopup = () => {
  const checkboxes = [
    {
      name: 'allow_indexes_at_the_beginning',
      label: 'Allow indexes at the beginning',
      tooltip: `Let generate locators with indexes (such as @UI("//[1]/[@Class='breadcrumb']")) at the beginning`,
    },
    {
      name: 'allow_indexes_in_the_middle',
      label: 'Allow indexes at the middle',
      tooltip: `Let generate locators with indexes (such as @UI("//*[@class='items_16']/*[1]/*/*")) in the middle`
    },
    {
      name: 'allow_indexes_at_the_end',
      label: 'Allow indexes at the end',
      tooltip: `Let generate locators with indexes (such as @UI("//*[@class='legal']/*[3]")) at the end`
    },
    {
      name: 'limit_maximum_generation_time',
      label: 'Limit generation time of one locator to',
      tooltip: `Generate best locator for given time frame`
    },
  ];

  function removePopup() {
    backgroundModal.remove();
    modal.remove();
  }

  const settings = {
    maximum_generation_time: 10,
    allow_indexes_at_the_beginning: false,
    allow_indexes_in_the_middle: false,
    allow_indexes_at_the_end: true,
    limit_maximum_generation_time: true,
  };
  const modal = document.createElement("dialog");
  modal.setAttribute('open', true);
  modal.classList.add("jdn-settings-popup__modal");

  const backgroundModal = document.createElement("div");
  backgroundModal.classList.add("jdn-report-problem-popup__background");
  const modalCloseButton = document.createElement('button');
  modalCloseButton.innerHTML = "&#215;";
  modalCloseButton.classList.add('jdn-settings-popup__modal__close-button');
  modalCloseButton.onclick = removePopup;
  modal.appendChild(modalCloseButton);
  const heading = document.createElement('h4');
  heading.innerHTML = 'Settings';
  modal.appendChild(heading);

  const buttonOk = document.createElement("button");
  buttonOk.classList.add("jdn-settings-popup__button--ok");
  buttonOk.setAttribute('type', 'submit');
  buttonOk.innerText = "Save";

  const buttonCancel = document.createElement("button");
  buttonCancel.classList.add("jdn-report-problem-popup__button");
  buttonCancel.innerText = "Cancel";
  buttonCancel.onclick = removePopup;

  const form = document.createElement('form');
  form.onsubmit = (event) => {
    event.preventDefault();
    console.log(settings);
    removePopup();
    // chrome.runtime.sendMessage({
    //   message: "CHANGE_SETTINGS",
    //   param: settings,
    // });
  };
  checkboxes.forEach(((checkbox) => {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'jdn-settings-popup__input-container';
    const {name, label} = checkbox;
    const formCheckbox = document.createElement('input');
    formCheckbox.setAttribute('type', 'checkbox');
    formCheckbox.setAttribute('name', name);
    const tooltipIcon = document.createElement('span');
    tooltipIcon.innerHTML = `<svg width="4" height="7" viewBox="0 0 4 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.07944 3.81601C1.07944 3.54934 1.13544 3.32534 1.24744 3.14401C1.35944 2.96267 1.55144 2.77334 1.82344 2.57601C2.06344 2.40534 2.2341 2.25867 2.33544 2.13601C2.4421 2.00801 2.49544 1.85867 2.49544 1.68801C2.49544 1.51734 2.43144 1.38934 2.30344 1.30401C2.18077 1.21334 2.00744 1.16801 1.78344 1.16801C1.55944 1.16801 1.3381 1.20267 1.11944 1.27201C0.900771 1.34134 0.676771 1.43467 0.447438 1.55201L0.0234375 0.696008C0.284771 0.552008 0.567438 0.434674 0.871438 0.344008C1.17544 0.253341 1.50877 0.208008 1.87144 0.208008C2.4261 0.208008 2.85544 0.341341 3.15944 0.608008C3.46877 0.874675 3.62344 1.21334 3.62344 1.62401C3.62344 1.84267 3.58877 2.03201 3.51944 2.19201C3.4501 2.35201 3.3461 2.50134 3.20744 2.64001C3.06877 2.77334 2.89544 2.91734 2.68744 3.07201C2.53277 3.18401 2.41277 3.28001 2.32744 3.36001C2.2421 3.44001 2.18344 3.51734 2.15144 3.59201C2.12477 3.66667 2.11144 3.76001 2.11144 3.87201V4.10401H1.07944V3.81601ZM0.951438 5.44001C0.951438 5.19467 1.0181 5.02401 1.15144 4.92801C1.28477 4.82667 1.44744 4.77601 1.63944 4.77601C1.8261 4.77601 1.9861 4.82667 2.11944 4.92801C2.25277 5.02401 2.31944 5.19467 2.31944 5.44001C2.31944 5.67467 2.25277 5.84534 2.11944 5.95201C1.9861 6.05334 1.8261 6.10401 1.63944 6.10401C1.44744 6.10401 1.28477 6.05334 1.15144 5.95201C1.0181 5.84534 0.951438 5.67467 0.951438 5.44001Z" fill="black"/>
    </svg>
    `;
    const tooltip = document.createElement('span');
    tooltip.innerHTML = checkbox.tooltip;
    tooltipIcon.appendChild(tooltip);
    if (settings[name]) {
      formCheckbox.setAttribute('checked', true);
    }

    const checkboxLabel = document.createElement('label');
    checkboxLabel.innerHTML = label;
    checkboxLabel.appendChild(formCheckbox);

    formCheckbox.addEventListener("change", (event) => {
      event.preventDefault();
      settings[event.target.name] = event.target.checked;
    });
    inputContainer.appendChild(checkboxLabel);
    if (name === 'limit_maximum_generation_time') {
      const numberInput = document.createElement('input');
      numberInput.className = 'jdn-settings-popup__input';
      numberInput.setAttribute('type', 'number');
      numberInput.setAttribute('name', 'maximum_generation_time');
      numberInput.setAttribute('min', 0);
      numberInput.setAttribute('step', 1);
      numberInput.setAttribute('value', settings.maximum_generation_time);
      numberInput.addEventListener("change", (event) => {
        event.preventDefault();
        settings[event.target.name] = event.target.value;
      });
      const numberInputLabel = document.createElement('label');
      numberInputLabel.innerHTML = 'sec';
      numberInputLabel.appendChild(numberInput);
      inputContainer.appendChild(numberInputLabel);
    }
    inputContainer.appendChild(tooltipIcon);
    form.append(inputContainer);
  }));

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("jdn-settings-popup__button-container");

  buttonContainer.append(buttonCancel);
  buttonContainer.append(buttonOk);
  form.appendChild(buttonContainer);
  modal.appendChild(form);
  backgroundModal.append(modal);
  document.body.append(backgroundModal);
};
