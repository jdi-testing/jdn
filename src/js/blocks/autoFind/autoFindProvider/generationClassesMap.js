const defaultClass = "DefaultClass";

export const JDIclasses = {
  button: "Button",
  link: "Link",
  textfield: "TextField",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  radiobutton: "RadioButtons",
  textarea: "TextArea",
  fileinput: "FileInput",
  iframe: defaultClass,
  range: defaultClass,
  progressbar: defaultClass,
  datetimeselector: defaultClass,
  colorpicker: defaultClass,
  numberselector: defaultClass,
  selector: "Selector",
  table: "Table",
  switch: "Switch",
  slider: defaultClass,
  treenode: "TreeNode",
  stepper: "Stepper",
  tab: "Tab",
};

export const getJDILabel = (label) => JDIclasses[label] || label;
