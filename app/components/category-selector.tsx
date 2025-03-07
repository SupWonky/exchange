import { useState } from "react";
import { Combobox } from "./combobox";
import { CategoryNode } from "~/models/category.server";

interface CategorySelectionProps extends React.ComponentProps<"input"> {
  categories: CategoryNode[];
  initValue?: CategoryNode; // note: consider renaming to defaultValue
}

export function CategorySelector({
  categories,
  initValue,
  ...props
}: CategorySelectionProps) {
  // Helper function to recursively find the chain of category IDs from the root to the target
  const findCategoryChain = (
    nodes: CategoryNode[],
    targetId: string,
    path: string[] = []
  ): string[] | null => {
    for (const node of nodes) {
      const newPath = [...path, node.id];
      if (node.id === targetId) return newPath;
      if (node.children.length > 0) {
        const result = findCategoryChain(node.children, targetId, newPath);
        if (result) return result;
      }
    }
    return null;
  };

  // Initialize state with the default chain if a default value is provided
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    () => {
      if (initValue) {
        const chain = findCategoryChain(categories, initValue.id);
        return chain ? chain : [];
      }
      return [];
    }
  );

  // Optionally, if the default value might change over time, you can use an effect:
  // useEffect(() => {
  //   if (defualtValue) {
  //     const chain = findCategoryChain(categories, defualtValue.id);
  //     if (chain) setSelectedCategoryIds(chain);
  //   }
  // }, [defualtValue, categories]);

  // Build category hierarchy levels based on selections
  const categoryLevels: CategoryNode[][] = [categories];
  for (let i = 0; i < selectedCategoryIds.length; i++) {
    const currentLevel = categoryLevels[i];
    const selectedCategory = currentLevel.find(
      (c) => c.id === selectedCategoryIds[i]
    );
    if (!selectedCategory) break;
    categoryLevels.push(selectedCategory.children);
  }

  const handleSelect = (level: number, value: string) => {
    // Update selections up to the current level and reset subsequent choices
    const newSelections = [...selectedCategoryIds.slice(0, level), value];
    setSelectedCategoryIds(newSelections);
  };

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {categoryLevels.map((levelCategories, levelIndex) => {
        if (levelCategories.length === 0) return null;

        const comboboxItems = levelCategories.map((category) => ({
          label: category.name,
          value: category.id,
        }));

        return (
          <Combobox
            key={levelIndex}
            title="Выберите рубрику"
            list={comboboxItems}
            selectedValue={selectedCategoryIds[levelIndex] || null}
            onSelect={(value) => handleSelect(levelIndex, value)}
          />
        );
      })}

      <input
        className="hidden"
        type="hidden"
        value={selectedCategoryIds.at(selectedCategoryIds.length - 1) || ""}
        {...props}
      />
    </div>
  );
}
