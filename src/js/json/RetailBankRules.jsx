const RetailBankRules = {
  Name: "RetailBank",
  ListOfSearchAttributes: ["data-testid"],
  SimpleRules: {
    TextInput: [{ Locator: "[data-role=text-field]", uniqueness: "data-testid", id: 0 }],
    Button: [{ Locator: "[data-role=button]", uniqueness: "data-testid", id: 0 }],
    Label: [{ Locator: "[data-role=headings]", id: 0, uniqueness: "data-testid" }],
    Text: [{ Locator: "[data-role=text]", id: 0, uniqueness: "data-testid" }],
    Link: [{ Locator: "[data-role=link]", uniqueness: "data-testid", id: 0 }],
    Menu: [{ Locator: "[data-role=menu]", id: 0, uniqueness: "data-testid" }],
    ButtonDropdown: [{ Locator: "[data-role=button-dropdown]", id: 0, uniqueness: "data-testid" }],
    PayorderSelector: [{ Locator: "[data-role=payorder-selector]", id: 0, uniqueness: "data-testid" }],
    CurrencyAmountSelector: [{ Locator: "[data-role=currency-amount-selector]", id: 0, uniqueness: "data-testid" }],
    BeneficiarySelector: [{ Locator: "[data-role=beneficiary-selector]", id: 0, uniqueness: "data-testid" }],
    Tabs: [{ Locator: "[data-role=tabs]", id: 0, uniqueness: "data-testid" }],
    CountrySelectorDropdown: [{ Locator: "[data-role=country-selector-dropdown]", id: 0, uniqueness: "data-testid" }],
    Selector: [{ Locator: "[data-role=selector]", id: 0, uniqueness: "data-testid" }],
    Table: [{ Locator: "[data-role=table]", id: 0, uniqueness: "data-testid" }],
  },
  ComplexRules: {
  },
  CompositeRules: {
    Section: [
      { Locator: "[data-role=section]", id: 0, uniqueness: "data-testid" },
    ]
  },
};

export default RetailBankRules;
