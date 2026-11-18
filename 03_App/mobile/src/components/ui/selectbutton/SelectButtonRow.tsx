import { StyleSheet, View } from "react-native";

import { spacing } from "@/design/tokens";

import { SelectButton } from "./SelectButton";

type SelectOption = {
  value: string;
  label: string;
};

type SelectButtonRowProps = {
  options: SelectOption[];
  selectionMode?: "single" | "multiple";
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
};

export function SelectButtonRow({
  options,
  selectionMode = "single",
  selectedValues,
  onSelectionChange,
}: SelectButtonRowProps) {
  function onPressOption(value: string) {
    if (selectionMode === "single") {
      onSelectionChange([value]);
      return;
    }

    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  }

  return (
    <View style={styles.row}>
      {options.map((option) => (
        <SelectButton
          key={option.value}
          label={option.label}
          selected={selectedValues.includes(option.value)}
          onPress={() => onPressOption(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});