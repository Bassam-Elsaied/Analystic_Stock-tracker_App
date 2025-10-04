declare module "react-select-country-list" {
  export interface Country {
    value: string;
    label: string;
  }

  export default function countryList(): {
    getData: () => Country[];
    getLabel: (value: string) => string;
    getValue: (label: string) => string;
    getLabels: () => string[];
    getValues: () => string[];
    native: () => any;
    setLabel: (value: string, label: string) => any;
  };
}
