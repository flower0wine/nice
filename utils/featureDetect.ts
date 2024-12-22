import "~/styles/components/FeatureWarning.scss";

export interface FeatureSupport {
  name: string;
  supported: boolean;
  minVersion: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
}

export const checkFeatureSupport = (feature: string): FeatureSupport => {
  const features = {
    // 剪贴板 API
    clipboard: {
      name: "剪贴板访问",
      check: () => !!navigator.clipboard,
      minVersion: {
        chrome: "66",
        firefox: "63",
        edge: "79"
      }
    },
    // 文件系统访问 API
    fileSystem: {
      name: "文件系统访问",
      check: () => "showOpenFilePicker" in window,
      minVersion: {
        chrome: "86",
        edge: "86"
      }
    }
  };

  const featureCheck = features[feature];
  return {
    name: featureCheck.name,
    supported: featureCheck.check(),
    minVersion: featureCheck.minVersion
  };
};
