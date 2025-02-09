import { useTheme } from "../../contexts/theme-context";

const AVAILABLE_COLORS = [
  { name: "Red", value: "red" },
  { name: "Blue", value: "blue" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
  { name: "Orange", value: "orange" },
];

export const ThemePicker = () => {
  const { primaryColor, setPrimaryColor, gradientFrom, gradientTo } =
    useTheme();

  return (
    <div className="space-y-4">
      <h4 className="text-white/60 mb-2">Theme Color</h4>
      <div className="flex flex-wrap gap-3">
        {AVAILABLE_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setPrimaryColor(color.value)}
            className={`group relative p-4 rounded-xl transition-all duration-300 ${
              primaryColor === color.value
                ? "bg-white/10 scale-110"
                : "hover:bg-white/5"
            }`}
            title={color.name}
          >
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-${
                color.value
              }-500 to-${
                color.value === "red"
                  ? "rose"
                  : color.value === "blue"
                  ? "indigo"
                  : color.value === "green"
                  ? "emerald"
                  : color.value === "purple"
                  ? "fuchsia"
                  : "amber"
              }-600`}
            />
            {primaryColor === color.value && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-xl bg-white/5">
        <p className="text-white/40 text-sm mb-2">Preview</p>
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
        />
      </div>
    </div>
  );
};
