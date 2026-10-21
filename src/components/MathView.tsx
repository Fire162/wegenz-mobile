import React, { useState } from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";

interface MathViewProps {
  htmlContent: string;
  fontSize?: number;
  color?: string;
}

export function MathView({ htmlContent, fontSize = 15, color }: MathViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = color || (isDark ? "#f1f5f9" : "#0f172a");
  const bgColor = isDark ? "#020617" : "#ffffff";
  const [height, setHeight] = useState(48);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.55;
      color: ${textColor};
      background-color: transparent;
      padding: 2px 0;
      overflow: hidden;
    }
    p { margin-bottom: 8px; }
    p:last-child { margin-bottom: 0; }
    img { max-width: 100%; height: auto; border-radius: 6px; margin: 4px 0; }
    .katex-display { margin: 8px 0; overflow-x: auto; overflow-y: hidden; }
  </style>
</head>
<body>
  <div id="content">${htmlContent}</div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.getElementById("content"), {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
      setTimeout(function() {
        var h = document.getElementById("content").scrollHeight || document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: h }));
      }, 50);
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height: Math.max(32, height + 8) }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidHardwareAccelerationDisabled={false}
        style={[styles.webview, { backgroundColor: "transparent" }]}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height && data.height > 10) {
              setHeight(data.height);
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "transparent",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
